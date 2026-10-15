'use client';

import { useEffect } from 'react';

/**
 * Header behaviour that CSS can't express, done with attribute toggles
 * rather than React state (no re-render per scroll event):
 * - `data-scrolled` — fallback for the condensed look where scroll-driven
 *   animations aren't supported (or motion is reduced).
 * - Closes the mobile menu popover when one of its links is used; same-page
 *   hash links (e.g. "/#contact") don't remount the header.
 * The header itself stays visible in both scroll directions.
 */
export default function HeaderController() {
  useEffect(() => {
    const header = document.querySelector<HTMLElement>('[data-site-header]');
    if (!header) return;
    const menu = document.getElementById('site-menu');

    let raf = 0;
    const update = () => {
      raf = 0;
      header.toggleAttribute('data-scrolled', window.scrollY > 8);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    const onMenuClick = (e: MouseEvent) => {
      if (e.target instanceof Element && e.target.closest('a')) menu?.hidePopover();
    };

    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    menu?.addEventListener('click', onMenuClick);
    return () => {
      window.removeEventListener('scroll', onScroll);
      menu?.removeEventListener('click', onMenuClick);
      cancelAnimationFrame(raf);
    };
  }, []);

  return null;
}
