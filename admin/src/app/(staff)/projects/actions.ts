'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { writeAudit } from '@codeminds/cms/audit';
import { projectSchema, publishProject, type ProjectData } from '@codeminds/cms/content/project';
import { AppwriteException, ID, Query, adminClient } from '@codeminds/cms/server';
import { signPreview } from '@codeminds/cms/signing';
import { requireStaff, type Staff } from '@/lib/auth';
import { DraftConflict, draftRowId, getDraft, saveDraft } from '@/lib/drafts';
import { previewSecret, siteUrl } from '@/lib/env';
import { loadProject } from '@/lib/projects';
import { asUser } from '@/lib/session';
import { fieldErrors, ROW_ID } from '@/lib/validation';

/**
 * Project editor actions. Every action re-checks the session and role, then
 * talks to Appwrite as the signed-in person: Editors can only write drafts;
 * publishing writes live tables, which Appwrite allows for Admins only.
 */
export type SaveResult =
  | { ok: true; updatedAt: string; message: string }
  | { ok: false; message: string; fieldErrors?: Record<string, string> };

const path = (rowId: string) => `/projects/${rowId}`;

function audit(me: Staff, action: string, rowId: string, label: string, summary?: string) {
  return writeAudit(adminClient(), { actor: { id: me.id, name: me.name }, action, tableId: 'caseStudy', rowId, label, summary });
}

export async function createProject() {
  const me = await requireStaff('/projects');
  const { tablesDB, databaseId } = await asUser();
  const rowId = ID.unique();
  const blank: Partial<ProjectData> = { slug: '', title: '', year: new Date().getUTCFullYear(), brief: '', tags: [], status: 'coming', cover: {}, approach: [], screens: [], metrics: [], testimonial: null };
  await saveDraft(tablesDB, databaseId, { tableId: 'caseStudy', rowId, title: 'Untitled project', data: blank, actorId: me.id, expectedUpdatedAt: null });
  await audit(me, 'project.create', rowId, 'Untitled project');
  redirect(path(rowId));
}

/** Save the working copy. Validation errors are returned per field; the draft is only saved when valid. */
export async function saveProject(rowId: string, json: string, expectedUpdatedAt: string | null): Promise<SaveResult> {
  const me = await requireStaff(path(rowId));
  if (!ROW_ID.test(rowId) || json.length > 200_000) return { ok: false, message: 'That project couldn’t be saved.' };
  let raw: unknown;
  try {
    raw = JSON.parse(json);
  } catch {
    return { ok: false, message: 'That project couldn’t be saved.' };
  }
  const parsed = projectSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, message: 'Fix the highlighted fields, then save again.', fieldErrors: fieldErrors(parsed.error.issues) };

  const { tablesDB, databaseId } = await asUser();
  const clash = await tablesDB.listRows({ databaseId, tableId: 'caseStudy', queries: [Query.equal('slug', parsed.data.slug), Query.limit(1)] });
  if (clash.rows.some((r) => r.$id !== rowId)) return { ok: false, message: 'Fix the highlighted fields, then save again.', fieldErrors: { slug: 'Another project already uses this address.' } };

  try {
    const row = await saveDraft(tablesDB, databaseId, { tableId: 'caseStudy', rowId, title: parsed.data.title, data: parsed.data, actorId: me.id, expectedUpdatedAt });
    revalidatePath('/projects');
    return { ok: true, updatedAt: row.$updatedAt, message: 'Draft saved.' };
  } catch (e) {
    if (e instanceof DraftConflict) return { ok: false, message: `${e.message} Reload the page to see their changes (copy anything you need first).` };
    console.error('Save draft failed:', (e as Error).message);
    return { ok: false, message: 'Couldn’t save right now. Your changes are still on this page; try again.' };
  }
}

export async function submitForReview(rowId: string): Promise<SaveResult> {
  const me = await requireStaff(path(rowId));
  const { tablesDB, databaseId } = await asUser();
  const draft = await getDraft(tablesDB, databaseId, 'caseStudy', rowId);
  if (!draft) return { ok: false, message: 'Save a draft first.' };
  const row = await tablesDB.updateRow({ databaseId, tableId: 'contentDraft', rowId: draft.$id, data: { status: 'in_review', submittedBy: me.id, submittedAt: new Date().toISOString() } });
  await audit(me, 'project.submit', rowId, draft.title);
  revalidatePath('/projects');
  return { ok: true, updatedAt: row.$updatedAt, message: 'Submitted for review. An Admin will publish it.' };
}

export async function previewLink(rowId: string, slug: string): Promise<{ url: string } | { error: string }> {
  await requireStaff(path(rowId));
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) return { error: 'Save a valid address (slug) first.' };
  const p = signPreview(previewSecret(), `/work/${slug}`);
  return { url: `${siteUrl()}/api/preview?path=${encodeURIComponent(p.path)}&expires=${p.expires}&signature=${p.signature}` };
}

/** Admin: make the saved draft the live version (one transaction), then remove the draft. */
export async function publish(rowId: string, expectedUpdatedAt: string | null): Promise<SaveResult> {
  const me = await requireStaff(path(rowId), 'admin');
  const { tablesDB, databaseId } = await asUser();
  const draft = await getDraft(tablesDB, databaseId, 'caseStudy', rowId);
  if (!draft) return { ok: false, message: 'There are no unpublished changes.' };
  // Publish exactly the version the Admin reviewed.
  if (draft.$updatedAt !== expectedUpdatedAt) return { ok: false, message: 'Someone saved this draft after you opened it. Reload the page and review it before publishing.' };
  const parsed = projectSchema.safeParse(JSON.parse(draft.data));
  if (!parsed.success) return { ok: false, message: 'The saved draft has errors. Open it, fix them and save first.' };
  try {
    await publishProject(tablesDB, { databaseId, rowId, data: parsed.data, actorId: me.id });
  } catch (e) {
    if (e instanceof AppwriteException && e.code === 401) return { ok: false, message: 'Appwrite refused: only Admins can publish.' };
    console.error('Publish failed:', (e as Error).message);
    return { ok: false, message: (e as Error).message.startsWith('Another project') ? (e as Error).message : 'Publishing failed; nothing was changed. Try again.' };
  }
  await tablesDB.deleteRow({ databaseId, tableId: 'contentDraft', rowId: draft.$id });
  await audit(me, 'project.publish', rowId, parsed.data.title, `/work/${parsed.data.slug}`);
  revalidatePath('/projects');
  redirect(`${path(rowId)}?notice=published`);
}

export async function discardDraft(rowId: string) {
  const me = await requireStaff(path(rowId));
  const { tablesDB, databaseId } = await asUser();
  const draft = await getDraft(tablesDB, databaseId, 'caseStudy', rowId);
  if (draft) {
    await tablesDB.deleteRow({ databaseId, tableId: 'contentDraft', rowId: draftRowId('caseStudy', rowId) });
    await audit(me, 'project.discard', rowId, draft.title);
  }
  const live = await tablesDB.getRow({ databaseId, tableId: 'caseStudy', rowId }).catch(() => null);
  revalidatePath('/projects');
  redirect(live ? `${path(rowId)}?notice=discarded` : '/projects?notice=discarded');
}

/** Admin: hide from (or return to) the public site without deleting. */
export async function setVisibility(rowId: string, visible: boolean) {
  const me = await requireStaff(path(rowId), 'admin');
  const { tablesDB, databaseId } = await asUser();
  const row = await tablesDB.updateRow({ databaseId, tableId: 'caseStudy', rowId, data: { state: visible ? 'published' : 'draft', updatedBy: me.id } });
  await audit(me, visible ? 'project.republish' : 'project.unpublish', rowId, String(row.title));
  revalidatePath('/projects');
  redirect(`${path(rowId)}?notice=${visible ? 'republished' : 'unpublished'}`);
}

/** Admin: delete the project, its child rows, testimonial and draft. Uploaded images stay in Storage. */
export async function deleteProject(rowId: string) {
  const me = await requireStaff(path(rowId), 'admin');
  const { tablesDB, databaseId } = await asUser();
  const loaded = await loadProject(tablesDB, databaseId, rowId);
  if (!loaded) redirect('/projects');
  const { $id: transactionId } = await tablesDB.createTransaction({ ttl: 120 });
  try {
    for (const tableId of ['caseApproachStep', 'caseScreen', 'caseMetric']) {
      const { rows } = await tablesDB.listRows({ databaseId, tableId, queries: [Query.equal('caseStudyId', rowId), Query.limit(100)] });
      for (const r of rows) await tablesDB.deleteRow({ databaseId, tableId, rowId: r.$id, transactionId });
    }
    if (loaded.live?.testimonialId) await tablesDB.deleteRow({ databaseId, tableId: 'testimonial', rowId: loaded.live.testimonialId, transactionId });
    if (loaded.live) await tablesDB.deleteRow({ databaseId, tableId: 'caseStudy', rowId, transactionId });
    if (loaded.draft) await tablesDB.deleteRow({ databaseId, tableId: 'contentDraft', rowId: loaded.draft.$id, transactionId });
    await tablesDB.updateTransaction({ transactionId, commit: true });
  } catch (e) {
    await tablesDB.updateTransaction({ transactionId, rollback: true }).catch(() => {});
    throw e;
  }
  await audit(me, 'project.delete', rowId, loaded.data.title || 'Untitled');
  revalidatePath('/projects');
  redirect('/projects?notice=deleted');
}

/** Admin: move a live project one place up or down on the site. */
export async function moveProject(rowId: string, direction: 'up' | 'down') {
  const me = await requireStaff('/projects', 'admin');
  const { tablesDB, databaseId } = await asUser();
  const { rows } = await tablesDB.listRows({ databaseId, tableId: 'caseStudy', queries: [Query.orderAsc('orderIndex'), Query.limit(100)] });
  const i = rows.findIndex((r) => r.$id === rowId);
  const j = direction === 'up' ? i - 1 : i + 1;
  if (i < 0 || j < 0 || j >= rows.length) return;
  // Renumber everything so ties from older data can't stick.
  const order = rows.map((r) => r.$id);
  [order[i], order[j]] = [order[j], order[i]];
  const { $id: transactionId } = await tablesDB.createTransaction({ ttl: 60 });
  for (const [n, id] of order.entries()) {
    if (rows.find((r) => r.$id === id)!.orderIndex !== n) await tablesDB.updateRow({ databaseId, tableId: 'caseStudy', rowId: id, transactionId, data: { orderIndex: n } });
  }
  await tablesDB.updateTransaction({ transactionId, commit: true });
  await audit(me, 'project.reorder', rowId, String(rows[i].title), direction);
  revalidatePath('/projects');
}
