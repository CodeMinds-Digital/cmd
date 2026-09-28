/**
 * Frame-rate-independent exponential approach: move `current` toward
 * `target`, covering `rate` of the remaining distance per 16.7ms frame.
 * A lightweight stand-in for a spring in pointer-follow effects.
 */
export function easeToward(current: number, target: number, rate: number, dtMs: number): number {
  const t = 1 - Math.pow(1 - rate, dtMs / 16.67);
  const next = current + (target - current) * t;
  return Math.abs(target - next) < 0.01 ? target : next;
}
