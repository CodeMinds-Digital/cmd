'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { clearedSessionCookie, signOut as endSession } from '@codeminds/cms/session';
import { sessionSecret } from '@/lib/auth';

/** Ends the Appwrite session (not just the cookie), then returns to sign-in. */
export async function signOut() {
  const secret = await sessionSecret();
  if (secret) {
    try {
      await endSession(secret);
    } catch {
      // Already expired or revoked: clearing the cookie is enough.
    }
  }
  (await cookies()).set(clearedSessionCookie());
  redirect('/login?notice=signed_out');
}
