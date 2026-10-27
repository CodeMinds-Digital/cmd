import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { readPublicEnv } from '@codeminds/cms/env';
import { requireStaff } from '@/lib/auth';
import { loadPost } from '@/lib/posts';
import { asUser } from '@/lib/session';
import { ROW_ID } from '@/lib/validation';
import PostEditor from './PostEditor';

export const metadata: Metadata = { title: 'Edit post' };

const NOTICES: Record<string, string> = {
  published: 'Published. The site updates within a few seconds.',
  discarded: 'Draft discarded. Showing the published version.',
  unpublished: 'Hidden from the site. Nothing was deleted.',
  republished: 'Back on the site.',
};

export default async function EditPostPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | undefined>> }) {
  const { id } = await params;
  if (!ROW_ID.test(id)) notFound();
  const me = await requireStaff(`/journal/${id}`);
  const { notice } = await searchParams;
  const { tablesDB, databaseId } = await asUser();
  const post = await loadPost(tablesDB, databaseId, id);
  if (!post) notFound();
  const env = readPublicEnv();
  return (
    <>
      <Link href="/journal" className="mb-4 inline-flex min-h-11 items-center text-sm text-fg-muted hover:text-fg">
        ← All posts
      </Link>
      {notice && NOTICES[notice] && (
        <p role="status" className="mb-6 rounded-lg bg-surface-sunk px-4 py-3 text-sm">
          {NOTICES[notice]}
        </p>
      )}
      <PostEditor
        rowId={id}
        initial={post.data}
        draftUpdatedAt={post.draft?.$updatedAt ?? null}
        draftStatus={post.draft?.status ?? null}
        live={post.live ? (post.live.state === 'published' ? 'published' : 'unpublished') : null}
        isAdmin={me.role === 'admin'}
        filesBase={`${env.endpoint}/storage/buckets/public-assets/files`}
        projectId={env.projectId}
      />
    </>
  );
}
