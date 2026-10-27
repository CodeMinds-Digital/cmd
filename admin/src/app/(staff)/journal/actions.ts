'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { writeAudit } from '@codeminds/cms/audit';
import { postSchema, publishPost } from '@codeminds/cms/content/post';
import { emptyDoc } from '@codeminds/cms/content/rich-text';
import { AppwriteException, ID, Query, adminClient } from '@codeminds/cms/server';
import { signPreview } from '@codeminds/cms/signing';
import { requireStaff, type Staff } from '@/lib/auth';
import { DraftConflict, draftRowId, getDraft, saveDraft } from '@/lib/drafts';
import { previewSecret, siteUrl } from '@/lib/env';
import { asUser } from '@/lib/session';
import { fieldErrors, ROW_ID } from '@/lib/validation';
import type { SaveResult } from '../projects/actions';

/**
 * Journal editor actions — same model as projects (D24): Editors write
 * drafts; publishing writes journalPost as the Admin's own session.
 */
const path = (rowId: string) => `/journal/${rowId}`;
const audit = (me: Staff, action: string, rowId: string, label: string, summary?: string) =>
  writeAudit(adminClient(), { actor: { id: me.id, name: me.name }, action, tableId: 'journalPost', rowId, label, summary });

export async function createPost() {
  const me = await requireStaff('/journal');
  const { tablesDB, databaseId } = await asUser();
  const rowId = ID.unique();
  const blank = { slug: '', title: '', excerpt: '', tags: [], cover: {}, body: emptyDoc() };
  await saveDraft(tablesDB, databaseId, { tableId: 'journalPost', rowId, title: 'Untitled post', data: blank, actorId: me.id, expectedUpdatedAt: null });
  await audit(me, 'post.create', rowId, 'Untitled post');
  redirect(path(rowId));
}

export async function savePost(rowId: string, json: string, expectedUpdatedAt: string | null): Promise<SaveResult> {
  const me = await requireStaff(path(rowId));
  if (!ROW_ID.test(rowId) || json.length > 400_000) return { ok: false, message: 'That post is too long to save.' };
  let raw: unknown;
  try {
    raw = JSON.parse(json);
  } catch {
    return { ok: false, message: 'That post couldn’t be saved.' };
  }
  const parsed = postSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, message: 'Fix the highlighted fields, then save again.', fieldErrors: fieldErrors(parsed.error.issues) };

  const { tablesDB, databaseId } = await asUser();
  const clash = await tablesDB.listRows({ databaseId, tableId: 'journalPost', queries: [Query.equal('slug', parsed.data.slug), Query.limit(1)] });
  if (clash.rows.some((r) => r.$id !== rowId)) return { ok: false, message: 'Fix the highlighted fields, then save again.', fieldErrors: { slug: 'Another post already uses this address.' } };
  try {
    // Store the validated (stripped) document, never the raw input.
    const row = await saveDraft(tablesDB, databaseId, { tableId: 'journalPost', rowId, title: parsed.data.title, data: parsed.data, actorId: me.id, expectedUpdatedAt });
    revalidatePath('/journal');
    return { ok: true, updatedAt: row.$updatedAt, message: 'Draft saved.' };
  } catch (e) {
    if (e instanceof DraftConflict) return { ok: false, message: `${e.message} Reload the page to see their changes (copy anything you need first).` };
    console.error('Save post draft failed:', (e as Error).message);
    return { ok: false, message: 'Couldn’t save right now. Your changes are still on this page; try again.' };
  }
}

export async function submitPost(rowId: string): Promise<SaveResult> {
  const me = await requireStaff(path(rowId));
  const { tablesDB, databaseId } = await asUser();
  const draft = await getDraft(tablesDB, databaseId, 'journalPost', rowId);
  if (!draft) return { ok: false, message: 'Save a draft first.' };
  const row = await tablesDB.updateRow({ databaseId, tableId: 'contentDraft', rowId: draft.$id, data: { status: 'in_review', submittedBy: me.id, submittedAt: new Date().toISOString() } });
  await audit(me, 'post.submit', rowId, draft.title);
  revalidatePath('/journal');
  return { ok: true, updatedAt: row.$updatedAt, message: 'Submitted for review. An Admin will publish it.' };
}

export async function postPreviewLink(rowId: string, slug: string): Promise<{ url: string } | { error: string }> {
  await requireStaff(path(rowId));
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) return { error: 'Save a valid address (slug) first.' };
  const p = signPreview(previewSecret(), `/journal/${slug}`);
  return { url: `${siteUrl()}/api/preview?path=${encodeURIComponent(p.path)}&expires=${p.expires}&signature=${p.signature}` };
}

export async function publishPostDraft(rowId: string, expectedUpdatedAt: string | null): Promise<SaveResult> {
  const me = await requireStaff(path(rowId), 'admin');
  const { tablesDB, databaseId } = await asUser();
  const draft = await getDraft(tablesDB, databaseId, 'journalPost', rowId);
  if (!draft) return { ok: false, message: 'There are no unpublished changes.' };
  // Publish exactly the version the Admin reviewed.
  if (draft.$updatedAt !== expectedUpdatedAt) return { ok: false, message: 'Someone saved this draft after you opened it. Reload the page and review it before publishing.' };
  const parsed = postSchema.safeParse(JSON.parse(draft.data));
  if (!parsed.success) return { ok: false, message: 'The saved draft has errors. Open it, fix them and save first.' };
  try {
    await publishPost(tablesDB, { databaseId, rowId, data: parsed.data, actorId: me.id });
  } catch (e) {
    if (e instanceof AppwriteException && e.code === 401) return { ok: false, message: 'Appwrite refused: only Admins can publish.' };
    console.error('Publish post failed:', (e as Error).message);
    return { ok: false, message: (e as Error).message.startsWith('Another post') ? (e as Error).message : 'Publishing failed; nothing was changed. Try again.' };
  }
  await tablesDB.deleteRow({ databaseId, tableId: 'contentDraft', rowId: draft.$id });
  await audit(me, 'post.publish', rowId, parsed.data.title, `/journal/${parsed.data.slug}`);
  revalidatePath('/journal');
  redirect(`${path(rowId)}?notice=published`);
}

export async function discardPostDraft(rowId: string) {
  const me = await requireStaff(path(rowId));
  const { tablesDB, databaseId } = await asUser();
  const draft = await getDraft(tablesDB, databaseId, 'journalPost', rowId);
  if (draft) {
    await tablesDB.deleteRow({ databaseId, tableId: 'contentDraft', rowId: draftRowId('journalPost', rowId) });
    await audit(me, 'post.discard', rowId, draft.title);
  }
  const live = await tablesDB.getRow({ databaseId, tableId: 'journalPost', rowId }).catch(() => null);
  revalidatePath('/journal');
  redirect(live ? `${path(rowId)}?notice=discarded` : '/journal?notice=discarded');
}

export async function setPostVisibility(rowId: string, visible: boolean) {
  const me = await requireStaff(path(rowId), 'admin');
  const { tablesDB, databaseId } = await asUser();
  const row = await tablesDB.updateRow({ databaseId, tableId: 'journalPost', rowId, data: { state: visible ? 'published' : 'draft', updatedBy: me.id } });
  await audit(me, visible ? 'post.republish' : 'post.unpublish', rowId, String(row.title));
  revalidatePath('/journal');
  redirect(`${path(rowId)}?notice=${visible ? 'republished' : 'unpublished'}`);
}

export async function deletePost(rowId: string) {
  const me = await requireStaff(path(rowId), 'admin');
  const { tablesDB, databaseId } = await asUser();
  const live = await tablesDB.getRow({ databaseId, tableId: 'journalPost', rowId }).catch(() => null);
  const draft = await getDraft(tablesDB, databaseId, 'journalPost', rowId);
  if (live) await tablesDB.deleteRow({ databaseId, tableId: 'journalPost', rowId });
  if (draft) await tablesDB.deleteRow({ databaseId, tableId: 'contentDraft', rowId: draft.$id });
  await audit(me, 'post.delete', rowId, String(live?.title ?? draft?.title ?? 'Untitled'));
  revalidatePath('/journal');
  redirect('/journal?notice=deleted');
}
