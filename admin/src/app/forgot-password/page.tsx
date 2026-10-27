'use client';

import { useActionState } from 'react';
import Link from 'next/link';
import AuthCard from '@/components/AuthCard';
import { Field, FormMessage, SubmitButton, type FormState } from '@/components/form';
import { requestReset } from './actions';

export default function ForgotPasswordPage() {
  const [state, action] = useActionState(requestReset, { status: 'idle' } as FormState);
  return (
    <AuthCard title="Reset your password">
      <form action={action} className="flex flex-col gap-4">
        <Field label="Email" name="email" type="email" autoComplete="username" inputMode="email" maxLength={320} />
        <FormMessage state={state} />
        <SubmitButton>Email me a link</SubmitButton>
        <Link href="/login" className="text-sm text-accent-ink underline underline-offset-4">
          Back to sign in
        </Link>
      </form>
    </AuthCard>
  );
}
