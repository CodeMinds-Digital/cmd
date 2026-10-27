/**
 * Copy today's site content (src/data/*.ts) into the evolved tables.
 *
 *   npm run appwrite:seed              dry run
 *   npm run appwrite:seed -- --apply   apply
 *
 * Idempotent: rows are matched by natural key (slug, displayIndex) so
 * existing rows keep their IDs; new rows get deterministic IDs; a second run
 * changes nothing. Child rows (case steps/screens/metrics, capability
 * groups) are replaced to mirror the source exactly.
 *
 * Bootstrap only: once editors work in the admin (Phase 3+), the database is
 * the source of truth and this script must not be run against production
 * again (it would overwrite their edits).
 */
import { createHash } from 'node:crypto';
import { Query, type Models } from 'node-appwrite';
import { createAdminClient } from '../../packages/cms/src/appwrite/server.ts';
import { retrying } from './retry.mts';
import { cases } from './fixtures/cases.ts';
import { posts } from './fixtures/posts.ts';
import { capabilities } from './fixtures/capabilities.ts';
import { processSteps } from './fixtures/process.ts';
import { stack } from './fixtures/stack.ts';
import { logos } from './fixtures/logos.ts';
import { site } from './fixtures/site.ts';

const APPLY = process.argv.includes('--apply');
const admin = createAdminClient();
const env = admin.env;
const tablesDB = retrying(admin.tablesDB);
const databaseId = env.databaseId;
const now = new Date().toISOString();
const stats = new Map<string, { create: number; update: number; same: number; delete: number }>();

type Data = Record<string, unknown>;

/** Appwrite IDs: ≤ 36 chars of [a-zA-Z0-9._-]. Long keys fall back to a hash. */
function rid(...parts: (string | number)[]) {
  const id = parts.join('-').toLowerCase().replace(/[^a-z0-9._-]+/g, '-').replace(/^-+|-+$/g, '');
  return id.length <= 36 ? id : id.slice(0, 27) + '-' + createHash('sha1').update(id).digest('hex').slice(0, 8);
}

async function all(tableId: string, queries: string[] = []) {
  const out: Models.DefaultRow[] = [];
  let cursor: string | undefined;
  for (;;) {
    const page = await tablesDB.listRows({ databaseId, tableId, queries: [...queries, Query.limit(100), ...(cursor ? [Query.cursorAfter(cursor)] : [])] });
    out.push(...page.rows);
    if (page.rows.length < 100) return out;
    cursor = page.rows.at(-1)!.$id;
  }
}

const norm = (v: unknown) => (v === undefined ? null : v);
const unchanged = (row: Data, data: Data) => Object.entries(data).every(([k, v]) => JSON.stringify(norm(row[k])) === JSON.stringify(norm(v)));

async function put(tableId: string, existing: Models.DefaultRow | undefined, rowId: string, data: Data) {
  const s = stats.get(tableId) ?? { create: 0, update: 0, same: 0, delete: 0 };
  stats.set(tableId, s);
  if (existing && unchanged(existing, data)) return (s.same++, existing.$id);
  if (existing) {
    s.update++;
    if (APPLY) console.log(`  update ${tableId}/${existing.$id}`);
    if (APPLY) await tablesDB.updateRow({ databaseId, tableId, rowId: existing.$id, data });
    return existing.$id;
  }
  s.create++;
  if (APPLY) console.log(`  create ${tableId}/${rowId}`);
  if (APPLY) await tablesDB.createRow({ databaseId, tableId, rowId, data });
  return rowId;
}

/** Make a parent's child rows equal `items` (deterministic IDs; extras removed). */
async function children(tableId: string, parentKey: string, parentId: string, idPrefix: string, items: Data[]) {
  const have = new Map((await all(tableId, [Query.equal(parentKey, parentId)])).map((r) => [r.$id, r]));
  const keep = new Set<string>();
  for (const [i, item] of items.entries()) {
    const id = rid(idPrefix, i + 1);
    keep.add(id);
    await put(tableId, have.get(id), id, { [parentKey]: parentId, orderIndex: i, ...item });
  }
  for (const id of have.keys()) {
    if (keep.has(id)) continue;
    stats.get(tableId)!.delete++;
    if (APPLY) await tablesDB.deleteRow({ databaseId, tableId, rowId: id });
  }
}

// ── Projects (caseStudy + children + testimonial) ────────────────────────
const liveCases = new Map((await all('caseStudy')).map((r) => [r.slug as string, r]));
for (const [i, c] of cases.entries()) {
  const existing = liveCases.get(c.slug);
  let testimonialId = (existing?.testimonialId as string | null) ?? null;
  if (c.testimonial) {
    const tId = testimonialId ?? rid('testimonial', c.slug);
    const tRow = testimonialId ? await tablesDB.getRow({ databaseId, tableId: 'testimonial', rowId: testimonialId }).catch(() => undefined) : undefined;
    testimonialId = await put('testimonial', tRow, tId, { ...c.testimonial, approved: true, orderIndex: i });
  }
  const caseId = await put('caseStudy', existing, rid('case', c.slug), {
    slug: c.slug,
    title: c.title,
    client: c.client ?? null,
    year: c.year,
    brief: c.brief,
    tags: c.tags,
    status: c.status,
    eta: c.eta ?? null,
    coverSrc: c.cover ?? null,
    // The old file IDs point at files that no longer exist (bucket is empty).
    coverFileId: null,
    coverAlt: c.coverAlt ?? null,
    role: c.role ?? null,
    duration: c.duration ?? null,
    liveUrl: c.liveUrl ?? null,
    problem: c.problem ?? null,
    testimonialId: c.testimonial ? testimonialId : null,
    orderIndex: i,
    state: 'published',
    publishedAt: (existing?.publishedAt as string | null) ?? now,
  });
  await children('caseApproachStep', 'caseStudyId', caseId, `${c.slug}-step`, (c.approach ?? []).map((s) => ({ displayIndex: s.index, title: s.title, body: s.body })));
  await children('caseScreen', 'caseStudyId', caseId, `${c.slug}-screen`, (c.screens ?? []).map((s) => ({ src: s.src ?? null, alt: s.alt, caption: s.caption ?? null, tone: s.tone ?? null })));
  await children('caseMetric', 'caseStudyId', caseId, `${c.slug}-metric`, (c.metrics ?? []).map((m) => ({ label: m.label, value: m.value })));
}

// ── Journal ──────────────────────────────────────────────────────────────
const livePosts = new Map((await all('journalPost')).map((r) => [r.slug as string, r]));
for (const p of posts) {
  await put('journalPost', livePosts.get(p.slug), rid('post', p.slug), {
    slug: p.slug,
    title: p.title,
    excerpt: p.excerpt,
    publishedAt: new Date(`${p.date}T00:00:00.000Z`).toISOString().replace('Z', '+00:00'),
    readingTime: p.readingTime,
    tags: p.tags,
    body: p.body ?? null,
    status: 'published',
    state: 'published',
  });
}

// ── Capabilities (+ groups) ──────────────────────────────────────────────
const liveCaps = new Map((await all('capability')).map((r) => [r.displayIndex as string, r]));
for (const [i, c] of capabilities.entries()) {
  const capId = await put('capability', liveCaps.get(c.index), rid('capability', c.index), {
    displayIndex: c.index,
    title: c.title,
    description: c.description,
    tags: c.tags,
    services: c.services ?? [],
    proof: c.proof ?? null,
    tone: c.tone ?? null,
    spanMd: c.span?.md ?? null,
    spanLg: c.span?.lg ?? null,
    orderIndex: i,
    state: 'published',
  });
  await children('capabilityGroup', 'capabilityId', capId, `capability-${c.index}-group`, (c.serviceGroups ?? []).map((g) => ({ title: g.title, items: g.items })));
}

// ── Process ──────────────────────────────────────────────────────────────
const liveSteps = new Map((await all('processStep')).map((r) => [r.displayIndex as string, r]));
for (const [i, s] of processSteps.entries()) {
  await put('processStep', liveSteps.get(s.index), rid('process', s.index), {
    displayIndex: s.index,
    title: s.title,
    body: s.body,
    duration: s.duration,
    deliverables: s.deliverables,
    orderIndex: i,
    state: 'published',
  });
}

// ── Stack ────────────────────────────────────────────────────────────────
const liveStack = new Map((await all('stackItem')).map((r) => [r.$id, r]));
for (const [i, s] of stack.entries()) {
  const id = rid('stack', s.category, s.label);
  await put('stackItem', liveStack.get(id), id, { label: s.label, category: s.category, icon: s.icon, orderIndex: i, state: 'published' });
}

// ── Client logos: none approved in src/data; mark legacy placeholder rows unapproved ──
for (const r of await all('clientLogo')) {
  const listed = logos.find((l) => l.name === r.name);
  await put('clientLogo', r, r.$id, { approved: listed?.approved ?? false });
}

// ── Site settings (single row) ───────────────────────────────────────────
const settings = await tablesDB.getRow({ databaseId, tableId: 'siteSettings', rowId: 'siteSettings' });
await put('siteSettings', settings, 'siteSettings', {
  contactEmail: site.email,
  bookingUrl: site.calUrl,
  city: site.city,
  country: site.country,
  timezoneLabel: site.timezoneLabel,
  replyWithin: site.replyWithin,
  bookingOpen: site.booking.open,
  bookingDetail: site.booking.detail,
  deliveryMinWeeks: site.delivery.minWeeks,
  deliveryMaxWeeks: site.delivery.maxWeeks,
  disciplines: [...site.disciplines],
});

console.log(`${APPLY ? 'Applied' : 'Dry run'} against database "${databaseId}":`);
for (const [t, s] of stats) console.log(`  ${t.padEnd(18)} create ${s.create}  update ${s.update}  unchanged ${s.same}  delete ${s.delete}`);
if (!APPLY) console.log('Re-run with --apply.');
