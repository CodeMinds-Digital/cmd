import 'server-only';
import type { TablesDB } from 'node-appwrite';
import type { ContentDraftRow } from '@codeminds/cms/schema';
import { Query } from '@codeminds/cms/server';

/**
 * Working copies in `contentDraft` (one per item: unique tableId + rowId).
 * Editors and Admins write here; only publishing touches live tables.
 */
export { draftRowId } from '@codeminds/cms/content/drafts';
import { draftRowId } from '@codeminds/cms/content/drafts';

export async function getDraft(db: TablesDB, databaseId: string, tableId: string, rowId: string) {
  return db.getRow<ContentDraftRow>({ databaseId, tableId: 'contentDraft', rowId: draftRowId(tableId, rowId) }).catch(() => null);
}

export async function listDrafts(db: TablesDB, databaseId: string, tableId: string) {
  return (await db.listRows<ContentDraftRow>({ databaseId, tableId: 'contentDraft', queries: [Query.equal('tableId', tableId), Query.limit(100)] })).rows;
}

export class DraftConflict extends Error {}

/**
 * Create or update a draft. `expectedUpdatedAt` is the version the editor
 * loaded; if someone saved since, refuse rather than silently overwrite.
 */
export async function saveDraft(
  db: TablesDB,
  databaseId: string,
  d: { tableId: string; rowId: string; title: string; data: unknown; actorId: string; expectedUpdatedAt: string | null },
) {
  const id = draftRowId(d.tableId, d.rowId);
  const existing = await db.getRow<ContentDraftRow>({ databaseId, tableId: 'contentDraft', rowId: id }).catch(() => null);
  if (existing && d.expectedUpdatedAt !== existing.$updatedAt) throw new DraftConflict('Someone else saved this draft after you opened it.');
  const fields = { title: d.title.slice(0, 200) || 'Untitled', data: JSON.stringify(d.data), updatedBy: d.actorId, status: 'draft' as const };
  return existing
    ? db.updateRow<ContentDraftRow>({ databaseId, tableId: 'contentDraft', rowId: id, data: fields })
    : db.createRow<ContentDraftRow>({ databaseId, tableId: 'contentDraft', rowId: id, data: { ...fields, tableId: d.tableId, rowId: d.rowId, createdBy: d.actorId, submittedBy: null, submittedAt: null } });
}
