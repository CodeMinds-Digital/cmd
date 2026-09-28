'use client';

import React, { useRef } from 'react';
import { usePrefersReducedMotion } from '@/lib/use-media-query';

type TiltProps = {
  children: React.ReactNode;
  className?: string;
  /** Max rotation in degrees on each axis. Default 8. */
  max?: number;
  /** Lift in px on hover. Default 6. */
  lift?: number;
};

/**
 * Pointer-parallax 3D tilt + lift. Writes CSS variables on pointer move;
 * a CSS transition smooths them (styles/motion.css `.tilt`). Mouse only;
 * touch and reduced motion bypass it.
 */
export default function Tilt({ children, className, max = 8, lift = 6 }: TiltProps) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = usePrefersReducedMotion();

  const set = (rx: number, ry: number, l: number) => {
    const el = ref.current;
    if (!el) return;
    el.style.setProperty('--tilt-rx', `${rx}deg`);
    el.style.setProperty('--tilt-ry', `${ry}deg`);
    el.style.setProperty('--tilt-lift', `${-l}px`);
  };

  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (reduced || e.pointerType !== 'mouse' || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    set(-py * 2 * max, px * 2 * max, lift);
  };
  const onLeave = () => set(0, 0, 0);

  return (
    <div
      ref={ref}
      className={`tilt${className ? ` ${className}` : ''}`}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      onPointerCancel={onLeave}
    >
      {children}
    </div>
  );
}
