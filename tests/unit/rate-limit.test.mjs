import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRateLimiter } from '../../src/lib/rate-limit.ts';

const MIN = 60_000;

test('allows a burst up to capacity, then blocks', () => {
  const rl = createRateLimiter({ capacity: 3, refillEveryMs: 10 * MIN });
  const t = 1_000_000;
  assert.deepEqual(rl.take('a', t), { ok: true, remaining: 2 });
  assert.deepEqual(rl.take('a', t), { ok: true, remaining: 1 });
  assert.deepEqual(rl.take('a', t), { ok: true, remaining: 0 });
  const blocked = rl.take('a', t);
  assert.equal(blocked.ok, false);
  assert.equal(blocked.retryAfterMs, 10 * MIN);
});

test('keys are independent', () => {
  const rl = createRateLimiter({ capacity: 1, refillEveryMs: MIN });
  assert.equal(rl.take('a', 0).ok, true);
  assert.equal(rl.take('a', 0).ok, false);
  assert.equal(rl.take('b', 0).ok, true);
});

test('refills one token per interval and reports the remaining wait', () => {
  const rl = createRateLimiter({ capacity: 2, refillEveryMs: 10 * MIN });
  rl.take('a', 0);
  rl.take('a', 0);
  const early = rl.take('a', 4 * MIN);
  assert.equal(early.ok, false);
  assert.equal(early.retryAfterMs, 6 * MIN);
  assert.equal(rl.take('a', 10 * MIN).ok, true); // one token back
  assert.equal(rl.take('a', 10 * MIN).ok, false);
  assert.equal(rl.take('a', 40 * MIN).ok, true); // capped at capacity…
  assert.equal(rl.take('a', 40 * MIN).ok, true);
  assert.equal(rl.take('a', 40 * MIN).ok, false); // …not 3 tokens
});

test('a full bucket does not bank refill time before its first use', () => {
  const rl = createRateLimiter({ capacity: 1, refillEveryMs: 10 * MIN });
  rl.take('a', 0);
  assert.equal(rl.take('a', 10 * MIN).ok, true); // refilled, then used at t=10
  // Next token must be a full interval after t=10, not after t=0's anchor.
  assert.equal(rl.take('a', 19 * MIN).ok, false);
  assert.equal(rl.take('a', 20 * MIN).ok, true);
});

test('partial refill time is kept across calls', () => {
  const rl = createRateLimiter({ capacity: 3, refillEveryMs: 10 * MIN });
  rl.take('a', 0); rl.take('a', 0); rl.take('a', 0);
  assert.equal(rl.take('a', 15 * MIN).ok, true); // 1 token at t=10, used
  assert.equal(rl.take('a', 19 * MIN).ok, false);
  assert.equal(rl.take('a', 20 * MIN).ok, true); // next token at t=20
});

test('evicts idle keys to stay within maxKeys', () => {
  const rl = createRateLimiter({ capacity: 1, refillEveryMs: MIN, maxKeys: 3 });
  for (const k of ['a', 'b', 'c']) rl.take(k, 0);
  assert.equal(rl.size(), 3);
  rl.take('d', 5 * MIN); // a–c have fully refilled → dropped
  assert.equal(rl.size(), 1);
  for (const k of ['e', 'f']) rl.take(k, 5 * MIN);
  rl.take('g', 5 * MIN); // all busy → oldest evicted
  assert.ok(rl.size() <= 3);
});
