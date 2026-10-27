import type { Metadata } from 'next';
import Link from 'next/link';
import { SECTION_ROW_ID } from '@codeminds/cms/content/drafts';
import { SECTIONS, type SectionKey } from '@codeminds/cms/content/sections';
import { requireStaff } from '@/lib/auth';
import { getDraft } from '@/lib/drafts';
import { asUser } from '@/lib/session';

export const metadata: Metadata = { title: 'Site content' };

const ABOUT: Record<SectionKey, string> = {
  capabilities: 'What we offer: the bento of services on the home page.',
  process: 'The four-step “How we work” track.',
  stack: 'The “Built with” strip of technologies and tools.',
  logos: 'Client logos. The strip appears once at least four are approved.',
  settings: 'Email, booking link, city, reply time, delivery window.',
};

export default async function ContentPage() {
  await requireStaff('/content');
  const { tablesDB, databaseId } = await asUser();
  const keys = Object.keys(SECTIONS) as SectionKey[];
  const drafts = await Promise.all(keys.map((k) => getDraft(tablesDB, databaseId, SECTIONS[k].tableId, SECTION_ROW_ID)));
  return (
    <>
      <h1 className="mb-2 font-display text-3xl font-bold">Site content</h1>
      <p className="mb-8 text-fg-muted">The home page’s sections. Changes are saved as drafts; an Admin publishes them.</p>
      <ul className="grid gap-4 sm:grid-cols-2">
        {keys.map((k, i) => (
          <li key={k} className="rounded-2xl border border-line bg-surface p-5">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-medium">
                <Link href={`/content/${k}`} className="underline-offset-4 hover:underline">
                  {SECTIONS[k].label}
                </Link>
              </h2>
              {drafts[i]?.status === 'in_review' && <span className="rounded-full bg-accent px-2.5 py-0.5 text-xs font-medium text-accent-fg">In review</span>}
              {drafts[i]?.status === 'draft' && <span className="rounded-full border border-line-strong px-2.5 py-0.5 text-xs font-medium">Draft changes</span>}
            </div>
            <p className="mt-2 text-sm text-fg-muted">{ABOUT[k]}</p>
          </li>
        ))}
      </ul>
    </>
  );
}
