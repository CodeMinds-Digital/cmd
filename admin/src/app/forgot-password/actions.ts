'use server';

import { headers } from 'next/headers';
import { z } from 'zod';
import { clientIp } from '@codeminds/cms/client-ip';
import { AppwriteException } from '@codeminds/cms/server';
import { createPublicClient } from '@codeminds/cms/session';
import type { FormState } from '@/components/form';
import { adminUrl } from '@/lib/env';
import { recoveryByIp } from '@/lib/rate-limits';

const SENT = 'If that email belongs to a staff account, a link to set a new password is on its way. It works for one hour.';

/** Same answer whether or not the account exists (no account probing). */
export async function requestReset(_prev: FormState, form: FormData): Promise<FormState> {
  const email = z.string().trim().toLowerCase().max(320).pipe(z.email()).safeParse(form.get('email'));
  if (!email.success) return { status: 'error', message: 'Enter a valid email address.' };
  if (!recoveryByIp.take(clientIp(await headers())).ok) return { status: 'error', message: 'Too many requests. Try again later.' };
  try {
    await createPublicClient().account.createRecovery({ email: email.data, url: `${adminUrl()}/reset-password` });
  } catch (e) {
    // The visitor still sees the neutral message (no account probing); the reason is only logged.
    console.error('Password recovery email NOT sent:', e instanceof AppwriteException ? `${e.code} ${e.type}: ${e.message}` : (e as Error).message);
  }
  return { status: 'success', message: SENT };
}
