'use client';

import { useActionState } from 'react';
import { Field, FormMessage, SubmitButton, type FormState } from '@/components/form';
import { setPassword } from './actions';

export default function ResetForm({ userId, secret, minLength }: { userId: string; secret: string; minLength: number }) {
  const [state, action] = useActionState(setPassword, { status: 'idle' } as FormState);
  return (
    <form action={action} className="flex flex-col gap-4">
      <input type="hidden" name="userId" value={userId} />
      <input type="hidden" name="secret" value={secret} />
      <Field label="New password" name="password" type="password" autoComplete="new-password" minLength={minLength} maxLength={256} hint={`At least ${minLength} characters. A passphrase works well.`} />
      <Field label="Repeat password" name="confirm" type="password" autoComplete="new-password" minLength={minLength} maxLength={256} />
      <FormMessage state={state} />
      <SubmitButton>Set password</SubmitButton>
    </form>
  );
}
