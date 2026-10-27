import 'server-only';
import { STAFF_TEAMS, type StaffRole } from '@codeminds/cms/roles';
import { adminClient, Query } from '@codeminds/cms/server';

export type StaffMember = {
  userId: string;
  name: string;
  email: string;
  role: StaffRole;
  mfa: boolean;
  joined: string;
  lastSeen: string;
  memberships: { teamId: StaffRole; membershipId: string }[];
};

/** Everyone in the admin and editor teams, one row per person (highest role). */
export async function listStaff(): Promise<StaffMember[]> {
  const { teams } = adminClient();
  const lists = await Promise.all(
    (Object.keys(STAFF_TEAMS) as StaffRole[]).map(async (role) =>
      (await teams.listMemberships({ teamId: STAFF_TEAMS[role], queries: [Query.limit(100)] })).memberships.map((m) => ({ ...m, role })),
    ),
  );
  const people = new Map<string, StaffMember>();
  for (const m of lists.flat()) {
    const p = people.get(m.userId) ?? {
      userId: m.userId,
      name: m.userName || m.userEmail,
      email: m.userEmail,
      role: m.role,
      mfa: m.mfa,
      joined: m.joined || m.$createdAt,
      lastSeen: m.userAccessedAt,
      memberships: [],
    };
    if (m.role === 'admin') p.role = 'admin';
    p.memberships.push({ teamId: m.role, membershipId: m.$id });
    people.set(m.userId, p);
  }
  return [...people.values()].sort((a, b) => (a.role === b.role ? a.name.localeCompare(b.name) : a.role === 'admin' ? -1 : 1));
}
