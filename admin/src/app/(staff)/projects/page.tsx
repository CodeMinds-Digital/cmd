import type { Metadata } from 'next';
import Link from 'next/link';
import { requireStaff } from '@/lib/auth';
import { listProjects } from '@/lib/projects';
import { asUser } from '@/lib/session';
import { createProject, moveProject } from './actions';

export const metadata: Metadata = { title: 'Projects' };

const NOTICES: Record<string, string> = { deleted: 'Project deleted.', discarded: 'Draft discarded.' };

function Badge({ tone, children }: { tone: 'live' | 'muted' | 'review' | 'draft'; children: React.ReactNode }) {
  const styles = {
    live: 'bg-inverse text-inverse-fg',
    muted: 'bg-surface-sunk text-fg-muted',
    review: 'bg-accent text-accent-fg',
    draft: 'border border-line-strong text-fg',
  }[tone];
  return <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${styles}`}>{children}</span>;
}

export default async function ProjectsPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const me = await requireStaff('/projects');
  const { notice } = await searchParams;
  const { tablesDB, databaseId } = await asUser();
  const items = await listProjects(tablesDB, databaseId);
  const live = items.filter((i) => i.live);
  return (
    <>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold">Projects</h1>
          <p className="mt-2 text-fg-muted">Case studies on /work. Changes are saved as drafts; an Admin publishes them.</p>
        </div>
        <form action={createProject}>
          <button type="submit" className="inline-flex min-h-11 items-center rounded-full bg-inverse px-5 text-sm font-medium text-inverse-fg">
            New project
          </button>
        </form>
      </div>
      {notice && NOTICES[notice] && (
        <p role="status" className="mb-6 rounded-lg bg-surface-sunk px-4 py-3 text-sm">
          {NOTICES[notice]}
        </p>
      )}
      <ul className="divide-y divide-line rounded-2xl border border-line bg-surface">
        {items.map((p) => {
          const pos = live.findIndex((l) => l.rowId === p.rowId);
          return (
            <li key={p.rowId} className="flex flex-wrap items-center gap-3 px-5 py-4">
              <div className="min-w-0 flex-1">
                <Link href={`/projects/${p.rowId}`} className="font-medium text-fg underline-offset-4 hover:underline">
                  {p.title || 'Untitled project'}
                </Link>
                <p className="truncate text-sm text-fg-muted">{p.slug ? `/work/${p.slug}` : 'No address yet'}</p>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {p.live === 'published' && <Badge tone="live">Live</Badge>}
                {p.live === 'unpublished' && <Badge tone="muted">Hidden</Badge>}
                {p.live === null && <Badge tone="muted">Not published</Badge>}
                {p.draft === 'draft' && <Badge tone="draft">Draft changes</Badge>}
                {p.draft === 'in_review' && <Badge tone="review">In review</Badge>}
              </div>
              {me.role === 'admin' && pos >= 0 && (
                <div className="flex gap-1">
                  <form action={moveProject.bind(null, p.rowId, 'up')}>
                    <button type="submit" disabled={pos === 0} aria-label={`Move ${p.title} up`} className="grid size-11 place-items-center rounded-full hover:bg-surface-sunk disabled:opacity-30">
                      ↑
                    </button>
                  </form>
                  <form action={moveProject.bind(null, p.rowId, 'down')}>
                    <button type="submit" disabled={pos === live.length - 1} aria-label={`Move ${p.title} down`} className="grid size-11 place-items-center rounded-full hover:bg-surface-sunk disabled:opacity-30">
                      ↓
                    </button>
                  </form>
                </div>
              )}
            </li>
          );
        })}
        {items.length === 0 && <li className="px-5 py-8 text-center text-fg-muted">No projects yet.</li>}
      </ul>
    </>
  );
}
