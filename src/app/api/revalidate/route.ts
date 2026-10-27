import { revalidateTag } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';
import { tableFromEvent, tagForTable } from '@codeminds/cms/cache-tags';
import { REVALIDATE_HEADERS, verifyRevalidate } from '@codeminds/cms/signing';
import { readBodyCapped } from '@/lib/read-body';

/**
 * Called by the `revalidate-site` Appwrite Function whenever a row changes
 * (admin app or Appwrite Console). Body: `{ "events": ["databases.<db>.tables.<table>.rows.<row>.update", …] }`,
 * signed with APPWRITE_WEBHOOK_SECRET over `${timestamp}.${body}`; requests
 * older than 5 minutes or with a bad signature are rejected.
 *
 * Expires the matching cache tag immediately, so the next visit renders fresh
 * content (pages stay pre-rendered between edits).
 */
const MAX_BODY_BYTES = 8 * 1024;

export async function POST(request: NextRequest) {
  const secret = process.env.APPWRITE_WEBHOOK_SECRET;
  if (!secret) return NextResponse.json({ error: 'Not configured' }, { status: 503 });

  const body = await readBodyCapped(request, MAX_BODY_BYTES).catch(() => '');
  if (body === null) return NextResponse.json({ error: 'Too large' }, { status: 413 });

  const ok = verifyRevalidate(
    secret,
    body,
    request.headers.get(REVALIDATE_HEADERS.timestamp),
    request.headers.get(REVALIDATE_HEADERS.signature),
  );
  if (!ok) return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });

  let events: unknown;
  try {
    events = (JSON.parse(body) as { events?: unknown }).events;
  } catch {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
  }
  if (!Array.isArray(events)) return NextResponse.json({ error: 'Invalid body' }, { status: 400 });

  const tags = Array.from(
    new Set(events.flatMap((e) => (typeof e === 'string' ? (tagForTable(tableFromEvent(e) ?? '') ?? []) : []))),
  );
  for (const tag of tags) revalidateTag(tag, { expire: 0 });

  return NextResponse.json({ revalidated: tags });
}
