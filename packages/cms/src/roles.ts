/**
 * Staff roles = Appwrite team membership (D12: live teams `admin`, `editor`).
 * An Admin may also sit in `editor`; the highest role wins. Anyone else
 * (including members of the unused `writer`/`viewer` teams) has no access.
 */
export const STAFF_TEAMS = { admin: 'admin', editor: 'editor' } as const;
export type StaffRole = keyof typeof STAFF_TEAMS;

export function roleFromTeams(teamIds: readonly string[]): StaffRole | null {
  if (teamIds.includes(STAFF_TEAMS.admin)) return 'admin';
  if (teamIds.includes(STAFF_TEAMS.editor)) return 'editor';
  return null;
}

export function hasRole(role: StaffRole | null, needed: StaffRole): boolean {
  return role === 'admin' || (role !== null && role === needed);
}

/**
 * Where a signed-in user must go before reaching `path`, or null to proceed.
 * Admins must have two-factor authentication (TOTP) on; until then only the
 * account page (where they enrol) is reachable.
 */
export function gate({ role, mfa, path }: { role: StaffRole | null; mfa: boolean; path: string }): string | null {
  if (!role) return '/no-access';
  if (role === 'admin' && !mfa && !path.startsWith('/account')) return '/account?enrol=1';
  return null;
}
