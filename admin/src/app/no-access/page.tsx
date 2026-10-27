import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import AuthCard from '@/components/AuthCard';
import SignOutButton from '@/components/SignOutButton';
import { getSessionState } from '@/lib/auth';

export const metadata: Metadata = { title: 'No access' };

export default async function NoAccess({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const state = await getSessionState();
  if (state.kind === 'none') redirect('/login');
  const { needed } = await searchParams;
  const isStaff = state.kind === 'user' && state.role !== null;
  return (
    <AuthCard title={isStaff && needed === 'admin' ? 'Admins only' : 'No access'}>
      <p className="mb-5 text-fg-muted">
        {isStaff && needed === 'admin'
          ? 'This page is for Admins. Ask an Admin if you need something changed here.'
          : 'Your account isn’t on the staff list. Ask an Admin to invite you.'}
      </p>
      <div className="flex items-center gap-3">
        {isStaff && (
          <Link href="/" className="inline-flex min-h-11 items-center rounded-full bg-inverse px-5 text-sm font-medium text-inverse-fg">
            Back to dashboard
          </Link>
        )}
        <SignOutButton />
      </div>
    </AuthCard>
  );
}
