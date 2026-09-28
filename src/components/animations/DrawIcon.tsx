import type React from 'react';

type DrawIconProps = {
  d: string;
  className?: string;
  /** Path stroke width. Default 2. */
  strokeWidth?: number;
  /** Duration in seconds. Default 1.2. */
  duration?: number;
  /** Delay in seconds. Default 0. */
  delay?: number;
};

/**
 * Stroke-draws an SVG path when it scrolls into view (CSS stroke-dashoffset,
 * triggered by <MotionRuntime>; see styles/motion.css `.draw-path`). Starts
 * from a faintly visible state, and renders fully drawn without JS or with
 * reduced motion.
 */
export default function DrawIcon({ d, className, strokeWidth = 2, duration = 1.2, delay = 0 }: DrawIconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden focusable="false">
      <path
        d={d}
        pathLength={1}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="draw-path"
        data-inview=""
        style={{ '--draw-dur': `${duration}s`, '--draw-delay': `${delay}s` } as React.CSSProperties}
      />
    </svg>
  );
}
