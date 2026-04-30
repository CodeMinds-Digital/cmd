'use client';

import { useEffect, useState } from 'react';

/**
 * Generic repeater shell. Maintains an array of typed rows and writes
 * a hidden form input with the JSON-stringified array value, so the
 * existing string-field server-action contract still applies.
 *
 * Each repeater (Approach, Screens, Metrics) wraps this with its own
 * row template.
 */
export function useRepeater<T>(initial: T[], emptyRow: () => T) {
  const [rows, setRows] = useState<T[]>(initial);

  function update(i: number, patch: Partial<T>) {
    setRows((prev) =>
      prev.map((r, idx) => (idx === i ? { ...r, ...patch } : r)),
    );
  }
  function add() {
    setRows((prev) => [...prev, emptyRow()]);
  }
  function remove(i: number) {
    setRows((prev) => prev.filter((_, idx) => idx !== i));
  }
  function move(i: number, dir: -1 | 1) {
    setRows((prev) => {
      const next = [...prev];
      const j = i + dir;
      if (j < 0 || j >= next.length) return prev;
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  }

  return { rows, update, add, remove, move };
}

export function HiddenJsonInput({
  name,
  value,
}: {
  name: string;
  value: unknown;
}) {
  const [json, setJson] = useState(() => JSON.stringify(value));
  useEffect(() => {
    setJson(JSON.stringify(value));
  }, [value]);
  return <input type="hidden" name={name} value={json} />;
}

export function AddRowButton({
  onAdd,
  label,
}: {
  onAdd: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onAdd}
      className="font-mono text-mono-sm text-paper-100 hover:text-brand-400 border border-dashed border-ink-600 hover:border-brand-400 transition-colors px-4 py-2 rounded-lg w-full"
    >
      + {label}
    </button>
  );
}

export function RowFrame({
  index,
  total,
  onMove,
  onRemove,
  children,
}: {
  index: number;
  total: number;
  onMove: (dir: -1 | 1) => void;
  onRemove: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="border border-ink-600 rounded-lg p-4 bg-ink-800/40">
      <div className="flex items-center justify-between mb-3">
        <span className="font-mono text-mono-sm text-paper-400">
          #{String(index + 1).padStart(2, '0')}
        </span>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => onMove(-1)}
            disabled={index === 0}
            aria-label="Move up"
            className="font-mono text-mono-sm text-paper-300 hover:text-paper-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            ↑
          </button>
          <button
            type="button"
            onClick={() => onMove(1)}
            disabled={index === total - 1}
            aria-label="Move down"
            className="font-mono text-mono-sm text-paper-300 hover:text-paper-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            ↓
          </button>
          <button
            type="button"
            onClick={onRemove}
            aria-label="Remove"
            className="font-mono text-mono-sm text-red-400 hover:text-red-300 transition-colors"
          >
            ✕
          </button>
        </div>
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  );
}
