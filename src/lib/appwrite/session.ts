import 'server-only';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { Account, Client, Databases, Storage, Teams } from 'node-appwrite';
import { APPWRITE_ENDPOINT, APPWRITE_PROJECT_ID } from './env';

const SESSION_COOKIE = 'cmd_session';

/** httpOnly cookie config — secret session token, never readable by JS. */
export const SESSION_COOKIE_OPTIONS = {
  name: SESSION_COOKIE,
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
  // 30-day rolling. Refresh on every authenticated request.
  maxAge: 60 * 60 * 24 * 30,
};

export type AppwriteUser = {
  $id: string;
  email: string;
  name: string;
  emailVerification: boolean;
};

/**
 * Returns an Appwrite SDK client scoped to the current user's session.
 * Uses cookies() so it's only callable from server components / server
 * actions / route handlers.
 */
async function getSessionClient(): Promise<Client | null> {
  const session = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!session) return null;
  return new Client()
    .setEndpoint(APPWRITE_ENDPOINT)
    .setProject(APPWRITE_PROJECT_ID)
    .setSession(session);
}

/** Returns the logged-in user, or null if no valid session. */
export async function getCurrentUser(): Promise<AppwriteUser | null> {
  const client = await getSessionClient();
  if (!client) return null;
  try {
    const account = new Account(client);
    const user = await account.get();
    return {
      $id: user.$id,
      email: user.email,
      name: user.name,
      emailVerification: user.emailVerification,
    };
  } catch {
    return null;
  }
}

/**
 * Server-component / server-action helper. Throws a redirect to the
 * login page if no valid session.
 */
export async function requireUser(): Promise<AppwriteUser> {
  const user = await getCurrentUser();
  if (!user) redirect('/admin/login');
  return user;
}

/**
 * Returns true if the user is a member of any of the given teams.
 * For document-level perms we'll lean on Appwrite's collection ACL
 * (defined in appwrite.json) — this helper is for UI affordances
 * (show/hide buttons) only.
 */
export async function isInTeam(teamIds: string[]): Promise<boolean> {
  const client = await getSessionClient();
  if (!client) return false;
  try {
    const teams = new Teams(client);
    const memberships = await teams.list();
    const userTeamIds = new Set(memberships.teams.map((t) => t.$id));
    return teamIds.some((id) => userTeamIds.has(id));
  } catch {
    return false;
  }
}

/**
 * Returns SDK instances scoped to the current session — for reads /
 * writes that should respect the user's permissions, not the admin
 * key's permissions. Use this from server components / actions when
 * the action should be performed as the logged-in user.
 */
export async function getSessionSdk(): Promise<{
  account: Account;
  databases: Databases;
  storage: Storage;
  teams: Teams;
} | null> {
  const client = await getSessionClient();
  if (!client) return null;
  return {
    account: new Account(client),
    databases: new Databases(client),
    storage: new Storage(client),
    teams: new Teams(client),
  };
}
