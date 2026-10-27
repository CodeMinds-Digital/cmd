import Link from 'next/link';
import SignOutButton from '@/components/SignOutButton';
import { getSessionState } from '@/lib/auth';

const NAV = [
  { href: '/', label: 'Dashboard', admin: false },
  { href: '/projects', label: 'Projects', admin: false },
  { href: '/journal', label: 'Journal', admin: false },
  { href: '/content', label: 'Site content', admin: false },
  { href: '/enquiries', label: 'Enquiries', admin: true },
  { href: '/staff', label: 'Staff', admin: true },
  { href: '/audit', label: 'Audit log', admin: true },
  { href: '/account', label: 'Account', admin: false },
];

/**
 * Staff shell. Navigation only: every page and action still checks the
 * session and role itself (lib/auth.ts requireStaff).
 */
export default async function StaffLayout({ children }: { children: React.ReactNode }) {
  const state = await getSessionState();
  const user = state.kind === 'user' ? state : null;
  const items = NAV.filter((n) => !n.admin || user?.role === 'admin');
  return (
    <div className="min-h-screen">
      <a href="#main" className="fixed left-4 top-4 z-50 -translate-y-24 rounded-full bg-inverse px-4 py-2 text-sm text-inverse-fg focus:translate-y-0">
        Skip to content
      </a>
      <header className="border-b border-line bg-surface">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <Link href="/" className="font-display text-lg font-bold text-fg">
            Codeminds<span className="text-accent">.</span> <span className="font-sans text-sm font-normal text-fg-muted">Admin</span>
          </Link>
          {user && (
            <>
              {/* Desktop: inline links. */}
              <nav aria-label="Admin" className="hidden flex-wrap items-center gap-1 lg:flex">
                {items.map((n) => (
                  <Link key={n.href} href={n.href} className="min-h-11 content-center rounded-full px-4 text-sm text-fg-muted hover:bg-surface-sunk hover:text-fg">
                    {n.label}
                  </Link>
                ))}
                <span className="px-2 text-sm text-fg-subtle">
                  {user.user.name} · {user.role === 'admin' ? 'Admin' : 'Editor'}
                </span>
                <SignOutButton />
              </nav>
              {/* Phones and tablets: a native disclosure (no script needed). */}
              <details className="relative lg:hidden">
                <summary className="flex min-h-11 cursor-pointer list-none items-center rounded-full border border-line-strong px-4 text-sm font-medium">Menu</summary>
                <nav aria-label="Admin" className="absolute right-0 z-50 mt-2 flex w-64 flex-col rounded-2xl border border-line bg-surface p-2 shadow-lg">
                  {items.map((n) => (
                    <Link key={n.href} href={n.href} className="min-h-11 content-center rounded-lg px-3 text-sm hover:bg-surface-sunk">
                      {n.label}
                    </Link>
                  ))}
                  <p className="border-t border-line px-3 pt-2 text-sm text-fg-subtle">
                    {user.user.name} · {user.role === 'admin' ? 'Admin' : 'Editor'}
                  </p>
                  <SignOutButton />
                </nav>
              </details>
            </>
          )}
        </div>
      </header>
      <main id="main" className="mx-auto max-w-6xl px-4 py-10">
        {children}
      </main>
    </div>
  );
}
