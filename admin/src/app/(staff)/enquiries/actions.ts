'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { writeAudit } from '@codeminds/cms/audit';
import type { LeadRow } from '@codeminds/cms/schema';
import { adminClient } from '@codeminds/cms/server';
import type { FormState } from '@/components/form';
import { requireStaff } from '@/lib/auth';
import { ENQUIRY_STATUSES } from '@/lib/enquiries';
import { asUser } from '@/lib/session';
import { listStaff } from '@/lib/staff';
import { ROW_ID } from '@/lib/validation';

/**
 * Inbox actions (Admin only, as the Admin's session — Appwrite also limits
 * the table to team:admin). Audit entries name the enquiry by ID only: no
 * personal data goes into the audit log.
 */
const update = z.object({
  status: z.enum(ENQUIRY_STATUSES),
  notes: z.string().max(4000),
  assignedTo: z.union([z.literal(''), z.string().regex(ROW_ID)]),
});

export async function updateEnquiry(id: string, _prev: FormState, form: FormData): Promise<FormState> {
  const me = await requireStaff(`/enquiries/${id}`, 'admin');
  if (!ROW_ID.test(id)) return { status: 'error', message: 'Unknown enquiry.' };
  const parsed = update.safeParse({ status: form.get('status'), notes: form.get('notes') ?? '', assignedTo: form.get('assignedTo') ?? '' });
  if (!parsed.success) return { status: 'error', message: 'Check the status, notes (≤ 4,000 characters) and assignee.' };
  if (parsed.data.assignedTo && !(await listStaff()).some((s) => s.userId === parsed.data.assignedTo)) return { status: 'error', message: 'Assign it to someone on the staff list.' };

  const { tablesDB, databaseId } = await asUser();
  const before = await tablesDB.getRow<LeadRow>({ databaseId, tableId: 'lead', rowId: id });
  await tablesDB.updateRow({ databaseId, tableId: 'lead', rowId: id, data: { status: parsed.data.status, notes: parsed.data.notes || null, assignedTo: parsed.data.assignedTo || null } });
  const changes = [
    before.status !== parsed.data.status && `status ${before.status} → ${parsed.data.status}`,
    (before.notes ?? '') !== parsed.data.notes && 'notes edited',
    (before.assignedTo ?? '') !== parsed.data.assignedTo && 'reassigned',
  ].filter(Boolean);
  if (changes.length) await writeAudit(adminClient(), { actor: { id: me.id, name: me.name }, action: 'enquiry.update', tableId: 'lead', rowId: id, summary: changes.join('; ') });
  revalidatePath('/enquiries');
  return { status: 'success', message: changes.length ? 'Saved.' : 'Nothing changed.' };
}

/** Permanent deletion (e.g. a data-removal request). */
export async function deleteEnquiry(id: string) {
  const me = await requireStaff(`/enquiries/${id}`, 'admin');
  if (!ROW_ID.test(id)) redirect('/enquiries');
  const { tablesDB, databaseId } = await asUser();
  await tablesDB.deleteRow({ databaseId, tableId: 'lead', rowId: id });
  await writeAudit(adminClient(), { actor: { id: me.id, name: me.name }, action: 'enquiry.delete', tableId: 'lead', rowId: id, summary: 'Deleted by an Admin' });
  revalidatePath('/enquiries');
  redirect('/enquiries?notice=deleted');
}
