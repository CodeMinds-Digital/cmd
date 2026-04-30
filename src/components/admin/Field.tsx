import dynamic from 'next/dynamic';
import type { FieldConfig } from '@/lib/admin/collections';
import ImageUploader from './ImageUploader';
import ApproachEditor from './ApproachEditor';
import ScreensEditor from './ScreensEditor';
import MetricsEditor from './MetricsEditor';
import LogoFieldset from './site-settings/LogoFieldset';
import type { SiteSettings } from '@/lib/cms/site-settings';
import type { FontKey } from '@/app/fonts';

// TipTap is ~150KB — only ship it on routes that actually edit rich text.
const RichTextEditor = dynamic(
  () => import('./rich-text/RichTextEditor'),
  {
    ssr: false,
    loading: () => (
      <div className="border border-ink-600 rounded-lg p-6 text-paper-400 font-mono text-mono-sm">
        Loading editor…
      </div>
    ),
  },
);

type FieldProps = {
  field: FieldConfig;
  value: unknown;
  /** The full document — used by composite fields (e.g. logo-mode). */
  doc?: Partial<SiteSettings> & Record<string, unknown>;
};

const inputClass =
  'w-full bg-transparent border-b border-ink-600 focus:border-paper-50 outline-none text-lead text-paper-50 py-2 transition-colors';
const labelClass =
  'font-mono text-mono-sm text-paper-400 block mb-2';

/**
 * Renders a single form field bound to its schema config. Inputs stay
 * uncontrolled — the parent <form> submits via a server action — but
 * we read the form's current value on `input` events for live validation
 * feedback below the field.
 */
export default function Field({ field, value, error, doc }: FieldProps & { error?: string }) {
  const v = value === null || value === undefined ? '' : value;

  return (
    <div className="block">
      <label htmlFor={field.key} className={labelClass}>
        {field.label}
        {field.required && <span className="ml-1 text-brand-400">*</span>}
      </label>

      {renderControl(field, v, doc)}

      {field.hint && !error && (
        <p className="font-mono text-mono-sm text-paper-400 mt-2">
          {field.hint}
        </p>
      )}
      {error && (
        <p
          className="font-mono text-mono-sm text-red-400 mt-2"
          role="alert"
          data-field-error={field.key}
        >
          {error}
        </p>
      )}
    </div>
  );
}

function renderControl(field: FieldConfig, v: unknown, doc?: Record<string, unknown>) {
  const stringValue = typeof v === 'string' || typeof v === 'number' ? String(v) : '';

  switch (field.type) {
    case 'text':
      return (
        <textarea
          id={field.key}
          name={field.key}
          defaultValue={stringValue}
          required={field.required}
          maxLength={field.maxLength}
          rows={4}
          className={`${inputClass} resize-none`}
        />
      );

    case 'email':
      return (
        <input
          id={field.key}
          name={field.key}
          type="email"
          defaultValue={stringValue}
          required={field.required}
          maxLength={field.maxLength}
          className={inputClass}
        />
      );

    case 'url':
      return (
        <input
          id={field.key}
          name={field.key}
          type="url"
          defaultValue={stringValue}
          required={field.required}
          maxLength={field.maxLength}
          className={inputClass}
        />
      );

    case 'integer':
      return (
        <input
          id={field.key}
          name={field.key}
          type="number"
          defaultValue={typeof v === 'number' ? v : ''}
          required={field.required}
          className={inputClass}
        />
      );

    case 'boolean':
      return (
        <input
          id={field.key}
          name={field.key}
          type="checkbox"
          defaultChecked={Boolean(v)}
          className="h-4 w-4 accent-brand-400"
        />
      );

    case 'enum':
      return (
        <select
          id={field.key}
          name={field.key}
          defaultValue={stringValue}
          required={field.required}
          className={`${inputClass} appearance-none cursor-pointer pr-8`}
        >
          {!field.required && <option value="">—</option>}
          {field.options?.map((opt) => (
            <option key={opt.value} value={opt.value} className="bg-ink-800">
              {opt.label}
            </option>
          ))}
        </select>
      );

    case 'image':
      return (
        <ImageUploader
          name={field.key}
          defaultValue={stringValue}
          required={field.required}
        />
      );

    case 'rich-text':
      return (
        <RichTextEditor
          name={field.key}
          defaultValue={stringValue}
          required={field.required}
          placeholder={field.hint ?? 'Write…'}
        />
      );

    case 'approach-list':
      return <ApproachEditor name={field.key} defaultValue={stringValue} />;

    case 'screens-list':
      return <ScreensEditor name={field.key} defaultValue={stringValue} />;

    case 'metrics-list':
      return <MetricsEditor name={field.key} defaultValue={stringValue} />;

    case 'reference':
      // A1.7+ adds <RefSelect>. For now: text input for $id.
      return (
        <input
          id={field.key}
          name={field.key}
          type="text"
          defaultValue={stringValue}
          required={field.required}
          placeholder={
            field.referenceCollection
              ? `Document ID in ${field.referenceCollection}`
              : 'Document ID'
          }
          className={inputClass}
        />
      );

    case 'logo-mode': {
      const d = (doc ?? {}) as Partial<SiteSettings>;
      return (
        <LogoFieldset
          defaultMode={d.logoMode === 'text' ? 'text' : 'image'}
          defaultText={typeof d.logoText === 'string' ? d.logoText : ''}
          defaultFontFamily={(typeof d.logoFontFamily === 'string' ? d.logoFontFamily : 'geist') as FontKey}
          defaultFontSize={typeof d.logoFontSize === 'number' ? d.logoFontSize : 20}
          defaultFontWeight={typeof d.logoFontWeight === 'number' ? d.logoFontWeight : 500}
          defaultLetterSpacing={typeof d.logoLetterSpacing === 'string' ? d.logoLetterSpacing : '-0.01em'}
          defaultWordmarkFileId={typeof d.wordmarkFileId === 'string' ? d.wordmarkFileId : ''}
        />
      );
    }

    case 'string':
    default:
      return (
        <input
          id={field.key}
          name={field.key}
          type="text"
          defaultValue={stringValue}
          required={field.required}
          maxLength={field.maxLength}
          className={inputClass}
        />
      );
  }
}
