import 'server-only';
import { databases, ID, Permission, Role, Query } from '@/lib/appwrite/server';
import { APPWRITE_DATABASE_ID } from '@/lib/appwrite/env';
import type { AppwriteUser } from '@/lib/appwrite/session';

export type AuditAction =
  | 'create'
  | 'update'
  | 'delete'
  | 'publish'
  | 'unpublish'
  | 'review'
  | 'schedule'
  | 'archive';

export type AuditEntry = {
  $id: string;
  $createdAt: string;
  actor: string;
  actorId: string;
  action: AuditAction;
  collectionId: string;
  documentId: string;
  documentLabel: string;
  diffSummary: string;
};

/**
 * Record an audit entry. Best-effort: a failure logging never blocks
 * the underlying mutation. Reads are scoped to team:editor (see schema
 * permissions), so writers / viewers see only their own actions filtered
 * client-side.
 */
export async function logAudit(input: {
  user: Pick<AppwriteUser, '$id' | 'email' | 'name'>;
  action: AuditAction;
  collectionId: string;
  documentId: string;
  documentLabel?: string;
  diffSummary?: string;
}): Promise<void> {
  try {
    await databases.createDocument(
      APPWRITE_DATABASE_ID,
      'auditLog',
      ID.unique(),
      {
        actor: input.user.email || input.user.name || input.user.$id,
        actorId: input.user.$id,
        action: input.action,
        collectionId: input.collectionId,
        documentId: input.documentId,
        documentLabel: (input.documentLabel ?? '').slice(0, 200),
        diffSummary: (input.diffSummary ?? '').slice(0, 1000),
      },
      [
        Permission.read(Role.team('editor')),
        Permission.read(Role.team('admin')),
        Permission.delete(Role.team('admin')),
      ],
    );
  } catch {
    // Audit failure is never fatal.
  }
}

export async function listRecentAudit(limit = 50): Promise<AuditEntry[]> {
  try {
    const res = await databases.listDocuments(
      APPWRITE_DATABASE_ID,
      'auditLog',
      [Query.orderDesc('$createdAt'), Query.limit(limit)],
    );
    return res.documents.map((d) => ({
      $id: d.$id,
      $createdAt: d.$createdAt,
      actor: String(d.actor ?? ''),
      actorId: String(d.actorId ?? ''),
      action: (String(d.action) as AuditAction) ?? 'update',
      collectionId: String(d.collectionId ?? ''),
      documentId: String(d.documentId ?? ''),
      documentLabel: String(d.documentLabel ?? ''),
      diffSummary: String(d.diffSummary ?? ''),
    }));
  } catch {
    return [];
  }
}
