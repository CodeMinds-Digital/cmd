import 'server-only';
import type { TablesDB } from 'node-appwrite';
import type { LeadRow } from '@codeminds/cms/schema';
import { Query } from '@codeminds/cms/server';

/** Inbox statuses (lead.status). */
export const ENQUIRY_STATUSES = ['new', 'replied', 'won', 'lost', 'spam'] as const;
export type EnquiryStatus = (typeof ENQUIRY_STATUSES)[number];
export const STATUS_LABEL: Record<EnquiryStatus, string> = { new: 'New', replied: 'Replied', won: 'Won', lost: 'Lost', spam: 'Spam' };
export const isStatus = (s: string | undefined): s is EnquiryStatus => !!s && (ENQUIRY_STATUSES as readonly string[]).includes(s);

/** Full message: messageBody (≤ 5,000) when present, else the legacy 4,000-char column. */
export const messageOf = (r: LeadRow) => r.messageBody ?? r.message;

const PAGE = 50;

/** Newest first; read as the signed-in Admin (lead is readable by team:admin only). */
export async function listEnquiries(db: TablesDB, databaseId: string, opts: { status?: EnquiryStatus; after?: string }) {
  const queries = [Query.orderDesc('$createdAt'), Query.limit(PAGE)];
  if (opts.status) queries.push(Query.equal('status', opts.status));
  if (opts.after && /^[a-zA-Z0-9._-]{1,36}$/.test(opts.after)) queries.push(Query.cursorAfter(opts.after));
  const { rows, total } = await db.listRows<LeadRow>({ databaseId, tableId: 'lead', queries });
  return { rows, total, more: rows.length === PAGE };
}

export async function countByStatus(db: TablesDB, databaseId: string) {
  const counts = await Promise.all(
    ENQUIRY_STATUSES.map((s) => db.listRows({ databaseId, tableId: 'lead', queries: [Query.equal('status', s), Query.limit(1)] }).then((r) => [s, r.total] as const)),
  );
  return Object.fromEntries(counts) as Record<EnquiryStatus, number>;
}
