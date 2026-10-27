import 'server-only';
import { readPublicEnv } from '@codeminds/cms/env';
import { createSessionClient } from '@codeminds/cms/session';
import { sessionSecret } from '@/lib/auth';

/** Appwrite as the signed-in staff member (call after requireStaff). */
export async function asUser() {
  const secret = await sessionSecret();
  if (!secret) throw new Error('Not signed in.');
  return { ...createSessionClient(secret), databaseId: readPublicEnv().databaseId };
}
