import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { readPublicEnv } from '@codeminds/cms/env';
import { requireStaff } from '@/lib/auth';
import { siteUrl } from '@/lib/env';
import { loadProject } from '@/lib/projects';
import { asUser } from '@/lib/session';
import ProjectEditor from './ProjectEditor';

export const metadata: Metadata = { title: 'Edit project' };

const NOTICES: Record<string, string> = {
  published: 'Published. The site updates within a few seconds.',
  discarded: 'Draft discarded. Showing the published version.',
  unpublished: 'Hidden from the site. Nothing was deleted.',
  republished: 'Back on the site.',
};

export default async function EditProjectPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | undefined>> }) {
  const { id } = await params;
  if (!/^[a-zA-Z0-9._-]{1,36}$/.test(id)) notFound();
  const me = await requireStaff(`/projects/${id}`);
  const { notice } = await searchParams;
  const { tablesDB, databaseId } = await asUser();
  const project = await loadProject(tablesDB, databaseId, id);
  if (!project) notFound();
  const env = readPublicEnv();
  return (
    <>
      <Link href="/projects" className="mb-4 inline-flex min-h-11 items-center text-sm text-fg-muted hover:text-fg">
        ← All projects
      </Link>
      {notice && NOTICES[notice] && (
        <p role="status" className="mb-6 rounded-lg bg-surface-sunk px-4 py-3 text-sm">
          {NOTICES[notice]}
        </p>
      )}
      <ProjectEditor
        rowId={id}
        initial={project.data}
        draftUpdatedAt={project.draft?.$updatedAt ?? null}
        draftStatus={project.draft?.status ?? null}
        live={project.live ? (project.live.state === 'published' ? 'published' : 'unpublished') : null}
        isAdmin={me.role === 'admin'}
        siteUrl={siteUrl()}
        filesBase={`${env.endpoint}/storage/buckets/public-assets/files`}
        projectId={env.projectId}
      />
    </>
  );
}
