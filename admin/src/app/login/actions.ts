'use server';

import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { writeAudit } from '@codeminds/cms/audit';
import { clientIp } from '@codeminds/cms/client-ip';
import { AuthenticationFactor, AppwriteException, adminClient } from '@codeminds/cms/server';
import { createSessionClient, sessionCookieOptions, signInWithPassword } from '@codeminds/cms/session';
import { isSafePath } from '@codeminds/cms/signing';
import type { FormState } from '@/components/form';
import { sessionSecret } from '@/lib/auth';
import { createHash } from 'node:crypto';
import { mfaBySession, signInByEmail, signInByIp } from '@/lib/rate-limits';

const credentials = z.object({
  email: z.string().trim().toLowerCase().max(320).pipe(z.email()),
  password: z.string().min(1).max(256),
});

const safeNext = (v: FormDataEntryValue | null) => (typeof v === 'string' && isSafePath(v) && !v.startsWith('/login') ? v : '/');

export async function signIn(_prev: FormState, form: FormData): Promise<FormState> {
  const parsed = credentials.safeParse({ email: form.get('email'), password: form.get('password') });
  if (!parsed.success) return { status: 'error', message: 'Enter your email and password.' };
  const { email, password } = parsed.data;

  const h = await headers();
  const ipLimit = signInByIp.take(clientIp(h));
  const emailLimit = signInByEmail.take(email);
  if (!ipLimit.ok || !emailLimit.ok) return { status: 'error', message: 'Too many attempts. Wait a few minutes and try again.' };

  let session: { secret: string; expire: string };
  try {
    session = await signInWithPassword(email, password, h.get('user-agent') ?? undefined);
  } catch (e) {
    // One message for wrong email, wrong password and blocked accounts: no account probing.
    if (e instanceof AppwriteException && e.code >= 400 && e.code < 500) return { status: 'error', message: 'Email or password is incorrect.' };
    // Not a credentials problem: configuration, network or Appwrite itself. See the [admin] startup line too.
    console.error('Sign-in failed (not a wrong password):', e instanceof AppwriteException ? `${e.code} ${e.type}: ${e.message}` : (e as Error).message);
    return { status: 'error', message: 'Sign-in is unavailable right now. Try again shortly.' };
  }

  const options = sessionCookieOptions(session.expire);
  (await cookies()).set({ ...options, value: session.secret });

  const next = safeNext(form.get('next'));
  try {
    const user = await createSessionClient(session.secret).account.get();
    await writeAudit(adminClient(), { actor: { id: user.$id, name: user.name || user.email }, action: 'auth.sign_in', tableId: 'auth', rowId: user.$id });
  } catch (e) {
    if (e instanceof AppwriteException && e.type === 'user_more_factors_required') redirect(`/login/mfa?next=${encodeURIComponent(next)}`);
    throw e;
  }
  redirect(next);
}

const otpSchema = z.object({
  mode: z.enum(['totp', 'recovery']),
  code: z.string().trim().regex(/^[A-Za-z0-9]{6,12}$/),
});

/** Second step: a code from the authenticator app, or one recovery code. */
export async function verifyMfa(_prev: FormState, form: FormData): Promise<FormState> {
  const parsed = otpSchema.safeParse({ mode: form.get('mode'), code: form.get('code') });
  if (!parsed.success) return { status: 'error', message: 'Enter the code from your authenticator app.' };
  const secret = await sessionSecret();
  if (!secret) redirect('/login');

  const sessionKey = createHash('sha256').update(secret).digest('hex');
  if (!mfaBySession.take(sessionKey).ok) return { status: 'error', message: 'Too many attempts. Wait a minute and try again.' };

  const s = createSessionClient(secret);
  try {
    const factor = parsed.data.mode === 'totp' ? AuthenticationFactor.Totp : AuthenticationFactor.Recoverycode;
    const challenge = await s.account.createMFAChallenge({ factor });
    await s.account.updateMFAChallenge({ challengeId: challenge.$id, otp: parsed.data.code });
  } catch (e) {
    if (e instanceof AppwriteException && e.code >= 400 && e.code < 500) return { status: 'error', message: 'That code didn’t work. Check the time on your phone and try again.' };
    console.error('MFA verification failed:', (e as Error).message);
    return { status: 'error', message: 'Verification is unavailable right now. Try again shortly.' };
  }
  const user = await s.account.get();
  await writeAudit(adminClient(), { actor: { id: user.$id, name: user.name || user.email }, action: 'auth.sign_in_mfa', tableId: 'auth', rowId: user.$id });
  redirect(safeNext(form.get('next')));
}
