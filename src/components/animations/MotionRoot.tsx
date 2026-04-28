'use client';

import { MotionConfig } from 'framer-motion';

const HOUSE_EASING = [0.16, 1, 0.3, 1] as const;

/**
 * Root motion config — every transition inherits the house "expo-out" easing
 * unless explicitly overridden, and reduced-motion preferences are honored
 * globally. Child components retain their own `useReducedMotion` guards for
 * scroll-driven `useTransform` motion values where MotionConfig alone is not
 * sufficient.
 */
export default function MotionRoot({ children }: { children: React.ReactNode }) {
  return (
    <MotionConfig
      transition={{ ease: HOUSE_EASING }}
      reducedMotion="user"
    >
      {children}
    </MotionConfig>
  );
}
