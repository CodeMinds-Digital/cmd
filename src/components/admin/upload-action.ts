'use server';

import { storage, ID, Permission, Role } from '@/lib/appwrite/server';
import { BUCKETS } from '@/lib/appwrite/url-for-asset';
import { requireUser } from '@/lib/appwrite/session';
import { InputFile } from 'node-appwrite/file';

export type UploadResult =
  | { ok: true; fileId: string; name: string; sizeBytes: number; mimeType: string }
  | { ok: false; error: string };

const MAX_BYTES = 10 * 1024 * 1024; // 10MB — matches bucket maximumFileSize.

/**
 * Uploads a single file to the public-assets bucket on behalf of the
 * logged-in editor. Returns the new file ID for the caller to persist
 * on the parent document.
 *
 * Auth: requires a valid editor session; the server action then uses
 * the admin key to do the actual upload (so editors don't need direct
 * SDK access in the browser).
 */
export async function uploadAsset(formData: FormData): Promise<UploadResult> {
  await requireUser();

  const file = formData.get('file');
  if (!(file instanceof File)) {
    return { ok: false, error: 'No file provided.' };
  }
  if (file.size === 0) {
    return { ok: false, error: 'Empty file.' };
  }
  if (file.size > MAX_BYTES) {
    return {
      ok: false,
      error: `File too large (${Math.round(file.size / 1024 / 1024)}MB). Max 10MB.`,
    };
  }

  try {
    const bytes = Buffer.from(await file.arrayBuffer());
    const result = await storage.createFile(
      BUCKETS.publicAssets,
      ID.unique(),
      InputFile.fromBuffer(bytes, file.name),
      [
        Permission.read(Role.any()),
        Permission.update(Role.team('editor')),
        Permission.delete(Role.team('admin')),
      ],
    );
    return {
      ok: true,
      fileId: result.$id,
      name: result.name,
      sizeBytes: result.sizeOriginal,
      mimeType: result.mimeType,
    };
  } catch (e: unknown) {
    const msg =
      e && typeof e === 'object' && 'message' in e
        ? String((e as { message: string }).message)
        : 'Upload failed.';
    return { ok: false, error: msg };
  }
}

export async function deleteAsset(fileId: string): Promise<void> {
  await requireUser();
  if (!fileId) return;
  try {
    await storage.deleteFile(BUCKETS.publicAssets, fileId);
  } catch {
    // Already gone or never existed — fine.
  }
}
