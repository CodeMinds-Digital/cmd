'use client';

import { useState } from 'react';
import { EditorContent, useEditor, useEditorState, type Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import ImageBase from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import { isSafeHref, type RichDoc } from '@codeminds/cms/content/rich-text';
import { quiet } from '@/components/editor';

/**
 * Visual article editor (Tiptap). Configured to produce only what the
 * allow-list accepts (packages/cms rich-text): H2–H4, lists, quotes, code,
 * rules, safe links, and images that are uploaded files (fileId + alt).
 * Pasted foreign images and unsafe links are dropped by the schema here, and
 * the server validates again on save.
 */

/** Images are stored as Appwrite file IDs; `src` is derived for display only. */
function imageExtension(filesBase: string, projectId: string) {
  return ImageBase.extend({
    addAttributes() {
      return {
        fileId: { default: null, parseHTML: (el) => el.getAttribute('data-file-id'), renderHTML: (a) => ({ 'data-file-id': a.fileId }) },
        alt: { default: '', parseHTML: (el) => el.getAttribute('alt') ?? '' },
      };
    },
    // Only our own images survive a paste/drop; foreign <img src=…> is ignored.
    parseHTML() {
      return [{ tag: 'img[data-file-id]' }];
    },
    renderHTML({ HTMLAttributes }) {
      const id = String(HTMLAttributes['data-file-id'] ?? '');
      return ['img', { 'data-file-id': id, alt: HTMLAttributes.alt ?? '', src: `${filesBase}/${encodeURIComponent(id)}/view?project=${projectId}` }];
    },
  });
}

export default function RichTextEditor({
  value,
  onChange,
  filesBase,
  projectId,
  labelledBy,
  invalid,
}: {
  value: RichDoc;
  onChange: (doc: RichDoc) => void;
  filesBase: string;
  projectId: string;
  labelledBy: string;
  invalid?: boolean;
}) {
  const editor = useEditor({
    immediatelyRender: false,
    // The admin's CSP forbids injected <style>; the equivalent CSS is in globals.css.
    injectCSS: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3, 4] },
        link: {
          openOnClick: false,
          autolink: true,
          protocols: ['mailto'],
          HTMLAttributes: { rel: null, target: null, class: null },
          isAllowedUri: (url) => isSafeHref(url),
        },
      }),
      imageExtension(filesBase, projectId),
      Placeholder.configure({ placeholder: 'Write the article…' }),
    ],
    content: value,
    editorProps: {
      attributes: {
        role: 'textbox',
        'aria-multiline': 'true',
        'aria-labelledby': labelledBy,
        ...(invalid ? { 'aria-invalid': 'true' } : {}),
        class: 'rich-text min-h-72 rounded-b-lg border border-t-0 border-line-strong bg-surface px-4 py-3 text-base text-fg focus:outline-2 focus:outline-accent-ink',
      },
    },
    onUpdate: ({ editor }) => onChange(editor.getJSON() as RichDoc),
  });

  if (!editor) return <div className="min-h-72 rounded-lg border border-line-strong bg-surface" aria-hidden />;
  return (
    <div>
      <Toolbar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  );
}

function Toolbar({ editor }: { editor: Editor }) {
  const [panel, setPanel] = useState<'link' | 'image' | null>(null);
  const state = useEditorState({
    editor,
    selector: ({ editor: e }) => ({
      bold: e.isActive('bold'),
      italic: e.isActive('italic'),
      code: e.isActive('code'),
      link: e.isActive('link'),
      h2: e.isActive('heading', { level: 2 }),
      h3: e.isActive('heading', { level: 3 }),
      bullet: e.isActive('bulletList'),
      ordered: e.isActive('orderedList'),
      quote: e.isActive('blockquote'),
      codeBlock: e.isActive('codeBlock'),
      canUndo: e.can().undo(),
      canRedo: e.can().redo(),
    }),
  });
  const chain = () => editor.chain().focus();
  const btn = (label: string, text: React.ReactNode, active: boolean | null, run: () => void, disabled = false) => (
    <button
      type="button"
      aria-label={label}
      {...(active === null ? {} : { 'aria-pressed': active })}
      disabled={disabled}
      onMouseDown={(e) => e.preventDefault()}
      onClick={run}
      className="grid min-h-11 min-w-11 place-items-center rounded-md px-2 text-sm hover:bg-surface-sunk disabled:opacity-30 aria-pressed:bg-inverse aria-pressed:text-inverse-fg"
    >
      {text}
    </button>
  );
  return (
    <div className="sticky top-0 z-10 rounded-t-lg border border-line-strong bg-surface-sunk">
      <div role="toolbar" aria-label="Formatting" className="flex flex-wrap gap-0.5 p-1">
        {btn('Bold', <strong>B</strong>, state.bold, () => chain().toggleBold().run())}
        {btn('Italic', <em className="font-serif">I</em>, state.italic, () => chain().toggleItalic().run())}
        {btn('Inline code', '</>', state.code, () => chain().toggleCode().run())}
        {btn('Link', 'Link', state.link, () => setPanel(panel === 'link' ? null : 'link'))}
        <span aria-hidden className="mx-1 w-px self-stretch bg-line-strong" />
        {btn('Heading', 'H2', state.h2, () => chain().toggleHeading({ level: 2 }).run())}
        {btn('Subheading', 'H3', state.h3, () => chain().toggleHeading({ level: 3 }).run())}
        {btn('Bulleted list', '• List', state.bullet, () => chain().toggleBulletList().run())}
        {btn('Numbered list', '1. List', state.ordered, () => chain().toggleOrderedList().run())}
        {btn('Quote', '“ ”', state.quote, () => chain().toggleBlockquote().run())}
        {btn('Code block', '{ }', state.codeBlock, () => chain().toggleCodeBlock().run())}
        {btn('Divider', '—', null, () => chain().setHorizontalRule().run())}
        {btn('Image', 'Image', null, () => setPanel(panel === 'image' ? null : 'image'))}
        <span aria-hidden className="mx-1 w-px self-stretch bg-line-strong" />
        {btn('Undo', '↶', null, () => chain().undo().run(), !state.canUndo)}
        {btn('Redo', '↷', null, () => chain().redo().run(), !state.canRedo)}
      </div>
      {panel === 'link' && <LinkPanel editor={editor} close={() => setPanel(null)} />}
      {panel === 'image' && <ImagePanel editor={editor} close={() => setPanel(null)} />}
    </div>
  );
}

function LinkPanel({ editor, close }: { editor: Editor; close: () => void }) {
  const [href, setHref] = useState<string>(editor.getAttributes('link').href ?? '');
  const [error, setError] = useState<string | null>(null);
  const apply = () => {
    if (!href.trim()) return;
    if (!isSafeHref(href.trim())) return setError('Use a full https:// link, a mailto: address or a site path like /work/x.');
    editor.chain().focus().extendMarkRange('link').setLink({ href: href.trim() }).run();
    close();
  };
  return (
    <div className="flex flex-wrap items-end gap-2 border-t border-line-strong p-2">
      <div className="flex min-w-60 flex-1 flex-col gap-1">
        <label htmlFor="link-href" className="text-sm font-medium">
          Link address
        </label>
        <input
          id="link-href"
          autoFocus
          value={href}
          onChange={(e) => setHref(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), apply())}
          placeholder="https://"
          className="min-h-11 rounded-lg border border-line-strong bg-surface px-3"
          aria-describedby={error ? 'link-error' : undefined}
        />
        {error && (
          <p id="link-error" role="alert" className="text-sm text-danger">
            {error}
          </p>
        )}
      </div>
      <button type="button" className={quiet} onClick={apply}>
        Apply
      </button>
      {editor.isActive('link') && (
        <button type="button" className={quiet} onClick={() => (editor.chain().focus().unsetLink().run(), close())}>
          Remove link
        </button>
      )}
      <button type="button" className={quiet} onClick={close}>
        Cancel
      </button>
    </div>
  );
}

function ImagePanel({ editor, close }: { editor: Editor; close: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [alt, setAlt] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function insert() {
    if (!file) return setError('Choose an image.');
    if (!alt.trim()) return setError('Describe the image for people who can’t see it.');
    setBusy(true);
    setError(null);
    const body = new FormData();
    body.set('file', file);
    const res = await fetch('/api/upload', { method: 'POST', body }).catch(() => null);
    const json = res ? ((await res.json().catch(() => ({}))) as { fileId?: string; error?: string }) : { error: 'Upload failed. Check your connection.' };
    setBusy(false);
    if (!json.fileId) return setError(json.error ?? 'Upload failed.');
    editor.chain().focus().insertContent({ type: 'image', attrs: { fileId: json.fileId, alt: alt.trim() } }).run();
    close();
  }
  return (
    <div className="flex flex-wrap items-end gap-2 border-t border-line-strong p-2">
      <div className="flex flex-col gap-1">
        <label htmlFor="body-image-file" className="text-sm font-medium">
          Image file
        </label>
        <input id="body-image-file" type="file" accept="image/png,image/jpeg,image/webp,image/avif,image/gif" onChange={(e) => setFile(e.target.files?.[0] ?? null)} className="min-h-11 text-sm" />
      </div>
      <div className="flex min-w-60 flex-1 flex-col gap-1">
        <label htmlFor="body-image-alt" className="text-sm font-medium">
          Image description (alt text)
        </label>
        <input id="body-image-alt" value={alt} onChange={(e) => setAlt(e.target.value)} maxLength={300} className="min-h-11 rounded-lg border border-line-strong bg-surface px-3" />
      </div>
      <button type="button" className={quiet} disabled={busy} onClick={insert}>
        {busy ? 'Uploading…' : 'Insert image'}
      </button>
      <button type="button" className={quiet} onClick={close}>
        Cancel
      </button>
      {error && (
        <p role="alert" className="w-full text-sm text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
