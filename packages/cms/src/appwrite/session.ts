/**
 * Server-side rendering (SSR) auth helpers for the admin app (Appwrite's SSR pattern).
 *
 * Sign-in creates the session with a keyed client: Appwrite only returns
 * `session.secret` to a request made with an API key (a keyless client gets
 * an empty secret, so the cookie would never authenticate). Because keyed
 * requests skip Appwrite's own sign-in rate limits, callers must rate-limit
 * sign-in themselves (the admin login action does).
 * Every later request runs as the user via `createSessionClient(secret)`, so
 * Appwrite permissions, not only UI checks, decide what they can do.
 *
 * Framework-free on purpose: the admin app reads/writes the cookie itself.
 */
import { Account, Avatars, Client, Storage, TablesDB, Teams } from 'node-appwrite';
import { readPublicEnv, type PublicEnv } from '../env.ts';
import { createAdminClient } from './server.ts';

/** Admin sessions last at most this long, whatever Appwrite's own session length is. */
export const SESSION_MAX_AGE_S = 12 * 60 * 60;

/**
 * `__Host-` (production): the browser only accepts it over HTTPS, for path /,
 * with no Domain, so the cookie can never be set or read by another subdomain.
 */
export function sessionCookieName(secure = process.env.NODE_ENV === 'production') {
  return secure ? '__Host-cmd_admin' : 'cmd_admin';
}

/** httpOnly: the session secret is never readable by page scripts. */
export function sessionCookieOptions(expire: string, secure = process.env.NODE_ENV === 'production', now = Date.now()) {
  const cap = now + SESSION_MAX_AGE_S * 1000;
  return {
    name: sessionCookieName(secure),
    httpOnly: true,
    secure,
    sameSite: 'strict' as const,
    path: '/',
    expires: new Date(Math.min(new Date(expire).getTime() || cap, cap)),
  };
}

/**
 * Expiring replacement cookie. A `__Host-` cookie can only be removed by a
 * Set-Cookie with the same Secure/Path attributes, which a plain delete omits.
 */
export function clearedSessionCookie(secure = process.env.NODE_ENV === 'production') {
  return { name: sessionCookieName(secure), value: '', httpOnly: true, secure, sameSite: 'strict' as const, path: '/', maxAge: 0 };
}

/** No key, no session: for unauthenticated account flows (password recovery). */
export function createPublicClient(env: PublicEnv = readPublicEnv()) {
  return { account: new Account(new Client().setEndpoint(env.endpoint).setProject(env.projectId)) };
}

export function createSessionClient(secret: string, env: PublicEnv = readPublicEnv()) {
  if (!secret) throw new Error('Missing session secret.');
  const client = new Client().setEndpoint(env.endpoint).setProject(env.projectId).setSession(secret);
  return {
    account: new Account(client),
    avatars: new Avatars(client),
    tablesDB: new TablesDB(client),
    storage: new Storage(client),
    teams: new Teams(client),
  };
}

/** Email + password sign-in. Returns the secret and expiry for the cookie. */
export async function signInWithPassword(email: string, password: string, userAgent?: string) {
  const admin = createAdminClient();
  if (userAgent) admin.client.setForwardedUserAgent(userAgent.slice(0, 256));
  const session = await admin.account.createEmailPasswordSession({ email, password });
  if (!session.secret) throw new Error('Appwrite returned no session secret; check the API key has the sessions.write scope.');
  return { secret: session.secret, expire: session.expire };
}

export async function signOut(secret: string) {
  await createSessionClient(secret).account.deleteSession({ sessionId: 'current' });
}
