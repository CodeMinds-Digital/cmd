import type { Metadata } from 'next';
import Link from 'next/link';
import { readPublicEnv } from '@codeminds/cms/env';
import { Query } from '@codeminds/cms/server';
import { createSessionClient } from '@codeminds/cms/session';
import type { AuditLogRow } from '@codeminds/cms/schema';
import { requireStaff, sessionSecret } from '@/lib/auth';
import { listStaff } from '@/lib/staff';

export const metadata: Metadata = { title: 'Audit log' };

const PAGE = 50;
const ID_RE = /^[a-zA-Z0-9._-]{1,36}$/;

export default async function AuditPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  await requireStaff('/audit', 'admin');
  const { after } = await searchParams;
  // Read as the signed-in Admin: the table grants read to team:admin only.
  const s = createSessionClient((await sessionSecret())!);
  const { rows } = await s.tablesDB.listRows<AuditLogRow>({
    databaseId: readPublicEnv().databaseId,
    tableId: 'auditLog',
    queries: [Query.orderDesc('$createdAt'), Query.limit(PAGE), ...(after && ID_RE.test(after) ? [Query.cursorAfter(after)] : [])],
  });
  // Names come from the account (by actorId), not the stored display name, which staff can change themselves.
  const names = new Map((await listStaff()).map((m) => [m.userId, m.name]));
  const fmt = new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Kolkata' });
  return (
    <>
      <h1 className="mb-2 font-display text-3xl font-bold">Audit log</h1>
      <p className="mb-8 text-fg-muted">Every admin change and sign-in, newest first (times in IST). Entries can’t be edited or deleted.</p>
      <div className="relative overflow-x-auto rounded-2xl border border-line bg-surface p-6">
        <table className="w-full min-w-[40rem] text-left text-sm">
          <caption className="sr-only">Audit entries</caption>
          <thead className="text-fg-muted">
            <tr>
              <th scope="col" className="pb-2 font-normal">When</th>
              <th scope="col" className="pb-2 font-normal">Who</th>
              <th scope="col" className="pb-2 font-normal">Action</th>
              <th scope="col" className="pb-2 font-normal">What</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.$id} className="border-t border-line align-top">
                <td className="py-2 pr-4 whitespace-nowrap">{fmt.format(new Date(r.$createdAt))}</td>
                <td className="py-2 pr-4">
                  {(r.actorId && names.get(r.actorId)) ?? r.actor}
                  {r.actorId && <span className="block font-mono text-xs text-fg-subtle">{r.actorId}</span>}
                </td>
                <td className="py-2 pr-4 font-mono">{r.action}</td>
                <td className="py-2">
                  {r.documentLabel ?? `${r.collectionId}/${r.documentId}`}
                  {r.diffSummary && <span className="block text-fg-muted">{r.diffSummary}</span>}
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={4} className="py-6 text-center text-fg-muted">
                  No entries yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {rows.length === PAGE && (
        <Link href={`/audit?after=${rows.at(-1)!.$id}`} className="mt-4 inline-flex min-h-11 items-center text-accent-ink underline underline-offset-4">
          Older entries
        </Link>
      )}
    </>
  );
}
