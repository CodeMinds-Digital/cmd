/**
 * In-memory token-bucket rate limiter.
 *
 * Suitable while the site runs as a single Node process (Dokploy, one
 * container). If it's ever scaled to more than one replica, each replica
 * would keep its own buckets — swap this for a shared store (Redis/Upstash)
 * behind the same `take()` interface.
 */

export type RateLimitResult =
  | { ok: true; remaining: number }
  | { ok: false; retryAfterMs: number };

export type RateLimiter = {
  /** Consume one token for `key`. */
  take(key: string, now?: number): RateLimitResult;
  /** Number of tracked keys (for tests / diagnostics). */
  size(): number;
};

type Bucket = { tokens: number; updatedAt: number };

export function createRateLimiter({
  capacity,
  refillEveryMs,
  maxKeys = 10_000,
}: {
  /** Burst size: how many requests a fresh key may make at once. */
  capacity: number;
  /** One token is restored every `refillEveryMs`. */
  refillEveryMs: number;
  /** Memory guard: evict the stalest keys beyond this many. */
  maxKeys?: number;
}): RateLimiter {
  const buckets = new Map<string, Bucket>();

  const refill = (bucket: Bucket, now: number) => {
    const elapsed = Math.max(0, now - bucket.updatedAt);
    const restored = Math.floor(elapsed / refillEveryMs);
    if (restored > 0) {
      bucket.tokens = Math.min(capacity, bucket.tokens + restored);
      // Keep the remainder so partial refill time isn't lost.
      bucket.updatedAt = bucket.tokens === capacity ? now : bucket.updatedAt + restored * refillEveryMs;
    }
  };

  const evict = (now: number) => {
    // Drop fully-refilled buckets first (they carry no state), then oldest.
    buckets.forEach((bucket, key) => {
      refill(bucket, now);
      if (bucket.tokens === capacity) buckets.delete(key);
    });
    // Make room for the key about to be inserted.
    while (buckets.size >= maxKeys) {
      const oldest = buckets.keys().next().value;
      if (oldest === undefined) break;
      buckets.delete(oldest);
    }
  };

  return {
    take(key, now = Date.now()) {
      let bucket = buckets.get(key);
      if (!bucket) {
        if (buckets.size >= maxKeys) evict(now);
        bucket = { tokens: capacity, updatedAt: now };
        buckets.set(key, bucket);
      } else {
        refill(bucket, now);
      }

      if (bucket.tokens > 0) {
        // A full bucket's refill clock isn't running; start it now.
        if (bucket.tokens === capacity) bucket.updatedAt = now;
        bucket.tokens -= 1;
        return { ok: true, remaining: bucket.tokens };
      }
      const retryAfterMs = refillEveryMs - (now - bucket.updatedAt);
      return { ok: false, retryAfterMs: Math.max(0, retryAfterMs) };
    },
    size: () => buckets.size,
  };
}
