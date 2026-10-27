import { NextResponse, type NextRequest } from 'next/server';
import { BUCKETS, fileViewUrl } from '@codeminds/cms/assets';
import { gate } from '@codeminds/cms/roles';
import { ID } from '@codeminds/cms/server';
import { InputFile } from 'node-appwrite/file';
import { getSessionState } from '@/lib/auth';
import { adminUrl } from '@/lib/env';
import { asUser } from '@/lib/session';

/**
 * Image upload for the editors: POST multipart/form-data { file }.
 * Same-origin only (CSRF), staff only, images only (checked by content, not
 * by name), ≤ 10 MB. Stored as the signed-in user, so the bucket's own
 * permissions (staff may create) and limits apply too.
 */
const MAX_BYTES = 10 * 1024 * 1024;

const SIGNATURES: { type: string; ext: string; test: (b: Uint8Array) => boolean }[] = [
  { type: 'image/png', ext: 'png', test: (b) => b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47 },
  { type: 'image/jpeg', ext: 'jpg', test: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  { type: 'image/gif', ext: 'gif', test: (b) => b[0] === 0x47 && b[1] === 0x49 && b[2] === 0x46 },
  { type: 'image/webp', ext: 'webp', test: (b) => ascii(b, 0, 4) === 'RIFF' && ascii(b, 8, 12) === 'WEBP' },
  { type: 'image/avif', ext: 'avif', test: (b) => ascii(b, 4, 8) === 'ftyp' && /^avi[fs]$/.test(ascii(b, 8, 12)) },
];

function ascii(b: Uint8Array, from: number, to: number) {
  return String.fromCharCode(...b.subarray(from, to));
}

export async function POST(request: NextRequest) {
  if (request.headers.get('origin') !== new URL(adminUrl()).origin) {
    return NextResponse.json({ error: 'Cross-site upload refused.' }, { status: 403 });
  }
  const state = await getSessionState();
  // Same rule as pages: staff only, and Admins only once two-factor is on.
  if (state.kind !== 'user' || gate({ role: state.role, mfa: state.user.mfa, path: '/projects' })) {
    return NextResponse.json({ error: 'Sign in again to upload.' }, { status: 401 });
  }
  if (Number(request.headers.get('content-length') ?? 0) > MAX_BYTES + 64 * 1024) {
    return NextResponse.json({ error: 'Images must be 10 MB or smaller.' }, { status: 413 });
  }

  const form = await request.formData().catch(() => null);
  const file = form?.get('file');
  if (!(file instanceof File)) return NextResponse.json({ error: 'Choose an image to upload.' }, { status: 400 });
  if (file.size > MAX_BYTES) return NextResponse.json({ error: 'Images must be 10 MB or smaller.' }, { status: 413 });

  const bytes = new Uint8Array(await file.arrayBuffer());
  const kind = SIGNATURES.find((s) => s.test(bytes));
  if (!kind) return NextResponse.json({ error: 'Use a PNG, JPEG, WebP, AVIF or GIF image (no SVG).' }, { status: 415 });

  try {
    const { storage } = await asUser();
    // Neutral name: the visitor's original filename is never stored.
    const stored = await storage.createFile({
      bucketId: BUCKETS.publicAssets,
      fileId: ID.unique(),
      file: InputFile.fromBuffer(bytes, `upload.${kind.ext}`),
    });
    return NextResponse.json({ fileId: stored.$id, url: fileViewUrl(BUCKETS.publicAssets, stored.$id) });
  } catch (e) {
    console.error('Upload failed:', (e as Error).message);
    return NextResponse.json({ error: 'Upload failed. Try again.' }, { status: 502 });
  }
}
