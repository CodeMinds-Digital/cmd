import type React from 'react';

export type ChipTone = 'sunk' | 'accent' | 'outline' | 'inverse';

const TONES: Record<ChipTone, string> = {
  sunk: 'bg-surface-sunk text-fg-muted',
  accent: 'bg-accent text-accent-fg',
  outline: 'border border-line-strong text-fg-muted',
  inverse: 'bg-inverse text-inverse-fg',
};

/**
 * Small mono pill — tags, ETAs, metric callouts. 12px minimum (plan §3.3).
 */
export default function Chip({
  children,
  tone = 'sunk',
  className,
}: {
  children: React.ReactNode;
  tone?: ChipTone;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-mono text-mono-xs uppercase ${TONES[tone]}${className ? ` ${className}` : ''}`}
    >
      {children}
    </span>
  );
}
