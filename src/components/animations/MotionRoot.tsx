'use client';

import { LazyMotion, MotionConfig, domAnimation } from 'motion/react';

const HOUSE_EASING = [0.16, 1, 0.3, 1] as const;

/**
 * Root motion config — every transition inherits the house "expo-out" easing
 * unless explicitly overridden, and reduced-motion preferences are honored
 * globally. Child components retain their own `useReducedMotion` guards for
 * scroll-driven `useTransform` motion values where MotionConfig alone is not
 * sufficient.
 *
 * `LazyMotion` ships only the `domAnimation` feature set (animations, variants,
 * exit, hover/tap/focus/inView gestures). `strict` makes any stray full-size
 * `motion.*` component throw, so components must use the slim `m.*` instead.
 * Switch to `domMax` if layout animations or drag are ever needed.
 */
export default function MotionRoot({ children }: { children: React.ReactNode }) {
  return (
    <LazyMotion features={domAnimation} strict>
      <MotionConfig
        transition={{ ease: HOUSE_EASING }}
        reducedMotion="user"
      >
        {children}
      </MotionConfig>
    </LazyMotion>
  );
}
