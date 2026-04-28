'use client';

import { useEffect } from 'react';

/**
 * Dev-only long-task observer. Fires only for tasks ≥ THRESHOLD ms.
 *
 * The 50ms web-vitals "long task" definition is noisy in development —
 * initial chunk evaluation, HMR, and font load all routinely cross 50ms
 * without being actionable. We surface only ≥ THRESHOLD so the signal
 * stays useful when interaction-time work blocks the main thread.
 */
const THRESHOLD = 200;

export default function FrameBudget() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') return;
    if (typeof PerformanceObserver === 'undefined') return;
    if (!PerformanceObserver.supportedEntryTypes?.includes('longtask')) return;

    // Skip the first 4 seconds so initial bundle eval doesn't flood the log.
    const startedAt = performance.now();
    const grace = 4000;

    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.duration < THRESHOLD) continue;
        if (performance.now() - startedAt < grace) continue;
        // eslint-disable-next-line no-console
        console.warn(
          `%c[frame-budget] %c${entry.duration.toFixed(0)}ms %ctask blocked the main thread`,
          'color:#f59e0b;font-weight:600',
          'color:#ef4444;font-weight:600',
          'color:inherit',
        );
      }
    });

    try {
      observer.observe({ type: 'longtask', buffered: true });
    } catch {
      return;
    }
    return () => observer.disconnect();
  }, []);

  return null;
}
