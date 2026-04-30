import { APPWRITE_ENDPOINT, APPWRITE_PROJECT_ID } from './env';

/**
 * Storage bucket IDs. These match `appwrite.json` so the bootstrap
 * script creates them with the same names. Adding a new bucket here
 * without adding it to appwrite.json (or vice versa) is a foot-gun.
 *
 * v1: single bucket for all media (free-tier limit). Per-file permissions
 * gate drafts vs published. Split into multiple buckets if/when paid tier.
 */
export const BUCKETS = {
  publicAssets: 'public-assets',
} as const;

export type BucketId = (typeof BUCKETS)[keyof typeof BUCKETS];

type PreviewOptions = {
  width?: number;
  height?: number;
  /** 0–9 — Appwrite default 100% quality is too generous for most uses. */
  quality?: number;
  /** Output format. AVIF + WebP are the design-system defaults. */
  format?: 'webp' | 'avif' | 'jpg' | 'png' | 'gif';
  /** Crop strategy when both width and height are specified. */
  gravity?:
    | 'center'
    | 'top-left'
    | 'top'
    | 'top-right'
    | 'left'
    | 'right'
    | 'bottom-left'
    | 'bottom'
    | 'bottom-right';
};

/**
 * Resolve a bucket file ID to a public URL with optional transforms.
 * Equivalent to Appwrite's `getFilePreview` but URL-only (no SDK call,
 * works in server components without a network round-trip).
 *
 * Focal-point convention:
 *   When uploading a file via /admin's <ImageUploader>, we record
 *   `focalX` / `focalY` (0–1 floats) on the parent document.
 *   Render call sites pass them as `gravity: 'center'` plus client-side
 *   `object-position` to honour the focal point.
 *   Appwrite's gravity options are 9-cell only — focal-point fidelity
 *   beyond that lives on the consuming component.
 */
export function urlForAsset(
  fileId: string,
  bucket: BucketId,
  opts: PreviewOptions = {},
): string {
  const params = new URLSearchParams({ project: APPWRITE_PROJECT_ID });
  if (opts.width) params.set('width', String(opts.width));
  if (opts.height) params.set('height', String(opts.height));
  if (opts.quality !== undefined) params.set('quality', String(opts.quality));
  if (opts.format) params.set('output', opts.format);
  if (opts.gravity) params.set('gravity', opts.gravity);

  return `${APPWRITE_ENDPOINT}/storage/buckets/${bucket}/files/${fileId}/preview?${params.toString()}`;
}

/**
 * Returns the raw file URL with no transformations. Used for SVG (since
 * Appwrite preview rasterises SVGs by default and we lose vector fidelity).
 */
export function urlForFile(fileId: string, bucket: BucketId): string {
  const params = new URLSearchParams({ project: APPWRITE_PROJECT_ID });
  return `${APPWRITE_ENDPOINT}/storage/buckets/${bucket}/files/${fileId}/view?${params.toString()}`;
}
