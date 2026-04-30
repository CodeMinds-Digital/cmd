import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import LoginForm from './login-form';
import { getCurrentUser } from '@/lib/appwrite/session';

export const metadata: Metadata = {
  title: 'Sign in — Admin · Codeminds Digital',
  robots: 'noindex, nofollow',
};

export default async function LoginPage() {
  // If already signed in, jump straight to the dashboard.
  const user = await getCurrentUser();
  if (user) redirect('/admin');

  return (
    <main className="min-h-dvh bg-ink-900 text-paper-100 flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        <Link
          href="/"
          className="font-mono text-mono-sm text-paper-400 hover:text-paper-200 transition-colors mb-12 inline-block"
        >
          ← Codeminds Digital
        </Link>

        <h1 className="text-h2 font-bold text-paper-50 mb-2">
          Sign in to{' '}
          <span className="font-serif italic font-normal text-brand-400">
            admin.
          </span>
        </h1>
        <p className="text-body text-paper-300 mb-12">
          Use your studio credentials. Need access? Ask the founder.
        </p>

        <LoginForm />

        <p className="font-mono text-mono-sm text-paper-400 mt-16">
          Codeminds Digital · Admin · v2026.1
        </p>
      </div>
    </main>
  );
}
