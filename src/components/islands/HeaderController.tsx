'use client';

import { useEffect } from 'react';

/**
 * Header behaviour that CSS can't express, done with attribute toggles
 * rather than React state (no re-render per scroll event):
 * - `data-hidden` — hide on scroll down past the hero, show on scroll up or
 *   when focus enters the header.
 * - `data-scrolled` — fallback for the condensed look where scroll-driven
 *   animations aren't supported (or motion is reduced).
 * - Closes the mobile menu popover when one of its links is used; same-page
 *   hash links (e.g. "/#contact") don't remount the header.
 */
export default function HeaderController() {
  useEffect(() => {
    const header = document.querySelector<HTMLElement>('[data-site-header]');
    if (!header) return;
    const menu = document.getElementById('site-menu');

    let lastY = window.scrollY;
    let raf = 0;
    const update = () => {
      raf = 0;
      const y = window.scrollY;
      header.toggleAttribute('data-scrolled', y > 8);
      const menuOpen = menu?.matches(':popover-open') ?? false;
      if (menuOpen || y <= 200 || y < lastY - 4) header.removeAttribute('data-hidden');
      else if (y > lastY + 4) header.setAttribute('data-hidden', '');
      lastY = y;
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    const onFocusIn = () => header.removeAttribute('data-hidden');
    const onMenuClick = (e: MouseEvent) => {
      if (e.target instanceof Element && e.target.closest('a')) menu?.hidePopover();
    };

    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    header.addEventListener('focusin', onFocusIn);
    menu?.addEventListener('click', onMenuClick);
    return () => {
      window.removeEventListener('scroll', onScroll);
      header.removeEventListener('focusin', onFocusIn);
      menu?.removeEventListener('click', onMenuClick);
      cancelAnimationFrame(raf);
    };
  }, []);

  return null;
}
