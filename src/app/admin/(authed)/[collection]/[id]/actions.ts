'use server';

import { revalidateTag } from 'next/cache';
import { redirect } from 'next/navigation';
import { databases, ID, Permission, Role } from '@/lib/appwrite/server';
import { APPWRITE_DATABASE_ID } from '@/lib/appwrite/env';
import { getCollection } from '@/lib/admin/collections';
import { requireUser } from '@/lib/appwrite/session';
import { logAudit, type AuditAction } from '@/lib/cms/audit';
import { notifyPublish } from '@/lib/cms/notify';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://codeminds.digital';

/**
 * Tag conventions — must match `next: { tags: [...] }` on every cached
 * read in /lib/cms/*. Surgical invalidation: editing a single case study
 * only revalidates that case + the index, not the whole site.
 */
function tagsForWrite(
  collectionId: string,
  doc: { $id: string; slug?: string } | { slug?: string },
): string[] {
  const tags: string[] = [collectionId];
  if (collectionId === 'siteSettings') tags.push('site-settings');
  if (collectionId === 'navItem') tags.push('nav-items');
  if ('slug' in doc && typeof doc.slug === 'string') {
    tags.push(`${collectionId}:${doc.slug}`);
  }
  if ('$id' in doc && typeof doc.$id === 'string') {
    tags.push(`${collectionId}:${doc.$id}`);
  }
  return tags;
}

export type SaveResult = { ok: true; id: string } | { ok: false; error: string };

/**
 * Coerce form data into typed values per the field config. Keeps the
 * client as a simple HTML form — type coercion happens once, here.
 */
function coerce(form: FormData, collectionId: string): Record<string, unknown> {
  const cfg = getCollection(collectionId);
  if (!cfg) throw new Error(`Unknown collection: ${collectionId}`);

  const out: Record<string, unknown> = {};
  for (const f of cfg.fields) {
    const raw = form.get(f.key);
    if (raw === null || raw === undefined) continue;
    const str = String(raw).trim();

    if (str === '' && !f.required) continue;
    if (str === '' && f.required) {
      throw new Error(`${f.label} is required`);
    }

    switch (f.type) {
      case 'integer':
        out[f.key] = Number(str);
        if (Number.isNaN(out[f.key])) throw new Error(`${f.label} must be a number`);
        break;
      case 'boolean':
        out[f.key] = str === 'true' || str === 'on' || str === '1';
        break;
      default:
        out[f.key] = str;
    }
  }
  return out;
}

export async function saveDocument(
  collectionId: string,
  documentId: string | null,
  formData: FormData,
): Promise<SaveResult> {
  const user = await requireUser();

  try {
    const data = coerce(formData, collectionId);
    const cfg = getCollection(collectionId);
    if (!cfg) return { ok: false, error: `Unknown collection: ${collectionId}` };

    // Singleton edge case: docId is fixed to the collection id ("siteSettings")
    const isSingleton = !!cfg.singleton;
    const fixedId = isSingleton ? collectionId : null;

    let result;
    if (documentId === '_new' || documentId === '_singleton') {
      // Create. For singletons, retry as update if it already exists.
      try {
        result = await databases.createDocument(
          APPWRITE_DATABASE_ID,
          collectionId,
          fixedId ?? ID.unique(),
          data,
          [
            Permission.read(Role.any()),
            Permission.update(Role.team('editor')),
            Permission.update(Role.team('admin')),
            Permission.delete(Role.team('admin')),
          ],
        );
      } catch (e: unknown) {
        if (
          isSingleton &&
          e &&
          typeof e === 'object' &&
          'code' in e &&
          (e as { code: number }).code === 409
        ) {
          // Singleton already exists — switch to update
          result = await databases.updateDocument(
            APPWRITE_DATABASE_ID,
            collectionId,
            collectionId,
            data,
          );
        } else {
          throw e;
        }
      }
    } else {
      result = await databases.updateDocument(
        APPWRITE_DATABASE_ID,
        collectionId,
        documentId!,
        data,
      );
    }

    // Surgical cache invalidation. Only the tags this write touches.
    for (const tag of tagsForWrite(collectionId, {
      $id: result.$id,
      slug: typeof data.slug === 'string' ? data.slug : undefined,
    })) {
      revalidateTag(tag, 'max');
    }

    // Audit — best-effort, never blocks.
    const wasCreate = documentId === '_new' || documentId === '_singleton';
    await logAudit({
      user,
      action: wasCreate ? 'create' : 'update',
      collectionId,
      documentId: result.$id,
      documentLabel: documentLabelFor(cfg, data),
    });

    return { ok: true, id: result.$id };
  } catch (e: unknown) {
    const msg =
      e && typeof e === 'object' && 'message' in e
        ? String((e as { message: string }).message)
        : 'Save failed.';
    return { ok: false, error: msg };
  }
}

export async function deleteDocument(
  collectionId: string,
  documentId: string,
): Promise<void> {
  const user = await requireUser();

  let label = '';
  try {
    const doc = await databases.getDocument(APPWRITE_DATABASE_ID, collectionId, documentId);
    const cfg = getCollection(collectionId);
    label = documentLabelFor(cfg, doc as Record<string, unknown>);
  } catch {
    /* document already gone — fine */
  }

  await databases.deleteDocument(APPWRITE_DATABASE_ID, collectionId, documentId);
  for (const tag of tagsForWrite(collectionId, { $id: documentId })) {
    revalidateTag(tag, 'max');
  }

  await logAudit({
    user,
    action: 'delete',
    collectionId,
    documentId,
    documentLabel: label,
  });

  redirect(`/admin/${collectionId}`);
}

// ── Workflow transitions ──────────────────────────────────────────────

type TransitionAction = Extract<
  AuditAction,
  'publish' | 'unpublish' | 'review' | 'schedule' | 'archive'
>;

export type TransitionResult =
  | { ok: true; status: string }
  | { ok: false; error: string };

/**
 * Move a document through its workflow state machine. Each transition
 * stamps the appropriate `*By` / `*At` fields, revalidates tags,
 * audits, and (for publish) Slack-notifies.
 *
 * Allowed transitions are intentionally permissive — the UI hides
 * inapplicable buttons but the server doesn't strictly enforce a graph,
 * so an admin can recover from any state.
 */
export async function transitionStatus(
  collectionId: string,
  documentId: string,
  action: TransitionAction,
  scheduledFor?: string,
): Promise<TransitionResult> {
  const user = await requireUser();
  const cfg = getCollection(collectionId);
  if (!cfg) return { ok: false, error: `Unknown collection: ${collectionId}` };

  const nowIso = new Date().toISOString();

  const updates: Record<string, unknown> = {};
  switch (action) {
    case 'publish':
      updates.status = 'published';
      updates.publishedBy = user.$id;
      updates.publishedAt = nowIso;
      break;
    case 'unpublish':
      updates.status = 'draft';
      break;
    case 'review':
      updates.status = 'review';
      updates.reviewedBy = user.$id;
      updates.reviewedAt = nowIso;
      break;
    case 'schedule':
      if (!scheduledFor) return { ok: false, error: 'Schedule date is required.' };
      updates.status = 'scheduled';
      updates.scheduledFor = new Date(scheduledFor).toISOString();
      break;
    case 'archive':
      updates.status = 'archived';
      break;
  }

  let updated;
  try {
    updated = await databases.updateDocument(
      APPWRITE_DATABASE_ID,
      collectionId,
      documentId,
      updates,
    );
  } catch (e: unknown) {
    const msg =
      e && typeof e === 'object' && 'message' in e
        ? String((e as { message: string }).message)
        : 'Transition failed.';
    return { ok: false, error: msg };
  }

  for (const tag of tagsForWrite(collectionId, {
    $id: documentId,
    slug: typeof updated.slug === 'string' ? updated.slug : undefined,
  })) {
    revalidateTag(tag, 'max');
  }

  await logAudit({
    user,
    action,
    collectionId,
    documentId,
    documentLabel: documentLabelFor(cfg, updated as Record<string, unknown>),
  });

  if (action === 'publish') {
    const slug = typeof updated.slug === 'string' ? updated.slug : undefined;
    let url: string | undefined;
    if (collectionId === 'caseStudy' && slug) url = `${SITE_URL}/work/${slug}`;
    else if (collectionId === 'journalPost' && slug) url = `${SITE_URL}/journal/${slug}`;
    await notifyPublish({
      title: typeof updated.title === 'string' ? updated.title : (slug ?? documentId),
      collectionId,
      slug,
      actor: user.email,
      url,
    });
  }

  return { ok: true, status: String(updates.status) };
}

// ── helpers ───────────────────────────────────────────────────────────

function documentLabelFor(
  cfg: ReturnType<typeof getCollection> | undefined,
  doc: Record<string, unknown>,
): string {
  if (!cfg) return '';
  const titleField = cfg.titleField ?? 'label';
  const candidate = doc[titleField] ?? doc.title ?? doc.label ?? doc.slug;
  return typeof candidate === 'string' ? candidate.slice(0, 200) : '';
}
