import type { Metadata } from 'next';
import Link from 'next/link';
import { readPublicEnv } from '@codeminds/cms/env';
import { Query } from '@codeminds/cms/server';
import { createSessionClient } from '@codeminds/cms/session';
import { requireStaff, sessionSecret } from '@/lib/auth';

export const metadata: Metadata = { title: 'Dashboard' };

const AREAS = [
  { table: 'caseStudy', label: 'Projects', href: '/projects' },
  { table: 'journalPost', label: 'Journal posts', href: '/journal' },
  { table: 'capability', label: 'Capabilities', href: '/content/capabilities' },
  { table: 'stackItem', label: 'Stack', href: '/content/stack' },
] as const;

export default async function Dashboard() {
  const me = await requireStaff('/');
  // Read as the signed-in user: Appwrite permissions apply.
  const s = createSessionClient((await sessionSecret())!);
  const db = readPublicEnv().databaseId;
  const counts = await Promise.all(
    AREAS.map(async (a) => {
      const [published, drafts] = await Promise.all(
        ['published', 'draft'].map((state) =>
          s.tablesDB
            .listRows({ databaseId: db, tableId: a.table, queries: [Query.equal('state', state), Query.limit(1)] })
            .then((r) => r.total)
            .catch(() => null),
        ),
      );
      return { ...a, published, drafts };
    }),
  );

  return (
    <>
      <h1 className="mb-2 font-display text-3xl font-bold">Hello, {me.name.split(' ')[0]}</h1>
      <p className="mb-8 text-fg-muted">What’s on the site now. Numbers are live.</p>
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {counts.map((a) => (
          <li key={a.table} className="rounded-2xl border border-line bg-surface p-5">
            <h2 className="font-medium">
              <Link href={a.href} className="underline-offset-4 hover:underline">
                {a.label}
              </Link>
            </h2>
            <p className="mt-2 text-sm text-fg-muted">
              {a.published ?? '—'} published · {a.drafts ?? '—'} draft
            </p>
          </li>
        ))}
      </ul>
    </>
  );
}
