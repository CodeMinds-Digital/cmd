import type { Metadata } from 'next';
import Link from 'next/link';
import { requireStaff } from '@/lib/auth';
import { countByStatus, ENQUIRY_STATUSES, isStatus, listEnquiries, messageOf, STATUS_LABEL } from '@/lib/enquiries';
import { asUser } from '@/lib/session';

export const metadata: Metadata = { title: 'Enquiries' };

export default async function EnquiriesPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  await requireStaff('/enquiries', 'admin');
  const q = await searchParams;
  const status = isStatus(q.status) ? q.status : undefined;
  const { tablesDB, databaseId } = await asUser();
  const [{ rows, more }, counts] = await Promise.all([listEnquiries(tablesDB, databaseId, { status, after: q.after }), countByStatus(tablesDB, databaseId)]);
  const fmt = new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Kolkata' });
  const tab = (s?: string) => `min-h-11 content-center rounded-full px-4 text-sm ${s === status ? 'bg-inverse text-inverse-fg' : 'text-fg-muted hover:bg-surface-sunk'}`;
  return (
    <>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold">Enquiries</h1>
          <p className="mt-2 text-fg-muted">Messages from the contact form. Admins only; each is deleted automatically 24 months after its last update.</p>
        </div>
        {/* Route handler download, not a page: plain link. */}
        <a href="/api/enquiries/export" className="inline-flex min-h-11 items-center rounded-full border border-line-strong px-5 text-sm font-medium hover:bg-surface-sunk">
          Export CSV
        </a>
      </div>
      {q.notice === 'deleted' && (
        <p role="status" className="mb-6 rounded-lg bg-surface-sunk px-4 py-3 text-sm">
          Enquiry deleted.
        </p>
      )}
      <nav aria-label="Filter by status" className="mb-4 flex flex-wrap gap-1">
        <Link href="/enquiries" className={tab(undefined)} aria-current={!status ? 'page' : undefined}>
          All
        </Link>
        {ENQUIRY_STATUSES.map((s) => (
          <Link key={s} href={`/enquiries?status=${s}`} className={tab(s)} aria-current={s === status ? 'page' : undefined}>
            {STATUS_LABEL[s]} ({counts[s]})
          </Link>
        ))}
      </nav>
      <ul className="divide-y divide-line rounded-2xl border border-line bg-surface">
        {rows.map((r) => (
          <li key={r.$id}>
            <Link href={`/enquiries/${r.$id}`} className="flex flex-wrap items-baseline gap-x-4 gap-y-1 px-5 py-4 hover:bg-surface-sunk">
              <span className={`font-medium ${r.status === 'new' ? 'text-fg' : 'text-fg-muted'}`}>{r.name}</span>
              <span className="text-sm text-fg-muted">{r.email}</span>
              <span className="ml-auto text-sm text-fg-subtle">{fmt.format(new Date(r.$createdAt))}</span>
              <span className="rounded-full border border-line-strong px-2.5 py-0.5 text-xs">{isStatus(r.status) ? STATUS_LABEL[r.status] : r.status}</span>
              <span className="w-full truncate text-sm text-fg-muted">{messageOf(r)}</span>
            </Link>
          </li>
        ))}
        {rows.length === 0 && <li className="px-5 py-8 text-center text-fg-muted">No enquiries{status ? ` marked ${STATUS_LABEL[status].toLowerCase()}` : ''}.</li>}
      </ul>
      {more && (
        <Link href={`/enquiries?${new URLSearchParams({ ...(status ? { status } : {}), after: rows.at(-1)!.$id })}`} className="mt-4 inline-flex min-h-11 items-center text-accent-ink underline underline-offset-4">
          Older enquiries
        </Link>
      )}
    </>
  );
}
