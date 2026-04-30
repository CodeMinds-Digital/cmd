import { logoutAction } from '@/app/admin/login/actions';
import type { AppwriteUser } from '@/lib/appwrite/session';

export default function TopBar({ user }: { user: AppwriteUser }) {
  return (
    <header className="border-b border-ink-700 bg-ink-900/60 backdrop-blur-md sticky top-0 z-10">
      <div className="px-8 py-4 flex items-center justify-between gap-6">
        <div>
          <p className="font-mono text-mono-sm text-paper-400">
            {user.email}
          </p>
        </div>

        <form action={logoutAction}>
          <button
            type="submit"
            className="font-mono text-mono-sm text-paper-300 hover:text-paper-50 transition-colors"
          >
            Sign out
          </button>
        </form>
      </div>
    </header>
  );
}
