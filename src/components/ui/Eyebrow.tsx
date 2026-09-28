type EyebrowTone = 'default' | 'inverse' | 'accent';

type EyebrowProps = {
  /** Two-digit zero-padded number ("01"), or "—" for unnumbered sections. */
  index: string;
  /** Section label. */
  label: string;
  /** Background it sits on: canvas (default), inverse (black) or accent (orange). */
  tone?: EyebrowTone;
  /** Render as a heading when the eyebrow *is* the section title. */
  as?: 'div' | 'h2';
  className?: string;
};

const TONES: Record<EyebrowTone, { text: string; index: string; rule: string }> = {
  default: { text: 'text-fg-subtle', index: 'text-accent-ink', rule: 'bg-line-strong' },
  inverse: { text: 'text-inverse-fg/70', index: 'text-accent', rule: 'bg-inverse-fg/30' },
  // Full-strength ink: reduced opacity on orange drops below 4.5:1.
  accent: { text: 'text-accent-fg', index: 'text-accent-fg', rule: 'bg-accent-fg/40' },
};

/**
 * Section header chrome: `01 ── SERVICES` in tracked-out mono, sits above
 * the heading. 12px minimum for legibility (plan §3.3).
 */
export default function Eyebrow({ index, label, tone = 'default', as: Tag = 'div', className }: EyebrowProps) {
  const t = TONES[tone];
  return (
    <Tag
      className={`flex items-center gap-3 font-mono text-mono-xs font-normal uppercase ${t.text}${className ? ` ${className}` : ''}`}
    >
      <span className={t.index}>{index}</span>
      <span aria-hidden className={`h-px w-8 ${t.rule}`} />
      <span>{label}</span>
    </Tag>
  );
}
