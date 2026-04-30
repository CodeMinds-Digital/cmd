'use client';

import {
  AddRowButton,
  HiddenJsonInput,
  RowFrame,
  useRepeater,
} from './RepeaterShell';
import ImageUploader from './ImageUploader';
import type { CaseScreen } from '@/types/case';

const inputClass =
  'w-full bg-transparent border-b border-ink-600 focus:border-paper-50 outline-none text-body text-paper-50 py-1.5 transition-colors';

/**
 * Storage row shape — what we persist in `screensJson`. Differs from
 * the runtime CaseScreen (where `src` is a pre-resolved URL): admin-edit
 * persists `fileId` so the CMS fetcher can resolve the URL on read.
 */
type ScreenRow = {
  fileId?: string;
  alt: string;
  caption?: string;
  tone?: 'indigo' | 'cyan' | 'mixed';
};

function safeParse(value: string): ScreenRow[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed)
      ? parsed.map<ScreenRow>((row) => ({
          fileId: typeof row.fileId === 'string' ? row.fileId : undefined,
          alt: typeof row.alt === 'string' ? row.alt : '',
          caption: typeof row.caption === 'string' ? row.caption : '',
          tone: ['indigo', 'cyan', 'mixed'].includes(row.tone)
            ? row.tone
            : 'indigo',
        }))
      : [];
  } catch {
    return [];
  }
}

export default function ScreensEditor({
  name,
  defaultValue = '',
}: {
  name: string;
  defaultValue?: string;
}) {
  const initial = safeParse(defaultValue);
  const { rows, update, add, remove, move } = useRepeater<ScreenRow>(
    initial,
    () => ({ fileId: '', alt: '', caption: '', tone: 'indigo' }),
  );

  return (
    <div className="space-y-3">
      <HiddenJsonInput name={name} value={rows} />

      {rows.map((row, i) => (
        <RowFrame
          key={i}
          index={i}
          total={rows.length}
          onMove={(dir) => move(i, dir)}
          onRemove={() => remove(i)}
        >
          <div className="grid grid-cols-12 gap-4">
            <div className="col-span-12">
              <ScreenImageField
                fileId={row.fileId ?? ''}
                onChange={(fileId) => update(i, { fileId })}
              />
            </div>

            <div className="col-span-12 md:col-span-7">
              <label className="font-mono text-mono-sm text-paper-400 block mb-1">
                Alt text
              </label>
              <input
                type="text"
                value={row.alt}
                onChange={(e) => update(i, { alt: e.target.value })}
                className={inputClass}
                maxLength={200}
              />
            </div>

            <div className="col-span-12 md:col-span-5">
              <label className="font-mono text-mono-sm text-paper-400 block mb-1">
                Tone (gradient when no image)
              </label>
              <select
                value={row.tone ?? 'indigo'}
                onChange={(e) =>
                  update(i, {
                    tone: e.target.value as 'indigo' | 'cyan' | 'mixed',
                  })
                }
                className={`${inputClass} appearance-none cursor-pointer pr-8`}
              >
                <option value="indigo" className="bg-ink-800">
                  Indigo
                </option>
                <option value="cyan" className="bg-ink-800">
                  Cyan
                </option>
                <option value="mixed" className="bg-ink-800">
                  Mixed
                </option>
              </select>
            </div>

            <div className="col-span-12">
              <label className="font-mono text-mono-sm text-paper-400 block mb-1">
                Caption
              </label>
              <textarea
                value={row.caption ?? ''}
                onChange={(e) => update(i, { caption: e.target.value })}
                rows={2}
                className={`${inputClass} resize-none`}
                maxLength={300}
              />
            </div>
          </div>
        </RowFrame>
      ))}

      <AddRowButton onAdd={add} label="Add screen" />
    </div>
  );
}

/**
 * Wraps <ImageUploader> for use inside a repeater. The uploader's
 * own hidden input has a randomised name (so it doesn't collide if
 * multiple rows exist) and isn't actually submitted — the repeater's
 * outer hidden JSON input owns the form value. Sync happens via the
 * `onChange` callback.
 */
function ScreenImageField({
  fileId,
  onChange,
}: {
  fileId: string;
  onChange: (fileId: string) => void;
}) {
  const localName = `__screen_${Math.random().toString(36).slice(2)}`;
  return (
    <ImageUploader
      name={localName}
      defaultValue={fileId}
      onChange={onChange}
    />
  );
}
