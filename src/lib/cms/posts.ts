import 'server-only';
import { unstable_cache as nextCache } from 'next/cache';
import { databases, Query } from '@/lib/appwrite/server';
import { APPWRITE_DATABASE_ID } from '@/lib/appwrite/env';
import type { Post } from '@/types/post';

export type CmsPost = Post;
export type { Post } from '@/types/post';

async function fetchPosts(): Promise<CmsPost[]> {
  try {
    const res = await databases.listDocuments(
      APPWRITE_DATABASE_ID,
      'journalPost',
      [
        Query.limit(100),
        Query.orderDesc('publishedAt'),
        Query.equal('status', 'published'),
      ],
    );
    if (res.total === 0) return [];

    return res.documents.map<CmsPost>((d) => ({
      slug: String(d.slug),
      title: String(d.title),
      excerpt: String(d.excerpt ?? ''),
      date: typeof d.publishedAt === 'string' ? d.publishedAt.slice(0, 10) : '',
      readingTime: String(d.readingTime ?? ''),
      tags: Array.isArray(d.tags) ? d.tags.map(String) : [],
      body: typeof d.body === 'string' ? d.body : undefined,
    }));
  } catch {
    return [];
  }
}

export const getPosts = nextCache(fetchPosts, ['journalPost'], {
  tags: ['journalPost'],
});

export async function getPost(slug: string): Promise<CmsPost | undefined> {
  const all = await getPosts();
  return all.find((p) => p.slug === slug);
}

export function formatDate(iso: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}
