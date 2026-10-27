'use client';

import { useActionState } from 'react';
import { FormMessage, SubmitButton, type FormState } from '@/components/form';
import type { StaffRole } from '@codeminds/cms/roles';
import { changeRole, removeStaff } from './actions';

type Props = { userId: string; name: string; email: string; role: StaffRole; mfa: boolean; lastSeen: string; isMe: boolean };

const fmt = (iso: string) => (iso ? new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—');

export default function StaffRow(p: Props) {
  const [roleState, roleAction] = useActionState(changeRole, { status: 'idle' } as FormState);
  const [removeState, removeAction] = useActionState(removeStaff, { status: 'idle' } as FormState);
  return (
    <tr className="border-t border-line align-top">
      <td className="py-3 pr-4">
        <p className="font-medium">
          {p.name} {p.isMe && <span className="text-sm font-normal text-fg-muted">(you)</span>}
        </p>
        <p className="text-sm text-fg-muted">{p.email}</p>
      </td>
      <td className="py-3 pr-4">
        {p.isMe ? (
          <span>{p.role === 'admin' ? 'Admin' : 'Editor'}</span>
        ) : (
          <form action={roleAction} className="flex items-center gap-2">
            <input type="hidden" name="userId" value={p.userId} />
            <label className="sr-only" htmlFor={`role-${p.userId}`}>
              Role for {p.name}
            </label>
            <select id={`role-${p.userId}`} name="role" defaultValue={p.role} className="min-h-11 rounded-lg border border-line-strong bg-surface px-2">
              <option value="editor">Editor</option>
              <option value="admin">Admin</option>
            </select>
            <SubmitButton tone="quiet">Save</SubmitButton>
          </form>
        )}
        <FormMessage state={roleState} />
      </td>
      {/* Required for Admins (shown as a problem), optional for Editors. */}
      <td className="py-3 pr-4">{p.mfa ? 'On' : p.role === 'admin' ? <span className="text-danger">Off (required)</span> : 'Off'}</td>
      <td className="py-3 pr-4 text-sm text-fg-muted">{fmt(p.lastSeen)}</td>
      <td className="py-3">
        {!p.isMe && (
          <details>
            <summary className="min-h-11 cursor-pointer content-center text-sm text-danger">Remove…</summary>
            <form action={removeAction} className="mt-2 flex flex-col gap-2">
              <input type="hidden" name="userId" value={p.userId} />
              <p className="text-sm text-fg-muted">Removes access and signs {p.name} out everywhere. Their content stays.</p>
              <SubmitButton tone="danger">Remove {p.name}</SubmitButton>
            </form>
          </details>
        )}
        <FormMessage state={removeState} />
      </td>
    </tr>
  );
}
