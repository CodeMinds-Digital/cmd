import { z } from 'zod';
import { BUDGETS, CONTACT_LIMITS, TIMELINES, type ContactField } from '@/lib/contact-options';

/**
 * Server-side validation for the contact form. Plain options/limits/types
 * live in contact-options.ts so the client bundle never imports zod.
 */

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

// Compile-time check: the schema's keys and ContactField must stay in sync.
type _SameKeys = [keyof ContactInput] extends [ContactField]
  ? [ContactField] extends [keyof ContactInput]
    ? true
    : never
  : never;
const _fieldsMatch: _SameKeys = true;
void _fieldsMatch;
