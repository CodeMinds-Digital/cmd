import React from 'react';

/**
 * CSS-only infinite marquee. Items render twice; the second copy is
 * aria-hidden so screen readers hear the list once. Pauses on hover/focus,
 * and has a visible pause control (WCAG 2.2.2) — a real checkbox, so it
 * works without JS. Under reduced motion it becomes a static, wrapped row
 * and the control is hidden (styles/motion.css).
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
    <div className={`marquee-root${className ? ` ${className}` : ''}`} style={style}>
      <label className="marquee-toggle">
        <input type="checkbox" className="sr-only" aria-label={`Pause scrolling: ${label}`} />
        <svg viewBox="0 0 24 24" className="marquee-icon-pause size-4" fill="currentColor" aria-hidden focusable="false">
          <path d="M7 5h3v14H7zM14 5h3v14h-3z" />
        </svg>
        <svg viewBox="0 0 24 24" className="marquee-icon-play size-4" fill="currentColor" aria-hidden focusable="false">
          <path d="M8 5v14l11-7z" />
        </svg>
      </label>
      <div className="marquee">
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
    </div>
  );
}
