import { signOut } from '@/app/actions/session';

export default function SignOutButton() {
  return (
    <form action={signOut}>
      <button type="submit" className="min-h-11 rounded-full px-4 text-sm text-fg-muted hover:bg-surface-sunk hover:text-fg">
        Sign out
      </button>
    </form>
  );
}
