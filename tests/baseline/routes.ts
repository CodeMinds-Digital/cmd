/** Routes covered by the Phase 0 baseline (see docs/superpowers/plans/2026-09-28-landing-page-modernization.md). */
export const ROUTES = [
  { name: 'home', path: '/' },
  { name: 'work', path: '/work' },
  { name: 'work-case', path: '/work/fintech-marketing-rebuild' },
  { name: 'studio', path: '/studio' },
  { name: 'journal', path: '/journal' },
] as const;

export const WIDTHS = [375, 768, 1280, 1920] as const;

export const OUT_DIR = 'docs/perf/2026-09-baseline';
