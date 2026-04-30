import 'server-only';
import { unstable_cache as nextCache } from 'next/cache';
import { databases, Query } from '@/lib/appwrite/server';
import { APPWRITE_DATABASE_ID } from '@/lib/appwrite/env';
import { urlForFile, BUCKETS } from '@/lib/appwrite/url-for-asset';
import type {
  CaseStub,
  CaseApproachStep,
  CaseScreen,
  CaseMetricItem,
  CaseTestimonial,
  CaseStatus,
} from '@/types/case';

// Re-export the canonical types so callers can `import { CmsCase } from '@/lib/cms/cases'`
// without reaching deeper into types/.
export type {
  CaseStub,
  CaseApproachStep,
  CaseScreen,
  CaseMetricItem,
  CaseTestimonial,
  CaseStatus,
};

/**
 * Public-facing case shape with pre-resolved URLs. Pages render this
 * directly without needing to know about Appwrite buckets.
 */
export type CmsCase = Omit<CaseStub, 'cover' | 'screens'> & {
  cover?: string; // pre-resolved public URL
  screens?: CmsScreen[];
};

export type CmsScreen = Omit<CaseScreen, 'src'> & {
  src?: string; // pre-resolved public URL
};

function resolveAssetUrl(fileId: string | undefined): string | undefined {
  if (!fileId) return undefined;
  // SVGs render via /view (no rasterisation); raster via /preview.
  // Heuristic: file IDs from migration end with `.svg` in the upload name,
  // not in the ID, so we can't tell from the ID alone. Use /view universally
  // here — Next/Image with `unoptimized` already handles SVG correctly.
  return urlForFile(fileId, BUCKETS.publicAssets);
}

function parseJson<T>(s: unknown, fallback: T): T {
  if (typeof s !== 'string' || s.length === 0) return fallback;
  try {
    return JSON.parse(s) as T;
  } catch {
    return fallback;
  }
}

async function loadTestimonial(id: string): Promise<CaseTestimonial | undefined> {
  if (!id) return undefined;
  try {
    const t = await databases.getDocument(APPWRITE_DATABASE_ID, 'testimonial', id);
    return {
      quote: String(t.quote ?? ''),
      author: String(t.author ?? ''),
      role: String(t.role ?? ''),
    };
  } catch {
    return undefined;
  }
}

async function fetchCases(): Promise<CmsCase[]> {
  try {
    const res = await databases.listDocuments(
      APPWRITE_DATABASE_ID,
      'caseStudy',
      [Query.limit(100), Query.orderAsc('orderIndex')],
    );
    if (res.total === 0) return [];

    const cases = await Promise.all(
      res.documents.map(async (d) => {
        const screens = parseJson<
          { fileId: string; alt: string; caption: string; tone: 'indigo' | 'cyan' | 'mixed' }[]
        >(d.screensJson, []);
        const approach = parseJson<CaseApproachStep[]>(d.approachJson, []);
        const metrics = parseJson<CaseMetricItem[]>(d.metricsJson, []);
        const testimonial = await loadTestimonial(String(d.testimonialId ?? ''));

        return {
          slug: String(d.slug),
          title: String(d.title),
          client: stringOrUndef(d.client),
          year: typeof d.year === 'number' ? d.year : new Date().getFullYear(),
          brief: String(d.brief ?? ''),
          tags: Array.isArray(d.tags) ? d.tags.map(String) : [],
          status: (String(d.status) as CaseStatus) ?? 'draft',
          eta: stringOrUndef(d.eta),
          cover: resolveAssetUrl(stringOrUndef(d.coverFileId)),
          coverAlt: stringOrUndef(d.coverAlt),
          role: stringOrUndef(d.role),
          duration: stringOrUndef(d.duration),
          liveUrl: stringOrUndef(d.liveUrl),
          problem: stringOrUndef(d.problem),
          approach,
          screens: screens.map<CmsScreen>((s) => ({
            src: resolveAssetUrl(s.fileId),
            alt: s.alt,
            caption: s.caption,
            tone: s.tone,
          })),
          metrics,
          testimonial,
        } satisfies CmsCase;
      }),
    );
    return cases;
  } catch {
    // Appwrite unreachable — return empty so the page renders the
    // empty state rather than crashing. Re-run migration if this happens.
    return [];
  }
}

/** Cached top-level fetcher — tagged for surgical revalidation. */
export const getCases = nextCache(fetchCases, ['caseStudy'], {
  tags: ['caseStudy'],
});

export async function getCase(slug: string): Promise<CmsCase | undefined> {
  const all = await getCases();
  return all.find((c) => c.slug === slug);
}

export async function getNextCase(slug: string): Promise<CmsCase | undefined> {
  const all = await getCases();
  const i = all.findIndex((c) => c.slug === slug);
  if (i === -1) return undefined;
  return all[(i + 1) % all.length];
}

// ── helpers ──────────────────────────────────────────────────────────
function stringOrUndef(v: unknown): string | undefined {
  return typeof v === 'string' && v.length > 0 ? v : undefined;
}
