import 'server-only';
import { createRateLimiter } from '@codeminds/cms/rate-limit';

/**
 * Sign-in and recovery go through the API key, which skips Appwrite's own
 * abuse limits, so they are limited here: per client IP and per email.
 * In-memory: one admin container (see rate-limit.ts for scaling).
 */
// Per IP is loose (staff can share an office IP); per email is the brute-force guard.
export const signInByIp = createRateLimiter({ capacity: 20, refillEveryMs: 30_000 });
export const signInByEmail = createRateLimiter({ capacity: 5, refillEveryMs: 3 * 60_000 });
/** Two-factor codes, per pending session (keyed by a hash of its secret). */
export const mfaBySession = createRateLimiter({ capacity: 5, refillEveryMs: 60_000 });
export const recoveryByIp = createRateLimiter({ capacity: 5, refillEveryMs: 10 * 60_000 });
