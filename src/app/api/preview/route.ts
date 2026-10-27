import { cookies, draftMode } from 'next/headers';
import { redirect } from 'next/navigation';
import { NextRequest, NextResponse } from 'next/server';
import { PREVIEW_COOKIE, PREVIEW_TTL_S, signPreviewSession, verifyPreview } from '@codeminds/cms/signing';

/**
 * Draft preview, opened from the admin app with a signed 10-minute link:
 * /api/preview?path=/work/slug&expires=…&signature=…
 * Enables Next draft mode plus a signed 10-minute preview cookie for this
 * browser only; pages then show saved drafts on top of the live site (no
 * cache). When the cookie expires, pages show the live site again.
 * Exit: /api/preview/exit.
 */
export async function GET(request: NextRequest) {
  const secret = process.env.PREVIEW_SECRET;
  if (!secret) return NextResponse.json({ error: 'Not configured' }, { status: 503 });

  const q = request.nextUrl.searchParams;
  const path = q.get('path') ?? '';
  if (!verifyPreview(secret, path, q.get('expires'), q.get('signature'))) {
    return NextResponse.json({ error: 'Invalid or expired preview link' }, { status: 401 });
  }

  (await draftMode()).enable();
  (await cookies()).set({
    name: PREVIEW_COOKIE,
    value: signPreviewSession(secret),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: PREVIEW_TTL_S,
  });
  redirect(path);
}
