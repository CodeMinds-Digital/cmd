import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Admin · Codeminds Digital',
  robots: 'noindex, nofollow',
};

/**
 * Top-level admin layout — passes children through. Auth gate + chrome
 * (sidebar + topbar) live in the `(authed)` route group so the login
 * page can render without them.
 */
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
