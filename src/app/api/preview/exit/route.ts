import { cookies, draftMode } from 'next/headers';
import { PREVIEW_COOKIE } from '@codeminds/cms/signing';
import { redirect } from 'next/navigation';

/** Leave draft preview and return to the published site. */
export async function GET() {
  (await draftMode()).disable();
  (await cookies()).delete(PREVIEW_COOKIE);
  redirect('/');
}
