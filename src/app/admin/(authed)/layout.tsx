import Sidebar from '@/components/admin/Sidebar';
import TopBar from '@/components/admin/TopBar';
import { requireUser } from '@/lib/appwrite/session';

/**
 * Authed admin shell. Anything under (authed)/ requires a valid Appwrite
 * session — `requireUser()` redirects to /admin/login otherwise.
 */
export default async function AuthedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();

  return (
    <div className="min-h-dvh bg-ink-900 text-paper-100 flex">
      <Sidebar />
      <div className="flex-1 min-w-0">
        <TopBar user={user} />
        <main className="px-8 py-10">{children}</main>
      </div>
    </div>
  );
}
