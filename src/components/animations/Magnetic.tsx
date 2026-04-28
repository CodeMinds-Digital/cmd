'use client';

import React, { useRef, useState } from 'react';
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useSpring,
  useReducedMotion,
} from 'framer-motion';

type Ripple = { id: number; x: number; y: number; size: number };

type MagneticProps = {
  children: React.ReactNode;
  className?: string;
  /** Pull strength as a fraction of pointer offset (0-1). Default 0.35. */
  strength?: number;
  /** Max travel in px on each axis. Default 18. */
  max?: number;
  /** Disable the click ripple. */
  ripple?: boolean;
};

export default function Magnetic({
  children,
  className,
  strength = 0.35,
  max = 18,
  ripple = true,
}: MagneticProps) {
  const ref = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useReducedMotion();
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 220, damping: 18, mass: 0.4 });
  const sy = useSpring(y, { stiffness: 220, damping: 18, mass: 0.4 });
  const [ripples, setRipples] = useState<Ripple[]>([]);

  const handleMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (prefersReducedMotion) return;
    if (e.pointerType !== 'mouse') return;
    const node = ref.current;
    if (!node) return;
    const rect = node.getBoundingClientRect();
    const dx = (e.clientX - (rect.left + rect.width / 2)) * strength;
    const dy = (e.clientY - (rect.top + rect.height / 2)) * strength;
    x.set(Math.max(-max, Math.min(max, dx)));
    y.set(Math.max(-max, Math.min(max, dy)));
  };

  const reset = () => {
    x.set(0);
    y.set(0);
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!ripple || prefersReducedMotion) return;
    const node = ref.current;
    if (!node) return;
    const rect = node.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height) * 1.6;
    const id = Date.now() + Math.random();
    setRipples((rs) => [
      ...rs,
      { id, x: e.clientX - rect.left, y: e.clientY - rect.top, size },
    ]);
    window.setTimeout(() => {
      setRipples((rs) => rs.filter((r) => r.id !== id));
    }, 700);
  };

  return (
    <motion.div
      ref={ref}
      className={className}
      onPointerMove={handleMove}
      onPointerLeave={reset}
      onPointerCancel={reset}
      onPointerDown={handlePointerDown}
      style={{
        x: sx,
        y: sy,
        display: 'inline-block',
        position: 'relative',
        overflow: 'hidden',
        borderRadius: 'inherit',
      }}
    >
      {children}
      <AnimatePresence>
        {ripples.map((r) => (
          <motion.span
            key={r.id}
            aria-hidden
            initial={{ scale: 0, opacity: 0.45 }}
            animate={{ scale: 1, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
            style={{
              position: 'absolute',
              left: r.x - r.size / 2,
              top: r.y - r.size / 2,
              width: r.size,
              height: r.size,
              borderRadius: '50%',
              background:
                'radial-gradient(circle, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0) 65%)',
              pointerEvents: 'none',
              mixBlendMode: 'screen',
            }}
          />
        ))}
      </AnimatePresence>
    </motion.div>
  );
}
