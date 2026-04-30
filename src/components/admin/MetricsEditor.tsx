'use client';

import {
  AddRowButton,
  HiddenJsonInput,
  RowFrame,
  useRepeater,
} from './RepeaterShell';
import type { CaseMetricItem } from '@/types/case';

const inputClass =
  'w-full bg-transparent border-b border-ink-600 focus:border-paper-50 outline-none text-body text-paper-50 py-1.5 transition-colors';

function safeParse(value: string): CaseMetricItem[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export default function MetricsEditor({
  name,
  defaultValue = '',
}: {
  name: string;
  defaultValue?: string;
}) {
  const initial = safeParse(defaultValue);
  const { rows, update, add, remove, move } = useRepeater<CaseMetricItem>(
    initial,
    () => ({ label: '', value: '' }),
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
            <div className="col-span-7">
              <label className="font-mono text-mono-sm text-paper-400 block mb-1">
                Label
              </label>
              <input
                type="text"
                value={row.label}
                onChange={(e) => update(i, { label: e.target.value })}
                placeholder="LCP"
                className={inputClass}
                maxLength={64}
              />
            </div>
            <div className="col-span-5">
              <label className="font-mono text-mono-sm text-paper-400 block mb-1">
                Value
              </label>
              <input
                type="text"
                value={row.value}
                onChange={(e) => update(i, { value: e.target.value })}
                placeholder="1.6s"
                className={inputClass}
                maxLength={32}
              />
            </div>
          </div>
        </RowFrame>
      ))}

      <AddRowButton onAdd={add} label="Add metric" />
    </div>
  );
}
