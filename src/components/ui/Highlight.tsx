import type React from 'react';

/**
 * Voltage highlight chip — the orange rounded block behind one key phrase per
 * section ("care.", "what we ship."). It wipes in left → right when it enters
 * the viewport (styles/motion.css). Text on the accent fill always uses
 * `accent-fg` (#111) so it passes AA at any size.
 *
 * `highlightClass` is exported for components that take a className instead
 * of children (e.g. <SplitText className={highlightClass}>, whose root already
 * carries `data-inview`).
 */
export const highlightClass = 'highlight highlight-wipe';

export default function Highlight({
  children,
  className,
  wipe = true,
  delayMs,
}: {
  children: React.ReactNode;
  className?: string;
  /** Animate the wipe on enter. Default true. */
  wipe?: boolean;
  /** Wipe delay in ms (default 250, see --wipe-delay). */
  delayMs?: number;
}) {
  const classes = [wipe ? highlightClass : 'highlight', className].filter(Boolean).join(' ');
  return (
    <span
      className={classes}
      data-inview={wipe ? '' : undefined}
      style={delayMs != null ? ({ '--wipe-delay': `${delayMs}ms` } as React.CSSProperties) : undefined}
    >
      {children}
    </span>
  );
}
