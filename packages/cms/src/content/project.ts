/**
 * A project (case study) as one editable document, shared by the admin
 * editor, the draft layer and the site's draft preview.
 *
 * Live data is spread over caseStudy + caseApproachStep / caseScreen /
 * caseMetric + testimonial. Editors never write those (Admin-only, D24): they
 * save a ProjectData document in `contentDraft`; an Admin publishes it with
 * `publishProject`, which rewrites the live rows in one transaction.
 */
import { z } from 'zod';
import type { TablesDB } from 'node-appwrite';
import { ID, Query } from 'node-appwrite';
import type { CaseApproachStepRow, CaseMetricRow, CaseScreenRow, CaseStudyRow, TestimonialRow } from '../schema/generated.ts';

const text = (max: number) => z.string().trim().max(max);
const optText = (max: number) =>
  z.preprocess((v) => (typeof v === 'string' && v.trim() === '' ? undefined : v), z.string().trim().max(max).optional());
const fileId = z.string().regex(/^[a-zA-Z0-9._-]{1,36}$/);
/**
 * Site-relative asset path (e.g. /work/x.svg) — legacy covers shipped with the
 * site. No `//` (a protocol-relative URL to another host) and no `..`.
 */
const sitePath = z.string().regex(/^\/(?!\/)(?!.*\.\.)[A-Za-z0-9/_.-]{1,254}$/);

const image = z
  .object({ src: sitePath.optional(), fileId: fileId.optional() })
  .refine((v) => !(v.src && v.fileId), 'Use either an uploaded image or a site path, not both.');

export const projectSchema = z.object({
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Lowercase letters, numbers and single hyphens.').max(80),
  title: text(200).min(1, 'Add a title.'),
  client: optText(200),
  year: z.coerce.number().int().min(2000).max(2100),
  brief: text(500).min(1, 'Add a one-line brief.'),
  tags: z.array(text(64).min(1)).max(10),
  status: z.enum(['live', 'coming']),
  eta: optText(100),
  cover: image.and(z.object({ alt: optText(200) })),
  role: optText(200),
  duration: optText(100),
  liveUrl: z.preprocess(
    (v) => (typeof v === 'string' && v.trim() === '' ? undefined : v),
    z.url({ protocol: /^https$/, error: 'Use a full https:// link.' }).max(2000).optional(),
  ),
  problem: optText(1500),
  approach: z.array(z.object({ index: text(4), title: text(200).min(1), body: text(16000).min(1) })).max(12),
  screens: z.array(image.and(z.object({ alt: text(300).min(1, 'Describe the image.'), caption: optText(16000), tone: z.enum(['paper', 'ink', 'mixed']).optional() }))).max(12),
  metrics: z.array(z.object({ label: text(60).min(1), value: text(60).min(1) })).max(8),
  testimonial: z.object({ quote: text(1000).min(1), author: text(200).min(1), role: text(200).min(1) }).nullable(),
});

export type ProjectData = z.infer<typeof projectSchema>;

export function emptyProject(year = new Date().getUTCFullYear()): ProjectData {
  return {
    slug: '', title: '', year, brief: '', tags: [], status: 'coming', cover: {}, approach: [], screens: [], metrics: [], testimonial: null,
  } as unknown as ProjectData;
}

const opt = <T>(v: T | null | undefined) => (v === null || v === undefined || v === '' ? undefined : v);

/** Live rows → editable document (to start a draft from the published version). */
export function projectFromLive(
  row: CaseStudyRow,
  kids: { steps: CaseApproachStepRow[]; screens: CaseScreenRow[]; metrics: CaseMetricRow[]; testimonial?: TestimonialRow | null },
): ProjectData {
  const byOrder = (a: { orderIndex: number }, b: { orderIndex: number }) => a.orderIndex - b.orderIndex;
  return {
    slug: row.slug,
    title: row.title,
    client: opt(row.client),
    year: row.year,
    brief: row.brief,
    tags: row.tags ?? [],
    status: row.status === 'live' ? 'live' : 'coming',
    eta: opt(row.eta),
    cover: { src: opt(row.coverSrc), fileId: opt(row.coverFileId), alt: opt(row.coverAlt) },
    role: opt(row.role),
    duration: opt(row.duration),
    liveUrl: opt(row.liveUrl),
    problem: opt(row.problem),
    approach: [...kids.steps].sort(byOrder).map((s) => ({ index: s.displayIndex ?? '', title: s.title, body: s.body })),
    screens: [...kids.screens].sort(byOrder).map((s) => ({ src: opt(s.src), fileId: opt(s.fileId), alt: s.alt, caption: opt(s.caption), tone: opt(s.tone) ?? undefined })),
    metrics: [...kids.metrics].sort(byOrder).map((m) => ({ label: m.label, value: m.value })),
    testimonial: kids.testimonial ? { quote: kids.testimonial.quote, author: kids.testimonial.author, role: kids.testimonial.role } : null,
  };
}

/** Child row IDs are derived from the project row ID so a re-publish updates in place. */
export const childId = (rowId: string, kind: 'a' | 's' | 'm', i: number) => `${rowId}-${kind}${i + 1}`;
export const testimonialIdFor = (rowId: string) => `t-${rowId}`;

const CHILDREN = [
  { tableId: 'caseApproachStep', kind: 'a' },
  { tableId: 'caseScreen', kind: 's' },
  { tableId: 'caseMetric', kind: 'm' },
] as const;

/**
 * Write `data` as the live version of project `rowId`, atomically.
 * Run it with the signed-in Admin's session client so Appwrite enforces that
 * only Admins can publish (Editors get 401 on these tables).
 */
export async function publishProject(
  tablesDB: TablesDB,
  { databaseId, rowId, data, actorId }: { databaseId: string; rowId: string; data: ProjectData; actorId: string },
) {
  const existing = await tablesDB.getRow<CaseStudyRow>({ databaseId, tableId: 'caseStudy', rowId }).catch(() => null);
  const clash = await tablesDB.listRows<CaseStudyRow>({ databaseId, tableId: 'caseStudy', queries: [Query.equal('slug', data.slug), Query.limit(1)] });
  if (clash.rows.some((r) => r.$id !== rowId)) throw new Error(`Another project already uses the address /work/${data.slug}.`);

  let orderIndex = existing?.orderIndex ?? 0;
  if (!existing) {
    const last = await tablesDB.listRows<CaseStudyRow>({ databaseId, tableId: 'caseStudy', queries: [Query.orderDesc('orderIndex'), Query.limit(1)] });
    orderIndex = (last.rows[0]?.orderIndex ?? -1) + 1;
  }
  const oldKids = await Promise.all(
    CHILDREN.map((c) => tablesDB.listRows({ databaseId, tableId: c.tableId, queries: [Query.equal('caseStudyId', rowId), Query.select(['$id']), Query.limit(100)] })),
  );

  const { $id: transactionId } = await tablesDB.createTransaction({ ttl: 120 });
  try {
    const tId = existing?.testimonialId ?? testimonialIdFor(rowId);
    if (data.testimonial) {
      await tablesDB.upsertRow({ databaseId, tableId: 'testimonial', rowId: tId, transactionId, data: { ...data.testimonial, approved: true, orderIndex } });
    } else if (existing?.testimonialId) {
      await tablesDB.updateRow({ databaseId, tableId: 'testimonial', rowId: existing.testimonialId, transactionId, data: { approved: false } });
    }

    await tablesDB.upsertRow({
      databaseId,
      tableId: 'caseStudy',
      rowId,
      transactionId,
      data: {
        slug: data.slug,
        title: data.title,
        client: data.client ?? null,
        year: data.year,
        brief: data.brief,
        tags: data.tags,
        status: data.status,
        eta: data.eta ?? null,
        coverSrc: data.cover.src ?? null,
        coverFileId: data.cover.fileId ?? null,
        coverAlt: data.cover.alt ?? null,
        role: data.role ?? null,
        duration: data.duration ?? null,
        liveUrl: data.liveUrl ?? null,
        problem: data.problem ?? null,
        testimonialId: data.testimonial ? tId : null,
        orderIndex,
        state: 'published',
        publishedAt: existing?.publishedAt ?? new Date().toISOString(),
        publishedBy: actorId,
        updatedBy: actorId,
        ...(existing ? {} : { createdBy: actorId }),
      },
    });

    const rows = {
      caseApproachStep: data.approach.map((s) => ({ displayIndex: s.index || null, title: s.title, body: s.body })),
      caseScreen: data.screens.map((s) => ({ src: s.src ?? null, fileId: s.fileId ?? null, alt: s.alt, caption: s.caption ?? null, tone: s.tone ?? null })),
      caseMetric: data.metrics.map((m) => ({ label: m.label, value: m.value })),
    };
    for (const [i, c] of CHILDREN.entries()) {
      const items = rows[c.tableId];
      const keep = new Set(items.map((_, n) => childId(rowId, c.kind, n)));
      for (const [n, item] of items.entries()) {
        await tablesDB.upsertRow({ databaseId, tableId: c.tableId, rowId: childId(rowId, c.kind, n), transactionId, data: { caseStudyId: rowId, orderIndex: n, ...item } });
      }
      for (const old of oldKids[i].rows) {
        if (!keep.has(old.$id)) await tablesDB.deleteRow({ databaseId, tableId: c.tableId, rowId: old.$id, transactionId });
      }
    }
    await tablesDB.updateTransaction({ transactionId, commit: true });
  } catch (e) {
    await tablesDB.updateTransaction({ transactionId, rollback: true }).catch(() => {});
    throw e;
  }
}

export { ID };
