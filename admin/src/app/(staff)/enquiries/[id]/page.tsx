import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { LeadRow } from '@codeminds/cms/schema';
import { SubmitButton } from '@/components/form';
import { requireStaff } from '@/lib/auth';
import { ENQUIRY_STATUSES, messageOf, STATUS_LABEL } from '@/lib/enquiries';
import { asUser } from '@/lib/session';
import { listStaff } from '@/lib/staff';
import { ROW_ID } from '@/lib/validation';
import { deleteEnquiry } from '../actions';
import EnquiryForm from './EnquiryForm';

export const metadata: Metadata = { title: 'Enquiry' };

export default async function EnquiryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!ROW_ID.test(id)) notFound();
  await requireStaff(`/enquiries/${id}`, 'admin');
  const { tablesDB, databaseId } = await asUser();
  const r = await tablesDB.getRow<LeadRow>({ databaseId, tableId: 'lead', rowId: id }).catch(() => null);
  if (!r) notFound();
  const staff = await listStaff();
  const fmt = new Intl.DateTimeFormat('en-GB', { dateStyle: 'full', timeStyle: 'short', timeZone: 'Asia/Kolkata' });
  const facts: [string, string][] = [
    ['Email', r.email],
    ['Received', `${fmt.format(new Date(r.$createdAt))} IST`],
    ['Building', r.project ?? '—'],
    ['Budget', r.budget ?? '—'],
    ['Timeline', r.timeline ?? '—'],
    ['Came via', r.source === 'api' ? 'API' : 'Contact form'],
    ['Email notification', r.emailDelivered === false ? 'Not delivered — reply from here' : r.emailDelivered ? 'Delivered' : '—'],
  ];
  return (
    <>
      <Link href="/enquiries" className="mb-4 inline-flex min-h-11 items-center text-sm text-fg-muted hover:text-fg">
        ← All enquiries
      </Link>
      <h1 className="mb-6 font-display text-3xl font-bold">{r.name}</h1>
      <div className="grid gap-6 lg:grid-cols-[3fr_2fr]">
        <section aria-labelledby="msg" className="rounded-2xl border border-line bg-surface p-6">
          <h2 id="msg" className="mb-4 font-display text-xl font-bold">Message</h2>
          <p className="whitespace-pre-wrap break-words">{messageOf(r)}</p>
          <dl className="mt-6 grid grid-cols-[9rem_1fr] gap-y-2 border-t border-line pt-4 text-sm">
            {facts.map(([k, v]) => (
              <div key={k} className="contents">
                <dt className="text-fg-muted">{k}</dt>
                <dd className="break-words">{k === 'Email' ? <a className="text-accent-ink underline underline-offset-4" href={`mailto:${v}`}>{v}</a> : v}</dd>
              </div>
            ))}
          </dl>
        </section>
        <div className="flex flex-col gap-6">
          <section aria-labelledby="handling" className="rounded-2xl border border-line bg-surface p-6">
            <h2 id="handling" className="mb-4 font-display text-xl font-bold">Handling</h2>
            <EnquiryForm
              id={r.$id}
              status={r.status}
              notes={r.notes ?? ''}
              assignedTo={r.assignedTo ?? ''}
              statuses={ENQUIRY_STATUSES.map((s) => [s, STATUS_LABEL[s]])}
              staff={staff.map((s) => ({ userId: s.userId, name: s.name }))}
            />
          </section>
          <section aria-labelledby="remove" className="rounded-2xl border border-line bg-surface p-6">
            <h2 id="remove" className="mb-2 font-display text-xl font-bold">Delete</h2>
            <details>
              <summary className="min-h-11 cursor-pointer content-center text-sm text-danger">Delete this enquiry…</summary>
              <form action={deleteEnquiry.bind(null, r.$id)} className="mt-2 flex flex-col gap-2">
                <p className="text-sm text-fg-muted">Permanent. Use for data-removal requests or obvious spam.</p>
                <SubmitButton tone="danger">Delete permanently</SubmitButton>
              </form>
            </details>
          </section>
        </div>
      </div>
    </>
  );
}
