import { draftMode } from 'next/headers';
import { isDraft } from '@/lib/cms/repository';

/** Visible only in draft preview, so nobody mistakes drafts for the live site. */
export default async function DraftBanner() {
  if (!(await draftMode()).isEnabled) return null;
  const active = await isDraft();
  return (
    <div
      role="status"
      className="fixed inset-x-0 bottom-0 z-[10001] flex items-center justify-center gap-4 bg-inverse px-4 py-3 text-sm text-inverse-fg"
    >
      <span>{active ? 'Draft preview: unpublished changes are visible.' : 'Preview expired: showing the live site. Open a new preview from the admin.'}</span>
      {/* Route handler (sets a cookie), so a plain link rather than <Link>. */}
      <a href="/api/preview/exit" className="font-medium text-accent underline underline-offset-4">
        Exit preview
      </a>
    </div>
  );
}
