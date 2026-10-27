/**
 * HMAC-SHA256 signatures shared by the site and its callers:
 *   - revalidation: the `revalidate-site` Appwrite Function signs
 *     `${timestamp}.${body}`; the site rejects stale or forged requests;
 *   - draft preview: the admin signs `${path}.${expires}` into a short-lived link.
 * Secrets are server-only. Comparison is constant-time.
 */
import { createHmac, timingSafeEqual } from 'node:crypto';

export function sign(secret: string, payload: string): string {
  if (!secret || secret.length < 32) throw new Error('Signing secret is missing or shorter than 32 characters.');
  return createHmac('sha256', secret).update(payload).digest('hex');
}

export function verify(secret: string, payload: string, signature: string | null | undefined): boolean {
  if (!signature || !/^[0-9a-f]{64}$/.test(signature)) return false;
  const expected = Buffer.from(sign(secret, payload), 'hex');
  return timingSafeEqual(expected, Buffer.from(signature, 'hex'));
}

/** Signed request headers for POST /api/revalidate. */
export const REVALIDATE_HEADERS = { timestamp: 'x-cmd-timestamp', signature: 'x-cmd-signature' } as const;
export const REVALIDATE_MAX_SKEW_S = 300;

export function verifyRevalidate(secret: string, body: string, timestamp: string | null, signature: string | null, nowS = Date.now() / 1000) {
  const ts = Number(timestamp);
  if (!Number.isFinite(ts) || Math.abs(nowS - ts) > REVALIDATE_MAX_SKEW_S) return false;
  return verify(secret, `${ts}.${body}`, signature);
}

/** Preview links: valid for `ttlS` seconds, for one site-relative path. */
export const PREVIEW_TTL_S = 600;

/**
 * A site-relative path that stays on this origin however a browser parses it.
 * Control characters are rejected outright: browsers strip tab/CR/LF, which
 * would turn "/\t/evil.tld" into "//evil.tld" (an open redirect).
 */
export function isSafePath(path: string) {
  if (!path.startsWith('/') || /[\u0000-\u001f\u007f\\]/.test(path)) return false;
  try {
    return new URL(path, 'https://x.invalid').origin === 'https://x.invalid';
  } catch {
    return false;
  }
}

export function signPreview(secret: string, path: string, nowS = Math.floor(Date.now() / 1000), ttlS = PREVIEW_TTL_S) {
  if (!isSafePath(path)) throw new Error('Preview path must be site-relative.');
  const expires = nowS + ttlS;
  return { path, expires, signature: sign(secret, `${path}.${expires}`) };
}

export function verifyPreview(secret: string, path: string, expires: string | null, signature: string | null, nowS = Date.now() / 1000) {
  const exp = Number(expires);
  if (!isSafePath(path) || !Number.isFinite(exp) || exp < nowS || exp - nowS > PREVIEW_TTL_S) return false;
  return verify(secret, `${path}.${exp}`, signature);
}

/**
 * Preview session: Next's draft-mode cookie is site-wide and never expires,
 * so preview also needs this signed cookie, valid PREVIEW_TTL_S from when the
 * signed link was opened. Value: "<expires>.<signature>".
 */
export const PREVIEW_COOKIE = 'cmd_preview';

export function signPreviewSession(secret: string, nowS = Math.floor(Date.now() / 1000)) {
  const expires = nowS + PREVIEW_TTL_S;
  return `${expires}.${sign(secret, `preview-session.${expires}`)}`;
}

export function verifyPreviewSession(secret: string, value: string | undefined, nowS = Date.now() / 1000) {
  const [exp, sig] = (value ?? '').split('.');
  const expires = Number(exp);
  if (!Number.isFinite(expires) || expires < nowS || expires - nowS > PREVIEW_TTL_S) return false;
  return verify(secret, `preview-session.${expires}`, sig);
}
