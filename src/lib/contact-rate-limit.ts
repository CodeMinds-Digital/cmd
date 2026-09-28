import { createRateLimiter } from '@/lib/rate-limit';

/**
 * Contact-form send limits (plan Phase 4). Only submissions that pass
 * validation and would actually send an email consume tokens.
 *
 * - Per IP: burst of 5, then 1 more every 10 minutes.
 * - Global: burst of 30, then 1 every 2 minutes — caps how much a
 *   distributed spammer can push through the SMTP account.
 */
const perIp = createRateLimiter({ capacity: 5, refillEveryMs: 10 * 60_000 });
const global = createRateLimiter({ capacity: 30, refillEveryMs: 2 * 60_000 });

export type ContactRateLimit = { ok: true } | { ok: false; retryAfterMinutes: number };

export function takeContactToken(ip: string): ContactRateLimit {
  const byIp = perIp.take(`ip:${ip}`);
  if (!byIp.ok) return { ok: false, retryAfterMinutes: Math.max(1, Math.ceil(byIp.retryAfterMs / 60_000)) };
  const overall = global.take('global');
  if (!overall.ok) return { ok: false, retryAfterMinutes: Math.max(1, Math.ceil(overall.retryAfterMs / 60_000)) };
  return { ok: true };
}
