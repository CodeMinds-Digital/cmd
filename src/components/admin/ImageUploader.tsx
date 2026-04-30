'use client';

import { useRef, useState, useTransition } from 'react';
import { uploadAsset, deleteAsset } from './upload-action';
import { urlForAsset, urlForFile, BUCKETS } from '@/lib/appwrite/url-for-asset';

type ImageUploaderProps = {
  /** Field name — submitted as the form value (the Appwrite file ID). */
  name: string;
  /** Currently saved file ID (or '' if unset). */
  defaultValue?: string;
  /** Whether this field is required at form submit. */
  required?: boolean;
  /** Optional label for the picker button. */
  label?: string;
  /** Accept attribute for the file input. */
  accept?: string;
  /**
   * Optional callback fired when the file ID changes (upload + clear).
   * Used by ScreensEditor and other repeater patterns that own state
   * outside the uploader's hidden input.
   */
  onChange?: (fileId: string) => void;
};

export default function ImageUploader({
  name,
  defaultValue = '',
  required,
  label = 'Upload image',
  accept = 'image/*',
  onChange,
}: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [fileId, setFileId] = useState(defaultValue);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function pickFile() {
    inputRef.current?.click();
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    const fd = new FormData();
    fd.set('file', f);
    setError(null);
    startTransition(async () => {
      const result = await uploadAsset(fd);
      if (result.ok) {
        // Replace previous file (if any) so we don't accumulate orphans.
        if (fileId && fileId !== result.fileId) {
          await deleteAsset(fileId);
        }
        setFileId(result.fileId);
        onChange?.(result.fileId);
      } else {
        setError(result.error);
      }
      // Reset the input so the same file can be re-selected if needed.
      if (inputRef.current) inputRef.current.value = '';
    });
  }

  function onClear() {
    if (!fileId) return;
    if (!confirm('Remove this image?')) return;
    const oldId = fileId;
    setFileId('');
    onChange?.('');
    startTransition(async () => {
      await deleteAsset(oldId);
    });
  }

  // Preview: SVGs render via `view` (no rasterisation), raster via preview.
  const isLikelySvg = fileId.endsWith('.svg') || fileId.startsWith('svg_');
  const previewUrl = fileId
    ? isLikelySvg
      ? urlForFile(fileId, BUCKETS.publicAssets)
      : urlForAsset(fileId, BUCKETS.publicAssets, {
          width: 320,
          height: 240,
          format: 'webp',
          quality: 85,
        })
    : null;

  return (
    <div className="space-y-3">
      {/* Hidden input is the actual form value. */}
      <input
        type="hidden"
        name={name}
        value={fileId}
        required={required && fileId === ''}
      />

      <div className="flex items-start gap-4">
        <div
          className="w-32 h-24 flex-shrink-0 rounded-lg border border-ink-600 bg-ink-800 overflow-hidden flex items-center justify-center"
          aria-label="Image preview"
        >
          {previewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={previewUrl}
              alt=""
              className="w-full h-full object-contain"
            />
          ) : (
            <span className="font-mono text-mono-sm text-paper-400">empty</span>
          )}
        </div>

        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={pickFile}
              disabled={pending}
              className="font-mono text-mono-sm text-paper-100 hover:text-brand-400 border-b border-paper-400 hover:border-brand-400 transition-colors pb-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {pending
                ? 'Uploading…'
                : fileId
                  ? 'Replace'
                  : label}
            </button>
            {fileId && (
              <button
                type="button"
                onClick={onClear}
                disabled={pending}
                className="font-mono text-mono-sm text-red-400 hover:text-red-300 transition-colors disabled:opacity-50"
              >
                Remove
              </button>
            )}
          </div>

          {fileId && (
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-paper-400 break-all">
              id: {fileId}
            </p>
          )}

          {error && (
            <p className="font-mono text-mono-sm text-red-400" role="alert">
              {error}
            </p>
          )}
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={onFileChange}
        className="sr-only"
      />
    </div>
  );
}
