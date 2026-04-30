'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { Account, Client, AppwriteException } from 'node-appwrite';
import { APPWRITE_ENDPOINT, APPWRITE_PROJECT_ID } from '@/lib/appwrite/env';
import { SESSION_COOKIE_OPTIONS } from '@/lib/appwrite/session';

export type LoginResult = { ok: true } | { ok: false; error: string };

export async function loginAction(formData: FormData): Promise<LoginResult> {
  const email = String(formData.get('email') ?? '').trim();
  const password = String(formData.get('password') ?? '');

  if (!email || !password) {
    return { ok: false, error: 'Email and password are required.' };
  }

  // Fresh client — no admin key, no existing session.
  const client = new Client()
    .setEndpoint(APPWRITE_ENDPOINT)
    .setProject(APPWRITE_PROJECT_ID);
  const account = new Account(client);

  try {
    const session = await account.createEmailPasswordSession(email, password);
    (await cookies()).set({
      ...SESSION_COOKIE_OPTIONS,
      value: session.secret,
    });
  } catch (e) {
    const msg =
      e instanceof AppwriteException
        ? e.message
        : 'Login failed. Please try again.';
    return { ok: false, error: msg };
  }

  return { ok: true };
}

export async function logoutAction(): Promise<void> {
  const cookieStore = await cookies();
  const session = cookieStore.get(SESSION_COOKIE_OPTIONS.name)?.value;
  if (session) {
    try {
      const client = new Client()
        .setEndpoint(APPWRITE_ENDPOINT)
        .setProject(APPWRITE_PROJECT_ID)
        .setSession(session);
      await new Account(client).deleteSession('current');
    } catch {
      // session may already be invalid; clearing the cookie is enough
    }
  }
  cookieStore.delete(SESSION_COOKIE_OPTIONS.name);
  redirect('/admin/login');
}
