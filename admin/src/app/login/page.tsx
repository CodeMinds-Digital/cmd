import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import AuthCard from '@/components/AuthCard';
import { getSessionState } from '@/lib/auth';
import LoginForm from './LoginForm';

export const metadata: Metadata = { title: 'Sign in' };

const NOTICES: Record<string, string> = {
  reset: 'Password set. Sign in with your new password.',
  signed_out: 'You’re signed out.',
};

export default async function LoginPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const q = await searchParams;
  const state = await getSessionState();
  if (state.kind === 'user') redirect('/');
  if (state.kind === 'mfa') redirect('/login/mfa');
  return (
    <AuthCard title="Sign in">
      <LoginForm next={q.next ?? '/'} notice={q.notice ? NOTICES[q.notice] : undefined} />
    </AuthCard>
  );
}
