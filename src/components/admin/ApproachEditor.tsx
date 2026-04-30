'use client';

import {
  AddRowButton,
  HiddenJsonInput,
  RowFrame,
  useRepeater,
} from './RepeaterShell';
import type { CaseApproachStep } from '@/types/case';

const inputClass =
  'w-full bg-transparent border-b border-ink-600 focus:border-paper-50 outline-none text-body text-paper-50 py-1.5 transition-colors';

function safeParse(value: string): CaseApproachStep[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function nextIndex(rows: CaseApproachStep[]): string {
  const max = rows.reduce((m, r) => {
    const n = parseInt(r.index, 10);
    return Number.isNaN(n) ? m : Math.max(m, n);
  }, 0);
  return String(max + 1).padStart(2, '0');
}

export default function ApproachEditor({
  name,
  defaultValue = '',
}: {
  name: string;
  defaultValue?: string;
}) {
  const initial = safeParse(defaultValue);
  const { rows, update, add, remove, move } = useRepeater<CaseApproachStep>(
    initial,
    () => ({ index: '', title: '', body: '' }),
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
          <div className="grid grid-cols-12 gap-3">
            <div className="col-span-2">
              <label className="font-mono text-mono-sm text-paper-400 block mb-1">
                Index
              </label>
              <input
                type="text"
                value={row.index}
                onChange={(e) => update(i, { index: e.target.value })}
                placeholder="01"
                className={inputClass}
                maxLength={4}
              />
            </div>
            <div className="col-span-10">
              <label className="font-mono text-mono-sm text-paper-400 block mb-1">
                Title
              </label>
              <input
                type="text"
                value={row.title}
                onChange={(e) => update(i, { title: e.target.value })}
                className={inputClass}
                maxLength={120}
              />
            </div>
            <div className="col-span-12">
              <label className="font-mono text-mono-sm text-paper-400 block mb-1">
                Body
              </label>
              <textarea
                value={row.body}
                onChange={(e) => update(i, { body: e.target.value })}
                rows={3}
                className={`${inputClass} resize-none`}
                maxLength={500}
              />
            </div>
          </div>
        </RowFrame>
      ))}

      <AddRowButton
        onAdd={() => {
          const auto = nextIndex(rows);
          // Append with auto-generated index
          add();
          // Patch index of the just-added row on next tick
          requestAnimationFrame(() =>
            update(rows.length, { index: auto } as Partial<CaseApproachStep>),
          );
        }}
        label="Add approach step"
      />
    </div>
  );
}
