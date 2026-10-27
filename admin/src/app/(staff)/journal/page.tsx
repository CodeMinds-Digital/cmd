import type { Metadata } from 'next';
import Link from 'next/link';
import { requireStaff } from '@/lib/auth';
import { listPosts } from '@/lib/posts';
import { asUser } from '@/lib/session';
import { createPost } from './actions';

export const metadata: Metadata = { title: 'Journal' };

const NOTICES: Record<string, string> = { deleted: 'Post deleted.', discarded: 'Draft discarded.' };
const BADGE = { live: 'bg-inverse text-inverse-fg', muted: 'bg-surface-sunk text-fg-muted', review: 'bg-accent text-accent-fg', draft: 'border border-line-strong text-fg' };
const Badge = ({ tone, children }: { tone: keyof typeof BADGE; children: React.ReactNode }) => (
  <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${BADGE[tone]}`}>{children}</span>
);

export default async function JournalPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  await requireStaff('/journal');
  const { notice } = await searchParams;
  const { tablesDB, databaseId } = await asUser();
  const items = await listPosts(tablesDB, databaseId);
  const fmt = new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeZone: 'UTC' });
  return (
    <>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold">Journal</h1>
          <p className="mt-2 text-fg-muted">Articles on /journal. Changes are saved as drafts; an Admin publishes them.</p>
        </div>
        <form action={createPost}>
          <button type="submit" className="inline-flex min-h-11 items-center rounded-full bg-inverse px-5 text-sm font-medium text-inverse-fg">
            New post
          </button>
        </form>
      </div>
      {notice && NOTICES[notice] && (
        <p role="status" className="mb-6 rounded-lg bg-surface-sunk px-4 py-3 text-sm">
          {NOTICES[notice]}
        </p>
      )}
      <ul className="divide-y divide-line rounded-2xl border border-line bg-surface">
        {items.map((p) => (
          <li key={p.rowId} className="flex flex-wrap items-center gap-3 px-5 py-4">
            <div className="min-w-0 flex-1">
              <Link href={`/journal/${p.rowId}`} className="font-medium text-fg underline-offset-4 hover:underline">
                {p.title || 'Untitled post'}
              </Link>
              <p className="truncate text-sm text-fg-muted">
                {p.date ? fmt.format(new Date(p.date)) : 'Not published'}
                {p.slug && ` · /journal/${p.slug}`}
              </p>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {p.live === 'published' && <Badge tone="live">Live</Badge>}
              {p.live === 'unpublished' && <Badge tone="muted">Hidden</Badge>}
              {p.live === null && <Badge tone="muted">Not published</Badge>}
              {p.draft === 'draft' && <Badge tone="draft">Draft changes</Badge>}
              {p.draft === 'in_review' && <Badge tone="review">In review</Badge>}
            </div>
          </li>
        ))}
        {items.length === 0 && <li className="px-5 py-8 text-center text-fg-muted">No posts yet.</li>}
      </ul>
    </>
  );
}
