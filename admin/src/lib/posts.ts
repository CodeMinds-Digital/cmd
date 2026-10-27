import 'server-only';
import type { TablesDB } from 'node-appwrite';
import { postFromLive, postSchema, type PostData } from '@codeminds/cms/content/post';
import type { ContentDraftRow, JournalPostRow } from '@codeminds/cms/schema';
import { Query } from '@codeminds/cms/server';
import { getDraft, listDrafts } from '@/lib/drafts';

export type PostListItem = {
  rowId: string;
  title: string;
  slug: string;
  date: string | null;
  live: 'published' | 'unpublished' | null;
  draft: 'draft' | 'in_review' | null;
};

const slugOf = (d: ContentDraftRow) => {
  try {
    return String((JSON.parse(d.data) as { slug?: string }).slug ?? '');
  } catch {
    return '';
  }
};

export async function listPosts(db: TablesDB, databaseId: string): Promise<PostListItem[]> {
  const [live, drafts] = await Promise.all([
    db.listRows<JournalPostRow>({ databaseId, tableId: 'journalPost', queries: [Query.orderDesc('publishedAt'), Query.limit(100)] }),
    listDrafts(db, databaseId, 'journalPost'),
  ]);
  const byRow = new Map(drafts.map((d) => [d.rowId, d]));
  const items: PostListItem[] = [];
  // Unpublished new posts first, then everything by date.
  for (const d of drafts) if (!live.rows.some((r) => r.$id === d.rowId)) items.push({ rowId: d.rowId, title: d.title, slug: slugOf(d), date: null, live: null, draft: d.status });
  for (const r of live.rows) {
    const d = byRow.get(r.$id);
    items.push({ rowId: r.$id, title: d?.title ?? r.title, slug: r.slug, date: r.publishedAt.slice(0, 10), live: r.state === 'published' ? 'published' : 'unpublished', draft: d?.status ?? null });
  }
  return items;
}

export type LoadedPost = { rowId: string; data: PostData; live: JournalPostRow | null; draft: ContentDraftRow | null };

export async function loadPost(db: TablesDB, databaseId: string, rowId: string): Promise<LoadedPost | null> {
  const [live, draft] = await Promise.all([
    db.getRow<JournalPostRow>({ databaseId, tableId: 'journalPost', rowId }).catch(() => null),
    getDraft(db, databaseId, 'journalPost', rowId),
  ]);
  if (!live && !draft) return null;
  if (draft) {
    const json = JSON.parse(draft.data);
    const parsed = postSchema.safeParse(json);
    return { rowId, data: parsed.success ? parsed.data : (json as PostData), live, draft };
  }
  return { rowId, data: postFromLive(live!), live, draft: null };
}
