/**
 * Appwrite rows → site models. Pure functions (no I/O), unit-tested in
 * tests/unit/cms-mappers.test.mjs. Optional fields map null → undefined so
 * components see the same shapes they did with the static data files.
 */
import type {
  CapabilityGroupRow,
  CapabilityRow,
  CaseApproachStepRow,
  CaseMetricRow,
  CaseScreenRow,
  CaseStudyRow,
  ClientLogoRow,
  JournalPostRow,
  ProcessStepRow,
  SiteSettingsRow,
  StackItemRow,
  TestimonialRow,
} from '@codeminds/cms/schema';
import type { ProjectData } from '@codeminds/cms/content/project';
import type { PostData } from '@codeminds/cms/content/post';
import { readingTime } from '@codeminds/cms/content/rich-text';
import type { SectionData } from '@codeminds/cms/content/sections';
import type { BrandIconKey } from '@/components/icons/brand';
import type {
  Capability,
  CaseStub,
  ClientLogo,
  GenericGlyph,
  Post,
  ProcessStep,
  SiteSettings,
  StackItem,
} from '@/lib/cms/types';

const opt = <T>(v: T | null | undefined): T | undefined => (v === null ? undefined : v);
const byOrder = (a: { orderIndex?: number | null }, b: { orderIndex?: number | null }) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0);

export type CaseChildren = {
  steps: CaseApproachStepRow[];
  screens: CaseScreenRow[];
  metrics: CaseMetricRow[];
  testimonials: TestimonialRow[];
};

/** File ID in the public-assets bucket → URL the site can render. */
export type FileUrl = (fileId: string) => string;

export function toCase(row: CaseStudyRow, kids: CaseChildren, fileUrl: FileUrl): CaseStub {
  const mine = <R extends { caseStudyId: string; orderIndex: number }>(rows: R[]) =>
    rows.filter((r) => r.caseStudyId === row.$id).sort(byOrder);
  const steps = mine(kids.steps);
  const screens = mine(kids.screens);
  const metrics = mine(kids.metrics);
  const t = row.testimonialId ? kids.testimonials.find((x) => x.$id === row.testimonialId && x.approved) : undefined;
  return {
    slug: row.slug,
    title: row.title,
    client: opt(row.client),
    year: row.year,
    brief: row.brief,
    tags: row.tags ?? [],
    status: row.status === 'live' ? 'live' : 'coming',
    eta: opt(row.eta),
    cover: opt(row.coverSrc) ?? (row.coverFileId ? fileUrl(row.coverFileId) : undefined),
    coverAlt: opt(row.coverAlt),
    role: opt(row.role),
    duration: opt(row.duration),
    liveUrl: opt(row.liveUrl),
    problem: opt(row.problem),
    approach: steps.length ? steps.map((s) => ({ index: s.displayIndex ?? '', title: s.title, body: s.body })) : undefined,
    screens: screens.length
      ? screens.map((s) => ({ src: opt(s.src) ?? (s.fileId ? fileUrl(s.fileId) : undefined), alt: s.alt, caption: opt(s.caption), tone: opt(s.tone) }))
      : undefined,
    metrics: metrics.length ? metrics.map((m) => ({ label: m.label, value: m.value })) : undefined,
    testimonial: t ? { quote: t.quote, author: t.author, role: t.role } : undefined,
  };
}

/** A saved draft (draft preview only) → the same shape as a live project. */
export function caseFromProject(d: ProjectData, fileUrl: FileUrl): CaseStub {
  const img = (i: { src?: string; fileId?: string }) => i.src ?? (i.fileId ? fileUrl(i.fileId) : undefined);
  const list = <T>(a: T[]) => (a.length ? a : undefined);
  return {
    slug: d.slug,
    title: d.title,
    client: d.client,
    year: d.year,
    brief: d.brief,
    tags: d.tags,
    status: d.status,
    eta: d.eta,
    cover: img(d.cover),
    coverAlt: d.cover.alt,
    role: d.role,
    duration: d.duration,
    liveUrl: d.liveUrl,
    problem: d.problem,
    approach: list(d.approach.map((s) => ({ index: s.index, title: s.title, body: s.body }))),
    screens: list(d.screens.map((s) => ({ src: img(s), alt: s.alt, caption: s.caption, tone: s.tone }))),
    metrics: list(d.metrics),
    testimonial: d.testimonial ?? undefined,
  };
}

export function toPost(row: JournalPostRow, fileUrl: FileUrl): Post {
  let doc: unknown;
  if (row.bodyJson) {
    try {
      doc = JSON.parse(row.bodyJson);
    } catch {
      doc = undefined;
    }
  }
  return {
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt,
    date: row.publishedAt.slice(0, 10),
    readingTime: row.readingTime ?? '',
    tags: row.tags ?? [],
    body: opt(row.body),
    doc,
    cover: row.coverFileId ? { src: fileUrl(row.coverFileId), alt: opt(row.coverAlt) } : undefined,
    seoTitle: opt(row.seoTitle),
    seoDescription: opt(row.seoDescription),
  };
}

/** A saved post draft (draft preview only). Undated drafts show today's date. */
export function postFromData(d: PostData, fileUrl: FileUrl, today = new Date().toISOString().slice(0, 10)): Post {
  return {
    slug: d.slug,
    title: d.title,
    excerpt: d.excerpt,
    date: d.date ?? today,
    readingTime: readingTime(d.body),
    tags: d.tags,
    doc: d.body,
    cover: d.cover.fileId ? { src: fileUrl(d.cover.fileId), alt: d.cover.alt } : undefined,
    seoTitle: d.seoTitle,
    seoDescription: d.seoDescription,
  };
}

const MD = new Set([6, 12]);
const LG = new Set([4, 6, 8]);

export function toCapability(row: CapabilityRow, groups: CapabilityGroupRow[]): Capability {
  const mine = groups.filter((g) => g.capabilityId === row.$id).sort(byOrder);
  const md = row.spanMd && MD.has(row.spanMd) ? (row.spanMd as 6 | 12) : undefined;
  const lg = row.spanLg && LG.has(row.spanLg) ? (row.spanLg as 4 | 6 | 8) : undefined;
  return {
    index: row.displayIndex ?? '',
    title: row.title,
    tags: row.tags ?? [],
    description: row.description,
    services: row.services?.length ? row.services : undefined,
    proof: opt(row.proof),
    serviceGroups: mine.length ? mine.map((g) => ({ title: g.title, items: g.items ?? [] })) : undefined,
    tone: opt(row.tone),
    span: md || lg ? { ...(md && { md }), ...(lg && { lg }) } : undefined,
  };
}

export function toProcessStep(row: ProcessStepRow): ProcessStep {
  return {
    index: row.displayIndex,
    title: row.title,
    body: row.body,
    duration: row.duration ?? '',
    deliverables: row.deliverables ?? [],
  };
}

const GENERIC = new Set<string>(['terminal', 'phone', 'code']);

/** Unknown icon keys (e.g. typed in the Console) fall back to the generic code glyph. */
export function toStackItem(row: StackItemRow, brandKeys: ReadonlySet<string>): StackItem {
  const icon = GENERIC.has(row.icon) || brandKeys.has(row.icon) ? (row.icon as BrandIconKey | GenericGlyph) : 'code';
  return { label: row.label, category: row.category, icon };
}

export function toClientLogo(row: ClientLogoRow, fileUrl: (fileId: string) => string): ClientLogo {
  return { name: row.name, src: row.logoFileId ? fileUrl(row.logoFileId) : undefined, width: opt(row.width) };
}

export function toSiteSettings(row: SiteSettingsRow): SiteSettings {
  return {
    email: row.contactEmail,
    calUrl: row.bookingUrl ?? '',
    city: row.city ?? '',
    country: row.country ?? '',
    timezoneLabel: row.timezoneLabel ?? '',
    replyWithin: row.replyWithin ?? '',
    delivery: { minWeeks: row.deliveryMinWeeks ?? 2, maxWeeks: row.deliveryMaxWeeks ?? 4 },
    disciplines: row.disciplines ?? [],
    booking: { open: row.bookingOpen ?? true, detail: row.bookingDetail ?? null },
  };
}

// ── Section drafts (draft preview only) → the same shapes as live rows ──
const pad = (i: number) => String(i + 1).padStart(2, '0');

export function capabilitiesFromDoc(d: SectionData['capabilities']): Capability[] {
  return d.items.map((c, i) => ({
    index: pad(i),
    title: c.title,
    tags: c.tags,
    description: c.description,
    services: c.services.length ? c.services : undefined,
    proof: c.proof,
    serviceGroups: c.groups.length ? c.groups : undefined,
    tone: c.tone,
    span: c.spanMd || c.spanLg ? { ...(c.spanMd && { md: c.spanMd }), ...(c.spanLg && { lg: c.spanLg }) } : undefined,
  }));
}

export function processFromDoc(d: SectionData['process']): ProcessStep[] {
  return d.items.map((s, i) => ({ index: pad(i), title: s.title, body: s.body, duration: s.duration ?? '', deliverables: s.deliverables }));
}

export function stackFromDoc(d: SectionData['stack'], brandKeys: ReadonlySet<string>): StackItem[] {
  return d.items.map((s) => toStackItem({ label: s.label, category: s.category, icon: s.icon } as StackItemRow, brandKeys));
}

export function logosFromDoc(d: SectionData['logos'], fileUrl: FileUrl): ClientLogo[] {
  return d.items.filter((l) => l.approved).map((l) => ({ name: l.name, src: l.fileId ? fileUrl(l.fileId) : undefined, width: l.width }));
}

export function settingsFromDoc(s: SectionData['settings']): SiteSettings {
  return {
    email: s.email,
    calUrl: s.calUrl,
    city: s.city,
    country: s.country,
    timezoneLabel: s.timezoneLabel,
    replyWithin: s.replyWithin,
    delivery: { minWeeks: s.deliveryMinWeeks, maxWeeks: s.deliveryMaxWeeks },
    disciplines: s.disciplines,
    booking: { open: s.bookingOpen, detail: s.bookingDetail ?? null },
  };
}
