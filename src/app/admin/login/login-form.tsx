'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { loginAction } from './actions';

export default function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await loginAction(formData);
      if (result.ok) {
        router.push('/admin');
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div>
        <label
          htmlFor="email"
          className="font-mono text-mono-sm text-paper-400 block mb-2"
        >
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          autoFocus
          className="w-full bg-transparent border-b border-ink-600 focus:border-paper-50 outline-none text-lead text-paper-50 py-2 transition-colors"
        />
      </div>

      <div>
        <label
          htmlFor="password"
          className="font-mono text-mono-sm text-paper-400 block mb-2"
        >
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          className="w-full bg-transparent border-b border-ink-600 focus:border-paper-50 outline-none text-lead text-paper-50 py-2 transition-colors"
        />
      </div>

      {error && (
        <p className="font-mono text-mono-sm text-red-400" role="alert">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="btn-primary btn-lg group disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {pending ? 'Signing in…' : 'Sign in'}
        {!pending && (
          <span aria-hidden className="ml-2 transition-transform group-hover:translate-x-1">
            →
          </span>
        )}
      </button>
    </form>
  );
}
