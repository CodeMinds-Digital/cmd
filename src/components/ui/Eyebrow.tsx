type EyebrowProps = {
  /** Two-digit zero-padded number ("01"), or "—" for unnumbered sections. */
  index: string;
  /** Section label. */
  label: string;
  /** Use on dark (inverse) sections. */
  inverse?: boolean;
  className?: string;
};

/**
 * Section header chrome: `01 ── SERVICES` in tracked-out mono, sits above
 * the heading. 12px minimum for legibility (plan §3.3).
 */
export default function Eyebrow({ index, label, inverse = false, className }: EyebrowProps) {
  return (
    <div
      className={`flex items-center gap-3 font-mono text-mono-xs uppercase ${
        inverse ? 'text-inverse-fg/70' : 'text-fg-subtle'
      }${className ? ` ${className}` : ''}`}
    >
      <span className={inverse ? 'text-accent' : 'text-accent-ink'}>{index}</span>
      <span aria-hidden className={`h-px w-8 ${inverse ? 'bg-inverse-fg/30' : 'bg-line-strong'}`} />
      <span>{label}</span>
    </div>
  );
}
