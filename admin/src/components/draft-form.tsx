'use client';

import { useEffect, useRef, useState, useTransition, type RefObject } from 'react';
import type { SaveResult } from '@/app/(staff)/projects/actions';
import { quiet, Section, solid } from '@/components/editor';

/**
 * The draft workflow shared by the content editors: local document state,
 * save with per-field errors (focus moves to the first invalid field),
 * optimistic-concurrency token, unsaved-changes guard, and a pending flag.
 */
export function useDraftForm<T>({
  initial,
  draftUpdatedAt,
  draftStatus,
  save: saveAction,
  prepare = (d) => d,
  formRef,
}: {
  /** The editor's <form>, owned by the caller (focus moves to its first invalid field). */
  formRef: RefObject<HTMLFormElement | null>;
  initial: T;
  draftUpdatedAt: string | null;
  draftStatus: 'draft' | 'in_review' | null;
  save: (json: string, expectedUpdatedAt: string | null) => Promise<SaveResult>;
  prepare?: (d: T) => T;
}) {
  const [data, setData] = useState<T>(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<{ tone: 'ok' | 'error'; text: string } | null>(null);
  const [updatedAt, setUpdatedAtState] = useState(draftUpdatedAt);
  // Latest saved version, readable inside the same click handler that saved it.
  const version = useRef(draftUpdatedAt);
  const setUpdatedAt = (v: string | null) => {
    version.current = v;
    setUpdatedAtState(v);
  };
  const [status, setStatus] = useState(draftStatus);
  const [dirty, setDirty] = useState(false);
  const [pending, start] = useTransition();
  // Bumped on each failed save; the effect below runs after React has marked the fields invalid.
  const [focusRequest, setFocusRequest] = useState(0);

  useEffect(() => {
    if (focusRequest) formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
  }, [focusRequest, formRef]);

  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  const set = (patch: Partial<T>) => {
    setData((d) => ({ ...d, ...patch }));
    setDirty(true);
  };

  async function save(): Promise<boolean> {
    const r = await saveAction(JSON.stringify(prepare(data)), updatedAt);
    if (r.ok) {
      setErrors({});
      setUpdatedAt(r.updatedAt);
      setStatus('draft');
      setDirty(false);
      setMessage({ tone: 'ok', text: r.message });
      return true;
    }
    setErrors(r.fieldErrors ?? {});
    setMessage({ tone: 'error', text: r.message });
    setFocusRequest((n) => n + 1);
    return false;
  }

  const err = (key: string) => errors[key];
  const aria = (key: string) => (errors[key] ? { 'aria-invalid': true as const, 'aria-describedby': `err-${key}` } : {});
  const run = (fn: () => Promise<unknown>) => start(async () => void (await fn()));

  /** The draft version on screen; publish sends it so nobody publishes changes they haven't seen. */
  const currentVersion = () => version.current;

  return { data, set, errors, err, aria, message, setMessage, updatedAt, setUpdatedAt, status, setStatus, dirty, pending, run, save, currentVersion };
}

/** What the bar and danger zone need from useDraftForm (independent of the document type). */
type Form = Pick<
  ReturnType<typeof useDraftForm<unknown>>,
  'message' | 'setMessage' | 'updatedAt' | 'setUpdatedAt' | 'status' | 'setStatus' | 'dirty' | 'pending' | 'run' | 'save' | 'currentVersion'
>;

/** Sticky bar: status line, Discard, Preview, Save, Submit (Editors) / Publish (Admins). */
export function ActionBar({
  form: f,
  isAdmin,
  previewLink,
  submit,
  publish,
  discard,
}: {
  form: Form;
  isAdmin: boolean;
  previewLink: () => Promise<{ url: string } | { error: string }>;
  submit: () => Promise<SaveResult>;
  /** Called with the draft version on screen; the server refuses if it has changed since. */
  publish: (expectedUpdatedAt: string | null) => Promise<SaveResult | void>;
  discard: () => Promise<void>;
}) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-4 py-3">
        <p role={f.message?.tone === 'error' ? 'alert' : 'status'} className={`mr-auto text-sm ${f.message?.tone === 'error' ? 'text-danger' : 'text-fg-muted'}`}>
          {f.pending ? 'Working…' : (f.message?.text ?? (f.dirty ? 'Unsaved changes' : f.status ? 'Draft saved' : 'No unpublished changes'))}
        </p>
        {f.updatedAt && !f.dirty && (
          <button type="button" className={quiet} disabled={f.pending} onClick={() => f.run(discard)}>
            Discard draft
          </button>
        )}
        <button
          type="button"
          className={quiet}
          disabled={f.pending}
          onClick={() => {
            // Open the tab now (popup blockers), point it at the signed link once ready.
            const tab = window.open('about:blank', '_blank');
            f.run(async () => {
              if ((f.dirty || !f.updatedAt) && !(await f.save())) return tab?.close();
              const r = await previewLink();
              if ('url' in r && tab) {
                tab.opener = null;
                tab.location.href = r.url;
              } else {
                tab?.close();
                if ('error' in r) f.setMessage({ tone: 'error', text: r.error });
              }
            });
          }}
        >
          Preview
        </button>
        <button type="submit" className={quiet} disabled={f.pending}>
          Save draft
        </button>
        {!isAdmin && f.updatedAt && !f.dirty && f.status === 'draft' && (
          <button
            type="button"
            className={solid}
            disabled={f.pending}
            onClick={() =>
              f.run(async () => {
                const r = await submit();
                f.setMessage({ tone: r.ok ? 'ok' : 'error', text: r.message });
                if (r.ok) {
                  f.setStatus('in_review');
                  f.setUpdatedAt(r.updatedAt);
                }
              })
            }
          >
            Submit for review
          </button>
        )}
        {isAdmin && (
          <button
            type="button"
            className={solid}
            disabled={f.pending || (!f.updatedAt && !f.dirty)}
            onClick={() =>
              f.run(async () => {
                if (f.dirty && !(await f.save())) return;
                const r = await publish(f.currentVersion());
                if (r && !r.ok) f.setMessage({ tone: 'error', text: r.message });
              })
            }
          >
            Publish
          </button>
        )}
      </div>
    </div>
  );
}

/** Admin-only: hide/show on the site, delete (with a confirmation step). */
export function DangerZone({
  form: f,
  live,
  title,
  deleteNote,
  setVisible,
  remove,
}: {
  form: Form;
  live: 'published' | 'unpublished' | null;
  title: string;
  deleteNote: string;
  setVisible: (visible: boolean) => Promise<void>;
  remove: () => Promise<void>;
}) {
  return (
    <Section title="Danger zone">
      <div className="flex flex-wrap gap-3">
        {live === 'published' && (
          <button type="button" className={quiet} disabled={f.pending} onClick={() => f.run(() => setVisible(false))}>
            Hide from site
          </button>
        )}
        {live === 'unpublished' && (
          <button type="button" className={quiet} disabled={f.pending} onClick={() => f.run(() => setVisible(true))}>
            Show on site again
          </button>
        )}
        <details>
          <summary className={`${quiet} cursor-pointer text-danger`}>Delete…</summary>
          <div className="mt-3 flex flex-col gap-2">
            <p className="text-sm text-fg-muted">{deleteNote}</p>
            <button type="button" className="inline-flex min-h-11 items-center justify-center rounded-full bg-danger px-5 text-sm font-medium text-white" disabled={f.pending} onClick={() => f.run(remove)}>
              Delete “{title}”
            </button>
          </div>
        </details>
      </div>
    </Section>
  );
}
