'use client';

/** Form building blocks shared by the content editors (projects, journal). */
import { useId, useState } from 'react';

export type Image = { src?: string; fileId?: string };

export const input = 'min-h-11 w-full rounded-lg border border-line-strong bg-surface px-3 text-base text-fg aria-[invalid=true]:border-danger';
export const area = 'w-full rounded-lg border border-line-strong bg-surface px-3 py-2 text-base text-fg aria-[invalid=true]:border-danger';
export const quiet = 'inline-flex min-h-11 items-center justify-center rounded-full border border-line-strong px-4 text-sm font-medium hover:bg-surface-sunk disabled:opacity-50';
export const solid = 'inline-flex min-h-11 items-center justify-center rounded-full bg-inverse px-5 text-sm font-medium text-inverse-fg hover:bg-fg disabled:opacity-50';

export const slugify = (s: string) => s.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80);

export function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-6 rounded-2xl border border-line bg-surface p-6">
      <h2 className="mb-4 font-display text-xl font-bold">{title}</h2>
      <div className="flex flex-col gap-4">{children}</div>
    </section>
  );
}

export function FieldError({ id, text }: { id: string; text?: string }) {
  return text ? (
    <p id={`err-${id}`} className="text-sm text-danger">
      {text}
    </p>
  ) : null;
}

export type FieldProps = {
  label: string;
  /** Screen-reader-only context for repeated fields, e.g. "Step 02". */
  context?: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  name: string;
  aria: object;
  max?: number;
};

export function Label({ htmlFor, label, context }: { htmlFor: string; label: string; context?: string }) {
  return (
    <label htmlFor={htmlFor} className="text-sm font-medium">
      {context && <span className="sr-only">{context} </span>}
      {label}
    </label>
  );
}

export function Text({ label, context, value, onChange, error, name, aria, max, type = 'text', inputMode }: FieldProps & { type?: string; inputMode?: 'numeric' }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={name} label={label} context={context} />
      <input id={name} type={type} inputMode={inputMode} className={input} value={value} maxLength={max} onChange={(e) => onChange(e.target.value)} {...aria} />
      <FieldError id={name} text={error} />
    </div>
  );
}

export function Area({ label, context, value, onChange, error, name, aria, max, rows = 3 }: FieldProps & { rows?: number }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={name} label={label} context={context} />
      <textarea id={name} rows={rows} className={area} value={value} maxLength={max} onChange={(e) => onChange(e.target.value)} {...aria} />
      {max && <p className="text-xs text-fg-subtle">{value.length} / {max}</p>}
      <FieldError id={name} text={error} />
    </div>
  );
}

export function ImageField({ label, context, url, onChange, error }: { label: string; context?: string; url: string | null; onChange: (i: Image) => void; error?: string }) {
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);
  const id = useId();
  async function upload(file: File) {
    setBusy(true);
    setProblem(null);
    const body = new FormData();
    body.set('file', file);
    const res = await fetch('/api/upload', { method: 'POST', body }).catch(() => null);
    const json = res ? ((await res.json().catch(() => ({}))) as { fileId?: string; error?: string }) : { error: 'Upload failed. Check your connection.' };
    setBusy(false);
    if (json.fileId) onChange({ fileId: json.fileId });
    else setProblem(json.error ?? 'Upload failed.');
  }
  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-medium">{label}</span>
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element -- admin thumbnail of a remote/uploaded image
        <img src={url} alt="" className="h-32 w-auto self-start rounded-lg border border-line object-contain" />
      ) : (
        <p className="text-sm text-fg-muted">No image.</p>
      )}
      <div className="flex flex-wrap items-center gap-2">
        <label htmlFor={id} className={`${quiet} cursor-pointer`}>
          {busy ? 'Uploading…' : url ? 'Replace image' : 'Upload image'}
          <span className="sr-only"> ({context ? `${context} ` : ''}{label})</span>
        </label>
        <input id={id} type="file" accept="image/png,image/jpeg,image/webp,image/avif,image/gif" className="sr-only" disabled={busy} onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
        {url && (
          <button type="button" className={quiet} onClick={() => onChange({})}>
            Remove image
          </button>
        )}
      </div>
      <p className="text-xs text-fg-subtle">PNG, JPEG, WebP, AVIF or GIF, up to 10 MB.</p>
      {(problem || error) && (
        <p role="alert" className="text-sm text-danger">
          {problem ?? error}
        </p>
      )}
    </div>
  );
}

export function Repeater<T>({
  title,
  items,
  empty,
  onChange,
  render,
  itemLabel,
  addLabel,
  max,
}: {
  title: string;
  /** Button text, e.g. "Add step". */
  addLabel: string;
  items: T[];
  empty: T;
  onChange: (items: T[]) => void;
  render: (item: T, i: number, update: (patch: Partial<T>) => void) => React.ReactNode;
  itemLabel: (i: number) => string;
  max: number;
}) {
  const move = (i: number, j: number) => {
    const next = [...items];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };
  return (
    <Section title={title}>
      {items.length === 0 && <p className="text-sm text-fg-muted">None yet.</p>}
      <ol className="flex flex-col gap-4">
        {items.map((item, i) => (
          <li key={i} className="rounded-xl border border-line p-4">
            <div className="mb-3 flex items-center gap-1">
              <h3 className="mr-auto text-sm font-medium text-fg-muted">{itemLabel(i)}</h3>
              <button type="button" aria-label={`Move ${itemLabel(i)} up`} disabled={i === 0} onClick={() => move(i, i - 1)} className="grid size-11 place-items-center rounded-full hover:bg-surface-sunk disabled:opacity-30">
                ↑
              </button>
              <button type="button" aria-label={`Move ${itemLabel(i)} down`} disabled={i === items.length - 1} onClick={() => move(i, i + 1)} className="grid size-11 place-items-center rounded-full hover:bg-surface-sunk disabled:opacity-30">
                ↓
              </button>
              <button type="button" aria-label={`Remove ${itemLabel(i)}`} onClick={() => onChange(items.filter((_, n) => n !== i))} className="grid size-11 place-items-center rounded-full text-danger hover:bg-surface-sunk">
                ✕
              </button>
            </div>
            <div className="flex flex-col gap-4">{render(item, i, (patch) => onChange(items.map((x, n) => (n === i ? { ...x, ...patch } : x))))}</div>
          </li>
        ))}
      </ol>
      {items.length < max && (
        <button type="button" className={`${quiet} self-start`} onClick={() => onChange([...items, { ...empty }])}>
          {addLabel}
        </button>
      )}
    </Section>
  );
}
