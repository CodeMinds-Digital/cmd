'use client';

import { useActionState, useEffect, useRef } from 'react';
import { useFormStatus } from 'react-dom';
import { submitContact } from '@/app/actions/contact';
import Button from '@/components/ui/Button';
import Icon from '@/components/icons/Icon';
import {
  BUDGETS,
  CONTACT_LIMITS,
  HONEYPOT_FIELD,
  TIMELINES,
  type ContactField,
  type ContactFormState,
} from '@/lib/contact-options';
import { site } from '@/data/site';

const initialState: ContactFormState = { status: 'idle' };

/**
 * Project enquiry form. Submits through the `submitContact` server action,
 * so it also works before hydration / without JS. On an error the server
 * returns the submitted values; they're fed back as default values so the
 * form's automatic post-action reset restores what the visitor typed.
 */
export default function ContactForm() {
  const [state, formAction] = useActionState(submitContact, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  // After a failed submit, move focus to the first invalid field — or to the
  // error message when no single field is at fault — so it's announced.
  useEffect(() => {
    if (state.status !== 'error') return;
    const form = formRef.current;
    const target =
      form?.querySelector<HTMLElement>('[aria-invalid="true"]') ??
      form?.querySelector<HTMLElement>('[role="alert"]');
    target?.focus();
  }, [state]);

  if (state.status === 'success') {
    return (
      <div role="status" className="flex h-full flex-col justify-center gap-4 py-8">
        <span className="grid size-12 place-items-center rounded-full bg-accent text-accent-fg">
          <Icon name="check" className="size-6" />
        </span>
        <p className="text-step-3 font-bold font-display">Thanks — message received.</p>
        <p className="text-step-0 text-fg-muted">
          We reply within {site.replyWithin}. Anything urgent: <a href={`mailto:${site.email}`}>{site.email}</a>.
        </p>
      </div>
    );
  }

  const error = state.status === 'error' ? state : null;
  const value = (f: ContactField) => error?.values[f] ?? '';
  const fieldError = (f: ContactField) => error?.fieldErrors[f];

  return (
    <form ref={formRef} action={formAction} className="space-y-6">
      {error && (
        <p role="alert" tabIndex={-1} className="rounded-inner border border-red-700/30 bg-red-700/5 px-4 py-3 text-sm text-red-700">
          {error.message}
        </p>
      )}

      <div className="grid gap-6 @lg:grid-cols-2">
        <Field label="Name" name="name" autoComplete="name" required maxLength={CONTACT_LIMITS.name} defaultValue={value('name')} error={fieldError('name')} />
        <Field label="Email" name="email" type="email" autoComplete="email" required maxLength={CONTACT_LIMITS.email} defaultValue={value('email')} error={fieldError('email')} />
      </div>

      <Field
        label="What you're building"
        name="project"
        placeholder="Marketing rebuild · Mobile MVP · AI search"
        maxLength={CONTACT_LIMITS.project}
        defaultValue={value('project')}
        error={fieldError('project')}
      />

      <PillGroup legend="Budget" name="budget" options={BUDGETS} selected={value('budget')} error={fieldError('budget')} />
      <PillGroup legend="Timeline" name="timeline" options={TIMELINES} selected={value('timeline')} error={fieldError('timeline')} />

      <Field
        label="Tell us more"
        name="message"
        multiline
        required
        maxLength={CONTACT_LIMITS.message}
        defaultValue={value('message')}
        error={fieldError('message')}
      />

      {/* Honeypot — visually hidden and skipped by keyboard / assistive tech. */}
      <div aria-hidden className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label>
          Leave this empty
          <input type="text" name={HONEYPOT_FIELD} tabIndex={-1} autoComplete="off" defaultValue="" />
        </label>
      </div>

      <div className="flex flex-col items-start gap-4 pt-2 @md:flex-row @md:items-center">
        <SubmitButton />
        <span className="font-mono text-mono-xs uppercase text-fg-subtle">
          Or email {site.email}
        </span>
      </div>
    </form>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" arrow={!pending} disabled={pending} aria-disabled={pending}>
      {pending ? 'Sending…' : 'Send enquiry'}
    </Button>
  );
}

const inputClasses =
  'mt-2 block w-full rounded-inner border border-line-strong bg-canvas px-4 py-3 text-step-0 text-fg placeholder:text-fg-subtle transition-colors focus:border-fg focus:outline-2 focus:outline-offset-2 focus:outline-accent aria-invalid:border-red-700';

function Field({
  label,
  name,
  error,
  multiline = false,
  ...inputProps
}: {
  label: string;
  name: ContactField;
  error?: string;
  multiline?: boolean;
} & React.InputHTMLAttributes<HTMLInputElement> &
  React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const id = `contact-${name}`;
  const errorId = `${id}-error`;
  const shared = {
    id,
    name,
    'aria-invalid': error ? true : undefined,
    'aria-describedby': error ? errorId : undefined,
    className: inputClasses,
  };
  return (
    <div>
      <label htmlFor={id} className="font-mono text-mono-xs uppercase text-fg-muted">
        {label}
        {inputProps.required ? (
          <span aria-hidden className="text-accent-ink"> *</span>
        ) : (
          <span className="normal-case text-fg-subtle"> (optional)</span>
        )}
      </label>
      {multiline ? (
        <textarea rows={5} {...(inputProps as React.TextareaHTMLAttributes<HTMLTextAreaElement>)} {...shared} className={`${inputClasses} resize-y`} />
      ) : (
        <input type="text" {...(inputProps as React.InputHTMLAttributes<HTMLInputElement>)} {...shared} />
      )}
      {error && (
        <p id={errorId} className="mt-2 text-sm text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}

function PillGroup({
  legend,
  name,
  options,
  selected,
  error,
}: {
  legend: string;
  name: ContactField;
  options: readonly string[];
  selected: string;
  error?: string;
}) {
  const errorId = `contact-${name}-error`;
  return (
    <fieldset aria-describedby={error ? errorId : undefined}>
      <legend className="font-mono text-mono-xs uppercase text-fg-muted">
        {legend} <span className="normal-case text-fg-subtle">(optional)</span>
      </legend>
      <div className="mt-3 flex flex-wrap gap-2">
        {options.map((option) => (
          <label key={option} className="cursor-pointer">
            <input
              type="radio"
              name={name}
              value={option}
              defaultChecked={selected === option}
              className="peer sr-only"
            />
            <span className="inline-flex min-h-11 items-center rounded-full border border-line-strong px-4 text-sm text-fg transition-colors hover:border-fg peer-checked:border-inverse peer-checked:bg-inverse peer-checked:text-inverse-fg peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent">
              {option}
            </span>
          </label>
        ))}
      </div>
      {error && (
        <p id={errorId} className="mt-2 text-sm text-red-700">
          {error}
        </p>
      )}
    </fieldset>
  );
}
