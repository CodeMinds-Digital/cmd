'use server';

import { z } from 'zod';
import { writeAudit } from '@codeminds/cms/audit';
import { AppwriteException, AuthenticatorType, adminClient } from '@codeminds/cms/server';
import { createSessionClient } from '@codeminds/cms/session';
import type { FormState } from '@/components/form';
import { requireStaff, sessionSecret } from '@/lib/auth';
import { MIN_PASSWORD } from '@/lib/password';

export type MfaState =
  | { step: 'start'; error?: string }
  | { step: 'verify'; qr: string; secret: string; error?: string }
  | { step: 'done'; codes: string[] };

async function me() {
  const staff = await requireStaff('/account');
  return { staff, s: createSessionClient((await sessionSecret())!) };
}

/** Two-factor setup: create a TOTP authenticator, verify one code, then turn MFA on and issue recovery codes. */
export async function mfaStep(prev: MfaState, form: FormData): Promise<MfaState> {
  const { staff, s } = await me();
  if (prev.step === 'start') {
    try {
      const { secret, uri } = await s.account.createMFAAuthenticator({ type: AuthenticatorType.Totp });
      const png = await s.avatars.getQR({ text: uri, size: 240, margin: 1 });
      return { step: 'verify', secret, qr: `data:image/png;base64,${Buffer.from(png).toString('base64')}` };
    } catch (e) {
      console.error('MFA setup failed:', (e as Error).message);
      return { step: 'start', error: 'Couldn’t start setup. If an authenticator is already linked, remove it in Appwrite or ask an Admin.' };
    }
  }
  if (prev.step === 'verify') {
    const otp = z.string().trim().regex(/^\d{6}$/).safeParse(form.get('otp'));
    if (!otp.success) return { ...prev, error: 'Enter the 6-digit code from the app.' };
    try {
      await s.account.updateMFAAuthenticator({ type: AuthenticatorType.Totp, otp: otp.data });
      await s.account.updateMFA({ mfa: true });
      const { recoveryCodes } = await s.account.createMFARecoveryCodes();
      await writeAudit(adminClient(), { actor: { id: staff.id, name: staff.name }, action: 'auth.mfa_enabled', tableId: 'auth', rowId: staff.id });
      return { step: 'done', codes: recoveryCodes };
    } catch (e) {
      if (e instanceof AppwriteException && e.code < 500) return { ...prev, error: 'That code didn’t work. Check the time on your phone and try again.' };
      console.error('MFA verification failed:', (e as Error).message);
      return { ...prev, error: 'Couldn’t verify right now. Try again shortly.' };
    }
  }
  return prev;
}

const passwordSchema = z
  .object({ current: z.string().min(1).max(256), password: z.string().min(MIN_PASSWORD).max(256), confirm: z.string() })
  .refine((v) => v.password === v.confirm, { path: ['confirm'] });

export async function changePassword(_prev: FormState, form: FormData): Promise<FormState> {
  const { staff, s } = await me();
  const parsed = passwordSchema.safeParse({ current: form.get('current'), password: form.get('password'), confirm: form.get('confirm') });
  if (!parsed.success) {
    const confirmIssue = parsed.error.issues.some((i) => i.path[0] === 'confirm');
    return { status: 'error', message: confirmIssue ? 'The two new passwords don’t match.' : `Use at least ${MIN_PASSWORD} characters.` };
  }
  try {
    await s.account.updatePassword({ password: parsed.data.password, oldPassword: parsed.data.current });
  } catch (e) {
    if (e instanceof AppwriteException && e.code === 401) return { status: 'error', message: 'Your current password is incorrect.' };
    if (e instanceof AppwriteException && e.code === 400) return { status: 'error', message: 'Choose a longer, less common password that doesn’t contain your name or email.' };
    console.error('Password change failed:', (e as Error).message);
    return { status: 'error', message: 'Couldn’t change the password right now.' };
  }
  // A changed password should lock out anyone else using the old one: end every other session.
  const { sessions } = await s.account.listSessions();
  await Promise.all(sessions.filter((x) => !x.current).map((x) => s.account.deleteSession({ sessionId: x.$id }).catch(() => {})));
  await writeAudit(adminClient(), { actor: { id: staff.id, name: staff.name }, action: 'auth.password_changed', tableId: 'auth', rowId: staff.id, summary: `Other sessions ended: ${sessions.length - 1}` });
  return { status: 'success', message: 'Password changed. You’ve been signed out everywhere else.' };
}
