'use client';

import { useFormStatus } from 'react-dom';

export type FormState = { status: 'idle' | 'error' | 'success'; message?: string };

export function SubmitButton({ children, tone = 'primary' }: { children: React.ReactNode; tone?: 'primary' | 'danger' | 'quiet' }) {
  const { pending } = useFormStatus();
  const styles = {
    primary: 'bg-inverse text-inverse-fg hover:bg-fg',
    danger: 'bg-danger text-white hover:opacity-90',
    quiet: 'border border-line-strong text-fg hover:bg-surface-sunk',
  }[tone];
  return (
    <button
      type="submit"
      disabled={pending}
      aria-disabled={pending}
      className={`inline-flex min-h-11 items-center justify-center rounded-full px-5 text-sm font-medium transition-colors disabled:opacity-60 ${styles}`}
    >
      {pending ? 'Working…' : children}
    </button>
  );
}

export function Field({
  label,
  name,
  type = 'text',
  autoComplete,
  required = true,
  hint,
  defaultValue,
  inputMode,
  pattern,
  maxLength,
  minLength,
}: {
  label: string;
  name: string;
  type?: string;
  autoComplete?: string;
  required?: boolean;
  hint?: string;
  defaultValue?: string;
  inputMode?: 'numeric' | 'text' | 'email';
  pattern?: string;
  maxLength?: number;
  minLength?: number;
}) {
  const hintId = hint ? `${name}-hint` : undefined;
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={name} className="text-sm font-medium text-fg">
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        autoComplete={autoComplete}
        required={required}
        defaultValue={defaultValue}
        inputMode={inputMode}
        pattern={pattern}
        maxLength={maxLength}
        minLength={minLength}
        aria-describedby={hintId}
        className="min-h-11 rounded-lg border border-line-strong bg-surface px-3 text-base text-fg"
      />
      {hint && (
        <p id={hintId} className="text-sm text-fg-muted">
          {hint}
        </p>
      )}
    </div>
  );
}

/** Result of the last submit, announced to screen readers. */
export function FormMessage({ state }: { state: FormState }) {
  if (state.status === 'idle' || !state.message) return <p role="status" aria-live="polite" className="sr-only" />;
  return (
    <p
      role={state.status === 'error' ? 'alert' : 'status'}
      className={`rounded-lg px-3 py-2 text-sm ${state.status === 'error' ? 'bg-danger/10 text-danger' : 'bg-surface-sunk text-fg'}`}
    >
      {state.message}
    </p>
  );
}
