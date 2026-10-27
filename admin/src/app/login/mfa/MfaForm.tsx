'use client';

import { useActionState, useState } from 'react';
import { Field, FormMessage, SubmitButton, type FormState } from '@/components/form';
import { verifyMfa } from '../actions';

export default function MfaForm({ next }: { next: string }) {
  const [state, action] = useActionState(verifyMfa, { status: 'idle' } as FormState);
  const [mode, setMode] = useState<'totp' | 'recovery'>('totp');
  return (
    <form action={action} className="flex flex-col gap-4">
      <input type="hidden" name="next" value={next} />
      <input type="hidden" name="mode" value={mode} />
      {mode === 'totp' ? (
        <Field
          key="totp"
          label="6-digit code from your authenticator app"
          name="code"
          autoComplete="one-time-code"
          inputMode="numeric"
          pattern="[0-9]{6}"
          maxLength={6}
        />
      ) : (
        <Field key="recovery" label="Recovery code" name="code" autoComplete="one-time-code" maxLength={12} hint="Each recovery code works once." />
      )}
      <FormMessage state={state} />
      <SubmitButton>Verify</SubmitButton>
      <button
        type="button"
        onClick={() => setMode(mode === 'totp' ? 'recovery' : 'totp')}
        className="self-start text-sm text-accent-ink underline underline-offset-4"
      >
        {mode === 'totp' ? 'Use a recovery code instead' : 'Use my authenticator app'}
      </button>
    </form>
  );
}
