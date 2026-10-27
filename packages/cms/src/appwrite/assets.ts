/**
 * Storage file URLs, built without a network call (usable in server
 * components and `next/image`). Mirrors Storage.getFileView/getFilePreview.
 */
import { readPublicEnv, type PublicEnv } from '../env.ts';

/** Live bucket IDs (see appwrite.config.json). */
export const BUCKETS = { publicAssets: 'public-assets' } as const;
export type BucketId = (typeof BUCKETS)[keyof typeof BUCKETS];

export type PreviewOptions = {
  width?: number;
  height?: number;
  /** 0–100. */
  quality?: number;
  output?: 'webp' | 'avif' | 'jpg' | 'png' | 'gif';
  gravity?: 'center' | 'top-left' | 'top' | 'top-right' | 'left' | 'right' | 'bottom-left' | 'bottom' | 'bottom-right';
};

function fileUrl(env: PublicEnv, bucket: BucketId, fileId: string, mode: 'view' | 'preview', params: URLSearchParams) {
  params.set('project', env.projectId);
  return `${env.endpoint}/storage/buckets/${encodeURIComponent(bucket)}/files/${encodeURIComponent(fileId)}/${mode}?${params}`;
}

/** Original file, untransformed. */
export function fileViewUrl(bucket: BucketId, fileId: string, env: PublicEnv = readPublicEnv()) {
  return fileUrl(env, bucket, fileId, 'view', new URLSearchParams());
}

/** Resized / re-encoded image. */
export function filePreviewUrl(bucket: BucketId, fileId: string, opts: PreviewOptions = {}, env: PublicEnv = readPublicEnv()) {
  const p = new URLSearchParams();
  if (opts.width) p.set('width', String(Math.round(opts.width)));
  if (opts.height) p.set('height', String(Math.round(opts.height)));
  if (opts.quality !== undefined) p.set('quality', String(Math.min(100, Math.max(0, Math.round(opts.quality)))));
  if (opts.output) p.set('output', opts.output);
  if (opts.gravity) p.set('gravity', opts.gravity);
  return fileUrl(env, bucket, fileId, 'preview', p);
}
