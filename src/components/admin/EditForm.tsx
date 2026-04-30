'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import Link from 'next/link';
import Field from './Field';
import WorkflowControls from './WorkflowControls';
import {
  validateField,
  type CollectionConfig,
} from '@/lib/admin/collections';
import {
  saveDocument,
  deleteDocument,
} from '@/app/admin/(authed)/[collection]/[id]/actions';

const WORKFLOW_COLLECTIONS = new Set(['caseStudy', 'journalPost']);

type EditFormProps = {
  cfg: CollectionConfig;
  documentId: string;
  doc: Record<string, unknown> | null;
};

export default function EditForm({ cfg, documentId, doc }: EditFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [pending, startTransition] = useTransition();
  const [deleting, startDelete] = useTransition();

  function runValidation(formData: FormData): Record<string, string> {
    const errors: Record<string, string> = {};
    for (const f of cfg.fields) {
      // Rich-text fields receive JSON strings; skip length checks against
      // raw JSON. Required is still checked (empty doc serialises to a
      // small but non-empty string, so this rarely flags).
      if (f.type === 'rich-text') continue;
      // Repeater fields submit JSON arrays — skip generic validation.
      if (
        f.type === 'approach-list' ||
        f.type === 'screens-list' ||
        f.type === 'metrics-list'
      )
        continue;
      const raw = formData.get(f.key);
      const v = typeof raw === 'string' ? raw : '';
      const err = validateField(f, v);
      if (err) errors[f.key] = err;
    }
    return errors;
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    const formData = new FormData(e.currentTarget);
    const localErrors = runValidation(formData);
    if (Object.keys(localErrors).length > 0) {
      setFieldErrors(localErrors);
      setError('Some fields need attention.');
      // Scroll to the first error so editors don't miss it.
      requestAnimationFrame(() => {
        const first = document.querySelector('[data-field-error]');
        first?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      });
      return;
    }
    setFieldErrors({});
    startTransition(async () => {
      const result = await saveDocument(cfg.id, documentId, formData);
      if (result.ok) {
        setSuccess(true);
        if (documentId === '_new') {
          router.replace(`/admin/${cfg.id}/${result.id}`);
        } else if (documentId === '_singleton') {
          router.replace(`/admin/${cfg.id}/${result.id}`);
        } else {
          router.refresh();
        }
        setTimeout(() => setSuccess(false), 4000);
      } else {
        setError(result.error);
      }
    });
  }

  function onDelete() {
    if (!confirm(`Delete this ${cfg.label.toLowerCase()}? This cannot be undone.`)) return;
    startDelete(async () => {
      await deleteDocument(cfg.id, documentId);
    });
  }

  const canDelete =
    !cfg.singleton &&
    documentId !== '_new' &&
    documentId !== '_singleton';

  const previewSlug = typeof doc?.slug === 'string' ? doc.slug : null;
  const previewBase =
    cfg.id === 'caseStudy'
      ? '/admin/preview/work/'
      : cfg.id === 'journalPost'
        ? '/admin/preview/journal/'
        : null;
  const previewHref =
    previewBase && previewSlug && documentId !== '_new'
      ? `${previewBase}${previewSlug}`
      : null;

  return (
    <form onSubmit={onSubmit} className="max-w-3xl space-y-8">
      {WORKFLOW_COLLECTIONS.has(cfg.id) &&
        documentId !== '_new' &&
        documentId !== '_singleton' &&
        typeof doc?.status === 'string' && (
          <WorkflowControls
            collectionId={cfg.id}
            documentId={documentId}
            currentStatus={doc.status}
            scheduledFor={
              typeof doc?.scheduledFor === 'string' ? doc.scheduledFor : null
            }
          />
        )}

      {previewHref && (
        <div className="-mt-2 flex justify-end">
          <Link
            href={previewHref}
            target="_blank"
            className="font-mono text-mono-sm text-paper-300 hover:text-brand-400 transition-colors"
          >
            Open preview ↗
          </Link>
        </div>
      )}

      {cfg.fields.map((f) => (
        <Field
          key={f.key}
          field={f}
          value={doc?.[f.key] ?? null}
          error={fieldErrors[f.key]}
        />
      ))}

      {error && (
        <p className="font-mono text-mono-sm text-red-400" role="alert">
          {error}
        </p>
      )}
      {success && (
        <p className="font-mono text-mono-sm text-brand-400">
          Saved.
        </p>
      )}

      <div className="flex items-center justify-between gap-4 pt-6 border-t border-ink-700">
        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={pending}
            className="btn-primary group disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {pending ? 'Saving…' : 'Save'}
            {!pending && (
              <span aria-hidden className="ml-2 transition-transform group-hover:translate-x-1">
                →
              </span>
            )}
          </button>
          <Link
            href={cfg.singleton ? '/admin' : `/admin/${cfg.id}`}
            className="font-mono text-mono-sm text-paper-300 hover:text-paper-50 transition-colors"
          >
            Cancel
          </Link>
        </div>

        {canDelete && (
          <button
            type="button"
            onClick={onDelete}
            disabled={deleting}
            className="font-mono text-mono-sm text-red-400 hover:text-red-300 transition-colors disabled:opacity-50"
          >
            {deleting ? 'Deleting…' : 'Delete'}
          </button>
        )}
      </div>
    </form>
  );
}
