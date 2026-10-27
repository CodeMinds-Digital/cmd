/** "2026-04-12" → "April 12, 2026". UTC, so the calendar date never shifts with the server's zone. */
export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  });
}
