'use server';

import { randomBytes } from 'node:crypto';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { writeAudit } from '@codeminds/cms/audit';
import { STAFF_TEAMS } from '@codeminds/cms/roles';
import { AuthenticatorType, adminClient, ID, Query } from '@codeminds/cms/server';
import { createPublicClient } from '@codeminds/cms/session';
import type { FormState } from '@/components/form';
import { requireStaff } from '@/lib/auth';
import { adminUrl } from '@/lib/env';
import { listStaff } from '@/lib/staff';

/**
 * Staff management. Admin-only (checked first in every action), executed
 * with the server key, and audited. Guard rails: nobody changes or removes
 * themselves, and the last Admin can't be demoted or removed.
 */
const role = z.enum(['admin', 'editor']);

const invite = z.object({
  name: z.string().trim().min(1).max(128),
  email: z.string().trim().toLowerCase().max(320).pipe(z.email()),
  role,
});

export async function inviteStaff(_prev: FormState, form: FormData): Promise<FormState> {
  const me = await requireStaff('/staff', 'admin');
  const parsed = invite.safeParse({ name: form.get('name'), email: form.get('email'), role: form.get('role') });
  if (!parsed.success) return { status: 'error', message: 'Enter a name, a valid email and a role.' };
  const { name, email } = parsed.data;
  const admin = adminClient();

  const staff = await listStaff();
  if (staff.some((s) => s.email.toLowerCase() === email)) return { status: 'error', message: `${email} is already on the staff list. Change their role instead.` };

  try {
    const existing = (await admin.users.list({ queries: [Query.equal('email', email), Query.limit(1)] })).users[0];
    const user = existing ?? (await admin.users.create({ userId: ID.unique(), email, name }));
    // An existing account may have been registered by someone else in advance
    // (account pre-hijacking). Before it gains any access: replace its
    // password with a random one, end all its sessions and remove any
    // authenticator. Only the inbox owner can then set a password (below).
    if (existing) {
      await admin.users.updatePassword({ userId: user.$id, password: randomBytes(48).toString('base64url') });
      await admin.users.deleteSessions({ userId: user.$id });
      if (existing.mfa) {
        await admin.users.deleteMFAAuthenticator({ userId: user.$id, type: AuthenticatorType.Totp }).catch(() => {});
        await admin.users.updateMFA({ userId: user.$id, mfa: false });
      }
    }
    const membership = await admin.teams.createMembership({ teamId: STAFF_TEAMS[parsed.data.role], roles: [], userId: user.$id });
    // A "set your password" link (Appwrite's recovery email, valid 1 hour).
    await createPublicClient().account.createRecovery({ email, url: `${adminUrl()}/reset-password` });
    await writeAudit(admin, {
      actor: { id: me.id, name: me.name },
      action: 'staff.invite',
      tableId: 'teams',
      rowId: membership.$id,
      label: name,
      summary: `Invited as ${parsed.data.role}${existing ? ' (existing account: password, sessions and authenticator reset)' : ''}`,
    });
  } catch (e) {
    console.error('Invite failed:', (e as Error).message);
    return { status: 'error', message: 'Couldn’t send the invite. Check the email address and try again.' };
  }
  revalidatePath('/staff');
  return { status: 'success', message: `Invited ${name}. They’ll get an email to set a password (the link lasts one hour).` };
}

/** Re-checked after a change: the earlier count can race with another Admin's action. */
async function adminsRemain() {
  return (await listStaff()).some((s) => s.role === 'admin');
}

const target = z.object({ userId: z.string().regex(/^[a-zA-Z0-9._-]{1,36}$/) });

async function loadTarget(form: FormData, meId: string) {
  const parsed = target.safeParse({ userId: form.get('userId') });
  if (!parsed.success) return { error: 'Unknown staff member.' } as const;
  if (parsed.data.userId === meId) return { error: 'You can’t change your own access. Ask another Admin.' } as const;
  const staff = await listStaff();
  const person = staff.find((s) => s.userId === parsed.data.userId);
  if (!person) return { error: 'That person is no longer on the staff list.' } as const;
  const admins = staff.filter((s) => s.role === 'admin').length;
  return { person, admins } as const;
}

export async function changeRole(_prev: FormState, form: FormData): Promise<FormState> {
  const me = await requireStaff('/staff', 'admin');
  const next = role.safeParse(form.get('role'));
  if (!next.success) return { status: 'error', message: 'Choose a role.' };
  const t = await loadTarget(form, me.id);
  if ('error' in t) return { status: 'error', message: t.error };
  if (t.person.role === next.data) return { status: 'idle' };
  if (t.person.role === 'admin' && t.admins <= 1) return { status: 'error', message: 'There must always be at least one Admin.' };

  const admin = adminClient();
  const created = await admin.teams.createMembership({ teamId: STAFF_TEAMS[next.data], roles: [], userId: t.person.userId });
  for (const m of t.person.memberships) await admin.teams.deleteMembership({ teamId: m.teamId, membershipId: m.membershipId });
  if (!(await adminsRemain())) {
    // Two Admins demoted each other at once: put this one back.
    await admin.teams.createMembership({ teamId: STAFF_TEAMS.admin, roles: [], userId: t.person.userId });
    await admin.teams.deleteMembership({ teamId: STAFF_TEAMS[next.data], membershipId: created.$id });
    return { status: 'error', message: 'There must always be at least one Admin.' };
  }
  // New permissions apply from their next sign-in.
  await admin.users.deleteSessions({ userId: t.person.userId });
  await writeAudit(admin, {
    actor: { id: me.id, name: me.name },
    action: 'staff.role',
    tableId: 'teams',
    rowId: created.$id,
    label: t.person.name,
    summary: `${t.person.role} → ${next.data}`,
  });
  revalidatePath('/staff');
  return { status: 'success', message: `${t.person.name} is now ${next.data === 'admin' ? 'an Admin' : 'an Editor'}. They’ve been signed out.` };
}

export async function removeStaff(_prev: FormState, form: FormData): Promise<FormState> {
  const me = await requireStaff('/staff', 'admin');
  const t = await loadTarget(form, me.id);
  if ('error' in t) return { status: 'error', message: t.error };
  if (t.person.role === 'admin' && t.admins <= 1) return { status: 'error', message: 'There must always be at least one Admin.' };

  const admin = adminClient();
  for (const m of t.person.memberships) await admin.teams.deleteMembership({ teamId: m.teamId, membershipId: m.membershipId });
  if (!(await adminsRemain())) {
    // Two Admins removed each other at once: restore this one's access.
    for (const m of t.person.memberships) await admin.teams.createMembership({ teamId: STAFF_TEAMS[m.teamId], roles: [], userId: t.person.userId });
    return { status: 'error', message: 'There must always be at least one Admin.' };
  }
  await admin.users.deleteSessions({ userId: t.person.userId });
  await writeAudit(admin, {
    actor: { id: me.id, name: me.name },
    action: 'staff.remove',
    tableId: 'teams',
    rowId: t.person.userId,
    label: t.person.name,
    summary: `Removed (was ${t.person.role}); signed out everywhere`,
  });
  revalidatePath('/staff');
  // The row disappears, so the confirmation is shown at page level (no name in the URL).
  redirect('/staff?notice=removed');
}
