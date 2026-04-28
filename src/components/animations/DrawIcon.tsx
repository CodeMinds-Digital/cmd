'use client';

import { motion } from 'framer-motion';

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
 * Stroke-draws an SVG path on mount. Animates from a faintly-visible
 * starting state (so the icon is not invisible if the animation never
 * runs) to the fully drawn path.
 */
export default function DrawIcon({
  d,
  className,
  strokeWidth = 2,
  duration = 1.2,
  delay = 0,
}: DrawIconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      aria-hidden
      focusable="false"
    >
      <motion.path
        d={d}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0.4, opacity: 0.6 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{
          pathLength: { duration, delay, ease: [0.22, 1, 0.36, 1] },
          opacity: { duration: duration * 0.4, delay },
        }}
      />
    </svg>
  );
}
