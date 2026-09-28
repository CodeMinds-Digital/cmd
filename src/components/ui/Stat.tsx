import type React from 'react';

/**
 * Integer that counts up from `from` to `value` when it enters the viewport
 * (CSS `@property --n` + counter, see styles/motion.css). Without JS, with
 * reduced motion, or in browsers without @property it simply shows `value`.
 *
 * The visual digits are drawn by CSS, so the real value is exposed to
 * assistive tech through an sr-only copy.
 */
export default function Stat({
  value,
  from = 0,
  index = 0,
  className,
}: {
  value: number;
  from?: number;
  /** Stagger position when several stats sit in one in-view group. */
  index?: number;
  className?: string;
}) {
  if (!Number.isInteger(value) || !Number.isInteger(from)) {
    throw new Error('<Stat> counts integers only');
  }
  return (
    <span className={className}>
      <span className="sr-only">{value}</span>
      <span
        aria-hidden
        className="stat-num"
        data-inview=""
        style={{ '--to': value, '--from': from, '--i': index } as React.CSSProperties}
      />
    </span>
  );
}
