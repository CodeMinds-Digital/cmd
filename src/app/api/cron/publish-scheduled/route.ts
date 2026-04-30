import { NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';
import { databases, Query } from '@/lib/appwrite/server';
import { APPWRITE_DATABASE_ID } from '@/lib/appwrite/env';
import { logAudit } from '@/lib/cms/audit';
import { notifyPublish } from '@/lib/cms/notify';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://codeminds.digital';

/**
 * Cron endpoint. Hit by an external scheduler (Vercel Cron, GitHub Actions,
 * Appwrite Function on a 5-minute schedule, etc.) to flip docs whose
 * scheduledFor is in the past from `scheduled` → `published`.
 *
 * Auth: Bearer header with ADMIN_API_SECRET. Anything else → 401.
 *
 * Idempotent: returns the list of docs flipped, with caps to prevent
 * runaway loops.
 */
export async function GET(request: Request) {
  const expected = process.env.ADMIN_API_SECRET;
  const auth = request.headers.get('authorization') ?? '';
  if (!expected || auth !== `Bearer ${expected}`) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
  }

  const nowIso = new Date().toISOString();
  const flipped: Array<{ collectionId: string; documentId: string; slug?: string; title?: string }> = [];

  for (const collectionId of ['caseStudy', 'journalPost'] as const) {
    try {
      const due = await databases.listDocuments(APPWRITE_DATABASE_ID, collectionId, [
        Query.equal('status', 'scheduled'),
        Query.lessThanEqual('scheduledFor', nowIso),
        Query.limit(50),
      ]);

      for (const doc of due.documents) {
        try {
          const updated = await databases.updateDocument(
            APPWRITE_DATABASE_ID,
            collectionId,
            doc.$id,
            {
              status: 'published',
              publishedAt: nowIso,
              // publishedBy stays whatever was on the doc — cron has no user.
            },
          );

          // Cache invalidation for both the index + the slug page.
          revalidateTag(collectionId, 'max');
          if (typeof updated.slug === 'string') {
            revalidateTag(`${collectionId}:${updated.slug}`, 'max');
          }

          // Log + notify.
          await logAudit({
            user: { $id: 'system:cron', email: 'cron@codeminds.digital', name: 'Scheduled publisher' },
            action: 'publish',
            collectionId,
            documentId: doc.$id,
            documentLabel:
              typeof updated.title === 'string'
                ? updated.title
                : typeof updated.slug === 'string'
                  ? updated.slug
                  : doc.$id,
          });

          const slug = typeof updated.slug === 'string' ? updated.slug : undefined;
          let url: string | undefined;
          if (collectionId === 'caseStudy' && slug) url = `${SITE_URL}/work/${slug}`;
          else if (collectionId === 'journalPost' && slug) url = `${SITE_URL}/journal/${slug}`;
          await notifyPublish({
            title: typeof updated.title === 'string' ? updated.title : (slug ?? doc.$id),
            collectionId,
            slug,
            actor: 'Scheduled publisher (cron)',
            url,
          });

          flipped.push({
            collectionId,
            documentId: doc.$id,
            slug,
            title: typeof updated.title === 'string' ? updated.title : undefined,
          });
        } catch {
          /* skip this doc, keep going */
        }
      }
    } catch {
      /* skip this collection */
    }
  }

  return NextResponse.json({
    ok: true,
    at: nowIso,
    flipped,
    count: flipped.length,
  });
}
