'use client';

import { useEffect } from 'react';
import { useReducedMotion } from 'motion/react';
import Lenis from 'lenis';

/**
 * Lenis smooth scroll, driven by its own requestAnimationFrame loop
 * (`autoRaf`). Nothing on the site uses GSAP ScrollTrigger any more, so the
 * old GSAP ticker bridge is gone.
 */
export default function SmoothScroll() {
  const prefersReducedMotion = useReducedMotion();

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
