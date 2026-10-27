'use client';

import { useActionState } from 'react';
import { Field, FormMessage, SubmitButton, type FormState } from '@/components/form';
import { inviteStaff } from './actions';

export default function InviteForm() {
  const [state, action] = useActionState(inviteStaff, { status: 'idle' } as FormState);
  return (
    <form action={action} className="grid gap-4 sm:grid-cols-[1fr_1fr_10rem_auto] sm:items-end">
      <Field label="Name" name="name" autoComplete="off" maxLength={128} />
      <Field label="Email" name="email" type="email" autoComplete="off" inputMode="email" maxLength={320} />
      <div className="flex flex-col gap-1.5">
        <label htmlFor="invite-role" className="text-sm font-medium">
          Role
        </label>
        <select id="invite-role" name="role" defaultValue="editor" className="min-h-11 rounded-lg border border-line-strong bg-surface px-3">
          <option value="editor">Editor</option>
          <option value="admin">Admin</option>
        </select>
      </div>
      <SubmitButton>Invite</SubmitButton>
      <div className="sm:col-span-4">
        <FormMessage state={state} />
      </div>
    </form>
  );
}
