'use client';

import { useEditor, EditorContent, type JSONContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Link from '@tiptap/extension-link';
import { useCallback, useEffect, useRef } from 'react';
import { customMarks } from './marks';

type RichTextEditorProps = {
  /** Hidden form-field name. The editor writes JSON to this on every change. */
  name: string;
  /** Current value — JSON string of a TipTap doc, or '' for new. */
  defaultValue?: string;
  /** Whether the field is required at submit. */
  required?: boolean;
  placeholder?: string;
};

const EMPTY_DOC: JSONContent = { type: 'doc', content: [{ type: 'paragraph' }] };

function safeParseDoc(value: string): JSONContent {
  if (!value) return EMPTY_DOC;
  try {
    const parsed = JSON.parse(value) as JSONContent;
    if (parsed && typeof parsed === 'object' && parsed.type === 'doc') {
      return parsed;
    }
  } catch {
    /* fall through */
  }
  // Plain-text legacy migration: wrap as a single paragraph.
  return {
    type: 'doc',
    content: [
      {
        type: 'paragraph',
        content: [{ type: 'text', text: value }],
      },
    ],
  };
}

export default function RichTextEditor({
  name,
  defaultValue = '',
  required,
  placeholder = 'Write…',
}: RichTextEditorProps) {
  const hiddenRef = useRef<HTMLInputElement>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        // Allow blockquote for pull-quotes; code/codeBlock for code marks.
      }),
      Placeholder.configure({ placeholder }),
      Link.configure({ openOnClick: false, autolink: true }),
      ...customMarks,
    ],
    content: safeParseDoc(defaultValue),
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class:
          'prose prose-invert max-w-none min-h-[180px] focus:outline-none ' +
          'text-paper-100 ' +
          // Headings + blockquote inherit design-system tokens.
          '[&_h2]:text-h2 [&_h2]:text-paper-50 [&_h2]:mt-8 [&_h2]:mb-3 ' +
          '[&_h3]:text-h3 [&_h3]:text-paper-50 [&_h3]:mt-6 [&_h3]:mb-2 ' +
          '[&_p]:text-body [&_p]:text-paper-100 ' +
          '[&_blockquote]:border-l-2 [&_blockquote]:border-brand-400 ' +
          '[&_blockquote]:pl-4 [&_blockquote]:font-serif [&_blockquote]:italic [&_blockquote]:text-paper-50 ' +
          '[&_code]:font-mono [&_code]:text-mono-sm [&_code]:text-brand-300 ' +
          '[&_pre]:bg-ink-800 [&_pre]:border [&_pre]:border-ink-600 [&_pre]:rounded [&_pre]:p-4 ' +
          '[&_a]:text-brand-400 [&_a]:underline [&_a]:underline-offset-4',
      },
    },
    onUpdate: ({ editor: ed }) => {
      const json = JSON.stringify(ed.getJSON());
      if (hiddenRef.current) hiddenRef.current.value = json;
    },
  });

  // Sync the hidden input on first mount so empty docs submit valid JSON.
  useEffect(() => {
    if (editor && hiddenRef.current) {
      hiddenRef.current.value = JSON.stringify(editor.getJSON());
    }
  }, [editor]);

  if (!editor) {
    return (
      <div className="border border-ink-600 rounded-lg p-4 text-paper-400 font-mono text-mono-sm">
        Loading editor…
      </div>
    );
  }

  return (
    <div>
      <input
        ref={hiddenRef}
        type="hidden"
        name={name}
        defaultValue={JSON.stringify(safeParseDoc(defaultValue))}
        required={required}
      />
      <Toolbar editor={editor} />
      <div className="border border-ink-600 rounded-b-lg bg-ink-800/40 px-4 py-3">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}

function Toolbar({ editor }: { editor: ReturnType<typeof useEditor> }) {
  const promptLink = useCallback(() => {
    if (!editor) return;
    const previous = editor.getAttributes('link').href as string | undefined;
    const url = window.prompt('URL', previous ?? 'https://');
    if (url === null) return;
    if (url === '') {
      editor.chain().focus().unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  }, [editor]);

  if (!editor) return null;

  return (
    <div className="border border-ink-600 border-b-0 rounded-t-lg bg-ink-800 px-3 py-2 flex flex-wrap gap-1 items-center">
      <Btn label="H2" active={editor.isActive('heading', { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} />
      <Btn label="H3" active={editor.isActive('heading', { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} />
      <Sep />
      <Btn label="B" active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()} title="Bold" weight="bold" />
      <Btn label="I" active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()} title="Italic" italic />
      <Btn label="serif" active={editor.isActive('serifItalic')} onClick={() => editor.chain().focus().toggleMark('serifItalic').run()} title="Serif italic accent" serif />
      <Btn label="accent" active={editor.isActive('accent')} onClick={() => editor.chain().focus().toggleMark('accent').run()} title="Brand accent color" accent />
      <Btn label="mono" active={editor.isActive('monospace')} onClick={() => editor.chain().focus().toggleMark('monospace').run()} title="Monospace caption" mono />
      <Sep />
      <Btn label="“ ”" active={editor.isActive('blockquote')} onClick={() => editor.chain().focus().toggleBlockquote().run()} title="Pull-quote" />
      <Btn label="•" active={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()} title="Bullet list" />
      <Btn label="1." active={editor.isActive('orderedList')} onClick={() => editor.chain().focus().toggleOrderedList().run()} title="Numbered list" />
      <Btn label="</>" active={editor.isActive('codeBlock')} onClick={() => editor.chain().focus().toggleCodeBlock().run()} title="Code block" mono />
      <Btn label="link" active={editor.isActive('link')} onClick={promptLink} title="Insert/edit link" />
    </div>
  );
}

function Sep() {
  return <span className="w-px h-5 bg-ink-600 mx-1" aria-hidden />;
}

function Btn({
  label,
  active,
  onClick,
  title,
  weight,
  italic,
  serif,
  accent,
  mono,
}: {
  label: string;
  active?: boolean;
  onClick: () => void;
  title?: string;
  weight?: 'bold';
  italic?: boolean;
  serif?: boolean;
  accent?: boolean;
  mono?: boolean;
}) {
  const cls = [
    'px-2.5 py-1 rounded text-mono-sm transition-colors',
    active
      ? 'bg-brand-400 text-ink-900'
      : 'text-paper-300 hover:text-paper-50 hover:bg-ink-700',
    weight === 'bold' ? 'font-bold' : '',
    italic ? 'italic' : '',
    serif ? 'font-serif italic' : '',
    accent && !active ? 'text-brand-400' : '',
    mono ? 'font-mono' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-pressed={active}
      className={cls}
    >
      {label}
    </button>
  );
}
