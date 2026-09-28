type SectionEyebrowProps = {
  /** Two-digit zero-padded number, e.g. "01". */
  index: string;
  /** Section label. */
  label: string;
  className?: string;
};

/**
 * Editorial agency-tier section header chrome:
 * `01 ─ SERVICES` in a tracked-out monospace, sits above the H2.
 */
export default function SectionEyebrow({
  index,
  label,
  className,
}: SectionEyebrowProps) {
  return (
    <div
      className={`flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.2em] text-fg-subtle ${className ?? ''}`}
    >
      <span className="text-accent-ink">{index}</span>
      <span aria-hidden className="h-px w-8 bg-line-strong" />
      <span>{label}</span>
    </div>
  );
}
