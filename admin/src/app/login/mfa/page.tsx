import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import AuthCard from '@/components/AuthCard';
import { getSessionState } from '@/lib/auth';
import MfaForm from './MfaForm';

export const metadata: Metadata = { title: 'Two-factor check' };

export default async function MfaPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const state = await getSessionState();
  if (state.kind === 'none') redirect('/login');
  if (state.kind === 'user') redirect('/');
  const { next } = await searchParams;
  return (
    <AuthCard title="Two-factor check">
      <MfaForm next={next ?? '/'} />
    </AuthCard>
  );
}
