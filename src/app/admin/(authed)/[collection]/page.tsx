import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { databases, Query } from '@/lib/appwrite/server';
import { APPWRITE_DATABASE_ID } from '@/lib/appwrite/env';
import { getCollection } from '@/lib/admin/collections';

type Params = { collection: string };

export default async function CollectionListPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { collection: collectionId } = await params;
  const cfg = getCollection(collectionId);
  if (!cfg) notFound();

  // Singletons skip the list — jump straight to edit (single doc id = collection id)
  if (cfg.singleton) {
    redirect(`/admin/${cfg.id}/_singleton`);
  }

  const docs = await databases.listDocuments(APPWRITE_DATABASE_ID, cfg.id, [
    Query.limit(100),
    Query.orderDesc('$updatedAt'),
  ]);

  const titleField = cfg.titleField ?? 'label';
  const cols = cfg.listColumns.length > 0 ? cfg.listColumns : [titleField];

  return (
    <div className="max-w-6xl">
      <div className="flex items-end justify-between mb-12">
        <div>
          <p className="font-mono text-mono-sm text-paper-400 mb-3">
            — {cfg.id}
          </p>
          <h1 className="text-h1 font-bold text-paper-50">{cfg.label}</h1>
          <p className="font-mono text-mono-sm text-paper-400 mt-2">
            {docs.total} {docs.total === 1 ? 'document' : 'documents'}
          </p>
        </div>

        <Link
          href={`/admin/${cfg.id}/_new`}
          className="btn-primary group"
        >
          New {cfg.label.toLowerCase().replace(/s$/, '')}
          <span aria-hidden className="ml-2 transition-transform group-hover:translate-x-1">
            →
          </span>
        </Link>
      </div>

      {docs.total === 0 ? (
        <div className="border border-dashed border-ink-600 rounded-2xl p-12 text-center">
          <p className="text-body text-paper-300 italic">
            No {cfg.label.toLowerCase()} yet.
          </p>
          <Link
            href={`/admin/${cfg.id}/_new`}
            className="font-mono text-mono-sm text-brand-400 hover:text-paper-50 mt-4 inline-block transition-colors"
          >
            Create the first one →
          </Link>
        </div>
      ) : (
        <div className="border border-ink-600 rounded-2xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-ink-600 bg-ink-800/50">
                {cols.map((col) => (
                  <th
                    key={col}
                    className="text-left font-mono text-mono-sm text-paper-400 px-6 py-3"
                  >
                    {col}
                  </th>
                ))}
                <th className="font-mono text-mono-sm text-paper-400 px-6 py-3 w-px whitespace-nowrap">
                  Updated
                </th>
              </tr>
            </thead>
            <tbody>
              {docs.documents.map((doc) => (
                <tr
                  key={doc.$id}
                  className="border-b border-ink-700 last:border-0 hover:bg-ink-800/40 transition-colors"
                >
                  {cols.map((col, i) => {
                    const value = (doc as Record<string, unknown>)[col];
                    const display =
                      typeof value === 'string' || typeof value === 'number'
                        ? String(value)
                        : value === null || value === undefined
                          ? '—'
                          : JSON.stringify(value);
                    return (
                      <td key={col} className="px-6 py-4">
                        {i === 0 ? (
                          <Link
                            href={`/admin/${cfg.id}/${doc.$id}`}
                            className="text-body text-paper-50 hover:text-brand-400 transition-colors"
                          >
                            {display}
                          </Link>
                        ) : (
                          <span className="text-body text-paper-200">
                            {display}
                          </span>
                        )}
                      </td>
                    );
                  })}
                  <td className="px-6 py-4 font-mono text-mono-sm text-paper-400 whitespace-nowrap">
                    {new Date(doc.$updatedAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
