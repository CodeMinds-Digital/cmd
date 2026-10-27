import { NextResponse } from 'next/server';
import { writeAudit } from '@codeminds/cms/audit';
import { gate } from '@codeminds/cms/roles';
import type { LeadRow } from '@codeminds/cms/schema';
import { adminClient, Query } from '@codeminds/cms/server';
import { getSessionState } from '@/lib/auth';
import { csvCell } from '@/lib/csv';
import { messageOf } from '@/lib/enquiries';
import { asUser } from '@/lib/session';

/**
 * CSV of every enquiry (Admin only, read as the Admin's session); cells are
 * escaped against CSV/formula injection (lib/csv.ts). Each export is audited.
 */
const COLUMNS: [string, (r: LeadRow) => string][] = [
  ['received', (r) => r.$createdAt],
  ['status', (r) => r.status],
  ['name', (r) => r.name],
  ['email', (r) => r.email],
  ['building', (r) => r.project ?? ''],
  ['budget', (r) => r.budget ?? ''],
  ['timeline', (r) => r.timeline ?? ''],
  ['message', (r) => messageOf(r)],
  ['notes', (r) => r.notes ?? ''],
  ['source', (r) => r.source],
];

export async function GET() {
  const state = await getSessionState();
  if (state.kind !== 'user' || state.role !== 'admin' || gate({ role: state.role, mfa: state.user.mfa, path: '/enquiries' })) {
    return NextResponse.json({ error: 'Admins only.' }, { status: 403 });
  }
  const { tablesDB, databaseId } = await asUser();
  const all: LeadRow[] = [];
  let cursor: string | undefined;
  for (;;) {
    const { rows } = await tablesDB.listRows<LeadRow>({ databaseId, tableId: 'lead', queries: [Query.orderDesc('$createdAt'), Query.limit(100), ...(cursor ? [Query.cursorAfter(cursor)] : [])] });
    all.push(...rows);
    if (rows.length < 100) break;
    cursor = rows.at(-1)!.$id;
  }
  const csv = [COLUMNS.map(([h]) => h).join(','), ...all.map((r) => COLUMNS.map(([, get]) => csvCell(get(r))).join(','))].join('\r\n');
  await writeAudit(adminClient(), { actor: { id: state.user.id, name: state.user.name }, action: 'enquiry.export', tableId: 'lead', rowId: 'all', summary: `${all.length} enquiries exported` });
  return new NextResponse(`﻿${csv}\r\n`, {
    headers: {
      'content-type': 'text/csv; charset=utf-8',
      'content-disposition': `attachment; filename="enquiries-${new Date().toISOString().slice(0, 10)}.csv"`,
      'cache-control': 'no-store',
    },
  });
}
