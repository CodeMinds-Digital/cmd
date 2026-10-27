/**
 * A journal post as one editable document (same draft layer as projects,
 * D24): editors save PostData in `contentDraft`; an Admin publishes it with
 * `publishPost`, as their own session (journalPost is Admin-write-only).
 */
import { z } from 'zod';
import type { TablesDB } from 'node-appwrite';
import { Query } from 'node-appwrite';
import type { JournalPostRow } from '../schema/generated.ts';
import { docFromPlainText, plainText, readingTime, richDocSchema } from './rich-text.ts';

const optText = (max: number) =>
  z.preprocess((v) => (typeof v === 'string' && v.trim() === '' ? undefined : v), z.string().trim().max(max).optional());

export const postSchema = z.object({
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Lowercase letters, numbers and single hyphens.').max(80),
  title: z.string().trim().min(1, 'Add a title.').max(200),
  excerpt: z.string().trim().min(1, 'Add a short summary (shown on the journal list).').max(500),
  /** Publication date shown on the site (yyyy-mm-dd). Empty = the day it's first published. */
  date: z.preprocess((v) => (v === '' ? undefined : v), z.iso.date().optional()),
  tags: z.array(z.string().trim().min(1).max(64)).max(10),
  cover: z.object({ fileId: z.string().regex(/^[a-zA-Z0-9._-]{1,36}$/).optional(), alt: optText(300) }),
  authorName: optText(100),
  seoTitle: optText(70),
  seoDescription: optText(160),
  body: richDocSchema,
});

export type PostData = z.infer<typeof postSchema>;

const opt = <T>(v: T | null | undefined) => (v === null || v === undefined || v === '' ? undefined : v);

export function postFromLive(row: JournalPostRow): PostData {
  let body = docFromPlainText(row.body);
  if (row.bodyJson) {
    const parsed = richDocSchema.safeParse(JSON.parse(row.bodyJson));
    if (parsed.success) body = parsed.data;
  }
  return {
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt,
    date: row.publishedAt.slice(0, 10),
    tags: row.tags ?? [],
    cover: { fileId: opt(row.coverFileId), alt: opt(row.coverAlt) },
    authorName: opt(row.authorName),
    seoTitle: opt(row.seoTitle),
    seoDescription: opt(row.seoDescription),
    body,
  };
}

const BODY_TEXT_MAX = 12_000;

/** Write `data` as the live version of post `rowId` (run as the Admin's session). */
export async function publishPost(
  tablesDB: TablesDB,
  { databaseId, rowId, data, actorId }: { databaseId: string; rowId: string; data: PostData; actorId: string },
) {
  const existing = await tablesDB.getRow<JournalPostRow>({ databaseId, tableId: 'journalPost', rowId }).catch(() => null);
  const clash = await tablesDB.listRows({ databaseId, tableId: 'journalPost', queries: [Query.equal('slug', data.slug), Query.limit(1)] });
  if (clash.rows.some((r) => r.$id !== rowId)) throw new Error(`Another post already uses the address /journal/${data.slug}.`);

  const publishedAt = data.date ? `${data.date}T00:00:00.000+00:00` : (existing?.publishedAt ?? new Date().toISOString());
  await tablesDB.upsertRow({
    databaseId,
    tableId: 'journalPost',
    rowId,
    data: {
      slug: data.slug,
      title: data.title,
      excerpt: data.excerpt,
      publishedAt,
      readingTime: readingTime(data.body),
      tags: data.tags,
      coverFileId: data.cover.fileId ?? null,
      coverAlt: data.cover.alt ?? null,
      authorName: data.authorName ?? null,
      seoTitle: data.seoTitle ?? null,
      seoDescription: data.seoDescription ?? null,
      // Plain-text copy for the legacy column (search, fallbacks); the article renders from bodyJson.
      body: plainText(data.body).slice(0, BODY_TEXT_MAX),
      bodyJson: JSON.stringify(data.body),
      status: 'published',
      state: 'published',
      publishedBy: actorId,
      updatedBy: actorId,
      ...(existing ? {} : { createdBy: actorId }),
    },
  });
}
