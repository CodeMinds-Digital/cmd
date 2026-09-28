import React from 'react';

/**
 * CSS-only infinite marquee. Items render twice; the second copy is
 * aria-hidden so screen readers hear the list once. Pauses on hover/focus.
 * Under reduced motion it becomes a static, wrapped row (styles/motion.css).
 */
export default function Marquee({
  items,
  durationS = 40,
  gap = '3rem',
  label,
  className,
}: {
  items: React.ReactNode[];
  /** Seconds for one full loop. */
  durationS?: number;
  gap?: string;
  /** Accessible name for the list. */
  label: string;
  className?: string;
}) {
  const style = {
    '--marquee-dur': `${durationS}s`,
    '--marquee-gap': gap,
  } as React.CSSProperties;

  return (
    <div className={`marquee${className ? ` ${className}` : ''}`} style={style}>
      <div className="marquee-track">
        <ul className="marquee-group" aria-label={label}>
          {items.map((item, i) => (
            <li key={i} className="shrink-0">
              {item}
            </li>
          ))}
        </ul>
        {/* Visual duplicate for the seamless loop: hidden from AT and not focusable. */}
        <ul className="marquee-group" aria-hidden="true" inert>
          {items.map((item, i) => (
            <li key={i} className="shrink-0">
              {item}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
