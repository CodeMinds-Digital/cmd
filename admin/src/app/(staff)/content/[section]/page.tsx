import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { readPublicEnv } from '@codeminds/cms/env';
import { SECTION_ROW_ID } from '@codeminds/cms/content/drafts';
import { isSectionKey, sectionFromLive, sectionSchemas, SECTIONS, STACK_ICONS } from '@codeminds/cms/content/sections';
import { requireStaff } from '@/lib/auth';
import { getDraft } from '@/lib/drafts';
import { asUser } from '@/lib/session';
import SectionEditor from './SectionEditor';

export const metadata: Metadata = { title: 'Edit section' };

const NOTICES: Record<string, string> = {
  published: 'Published. The site updates within a few seconds.',
  discarded: 'Draft discarded. Showing the published version.',
};

export default async function SectionPage({ params, searchParams }: { params: Promise<{ section: string }>; searchParams: Promise<Record<string, string | undefined>> }) {
  const { section } = await params;
  if (!isSectionKey(section)) notFound();
  const me = await requireStaff(`/content/${section}`);
  const { notice } = await searchParams;
  const { tablesDB, databaseId } = await asUser();
  const draft = await getDraft(tablesDB, databaseId, SECTIONS[section].tableId, SECTION_ROW_ID);
  let data: unknown = await sectionFromLive(tablesDB, databaseId, section);
  if (draft) {
    const parsed = sectionSchemas[section].safeParse(JSON.parse(draft.data));
    data = parsed.success ? parsed.data : JSON.parse(draft.data);
  }
  const env = readPublicEnv();
  return (
    <>
      <Link href="/content" className="mb-4 inline-flex min-h-11 items-center text-sm text-fg-muted hover:text-fg">
        ← Site content
      </Link>
      {notice && NOTICES[notice] && (
        <p role="status" className="mb-6 rounded-lg bg-surface-sunk px-4 py-3 text-sm">
          {NOTICES[notice]}
        </p>
      )}
      <SectionEditor
        section={section}
        label={SECTIONS[section].label}
        initial={data as never}
        draftUpdatedAt={draft?.$updatedAt ?? null}
        draftStatus={draft?.status ?? null}
        isAdmin={me.role === 'admin'}
        icons={[...STACK_ICONS]}
        filesBase={`${env.endpoint}/storage/buckets/public-assets/files`}
        projectId={env.projectId}
      />
    </>
  );
}
