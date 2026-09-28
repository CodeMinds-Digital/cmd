'use server';

import { z } from 'zod';
import { deliverContact } from '@/lib/contact';
import {
  contactSchema,
  HONEYPOT_FIELD,
  type ContactField,
  type ContactFormState,
} from '@/lib/contact-schema';

const FIELDS: ContactField[] = ['name', 'email', 'project', 'budget', 'timeline', 'message'];

/**
 * Contact form server action (used with useActionState). Works without
 * client JS: the form posts natively and the page re-renders with the state.
 */
export async function submitContact(
  _prev: ContactFormState,
  formData: FormData,
): Promise<ContactFormState> {
  // Honeypot: pretend it worked so bots don't learn anything.
  const trap = formData.get(HONEYPOT_FIELD);
  if (typeof trap === 'string' && trap.trim() !== '') return { status: 'success' };

  const raw = Object.fromEntries(
    FIELDS.map((f) => {
      const v = formData.get(f);
      return [f, typeof v === 'string' ? v : ''];
    }),
  ) as Record<ContactField, string>;

  const parsed = contactSchema.safeParse(raw);
  if (!parsed.success) {
    const { fieldErrors } = z.flattenError(parsed.error);
    return {
      status: 'error',
      message: 'Check the highlighted fields.',
      fieldErrors: Object.fromEntries(
        Object.entries(fieldErrors).map(([k, v]) => [k, v?.[0]]),
      ) as Partial<Record<ContactField, string>>,
      values: raw,
    };
  }

  const result = await deliverContact(parsed.data);
  if (!result.ok) {
    return {
      status: 'error',
      message:
        result.reason === 'not-configured'
          ? 'The form is temporarily unavailable. Please email cmd@codeminds.digital.'
          : 'We couldn’t send that. Please try again, or email cmd@codeminds.digital.',
      fieldErrors: {},
      values: raw,
    };
  }
  return { status: 'success' };
}
