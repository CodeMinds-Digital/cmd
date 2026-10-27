'use client';

import { useActionState } from 'react';
import { FormMessage, SubmitButton, type FormState } from '@/components/form';
import { input } from '@/components/editor';
import { updateEnquiry } from '../actions';

export default function EnquiryForm({
  id,
  status,
  notes,
  assignedTo,
  statuses,
  staff,
}: {
  id: string;
  status: string;
  notes: string;
  assignedTo: string;
  statuses: [string, string][];
  staff: { userId: string; name: string }[];
}) {
  const [state, action] = useActionState(updateEnquiry.bind(null, id), { status: 'idle' } as FormState);
  return (
    <form action={action} className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="status" className="text-sm font-medium">
            Status
          </label>
          <select id="status" name="status" defaultValue={status} className={input}>
            {statuses.map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="assignedTo" className="text-sm font-medium">
            Assigned to
          </label>
          <select id="assignedTo" name="assignedTo" defaultValue={assignedTo} className={input}>
            <option value="">Nobody</option>
            {staff.map((s) => (
              <option key={s.userId} value={s.userId}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="notes" className="text-sm font-medium">
          Internal notes
        </label>
        <textarea id="notes" name="notes" defaultValue={notes} maxLength={4000} rows={5} className="w-full rounded-lg border border-line-strong bg-surface px-3 py-2" />
      </div>
      <FormMessage state={state} />
      <SubmitButton>Save</SubmitButton>
    </form>
  );
}
