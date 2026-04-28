'use client';

import React, { useRef } from 'react';
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  useReducedMotion,
} from 'framer-motion';

type TiltProps = {
  children: React.ReactNode;
  className?: string;
  /** Max rotation in degrees on each axis. Default 8. */
  max?: number;
  /** Lift in px on hover. Default 6. */
  lift?: number;
};

export default function Tilt({
  children,
  className,
  max = 8,
  lift = 6,
}: TiltProps) {
  const ref = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useReducedMotion();

  const px = useMotionValue(0);
  const py = useMotionValue(0);
  const lifted = useMotionValue(0);

  const sx = useSpring(px, { stiffness: 220, damping: 22, mass: 0.4 });
  const sy = useSpring(py, { stiffness: 220, damping: 22, mass: 0.4 });
  const sLift = useSpring(lifted, { stiffness: 240, damping: 26 });

  const rotateY = useTransform(sx, [-0.5, 0.5], [-max, max]);
  const rotateX = useTransform(sy, [-0.5, 0.5], [max, -max]);
  const yOffset = useTransform(sLift, (v) => -v);

  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (prefersReducedMotion || e.pointerType !== 'mouse') return;
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    px.set((e.clientX - rect.left) / rect.width - 0.5);
    py.set((e.clientY - rect.top) / rect.height - 0.5);
  };

  const onEnter = () => {
    if (prefersReducedMotion) return;
    lifted.set(lift);
  };
  const onLeave = () => {
    px.set(0);
    py.set(0);
    lifted.set(0);
  };

  return (
    <motion.div
      ref={ref}
      className={className}
      onPointerMove={onMove}
      onPointerEnter={onEnter}
      onPointerLeave={onLeave}
      onPointerCancel={onLeave}
      style={{
        rotateX,
        rotateY,
        y: yOffset,
        transformStyle: 'preserve-3d',
        transformPerspective: 900,
      }}
    >
      {children}
    </motion.div>
  );
}
