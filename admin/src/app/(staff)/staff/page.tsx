import type { Metadata } from 'next';
import { requireStaff } from '@/lib/auth';
import { listStaff } from '@/lib/staff';
import InviteForm from './InviteForm';
import StaffRow from './StaffRow';

export const metadata: Metadata = { title: 'Staff' };

export default async function StaffPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const me = await requireStaff('/staff', 'admin');
  const { notice } = await searchParams;
  const staff = await listStaff();
  return (
    <>
      <h1 className="mb-2 font-display text-3xl font-bold">Staff</h1>
      {notice === 'removed' && (
        <p role="status" className="mb-6 rounded-lg bg-surface-sunk px-4 py-3 text-sm">
          Removed. They no longer have access and have been signed out everywhere.
        </p>
      )}
      <p className="mb-8 text-fg-muted">Editors write and submit content; Admins also publish, manage staff and read the audit log. Admins must use two-factor authentication.</p>
      <section aria-labelledby="invite" className="mb-10 rounded-2xl border border-line bg-surface p-6">
        <h2 id="invite" className="mb-4 font-display text-xl font-bold">Invite someone</h2>
        <InviteForm />
      </section>
      <div className="relative overflow-x-auto rounded-2xl border border-line bg-surface p-6">
        <table className="w-full min-w-[40rem] text-left">
          <caption className="sr-only">Staff members</caption>
          <thead className="text-sm text-fg-muted">
            <tr>
              <th scope="col" className="pb-2 font-normal">Person</th>
              <th scope="col" className="pb-2 font-normal">Role</th>
              <th scope="col" className="pb-2 font-normal">Two-factor</th>
              <th scope="col" className="pb-2 font-normal">Last seen</th>
              <th scope="col" className="pb-2 font-normal"><span className="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody>
            {staff.map((s) => (
              <StaffRow key={s.userId} userId={s.userId} name={s.name} email={s.email} role={s.role} mfa={s.mfa} lastSeen={s.lastSeen} isMe={s.userId === me.id} />
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
