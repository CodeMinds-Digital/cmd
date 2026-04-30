import Link from 'next/link';
import { databases } from '@/lib/appwrite/server';
import { APPWRITE_DATABASE_ID } from '@/lib/appwrite/env';
import { collections } from '@/lib/admin/collections';

async function getCounts() {
  const counts: Record<string, number> = {};
  for (const c of collections) {
    try {
      const res = await databases.listDocuments(APPWRITE_DATABASE_ID, c.id, []);
      counts[c.id] = res.total;
    } catch {
      counts[c.id] = -1;
    }
  }
  return counts;
}

export default async function AdminHome() {
  const counts = await getCounts();

  return (
    <div className="max-w-5xl">
      <div className="mb-12">
        <p className="font-mono text-mono-sm text-paper-400 mb-3">— Overview</p>
        <h1 className="text-h1 font-bold text-paper-50 text-balance">
          What needs your{' '}
          <span className="font-serif italic font-normal text-brand-400">
            attention?
          </span>
        </h1>
      </div>

      <ul className="border-t border-ink-600">
        {collections.map((c) => {
          const count = counts[c.id];
          const isUnknown = count === -1;
          const href = c.singleton
            ? `/admin/${c.id}`
            : `/admin/${c.id}`;

          return (
            <li key={c.id} className="border-b border-ink-600">
              <Link
                href={href}
                className="grid grid-cols-12 gap-4 md:gap-8 py-6 group hover:bg-ink-800/40 transition-colors px-2 md:px-4 -mx-2 md:-mx-4"
              >
                <div className="col-span-2 font-mono text-mono-sm text-brand-400">
                  {c.id}
                </div>
                <div className="col-span-7">
                  <h3 className="text-h3 font-semibold text-paper-50 group-hover:text-brand-400 transition-colors">
                    {c.label}
                  </h3>
                  <p className="font-mono text-mono-sm text-paper-400 mt-1">
                    {c.singleton
                      ? 'Singleton — one document'
                      : `${c.fields.length} fields`}
                  </p>
                </div>
                <div className="col-span-3 text-right self-center">
                  {isUnknown ? (
                    <span className="font-mono text-mono-sm text-red-400">
                      Error
                    </span>
                  ) : c.singleton ? (
                    <span className="font-mono text-mono-sm text-paper-400">
                      {count > 0 ? 'Configured' : 'Not yet set'} →
                    </span>
                  ) : (
                    <span className="text-h3 font-bold text-paper-50">
                      {count}
                      <span className="font-mono text-mono-sm text-paper-400 ml-2">
                        items
                      </span>
                    </span>
                  )}
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
