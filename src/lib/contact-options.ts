/**
 * Contact form options, limits and state types — no runtime dependencies,
 * so the client form can import them without pulling zod into the browser
 * bundle. Validation lives in contact-schema.ts (server).
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

export type ContactField = 'name' | 'email' | 'project' | 'budget' | 'timeline' | 'message';

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
