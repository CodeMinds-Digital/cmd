'use client';

import { useEffect, useRef } from 'react';
import { easeToward } from '@/lib/ease-toward';
import { useMediaQuery } from '@/lib/use-media-query';

const HOVER_SELECTOR = 'a, button, label, [data-cursor="hover"]';

/**
 * Dot + trailing ring cursor for fine pointers. The dot tracks the pointer
 * exactly; the ring eases behind it in a rAF loop that only runs while the
 * ring is catching up. Hover / press / hidden states are data attributes
 * styled in CSS (styles/motion.css), so nothing here re-renders.
 */
export default function CustomCursor() {
  const enabled = useMediaQuery('(pointer: fine) and (prefers-reduced-motion: no-preference)');
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const dot = dotRef.current;
    const ring = ringRef.current;
    if (!enabled || !dot || !ring) return;

    const root = document.documentElement;
    const pos = { x: -100, y: -100, rx: -100, ry: -100, raf: 0, last: 0 };
    const place = (el: HTMLElement, x: number, y: number) => {
      el.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%)`;
    };

    const tick = (now: number) => {
      const dt = pos.last ? Math.min(64, now - pos.last) : 16.67;
      pos.last = now;
      pos.rx = easeToward(pos.rx, pos.x, 0.22, dt);
      pos.ry = easeToward(pos.ry, pos.y, 0.22, dt);
      place(ring, pos.rx, pos.ry);
      if (pos.rx !== pos.x || pos.ry !== pos.y) pos.raf = requestAnimationFrame(tick);
      else pos.raf = 0;
    };

    const onMove = (e: PointerEvent) => {
      pos.x = e.clientX;
      pos.y = e.clientY;
      place(dot, pos.x, pos.y);
      root.removeAttribute('data-cursor-hidden');
      if (!pos.raf) {
        pos.last = 0;
        pos.raf = requestAnimationFrame(tick);
      }
    };
    const setAttr = (name: string, on: boolean) => root.toggleAttribute(name, on);
    const onDown = () => setAttr('data-cursor-pressed', true);
    const onUp = () => setAttr('data-cursor-pressed', false);
    const onLeave = () => setAttr('data-cursor-hidden', true);
    const onOver = (e: MouseEvent) =>
      setAttr('data-cursor-hover', e.target instanceof Element && !!e.target.closest(HOVER_SELECTOR));

    root.classList.add('has-custom-cursor');
    root.setAttribute('data-cursor-hidden', '');
    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('pointerdown', onDown);
    window.addEventListener('pointerup', onUp);
    document.addEventListener('mouseleave', onLeave);
    document.addEventListener('mouseover', onOver);

    return () => {
      cancelAnimationFrame(pos.raf);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointerup', onUp);
      document.removeEventListener('mouseleave', onLeave);
      document.removeEventListener('mouseover', onOver);
      root.classList.remove('has-custom-cursor');
      ['data-cursor-hidden', 'data-cursor-hover', 'data-cursor-pressed'].forEach((a) => root.removeAttribute(a));
    };
  }, [enabled]);

  if (!enabled) return null;

  return (
    <>
      <div ref={dotRef} aria-hidden className="cursor-dot" />
      <div ref={ringRef} aria-hidden className="cursor-ring" />
    </>
  );
}
