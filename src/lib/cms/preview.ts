import 'server-only';
import { databases, Query } from '@/lib/appwrite/server';
import { APPWRITE_DATABASE_ID } from '@/lib/appwrite/env';
import { urlForFile, BUCKETS } from '@/lib/appwrite/url-for-asset';
import type { CmsCase } from './cases';
import type { CmsPost } from './posts';

/**
 * Read a single document by slug from any collection, ignoring the
 * `status='published'` filter. Used by /admin/preview/* routes so editors
 * can preview drafts before publish. Auth-gated by the page layout.
 *
 * Note: these helpers do NOT use `unstable_cache` — previews must reflect
 * the latest write, so they bypass the public read cache.
 */

export async function previewCase(slug: string): Promise<CmsCase | null> {
  try {
    const res = await databases.listDocuments(
      APPWRITE_DATABASE_ID,
      'caseStudy',
      [Query.equal('slug', slug), Query.limit(1)],
    );
    if (res.total === 0) return null;
    const d = res.documents[0];

    let testimonial: { quote: string; author: string; role: string } | undefined;
    const tId = typeof d.testimonialId === 'string' ? d.testimonialId : '';
    if (tId) {
      try {
        const t = await databases.getDocument(APPWRITE_DATABASE_ID, 'testimonial', tId);
        testimonial = {
          quote: String(t.quote ?? ''),
          author: String(t.author ?? ''),
          role: String(t.role ?? ''),
        };
      } catch {
        /* ignore */
      }
    }

    const screensJson = typeof d.screensJson === 'string' ? d.screensJson : '';
    const approachJson = typeof d.approachJson === 'string' ? d.approachJson : '';
    const metricsJson = typeof d.metricsJson === 'string' ? d.metricsJson : '';

    const screens = parseJson(screensJson, []).map((s: { fileId?: string; alt?: string; caption?: string; tone?: 'indigo' | 'cyan' | 'mixed' }) => ({
      src: s.fileId ? urlForFile(s.fileId, BUCKETS.publicAssets) : undefined,
      alt: s.alt ?? '',
      caption: s.caption,
      tone: s.tone,
    }));

    return {
      slug: String(d.slug),
      title: String(d.title),
      client: stringOrUndef(d.client),
      year: typeof d.year === 'number' ? d.year : new Date().getFullYear(),
      brief: String(d.brief ?? ''),
      tags: Array.isArray(d.tags) ? d.tags.map(String) : [],
      status: (String(d.status) as CmsCase['status']) ?? 'draft',
      eta: stringOrUndef(d.eta),
      cover: stringOrUndef(d.coverFileId)
        ? urlForFile(String(d.coverFileId), BUCKETS.publicAssets)
        : undefined,
      coverAlt: stringOrUndef(d.coverAlt),
      role: stringOrUndef(d.role),
      duration: stringOrUndef(d.duration),
      liveUrl: stringOrUndef(d.liveUrl),
      problem: stringOrUndef(d.problem),
      approach: parseJson(approachJson, []),
      screens,
      metrics: parseJson(metricsJson, []),
      testimonial,
    };
  } catch {
    return null;
  }
}

export async function previewPost(slug: string): Promise<CmsPost | null> {
  try {
    const res = await databases.listDocuments(
      APPWRITE_DATABASE_ID,
      'journalPost',
      [Query.equal('slug', slug), Query.limit(1)],
    );
    if (res.total === 0) return null;
    const d = res.documents[0];
    return {
      slug: String(d.slug),
      title: String(d.title),
      excerpt: String(d.excerpt ?? ''),
      date: typeof d.publishedAt === 'string' ? d.publishedAt.slice(0, 10) : '',
      readingTime: String(d.readingTime ?? ''),
      tags: Array.isArray(d.tags) ? d.tags.map(String) : [],
      body: typeof d.body === 'string' ? d.body : undefined,
    };
  } catch {
    return null;
  }
}

// ── helpers ──────────────────────────────────────────────────────────
function stringOrUndef(v: unknown): string | undefined {
  return typeof v === 'string' && v.length > 0 ? v : undefined;
}

function parseJson<T>(s: string, fallback: T): T {
  if (!s) return fallback;
  try {
    return JSON.parse(s) as T;
  } catch {
    return fallback;
  }
}
