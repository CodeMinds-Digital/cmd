import 'server-only';
import { cache } from 'react';
import { unstable_cache } from 'next/cache';
import { cookies, draftMode } from 'next/headers';
import { BUCKETS, fileViewUrl } from '@codeminds/cms/assets';
import { CACHE_TAGS, type CacheTag } from '@codeminds/cms/cache-tags';
import { retrying } from '@codeminds/cms/retry';
import { PREVIEW_COOKIE, verifyPreviewSession } from '@codeminds/cms/signing';
import type {
  CapabilityGroupRow,
  CapabilityRow,
  CaseApproachStepRow,
  CaseMetricRow,
  CaseScreenRow,
  CaseStudyRow,
  ClientLogoRow,
  ContentDraftRow,
  JournalPostRow,
  ProcessStepRow,
  SiteSettingsRow,
  StackItemRow,
  TableId,
  TestimonialRow,
} from '@codeminds/cms/schema';
import { draftRowId, SECTION_ROW_ID } from '@codeminds/cms/content/drafts';
import { postSchema } from '@codeminds/cms/content/post';
import { sectionSchemas, SECTIONS, type SectionData, type SectionKey } from '@codeminds/cms/content/sections';
import { projectSchema } from '@codeminds/cms/content/project';
import { adminClient, Query } from '@codeminds/cms/server';
import { brandIconKeys } from '@/components/icons/brand';
import { siteConfig } from '@/config/site';
import {
  capabilitiesFromDoc,
  caseFromProject,
  logosFromDoc,
  processFromDoc,
  settingsFromDoc,
  stackFromDoc,
  postFromData,
  toCapability,
  toCase,
  toClientLogo,
  toPost,
  toProcessStep,
  toSiteSettings,
  toStackItem,
} from '@/lib/cms/mappers';
import type { CaseStub, Post } from '@/lib/cms/types';

/**
 * Site content from Appwrite, read server-side with the project API key
 * (visitors' browsers never call Appwrite).
 *
 * Caching: each loader is wrapped in `unstable_cache` with a tag from
 * CACHE_TAGS, so pages stay pre-rendered. A row change fires the
 * `revalidate-site` Appwrite Function, which calls /api/revalidate to expire
 * the matching tag; the hourly `revalidate` is a safety net if that call is
 * ever missed. In draft mode (/api/preview) loaders bypass the cache and
 * include draft / in-review rows.
 */

/** Live rows the public sees; preview adds saved drafts on top (never hidden or archived rows). */
const PUBLISHED = 'published';
const SAFETY_NET_S = 3600;

async function rows<R>(tableId: TableId, queries: string[]): Promise<R[]> {
  const { env, tablesDB } = adminClient();
  const db = retrying(tablesDB);
  const out: R[] = [];
  let cursor: string | undefined;
  for (;;) {
    const page = await db.listRows({
      databaseId: env.databaseId,
      tableId,
      queries: [...queries, Query.limit(100), ...(cursor ? [Query.cursorAfter(cursor)] : [])],
    });
    out.push(...(page.rows as R[]));
    if (page.rows.length < 100) return out;
    cursor = page.rows.at(-1)!.$id;
  }
}

/** Draft mode is a request-time signal; outside a request (build, generateStaticParams) it is off. */
/**
 * Preview needs both Next's draft mode and our signed, 10-minute preview
 * cookie (draft mode alone is site-wide and never expires).
 */
export async function isDraft() {
  try {
    if (!(await draftMode()).isEnabled) return false;
    const secret = process.env.PREVIEW_SECRET;
    return !!secret && verifyPreviewSession(secret, (await cookies()).get(PREVIEW_COOKIE)?.value);
  } catch {
    return false;
  }
}

/** Cached for the public, fresh (and including drafts) in draft mode; deduped per request. */
function loader<T>(name: string, tag: CacheTag, load: (preview: boolean) => Promise<T>) {
  const cached = unstable_cache(() => load(false), ['cms', name], { tags: [tag], revalidate: SAFETY_NET_S });
  return cache(async (): Promise<T> => ((await isDraft()) ? load(true) : cached()));
}

// ── Loaders ──────────────────────────────────────────────────────────────
async function loadCases(preview: boolean): Promise<CaseStub[]> {
  const cases = await rows<CaseStudyRow>('caseStudy', [Query.equal('state', PUBLISHED), Query.orderAsc('orderIndex')]);
  if (!cases.length) return preview ? withDrafts('caseStudy', [], projectDraft) : [];
  const ids = cases.map((c) => c.$id);
  const testimonialIds = cases.flatMap((c) => (c.testimonialId ? [c.testimonialId] : []));
  const [steps, screens, metrics, testimonials] = await Promise.all([
    rows<CaseApproachStepRow>('caseApproachStep', [Query.equal('caseStudyId', ids)]),
    rows<CaseScreenRow>('caseScreen', [Query.equal('caseStudyId', ids)]),
    rows<CaseMetricRow>('caseMetric', [Query.equal('caseStudyId', ids)]),
    testimonialIds.length ? rows<TestimonialRow>('testimonial', [Query.equal('$id', testimonialIds)]) : [],
  ]);
  const live = cases.map((c) => ({ id: c.$id, data: toCase(c, { steps, screens, metrics, testimonials }, publicFile) }));
  return preview ? withDrafts('caseStudy', live, projectDraft) : live.map((c) => c.data);
}

const publicFile = (id: string) => fileViewUrl(BUCKETS.publicAssets, id);

const projectDraft = (json: unknown) => {
  const p = projectSchema.safeParse(json);
  return p.success ? caseFromProject(p.data, publicFile) : null;
};
const postDraft = (json: unknown) => {
  const p = postSchema.safeParse(json);
  return p.success ? postFromData(p.data, publicFile) : null;
};

/**
 * Draft preview: each valid saved draft replaces its live item (or is added
 * if new). Invalid drafts are skipped, so preview never renders unchecked data.
 */
async function withDrafts<T>(tableId: TableId, live: { id: string; data: T }[], fromDraft: (json: unknown) => T | null): Promise<T[]> {
  const drafts = await rows<ContentDraftRow>('contentDraft', [Query.equal('tableId', tableId)]);
  const out = new Map(live.map((c) => [c.id, c.data]));
  for (const d of drafts) {
    let json: unknown;
    try {
      json = JSON.parse(d.data);
    } catch {
      continue;
    }
    const item = fromDraft(json);
    if (item) out.set(d.rowId, item);
  }
  return [...out.values()];
}

async function loadPosts(preview: boolean): Promise<Post[]> {
  const posts = await rows<JournalPostRow>('journalPost', [Query.equal('state', PUBLISHED), Query.orderDesc('publishedAt')]);
  const live = posts.map((p) => ({ id: p.$id, data: toPost(p, publicFile) }));
  if (!preview) return live.map((p) => p.data);
  return (await withDrafts('journalPost', live, postDraft)).sort((a, b) => b.date.localeCompare(a.date));
}

/** Draft preview: the saved draft of a whole home-page section, if valid. */
async function sectionDraft<K extends SectionKey>(key: K): Promise<SectionData[K] | null> {
  const [row] = await rows<ContentDraftRow>('contentDraft', [Query.equal('$id', draftRowId(SECTIONS[key].tableId, SECTION_ROW_ID))]);
  if (!row) return null;
  try {
    const parsed = sectionSchemas[key].safeParse(JSON.parse(row.data));
    return parsed.success ? (parsed.data as SectionData[K]) : null;
  } catch {
    return null;
  }
}

async function loadCapabilities(preview: boolean) {
  const draft = preview ? await sectionDraft('capabilities') : null;
  if (draft) return capabilitiesFromDoc(draft);
  const caps = await rows<CapabilityRow>('capability', [Query.equal('state', PUBLISHED), Query.orderAsc('orderIndex')]);
  if (!caps.length) return [];
  const groups = await rows<CapabilityGroupRow>('capabilityGroup', [Query.equal('capabilityId', caps.map((c) => c.$id))]);
  return caps.map((c) => toCapability(c, groups));
}

async function loadProcess(preview: boolean) {
  const draft = preview ? await sectionDraft('process') : null;
  if (draft) return processFromDoc(draft);
  const steps = await rows<ProcessStepRow>('processStep', [Query.equal('state', PUBLISHED), Query.orderAsc('orderIndex')]);
  return steps.map(toProcessStep);
}

const BRAND_KEYS: ReadonlySet<string> = new Set(brandIconKeys);

async function loadStack(preview: boolean) {
  const draft = preview ? await sectionDraft('stack') : null;
  if (draft) return stackFromDoc(draft, BRAND_KEYS);
  const items = await rows<StackItemRow>('stackItem', [Query.equal('state', PUBLISHED), Query.orderAsc('orderIndex')]);
  return items.map((r) => toStackItem(r, BRAND_KEYS));
}

/** Logos have no row state: `approved` is the switch. */
async function loadLogos(preview: boolean) {
  const draft = preview ? await sectionDraft('logos') : null;
  if (draft) return logosFromDoc(draft, publicFile);
  const logos = await rows<ClientLogoRow>('clientLogo', [Query.equal('approved', true), Query.orderAsc('orderIndex')]);
  return logos.map((r) => toClientLogo(r, publicFile));
}

async function loadSettings(preview: boolean) {
  const draft = preview ? await sectionDraft('settings') : null;
  if (draft) return settingsFromDoc(draft);
  const [row] = await rows<SiteSettingsRow>('siteSettings', [Query.equal('$id', 'siteSettings')]);
  if (!row) throw new Error('siteSettings row is missing in Appwrite.');
  return toSiteSettings(row);
}

export const getCases = loader('cases', CACHE_TAGS.cases, loadCases);
export const getPosts = loader('posts', CACHE_TAGS.posts, loadPosts);
export const getCapabilities = loader('capabilities', CACHE_TAGS.capabilities, loadCapabilities);
export const getProcessSteps = loader('process', CACHE_TAGS.process, loadProcess);
export const getStack = loader('stack', CACHE_TAGS.stack, loadStack);
export const getApprovedLogos = loader('logos', CACHE_TAGS.logos, loadLogos);
export const getSiteSettings = loader('site', CACHE_TAGS.site, loadSettings);

export async function getCase(slug: string) {
  return (await getCases()).find((c) => c.slug === slug);
}

/** The case after `slug`, wrapping around. */
export async function getNextCase(slug: string) {
  const cases = await getCases();
  const i = cases.findIndex((c) => c.slug === slug);
  return i === -1 ? undefined : cases[(i + 1) % cases.length];
}

export async function getPost(slug: string) {
  return (await getPosts()).find((p) => p.slug === slug);
}

/** Code-defined structure plus the editable settings, in the shape components used before. */
export async function getSite() {
  return { ...siteConfig, ...(await getSiteSettings()) };
}
