import 'server-only';
import { cache } from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { gate, hasRole, roleFromTeams, type StaffRole } from '@codeminds/cms/roles';
import { createSessionClient, sessionCookieName } from '@codeminds/cms/session';
import { AppwriteException } from '@codeminds/cms/server';

export type Staff = { id: string; name: string; email: string; mfa: boolean; role: StaffRole };

type SessionState =
  | { kind: 'none' }
  | { kind: 'mfa' }
  | { kind: 'user'; user: Omit<Staff, 'role'>; role: StaffRole | null };

export async function sessionSecret() {
  return (await cookies()).get(sessionCookieName())?.value;
}

/**
 * Who is signed in, checked against Appwrite on every request (deduped per
 * render). A revoked or expired session reads as signed out.
 */
export const getSessionState = cache(async (): Promise<SessionState> => {
  const secret = await sessionSecret();
  if (!secret) return { kind: 'none' };
  const s = createSessionClient(secret);
  try {
    const [user, teams] = await Promise.all([s.account.get(), s.teams.list({})]);
    return {
      kind: 'user',
      user: { id: user.$id, name: user.name || user.email, email: user.email, mfa: user.mfa },
      role: roleFromTeams(teams.teams.map((t) => t.$id)),
    };
  } catch (e) {
    if (e instanceof AppwriteException && e.type === 'user_more_factors_required') return { kind: 'mfa' };
    return { kind: 'none' };
  }
});

/**
 * Guard for every staff page and action. `path` is where the caller is (for
 * the post-login return and the admin two-factor gate); `needed` is the
 * minimum role.
 */
export async function requireStaff(path: string, needed: StaffRole = 'editor'): Promise<Staff> {
  const state = await getSessionState();
  if (state.kind === 'none') redirect(`/login?next=${encodeURIComponent(path)}`);
  if (state.kind === 'mfa') redirect(`/login/mfa?next=${encodeURIComponent(path)}`);
  const to = gate({ role: state.role, mfa: state.user.mfa, path });
  if (to) redirect(to);
  if (!hasRole(state.role, needed)) redirect(`/no-access?needed=${needed}`);
  return { ...state.user, role: state.role! };
}
