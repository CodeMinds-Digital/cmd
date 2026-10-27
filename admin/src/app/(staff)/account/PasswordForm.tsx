'use client';

import { useActionState } from 'react';
import { Field, FormMessage, SubmitButton, type FormState } from '@/components/form';
import { changePassword } from './actions';

export default function PasswordForm({ minLength }: { minLength: number }) {
  const [state, action] = useActionState(changePassword, { status: 'idle' } as FormState);
  return (
    <form action={action} className="flex flex-col gap-4">
      <Field label="Current password" name="current" type="password" autoComplete="current-password" maxLength={256} />
      <Field label="New password" name="password" type="password" autoComplete="new-password" minLength={minLength} maxLength={256} hint={`At least ${minLength} characters.`} />
      <Field label="Repeat new password" name="confirm" type="password" autoComplete="new-password" minLength={minLength} maxLength={256} />
      <FormMessage state={state} />
      <SubmitButton tone="quiet">Change password</SubmitButton>
    </form>
  );
}
