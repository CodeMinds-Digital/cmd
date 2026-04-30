import Link from 'next/link';
import { listRecentAudit, type AuditAction } from '@/lib/cms/audit';

const ACTION_STYLES: Record<AuditAction, string> = {
  create: 'bg-emerald-900/30 text-emerald-300',
  update: 'bg-ink-700 text-paper-200',
  delete: 'bg-red-900/30 text-red-300',
  publish: 'bg-emerald-900/30 text-emerald-300',
  unpublish: 'bg-ink-700 text-paper-300',
  review: 'bg-brand-400/20 text-brand-300',
  schedule: 'bg-yellow-900/30 text-yellow-300',
  archive: 'bg-ink-700 text-paper-400',
};

export const dynamic = 'force-dynamic';

export default async function AuditPage() {
  const entries = await listRecentAudit(100);

  return (
    <div className="max-w-5xl">
      <div className="mb-12">
        <p className="font-mono text-mono-sm text-paper-400 mb-3">— Audit log</p>
        <h1 className="text-h1 font-bold text-paper-50 text-balance">
          Who did <span className="font-serif italic font-normal text-brand-400">what</span>?
        </h1>
        <p className="text-body text-paper-300 mt-3">
          Last {entries.length} action{entries.length === 1 ? '' : 's'} — most recent first.
        </p>
      </div>

      {entries.length === 0 ? (
        <div className="border border-dashed border-ink-600 rounded-2xl p-12 text-center">
          <p className="text-body text-paper-300 italic">
            Nothing yet. Save a document to record the first entry.
          </p>
        </div>
      ) : (
        <ul className="border-t border-ink-600">
          {entries.map((e) => {
            const style = ACTION_STYLES[e.action] ?? ACTION_STYLES.update;
            const docHref = e.documentId
              ? `/admin/${e.collectionId}/${e.documentId}`
              : null;
            return (
              <li
                key={e.$id}
                className="border-b border-ink-600 grid grid-cols-12 gap-4 py-4 items-baseline"
              >
                <span className="col-span-3 font-mono text-mono-sm text-paper-400">
                  {new Date(e.$createdAt).toLocaleString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                  })}
                </span>
                <span className="col-span-2">
                  <span className={`font-mono text-mono-sm px-2 py-0.5 rounded-full ${style}`}>
                    {e.action}
                  </span>
                </span>
                <span className="col-span-3 font-mono text-mono-sm text-paper-300">
                  {e.collectionId}
                </span>
                <span className="col-span-4 text-body text-paper-100 truncate">
                  {docHref ? (
                    <Link
                      href={docHref}
                      className="hover:text-brand-400 transition-colors"
                    >
                      {e.documentLabel || e.documentId}
                    </Link>
                  ) : (
                    e.documentLabel || e.documentId
                  )}
                </span>
                <span className="col-span-12 font-mono text-mono-sm text-paper-400 -mt-1 ml-[25%]">
                  by {e.actor}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
