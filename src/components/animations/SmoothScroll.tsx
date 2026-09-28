'use client';

import { useEffect } from 'react';
import { usePrefersReducedMotion } from '@/lib/use-media-query';
import Lenis from 'lenis';

/**
 * Lenis smooth scroll, driven by its own requestAnimationFrame loop
 * (`autoRaf`). Mounted by <SmoothScrollLoader> for fine pointers only.
 */
export default function SmoothScroll() {
  const prefersReducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    if (prefersReducedMotion) return;

    const lenis = new Lenis({
      duration: 1.1,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      autoRaf: true,
    });

    return () => {
      lenis.destroy();
    };
  }, [prefersReducedMotion]);

  return null;
}
