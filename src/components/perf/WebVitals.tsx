'use client';

import { useReportWebVitals } from 'next/web-vitals';

const THRESHOLDS: Record<string, [number, number]> = {
  LCP: [2500, 4000],
  INP: [200, 500],
  CLS: [0.1, 0.25],
  FCP: [1800, 3000],
  TTFB: [800, 1800],
};

const rate = (name: string, value: number) => {
  const t = THRESHOLDS[name];
  if (!t) return 'n/a';
  if (value <= t[0]) return 'good';
  if (value <= t[1]) return 'needs-improvement';
  return 'poor';
};

export default function WebVitals() {
  useReportWebVitals((metric) => {
    const label = rate(metric.name, metric.value);

    if (process.env.NODE_ENV === 'development') {
      const color =
        label === 'good' ? '#10b981' : label === 'poor' ? '#ef4444' : '#f59e0b';
      // eslint-disable-next-line no-console
      console.log(
        `%c[vitals] ${metric.name} %c${metric.value.toFixed(1)} %c${label}`,
        'color:#6366f1;font-weight:600',
        'color:inherit;font-weight:600',
        `color:${color};font-weight:600`,
      );
      return;
    }

    const body = JSON.stringify({
      name: metric.name,
      value: metric.value,
      rating: label,
      id: metric.id,
      navigationType: metric.navigationType,
      path: window.location.pathname,
    });

    if (navigator.sendBeacon) {
      navigator.sendBeacon('/api/vitals', body);
    } else {
      fetch('/api/vitals', {
        body,
        method: 'POST',
        keepalive: true,
        headers: { 'content-type': 'application/json' },
      }).catch(() => {});
    }
  });

  return null;
}
