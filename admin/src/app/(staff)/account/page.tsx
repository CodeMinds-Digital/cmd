import type { Metadata } from 'next';
import { requireStaff } from '@/lib/auth';
import { MIN_PASSWORD } from '@/lib/password';
import MfaSetup from './MfaSetup';
import PasswordForm from './PasswordForm';

export const metadata: Metadata = { title: 'Account' };

export default async function AccountPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const me = await requireStaff('/account');
  const { enrol } = await searchParams;
  const mustEnrol = me.role === 'admin' && !me.mfa;
  return (
    <>
      <h1 className="mb-8 font-display text-3xl font-bold">Account</h1>
      {mustEnrol && enrol && (
        <p role="alert" className="mb-6 rounded-lg border border-accent bg-surface px-4 py-3 text-sm">
          Admins must turn on two-factor authentication before using the admin.
        </p>
      )}
      <div className="grid gap-6 lg:grid-cols-2">
        <section aria-labelledby="profile-heading" className="rounded-2xl border border-line bg-surface p-6">
          <h2 id="profile-heading" className="mb-4 font-display text-xl font-bold">Profile</h2>
          <dl className="grid grid-cols-[8rem_1fr] gap-y-2 text-sm">
            <dt className="text-fg-muted">Name</dt>
            <dd>{me.name}</dd>
            <dt className="text-fg-muted">Email</dt>
            <dd>{me.email}</dd>
            <dt className="text-fg-muted">Role</dt>
            <dd>{me.role === 'admin' ? 'Admin' : 'Editor'}</dd>
            <dt className="text-fg-muted">Two-factor</dt>
            <dd>{me.mfa ? 'On' : 'Off'}</dd>
          </dl>
        </section>
        <section aria-labelledby="mfa-heading" className="rounded-2xl border border-line bg-surface p-6">
          <h2 id="mfa-heading" className="mb-4 font-display text-xl font-bold">Two-factor authentication</h2>
          {me.mfa ? <p className="text-sm text-fg-muted">On. You’ll be asked for a code from your authenticator app when you sign in.</p> : <MfaSetup />}
        </section>
        <section aria-labelledby="password-heading" className="rounded-2xl border border-line bg-surface p-6">
          <h2 id="password-heading" className="mb-4 font-display text-xl font-bold">Password</h2>
          <PasswordForm minLength={MIN_PASSWORD} />
        </section>
      </div>
    </>
  );
}
