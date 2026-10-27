/**
 * Best-effort client IP for rate limiting.
 *
 * Production runs behind Dokploy's Traefik proxy, which sets `X-Real-IP`
 * and *appends* the connecting address to `X-Forwarded-For`. So the trusted
 * values are X-Real-IP, or the rightmost X-Forwarded-For entry — never the
 * leftmost, which the client can forge.
 *
 * Returns 'unknown' when neither header is present (e.g. local dev without
 * a proxy); those requests then share one bucket, which fails safe.
 */
export function clientIp(headers: Pick<Headers, 'get'>): string {
  const realIp = headers.get('x-real-ip')?.trim();
  if (realIp) return realIp;

  const forwarded = headers.get('x-forwarded-for');
  if (forwarded) {
    const hops = forwarded.split(',').map((h) => h.trim()).filter(Boolean);
    const last = hops.at(-1);
    if (last) return last;
  }
  return 'unknown';
}
