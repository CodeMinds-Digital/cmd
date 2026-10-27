/**
 * Append-only audit log (`auditLog`; only the server key may create rows,
 * Admins read). Every admin write calls this. Never pass personal data or
 * secrets in `summary`: it is shown to every Admin.
 *
 * Column names are the live ones (`collectionId`/`documentId` hold the
 * table ID and row ID).
 */
import { ID } from 'node-appwrite';
import type { AdminClient } from './appwrite/server.ts';

export type AuditEntry = {
  actor: { id: string; name: string };
  action: string;
  tableId: string;
  rowId: string;
  label?: string;
  summary?: string;
};

export async function writeAudit(admin: Pick<AdminClient, 'env' | 'tablesDB'>, e: AuditEntry) {
  await admin.tablesDB.createRow({
    databaseId: admin.env.databaseId,
    tableId: 'auditLog',
    rowId: ID.unique(),
    data: {
      actor: e.actor.name.slice(0, 200),
      actorId: e.actor.id,
      action: e.action.slice(0, 32),
      collectionId: e.tableId,
      documentId: e.rowId,
      documentLabel: e.label?.slice(0, 200) ?? null,
      diffSummary: e.summary?.slice(0, 1000) ?? null,
    },
  });
}
