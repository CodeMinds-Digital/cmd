'use client';

import { useEffect } from 'react';

/**
 * The one piece of JS behind the CSS motion system (styles/motion.css).
 * Mounted once in the root layout; renders nothing.
 *
 * 1. In-view triggers — a single IntersectionObserver flips
 *    `data-inview=""` → `data-inview="true"` the first time an element
 *    enters the viewport. A MutationObserver picks up elements added later
 *    (client-side navigation, streamed content).
 * 2. Tile glow — one delegated pointermove listener writes the pointer
 *    position into `--x` / `--y` on the hovered `[data-glow]` tile
 *    (rAF-throttled, fine pointers only). No React state involved.
 *
 * On mount it marks `html.motion-ready`, which cancels the head script's
 * fail-safe that would otherwise drop `js-motion` (revealing everything).
 */
export default function MotionRuntime() {
  useEffect(() => {
    const root = document.documentElement;

    if (!('IntersectionObserver' in window)) {
      root.classList.remove('js-motion');
      return;
    }

    const PENDING = '[data-inview]:not([data-inview="true"])';
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.setAttribute('data-inview', 'true');
          io.unobserve(entry.target);
        }
      },
      // Trigger slightly before the element is fully on screen.
      { rootMargin: '0px 0px -8% 0px', threshold: 0 },
    );

    const scan = (node: ParentNode) => {
      node.querySelectorAll(PENDING).forEach((el) => io.observe(el));
    };
    scan(document);

    const mo = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        mutation.addedNodes.forEach((node) => {
          if (!(node instanceof Element)) return;
          if (node.matches(PENDING)) io.observe(node);
          scan(node);
        });
      }
    });
    mo.observe(document.body, { childList: true, subtree: true });

    // Pointer glow for interactive tiles.
    const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    let raf = 0;
    let pending: { el: HTMLElement; x: number; y: number } | null = null;
    const onPointerMove = (e: PointerEvent) => {
      const target = e.target instanceof Element ? e.target.closest<HTMLElement>('[data-glow]') : null;
      if (!target) return;
      const rect = target.getBoundingClientRect();
      pending = { el: target, x: e.clientX - rect.left, y: e.clientY - rect.top };
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        if (!pending) return;
        pending.el.style.setProperty('--x', `${pending.x}px`);
        pending.el.style.setProperty('--y', `${pending.y}px`);
      });
    };
    if (finePointer) document.addEventListener('pointermove', onPointerMove, { passive: true });

    root.classList.add('motion-ready');

    return () => {
      io.disconnect();
      mo.disconnect();
      document.removeEventListener('pointermove', onPointerMove);
      cancelAnimationFrame(raf);
    };
  }, []);

  return null;
}
