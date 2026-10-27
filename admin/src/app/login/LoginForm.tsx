'use client';

import { useActionState } from 'react';
import Link from 'next/link';
import { Field, FormMessage, SubmitButton, type FormState } from '@/components/form';
import { signIn } from './actions';

export default function LoginForm({ next, notice }: { next: string; notice?: string }) {
  const [state, action] = useActionState(signIn, { status: notice ? 'success' : 'idle', message: notice } as FormState);
  return (
    <form action={action} className="flex flex-col gap-4">
      <input type="hidden" name="next" value={next} />
      <Field label="Email" name="email" type="email" autoComplete="username" inputMode="email" maxLength={320} />
      <Field label="Password" name="password" type="password" autoComplete="current-password" maxLength={256} />
      <FormMessage state={state} />
      <SubmitButton>Sign in</SubmitButton>
      <Link href="/forgot-password" className="text-sm text-accent-ink underline underline-offset-4">
        Forgot your password?
      </Link>
    </form>
  );
}
