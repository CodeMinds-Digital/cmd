import type { Metadata } from 'next';
import Link from 'next/link';
import AuthCard from '@/components/AuthCard';
import { MIN_PASSWORD } from '@/lib/password';
import ResetForm from './ResetForm';

export const metadata: Metadata = { title: 'Set a password' };

const isPast = (iso: string) => new Date(iso).getTime() < Date.now();

/** Link from Appwrite's recovery email: /reset-password?userId=…&secret=…&expire=… */
export default async function ResetPasswordPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const { userId, secret, expire } = await searchParams;
  const expired = expire ? isPast(expire) : false;
  return (
    <AuthCard title="Set a password">
      {!userId || !secret || expired ? (
        <p className="text-fg-muted">
          This link is incomplete or has expired.{' '}
          <Link href="/forgot-password" className="text-accent-ink underline underline-offset-4">
            Get a new link
          </Link>
          .
        </p>
      ) : (
        <ResetForm userId={userId} secret={secret} minLength={MIN_PASSWORD} />
      )}
    </AuthCard>
  );
}
