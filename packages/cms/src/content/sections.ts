/**
 * Home-page sections edited as whole documents (one draft per section, D25):
 * capabilities, process, stack, client logos, studio details.
 * `xFromLive` turns live rows into the editable document; `publishSection`
 * rewrites the live rows in one transaction, as the Admin's own session.
 * Existing rows keep their IDs; rows removed in the editor are deleted.
 */
import { z } from 'zod';
import type { TablesDB } from 'node-appwrite';
import { ID, Query } from 'node-appwrite';
import { brandIconKeys, GENERIC_GLYPHS } from '../brand-icons.ts';
import type { CapabilityGroupRow, CapabilityRow, ClientLogoRow, ProcessStepRow, SiteSettingsRow, StackItemRow } from '../schema/generated.ts';

const rowId = z.string().regex(/^[a-zA-Z0-9._-]{1,36}$/);
const text = (max: number, msg = 'Required.') => z.string().trim().min(1, msg).max(max);
const optText = (max: number) => z.preprocess((v) => (typeof v === 'string' && v.trim() === '' ? undefined : v), z.string().trim().max(max).optional());
const list = (itemMax: number, count: number) => z.array(z.string().trim().min(1).max(itemMax)).max(count);

export const SECTIONS = {
  capabilities: { tableId: 'capability', label: 'Capabilities', previewPath: '/' },
  process: { tableId: 'processStep', label: 'How we work', previewPath: '/' },
  stack: { tableId: 'stackItem', label: 'Tech stack', previewPath: '/' },
  logos: { tableId: 'clientLogo', label: 'Client logos', previewPath: '/' },
  settings: { tableId: 'siteSettings', label: 'Studio details', previewPath: '/' },
} as const;
export type SectionKey = keyof typeof SECTIONS;
export const isSectionKey = (k: string): k is SectionKey => Object.hasOwn(SECTIONS, k);

export const STACK_CATEGORIES = ['languages', 'web', 'mobile', 'backend', 'ai-tools', 'devops'] as const;
export const STACK_ICONS: readonly string[] = [...brandIconKeys, ...GENERIC_GLYPHS];

export const sectionSchemas = {
  capabilities: z.object({
    items: z
      .array(
        z.object({
          id: rowId.optional(),
          title: text(100, 'Add a title.'),
          description: text(500, 'Add a description.'),
          tags: list(64, 10),
          services: list(200, 20),
          proof: optText(300),
          tone: z.enum(['surface', 'inverse']).optional(),
          spanMd: z.union([z.literal(6), z.literal(12)]).optional(),
          spanLg: z.union([z.literal(4), z.literal(6), z.literal(8)]).optional(),
          groups: z.array(z.object({ title: text(100, 'Name the group.'), items: list(200, 20) })).max(4),
        }),
      )
      .max(20),
  }),
  process: z.object({
    items: z.array(z.object({ id: rowId.optional(), title: text(100, 'Add a title.'), body: text(1000, 'Describe the step.'), duration: optText(100), deliverables: list(200, 10) })).max(10),
  }),
  stack: z.object({
    items: z
      .array(
        z.object({
          id: rowId.optional(),
          label: text(60, 'Name the technology.'),
          category: z.enum(STACK_CATEGORIES),
          icon: z.string().refine((v) => STACK_ICONS.includes(v), 'Choose an icon from the list.'),
        }),
      )
      .max(100),
  }),
  logos: z.object({
    items: z.array(z.object({ id: rowId.optional(), name: text(100, 'Add the client’s name.'), fileId: rowId.optional(), width: z.number().int().min(40).max(400).optional(), approved: z.boolean() })).max(50),
  }),
  settings: z
    .object({
      email: z.email('Enter a valid email address.').max(254),
      calUrl: z.url({ protocol: /^https$/, error: 'Use a full https:// booking link.' }).max(2000),
      city: text(60),
      country: text(60),
      timezoneLabel: text(40),
      replyWithin: text(40),
      bookingOpen: z.boolean(),
      bookingDetail: optText(80),
      deliveryMinWeeks: z.number().int().min(1).max(52),
      deliveryMaxWeeks: z.number().int().min(1).max(52),
      disciplines: list(30, 6),
    })
    .refine((s) => s.deliveryMinWeeks <= s.deliveryMaxWeeks, { path: ['deliveryMaxWeeks'], message: 'Must be at least the minimum.' }),
} as const;

export type SectionData = { [K in SectionKey]: z.infer<(typeof sectionSchemas)[K]> };

const byOrder = (a: { orderIndex: number }, b: { orderIndex: number }) => a.orderIndex - b.orderIndex;
const opt = <T>(v: T | null | undefined) => (v === null || v === undefined || v === '' ? undefined : v);
const published = (r: { state?: string | null }) => r.state !== 'archived';

/** Live rows → section document. */
export async function sectionFromLive<K extends SectionKey>(db: TablesDB, databaseId: string, key: K): Promise<SectionData[K]> {
  const all = async <R>(tableId: string) => (await db.listRows<R & import('node-appwrite').Models.Row>({ databaseId, tableId, queries: [Query.limit(500)] })).rows;
  switch (key) {
    case 'capabilities': {
      const [caps, groups] = await Promise.all([all<CapabilityRow>('capability'), all<CapabilityGroupRow>('capabilityGroup')]);
      return {
        items: caps.filter(published).sort(byOrder).map((c) => ({
          id: c.$id,
          title: c.title,
          description: c.description,
          tags: c.tags ?? [],
          services: c.services ?? [],
          proof: opt(c.proof),
          tone: opt(c.tone),
          spanMd: c.spanMd === 6 || c.spanMd === 12 ? c.spanMd : undefined,
          spanLg: c.spanLg === 4 || c.spanLg === 6 || c.spanLg === 8 ? c.spanLg : undefined,
          groups: groups.filter((g) => g.capabilityId === c.$id).sort(byOrder).map((g) => ({ title: g.title, items: g.items ?? [] })),
        })),
      } as SectionData[K];
    }
    case 'process':
      return { items: (await all<ProcessStepRow>('processStep')).filter(published).sort(byOrder).map((s) => ({ id: s.$id, title: s.title, body: s.body, duration: opt(s.duration), deliverables: s.deliverables ?? [] })) } as SectionData[K];
    case 'stack':
      return { items: (await all<StackItemRow>('stackItem')).filter(published).sort(byOrder).map((s) => ({ id: s.$id, label: s.label, category: s.category, icon: s.icon })) } as SectionData[K];
    case 'logos':
      return { items: (await all<ClientLogoRow>('clientLogo')).sort(byOrder).map((l) => ({ id: l.$id, name: l.name, fileId: opt(l.logoFileId), width: opt(l.width), approved: l.approved ?? false })) } as SectionData[K];
    case 'settings': {
      const s = await db.getRow<SiteSettingsRow>({ databaseId, tableId: 'siteSettings', rowId: 'siteSettings' });
      return {
        email: s.contactEmail,
        calUrl: s.bookingUrl ?? '',
        city: s.city ?? '',
        country: s.country ?? '',
        timezoneLabel: s.timezoneLabel ?? '',
        replyWithin: s.replyWithin ?? '',
        bookingOpen: s.bookingOpen ?? true,
        bookingDetail: opt(s.bookingDetail),
        deliveryMinWeeks: s.deliveryMinWeeks ?? 2,
        deliveryMaxWeeks: s.deliveryMaxWeeks ?? 4,
        disciplines: s.disciplines ?? [],
      } as SectionData[K];
    }
  }
  throw new Error(`Unknown section ${String(key)}`);
}

const pad = (i: number) => String(i + 1).padStart(2, '0');

/** Section document → live rows, atomically. Run as the Admin's session. */
export async function publishSection<K extends SectionKey>(
  db: TablesDB,
  { databaseId, key, data, actorId }: { databaseId: string; key: K; data: SectionData[K]; actorId: string },
) {
  const tableId = SECTIONS[key].tableId;
  if (key === 'settings') {
    const s = data as SectionData['settings'];
    await db.updateRow({
      databaseId,
      tableId,
      rowId: 'siteSettings',
      data: {
        contactEmail: s.email,
        bookingUrl: s.calUrl,
        city: s.city,
        country: s.country,
        timezoneLabel: s.timezoneLabel,
        replyWithin: s.replyWithin,
        bookingOpen: s.bookingOpen,
        bookingDetail: s.bookingDetail ?? null,
        deliveryMinWeeks: s.deliveryMinWeeks,
        deliveryMaxWeeks: s.deliveryMaxWeeks,
        disciplines: s.disciplines,
        updatedBy: actorId,
      },
    });
    return;
  }

  const items = (data as { items: { id?: string }[] }).items;
  const existing = (await db.listRows({ databaseId, tableId, queries: [Query.select(['$id']), Query.limit(500)] })).rows.map((r) => r.$id);
  const ids = items.map((it) => (it.id && existing.includes(it.id) ? it.id : ID.unique()));
  const oldGroups =
    key === 'capabilities' ? (await db.listRows<CapabilityGroupRow>({ databaseId, tableId: 'capabilityGroup', queries: [Query.limit(500)] })).rows : [];

  const { $id: transactionId } = await db.createTransaction({ ttl: 120 });
  try {
    for (const [i, it] of items.entries()) {
      await db.upsertRow({ databaseId, tableId, rowId: ids[i], transactionId, data: { ...rowData(key, it, i), orderIndex: i } });
      if (key === 'capabilities') {
        const groups = (it as SectionData['capabilities']['items'][number]).groups;
        for (const [n, g] of groups.entries()) {
          await db.upsertRow({ databaseId, tableId: 'capabilityGroup', rowId: `${ids[i]}-g${n + 1}`, transactionId, data: { capabilityId: ids[i], orderIndex: n, title: g.title, items: g.items } });
        }
      }
    }
    if (key === 'capabilities') {
      const keep = new Set(items.flatMap((it, i) => (it as SectionData['capabilities']['items'][number]).groups.map((_, n) => `${ids[i]}-g${n + 1}`)));
      for (const g of oldGroups) if (!keep.has(g.$id)) await db.deleteRow({ databaseId, tableId: 'capabilityGroup', rowId: g.$id, transactionId });
    }
    for (const id of existing) if (!ids.includes(id)) await db.deleteRow({ databaseId, tableId, rowId: id, transactionId });
    await db.updateTransaction({ transactionId, commit: true });
  } catch (e) {
    await db.updateTransaction({ transactionId, rollback: true }).catch(() => {});
    throw e;
  }
}

function rowData(key: Exclude<SectionKey, 'settings'>, it: unknown, i: number): Record<string, unknown> {
  switch (key) {
    case 'capabilities': {
      const c = it as SectionData['capabilities']['items'][number];
      return { displayIndex: pad(i), title: c.title, description: c.description, tags: c.tags, services: c.services, proof: c.proof ?? null, tone: c.tone ?? null, spanMd: c.spanMd ?? null, spanLg: c.spanLg ?? null, state: 'published' };
    }
    case 'process': {
      const s = it as SectionData['process']['items'][number];
      return { displayIndex: pad(i), title: s.title, body: s.body, duration: s.duration ?? null, deliverables: s.deliverables, state: 'published' };
    }
    case 'stack': {
      const s = it as SectionData['stack']['items'][number];
      return { label: s.label, category: s.category, icon: s.icon, state: 'published' };
    }
    case 'logos': {
      const l = it as SectionData['logos']['items'][number];
      return { name: l.name, logoFileId: l.fileId ?? null, width: l.width ?? null, approved: l.approved };
    }
  }
}
