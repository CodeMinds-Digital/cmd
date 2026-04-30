import { NextResponse } from 'next/server';
import { revalidateTag, revalidatePath } from 'next/cache';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { getWebhookSecret } from '@/lib/appwrite/env';

export const runtime = 'nodejs';

/**
 * Webhook endpoint hit by an Appwrite Function on document write events.
 * Body shape (sent by our `revalidate-on-publish` Function):
 *   { collection: string, documentId: string, slug?: string }
 *
 * Auth: HMAC-SHA256 over the raw body, sent as `x-appwrite-signature`.
 * The Function uses APPWRITE_WEBHOOK_SECRET to sign; this route verifies
 * with the same secret. Any mismatch returns 401.
 *
 * Tag conventions (must match read-time tags in server components):
 *   - Site-wide settings:  "site-settings"
 *   - Per-collection:      "<collection>"
 *   - Per-document:        "<collection>:<slug>"  (only if slug exists)
 */
export async function POST(req: Request) {
  const raw = await req.text();
  const signature = req.headers.get('x-appwrite-signature') ?? '';

  let verified = false;
  try {
    const expected = createHmac('sha256', getWebhookSecret())
      .update(raw)
      .digest('hex');
    const a = Buffer.from(expected, 'utf8');
    const b = Buffer.from(signature, 'utf8');
    verified = a.length === b.length && timingSafeEqual(a, b);
  } catch {
    verified = false;
  }

  if (!verified) {
    return NextResponse.json({ ok: false, error: 'bad signature' }, { status: 401 });
  }

  type Payload = {
    collection?: string;
    documentId?: string;
    slug?: string;
    paths?: string[];
  };
  let body: Payload = {};
  try {
    body = JSON.parse(raw) as Payload;
  } catch {
    return NextResponse.json({ ok: false, error: 'bad body' }, { status: 400 });
  }

  const tags: string[] = [];
  if (body.collection) {
    tags.push(body.collection);
    if (body.slug) tags.push(`${body.collection}:${body.slug}`);
  }
  // Site settings is its own tag — every page reads it for metadata.
  if (body.collection === 'siteSettings') tags.push('site-settings');

  for (const tag of tags) {
    // Next 16 requires a "profile" argument: 'max' purges immediately and
    // is what we want for editorial content updates.
    revalidateTag(tag, 'max');
  }

  // Optional: explicit path purge for routes the function knows.
  if (body.paths) {
    for (const path of body.paths) {
      revalidatePath(path);
    }
  }

  return NextResponse.json({ ok: true, revalidated: { tags, paths: body.paths ?? [] } });
}
