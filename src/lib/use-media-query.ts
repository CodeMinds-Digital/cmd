'use client';

import { useSyncExternalStore } from 'react';

/**
 * Subscribe to a CSS media query. Returns `serverValue` during SSR and
 * hydration, then the live match.
 */
export function useMediaQuery(query: string, serverValue = false): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const mql = window.matchMedia(query);
      mql.addEventListener('change', onChange);
      return () => mql.removeEventListener('change', onChange);
    },
    () => window.matchMedia(query).matches,
    () => serverValue,
  );
}

/** True when the user asked for reduced motion (assumed true on the server). */
export function usePrefersReducedMotion(): boolean {
  return useMediaQuery('(prefers-reduced-motion: reduce)', true);
}
