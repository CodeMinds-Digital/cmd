'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { writeAudit } from '@codeminds/cms/audit';
import { SECTION_ROW_ID } from '@codeminds/cms/content/drafts';
import { isSectionKey, publishSection, sectionSchemas, SECTIONS, type SectionKey } from '@codeminds/cms/content/sections';
import { AppwriteException, adminClient } from '@codeminds/cms/server';
import { signPreview } from '@codeminds/cms/signing';
import { requireStaff, type Staff } from '@/lib/auth';
import { DraftConflict, getDraft, saveDraft } from '@/lib/drafts';
import { previewSecret, siteUrl } from '@/lib/env';
import { asUser } from '@/lib/session';
import { fieldErrors } from '@/lib/validation';
import type { SaveResult } from '../projects/actions';

/** Home-page sections (D25): one draft per section; publish rewrites the section (Admin session). */
const path = (key: SectionKey) => `/content/${key}`;
const audit = (me: Staff, action: string, key: SectionKey, summary?: string) =>
  writeAudit(adminClient(), { actor: { id: me.id, name: me.name }, action, tableId: SECTIONS[key].tableId, rowId: SECTION_ROW_ID, label: SECTIONS[key].label, summary });

function sectionKey(key: string): SectionKey {
  if (!isSectionKey(key)) throw new Error('Unknown section.');
  return key;
}

export async function saveSection(rawKey: string, json: string, expectedUpdatedAt: string | null): Promise<SaveResult> {
  const key = sectionKey(rawKey);
  const me = await requireStaff(path(key));
  if (json.length > 200_000) return { ok: false, message: 'That’s too much content to save at once.' };
  let raw: unknown;
  try {
    raw = JSON.parse(json);
  } catch {
    return { ok: false, message: 'That couldn’t be saved.' };
  }
  const parsed = sectionSchemas[key].safeParse(raw);
  if (!parsed.success) return { ok: false, message: 'Fix the highlighted fields, then save again.', fieldErrors: fieldErrors(parsed.error.issues) };
  const { tablesDB, databaseId } = await asUser();
  try {
    const row = await saveDraft(tablesDB, databaseId, { tableId: SECTIONS[key].tableId, rowId: SECTION_ROW_ID, title: SECTIONS[key].label, data: parsed.data, actorId: me.id, expectedUpdatedAt });
    revalidatePath('/content');
    return { ok: true, updatedAt: row.$updatedAt, message: 'Draft saved.' };
  } catch (e) {
    if (e instanceof DraftConflict) return { ok: false, message: `${e.message} Reload the page to see their changes (copy anything you need first).` };
    console.error('Save section draft failed:', (e as Error).message);
    return { ok: false, message: 'Couldn’t save right now. Your changes are still on this page; try again.' };
  }
}

export async function submitSection(rawKey: string): Promise<SaveResult> {
  const key = sectionKey(rawKey);
  const me = await requireStaff(path(key));
  const { tablesDB, databaseId } = await asUser();
  const draft = await getDraft(tablesDB, databaseId, SECTIONS[key].tableId, SECTION_ROW_ID);
  if (!draft) return { ok: false, message: 'Save a draft first.' };
  const row = await tablesDB.updateRow({ databaseId, tableId: 'contentDraft', rowId: draft.$id, data: { status: 'in_review', submittedBy: me.id, submittedAt: new Date().toISOString() } });
  await audit(me, 'section.submit', key);
  revalidatePath('/content');
  return { ok: true, updatedAt: row.$updatedAt, message: 'Submitted for review. An Admin will publish it.' };
}

export async function sectionPreviewLink(rawKey: string): Promise<{ url: string } | { error: string }> {
  const key = sectionKey(rawKey);
  await requireStaff(path(key));
  const p = signPreview(previewSecret(), SECTIONS[key].previewPath);
  return { url: `${siteUrl()}/api/preview?path=${encodeURIComponent(p.path)}&expires=${p.expires}&signature=${p.signature}` };
}

export async function publishSectionDraft(rawKey: string, expectedUpdatedAt: string | null): Promise<SaveResult> {
  const key = sectionKey(rawKey);
  const me = await requireStaff(path(key), 'admin');
  const { tablesDB, databaseId } = await asUser();
  const draft = await getDraft(tablesDB, databaseId, SECTIONS[key].tableId, SECTION_ROW_ID);
  if (!draft) return { ok: false, message: 'There are no unpublished changes.' };
  // Publish exactly the version the Admin reviewed.
  if (draft.$updatedAt !== expectedUpdatedAt) return { ok: false, message: 'Someone saved this draft after you opened it. Reload the page and review it before publishing.' };
  const parsed = sectionSchemas[key].safeParse(JSON.parse(draft.data));
  if (!parsed.success) return { ok: false, message: 'The saved draft has errors. Fix them and save first.' };
  try {
    await publishSection(tablesDB, { databaseId, key, data: parsed.data as never, actorId: me.id });
  } catch (e) {
    if (e instanceof AppwriteException && e.code === 401) return { ok: false, message: 'Appwrite refused: only Admins can publish.' };
    console.error('Publish section failed:', (e as Error).message);
    return { ok: false, message: 'Publishing failed; nothing was changed. Try again.' };
  }
  await tablesDB.deleteRow({ databaseId, tableId: 'contentDraft', rowId: draft.$id });
  await audit(me, 'section.publish', key);
  revalidatePath('/content');
  redirect(`${path(key)}?notice=published`);
}

export async function discardSection(rawKey: string) {
  const key = sectionKey(rawKey);
  const me = await requireStaff(path(key));
  const { tablesDB, databaseId } = await asUser();
  const draft = await getDraft(tablesDB, databaseId, SECTIONS[key].tableId, SECTION_ROW_ID);
  if (draft) {
    await tablesDB.deleteRow({ databaseId, tableId: 'contentDraft', rowId: draft.$id });
    await audit(me, 'section.discard', key);
  }
  revalidatePath('/content');
  redirect(`${path(key)}?notice=discarded`);
}
