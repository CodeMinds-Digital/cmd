'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { collections } from '@/lib/admin/collections';

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 shrink-0 border-r border-ink-700 bg-ink-900/60 backdrop-blur-md min-h-dvh sticky top-0">
      <div className="px-6 py-8 border-b border-ink-700">
        <Link
          href="/admin"
          className="font-semibold text-paper-50 tracking-tight hover:text-brand-400 transition-colors block"
        >
          Codeminds
          <span className="text-paper-400 font-mono mx-1">·</span>
          <span className="font-normal text-paper-400">Admin</span>
        </Link>
        <p className="font-mono text-mono-sm text-paper-400 mt-2">v2026.1</p>
      </div>

      <nav className="px-4 py-6" aria-label="Admin sections">
        <p className="font-mono text-mono-sm text-paper-400 px-2 mb-3">
          Collections
        </p>
        <ul className="space-y-1">
          {collections.map((c) => {
            const href = c.singleton ? `/admin/${c.id}` : `/admin/${c.id}`;
            const active = pathname.startsWith(href);
            return (
              <li key={c.id}>
                <Link
                  href={href}
                  className={`block px-3 py-2 rounded-lg text-body transition-colors ${
                    active
                      ? 'bg-ink-800 text-paper-50'
                      : 'text-paper-300 hover:bg-ink-800/50 hover:text-paper-100'
                  }`}
                >
                  {c.label}
                </Link>
              </li>
            );
          })}
        </ul>

        <p className="font-mono text-mono-sm text-paper-400 px-2 mt-8 mb-3">
          Workflow
        </p>
        <ul className="space-y-1">
          <li>
            <Link
              href="/admin/audit"
              className={`block px-3 py-2 rounded-lg text-body transition-colors ${
                pathname === '/admin/audit'
                  ? 'bg-ink-800 text-paper-50'
                  : 'text-paper-300 hover:bg-ink-800/50 hover:text-paper-100'
              }`}
            >
              Audit log
            </Link>
          </li>
        </ul>

        <p className="font-mono text-mono-sm text-paper-400 px-2 mt-8 mb-3">
          Site
        </p>
        <ul className="space-y-1">
          <li>
            <Link
              href="/"
              target="_blank"
              className="block px-3 py-2 rounded-lg text-body text-paper-300 hover:bg-ink-800/50 hover:text-paper-100 transition-colors"
            >
              View live site ↗
            </Link>
          </li>
        </ul>
      </nav>
    </aside>
  );
}
