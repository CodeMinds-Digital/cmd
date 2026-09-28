'use client';

import { useSyncExternalStore } from 'react';

const formatter = new Intl.DateTimeFormat('en-IN', {
  timeZone: 'Asia/Kolkata',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});

/** Notify subscribers at the top of every minute. */
function subscribe(onChange: () => void) {
  let timer: ReturnType<typeof setTimeout>;
  const schedule = () => {
    timer = setTimeout(() => {
      onChange();
      schedule();
    }, 60_000 - (Date.now() % 60_000) + 50);
  };
  schedule();
  return () => clearTimeout(timer);
}

// A string snapshot is stable within a minute, as useSyncExternalStore needs.
const getSnapshot = () => formatter.format(Date.now());
// The server can't know the viewer's render time; hydrate with a placeholder.
const getServerSnapshot = () => null;

/**
 * Live local time in Chennai (IST, UTC+5:30), updated every minute.
 * Renders `--:--` on the server and during hydration, then the real time.
 */
export default function ChennaiClock({ className }: { className?: string }) {
  const time = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return (
    <span className={className}>
      <time className="tabular-nums" aria-live="off">
        {time ?? '--:--'}
      </time>{' '}
      <span>IST</span>
    </span>
  );
}
