/** Routes covered by the Phase 0 baseline (see docs/superpowers/plans/2026-09-28-landing-page-modernization.md). */
export const ROUTES = [
  { name: 'home', path: '/' },
  { name: 'work', path: '/work' },
  { name: 'work-case', path: '/work/fintech-marketing-rebuild' },
  { name: 'work-coming', path: '/work/yc-startup-mobile-mvp' },
  { name: 'studio', path: '/studio' },
  { name: 'journal', path: '/journal' },
  { name: 'journal-post', path: '/journal/why-we-stopped-pricing-by-the-hour' },
] as const;

export const WIDTHS = [375, 768, 1280, 1920] as const;

export const OUT_DIR = 'docs/perf/2026-09-baseline';

/** Where screenshots are written. Override to capture a comparison set. */
export const SCREENSHOT_DIR = process.env.SCREENSHOT_DIR ?? `${OUT_DIR}/screenshots`;
