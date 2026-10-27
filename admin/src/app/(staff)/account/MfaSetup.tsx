'use client';

import { useActionState } from 'react';
import { Field, SubmitButton } from '@/components/form';
import { mfaStep, type MfaState } from './actions';

export default function MfaSetup() {
  const [state, action] = useActionState(mfaStep, { step: 'start' } as MfaState);

  if (state.step === 'done') {
    return (
      <div role="status" className="flex flex-col gap-3">
        <p className="font-medium">Two-factor authentication is on.</p>
        <p className="text-sm text-fg-muted">
          Save these recovery codes somewhere safe (a password manager). Each works once if you lose your phone. They won’t be shown again.
        </p>
        <ul className="grid grid-cols-2 gap-2 rounded-lg bg-surface-sunk p-4 font-mono text-sm">
          {state.codes.map((c) => (
            <li key={c}>{c}</li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <form action={action} className="flex flex-col gap-4">
      {state.step === 'start' ? (
        <p className="text-sm text-fg-muted">You’ll need an authenticator app such as 1Password, Google Authenticator or Authy.</p>
      ) : (
        <>
          <ol className="list-decimal space-y-1 pl-5 text-sm text-fg-muted">
            <li>Scan this code with your authenticator app.</li>
            <li>Enter the 6-digit code it shows.</li>
          </ol>
          {/* eslint-disable-next-line @next/next/no-img-element -- data: URL QR from Appwrite Avatars */}
          <img src={state.qr} width={240} height={240} alt="QR code for your authenticator app" className="rounded-lg border border-line" />
          <p className="text-sm text-fg-muted">
            Can’t scan? Enter this key: <code className="break-all font-mono text-fg">{state.secret}</code>
          </p>
          <Field label="6-digit code" name="otp" autoComplete="one-time-code" inputMode="numeric" pattern="[0-9]{6}" maxLength={6} />
        </>
      )}
      {state.error && (
        <p role="alert" className="rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">
          {state.error}
        </p>
      )}
      <SubmitButton>{state.step === 'start' ? 'Set up two-factor authentication' : 'Verify and turn on'}</SubmitButton>
    </form>
  );
}
