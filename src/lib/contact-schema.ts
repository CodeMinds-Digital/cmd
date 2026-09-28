import { z } from 'zod';

/**
 * Contact form contract, shared by the client form (field names, options,
 * limits) and the server (validation). The server is authoritative.
 */

export const BUDGETS = ['$15–30k', '$30–60k', '$60k+', 'Not sure yet'] as const;
export const TIMELINES = ['ASAP', '1–3 months', 'Just exploring'] as const;

export const CONTACT_LIMITS = {
  name: 200,
  email: 320,
  project: 200,
  message: 5000,
} as const;

/** Hidden field real people never fill in; bots usually do. */
export const HONEYPOT_FIELD = 'company_website';

const emptyToUndefined = (v: unknown) => (typeof v === 'string' && v.trim() === '' ? undefined : v);

export const contactSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, { error: 'Tell us your name.' })
    .max(CONTACT_LIMITS.name, { error: 'That name is too long.' }),
  email: z
    .string()
    .trim()
    .max(CONTACT_LIMITS.email, { error: 'That email is too long.' })
    .pipe(z.email({ error: 'Enter a valid email address.' })),
  project: z.preprocess(
    emptyToUndefined,
    z.string().trim().max(CONTACT_LIMITS.project, { error: 'Keep this under 200 characters.' }).optional(),
  ),
  budget: z.preprocess(emptyToUndefined, z.enum(BUDGETS).optional()),
  timeline: z.preprocess(emptyToUndefined, z.enum(TIMELINES).optional()),
  message: z
    .string()
    .trim()
    .min(1, { error: 'Tell us a little about the project.' })
    .max(CONTACT_LIMITS.message, { error: 'Keep this under 5,000 characters.' }),
});

export type ContactInput = z.infer<typeof contactSchema>;
export type ContactField = keyof ContactInput;

export type ContactFormState =
  | { status: 'idle' }
  | { status: 'success' }
  | {
      status: 'error';
      message: string;
      fieldErrors: Partial<Record<ContactField, string>>;
      /** Submitted values, so the form can repopulate after a server round-trip. */
      values: Partial<Record<ContactField, string>>;
    };
