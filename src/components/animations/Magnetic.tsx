'use client';

import React, { useEffect, useRef } from 'react';
import { easeToward } from '@/lib/ease-toward';
import { usePrefersReducedMotion } from '@/lib/use-media-query';

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

/**
 * Pointer-pulled wrapper for CTAs, plus a click ripple. Mouse only; touch
 * and reduced motion bypass it. Runs a rAF loop only while moving and
 * writes the transform directly — no React re-renders.
 */
export default function Magnetic({
  children,
  className,
  strength = 0.35,
  max = 18,
  ripple = true,
}: MagneticProps) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = usePrefersReducedMotion();
  const state = useRef({ x: 0, y: 0, tx: 0, ty: 0, raf: 0, last: 0 });

  useEffect(() => {
    const s = state.current;
    return () => cancelAnimationFrame(s.raf);
  }, []);

  const tick = (now: number) => {
    const s = state.current;
    const dt = s.last ? Math.min(64, now - s.last) : 16.67;
    s.last = now;
    s.x = easeToward(s.x, s.tx, 0.18, dt);
    s.y = easeToward(s.y, s.ty, 0.18, dt);
    if (ref.current) ref.current.style.transform = `translate3d(${s.x}px, ${s.y}px, 0)`;
    if (s.x !== s.tx || s.y !== s.ty) s.raf = requestAnimationFrame(tick);
    else s.raf = 0;
  };

  const setTarget = (tx: number, ty: number) => {
    const s = state.current;
    s.tx = tx;
    s.ty = ty;
    if (!s.raf) {
      s.last = 0;
      s.raf = requestAnimationFrame(tick);
    }
  };

  const clamp = (v: number) => Math.max(-max, Math.min(max, v));

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (reduced || e.pointerType !== 'mouse' || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    setTarget(
      clamp((e.clientX - (rect.left + rect.width / 2)) * strength),
      clamp((e.clientY - (rect.top + rect.height / 2)) * strength),
    );
  };
  const reset = () => setTarget(0, 0);

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const node = ref.current;
    if (!ripple || reduced || !node) return;
    const rect = node.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height) * 1.6;
    const span = document.createElement('span');
    span.className = 'magnetic-ripple';
    span.setAttribute('aria-hidden', 'true');
    Object.assign(span.style, {
      width: `${size}px`,
      height: `${size}px`,
      left: `${e.clientX - rect.left - size / 2}px`,
      top: `${e.clientY - rect.top - size / 2}px`,
    });
    span.addEventListener('animationend', () => span.remove(), { once: true });
    node.appendChild(span);
  };

  return (
    <div
      ref={ref}
      className={className}
      onPointerMove={onPointerMove}
      onPointerLeave={reset}
      onPointerCancel={reset}
      onPointerDown={onPointerDown}
      style={{ display: 'inline-block', position: 'relative', overflow: 'hidden', borderRadius: 9999 }}
    >
      {children}
    </div>
  );
}
