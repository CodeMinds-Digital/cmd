'use server';

import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { clientIp } from '@codeminds/cms/client-ip';
import { AppwriteException } from '@codeminds/cms/server';
import { createPublicClient } from '@codeminds/cms/session';
import type { FormState } from '@/components/form';
import { MIN_PASSWORD } from '@/lib/password';
import { recoveryByIp } from '@/lib/rate-limits';

const schema = z
  .object({
    userId: z.string().regex(/^[a-zA-Z0-9._-]{1,36}$/),
    secret: z.string().min(1).max(512),
    password: z.string().min(MIN_PASSWORD).max(256),
    confirm: z.string(),
  })
  .refine((v) => v.password === v.confirm, { path: ['confirm'] });

/** Sets a password from an emailed link (forgotten password, or a new staff invite). */
export async function setPassword(_prev: FormState, form: FormData): Promise<FormState> {
  const parsed = schema.safeParse(Object.fromEntries(['userId', 'secret', 'password', 'confirm'].map((k) => [k, form.get(k)])));
  if (!parsed.success) {
    const confirmIssue = parsed.error.issues.some((i) => i.path[0] === 'confirm');
    return { status: 'error', message: confirmIssue ? 'The two passwords don’t match.' : `Use at least ${MIN_PASSWORD} characters.` };
  }
  if (!recoveryByIp.take(clientIp(await headers())).ok) return { status: 'error', message: 'Too many attempts. Try again later.' };
  try {
    await createPublicClient().account.updateRecovery({ userId: parsed.data.userId, secret: parsed.data.secret, password: parsed.data.password });
  } catch (e) {
    if (e instanceof AppwriteException && e.type === 'password_personal_data') return { status: 'error', message: 'Don’t use your name or email in the password.' };
    if (e instanceof AppwriteException && e.type === 'password_recently_used') return { status: 'error', message: 'Choose a password you haven’t used recently.' };
    if (e instanceof AppwriteException && e.code === 400) return { status: 'error', message: 'That password is too common. Choose a longer, less guessable one.' };
    if (e instanceof AppwriteException && e.code === 401) return { status: 'error', message: 'This link has expired or was already used. Ask for a new one.' };
    console.error('Password reset failed:', (e as Error).message);
    return { status: 'error', message: 'Couldn’t set the password right now. Try again shortly.' };
  }
  redirect('/login?notice=reset');
}
