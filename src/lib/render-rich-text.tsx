/**
 * Server-side renderer for TipTap JSON. The admin editor (RichTextEditor)
 * writes JSON of this exact shape; this walks it and emits HTML using the
 * design-system classes that match the editor's preview styles.
 *
 * Plain-text legacy values are wrapped in a single paragraph at the
 * boundary (see safeNormalize) so old `string` fields render fine.
 */

import React from 'react';

type TextNode = {
  type: 'text';
  text: string;
  marks?: { type: string; attrs?: Record<string, unknown> }[];
};

type Node =
  | TextNode
  | { type: 'paragraph'; content?: Node[] }
  | { type: 'heading'; attrs?: { level?: number }; content?: Node[] }
  | { type: 'bulletList'; content?: Node[] }
  | { type: 'orderedList'; content?: Node[] }
  | { type: 'listItem'; content?: Node[] }
  | { type: 'blockquote'; content?: Node[] }
  | { type: 'codeBlock'; content?: Node[] }
  | { type: 'hardBreak' }
  | { type: 'doc'; content?: Node[] }
  | { type: string; content?: Node[]; attrs?: Record<string, unknown> };

function safeNormalize(value: unknown): Node | null {
  if (!value) return null;
  // Already-parsed object (passed as `Record`).
  if (typeof value === 'object') {
    const v = value as { type?: string };
    if (v.type === 'doc') return value as Node;
  }
  if (typeof value !== 'string') return null;
  const s = value.trim();
  if (!s) return null;

  // JSON shape?
  if (s.startsWith('{')) {
    try {
      const parsed = JSON.parse(s);
      if (parsed?.type === 'doc') return parsed as Node;
    } catch {
      /* fall through */
    }
  }

  // Plain string fallback — wrap as a single paragraph.
  return {
    type: 'doc',
    content: [
      { type: 'paragraph', content: [{ type: 'text', text: s }] } as Node,
    ],
  };
}

/** Render a TipTap doc (or plain string) as React. */
export default function RenderRichText({
  doc,
  className,
}: {
  doc: unknown;
  className?: string;
}) {
  const root = safeNormalize(doc);
  if (!root || !('content' in root) || !root.content?.length) return null;
  return (
    <div className={className}>
      {root.content.map((child, i) => (
        <RenderNode key={i} node={child} />
      ))}
    </div>
  );
}

function RenderNode({ node }: { node: Node }): React.ReactElement | null {
  switch (node.type) {
    case 'paragraph':
      return (
        <p className="text-body text-paper-100 leading-relaxed mb-4 last:mb-0">
          {renderChildren(node.content)}
        </p>
      );

    case 'heading': {
      const rawLevel = node.attrs?.level;
      const level = typeof rawLevel === 'number' ? rawLevel : 2;
      const clamped = Math.min(Math.max(level, 2), 4);
      const cls =
        clamped === 2
          ? 'text-h2 font-bold text-paper-50 mt-12 mb-3'
          : 'text-h3 font-semibold text-paper-50 mt-8 mb-2';
      const Tag = `h${clamped}` as 'h2' | 'h3' | 'h4';
      return <Tag className={cls}>{renderChildren(node.content)}</Tag>;
    }

    case 'bulletList':
      return (
        <ul className="list-none pl-0 my-4 space-y-2">
          {node.content?.map((c, i) => (
            <RenderNode key={i} node={c} />
          ))}
        </ul>
      );

    case 'orderedList':
      return (
        <ol className="list-none pl-0 my-4 space-y-2 [counter-reset:item]">
          {node.content?.map((c, i) => (
            <RenderNode key={i} node={c} />
          ))}
        </ol>
      );

    case 'listItem':
      return (
        <li className="flex items-start gap-2.5 text-body text-paper-200">
          <span aria-hidden className="font-mono text-mono-sm text-paper-400 mt-1">
            ─
          </span>
          <span className="flex-1">{renderChildren(node.content)}</span>
        </li>
      );

    case 'blockquote':
      // Pull-quote styling — serif italic, brand-400 left rule.
      return (
        <blockquote className="my-8 border-l-2 border-brand-400 pl-6 text-h3 font-serif italic font-normal text-paper-50 leading-snug">
          {renderChildren(node.content)}
        </blockquote>
      );

    case 'codeBlock':
      return (
        <pre className="my-6 bg-ink-800 border border-ink-600 rounded-lg p-4 overflow-x-auto font-mono text-mono-sm text-paper-100 leading-relaxed">
          <code>{renderChildren(node.content)}</code>
        </pre>
      );

    case 'hardBreak':
      return <br />;

    case 'text':
      return <RenderText node={node as TextNode} />;

    default: {
      const generic = node as { content?: Node[] };
      return <>{renderChildren(generic.content)}</>;
    }
  }
}

function renderChildren(content: Node[] | undefined) {
  if (!content?.length) return null;
  return content.map((child, i) => <RenderNode key={i} node={child} />);
}

/**
 * Text node — apply each mark in order. Marks compose by nesting spans
 * with the right Tailwind classes. Order matters for inheritance but is
 * stable per editor session.
 */
function RenderText({ node }: { node: TextNode }) {
  let el: React.ReactElement | string = node.text;
  for (const mark of node.marks ?? []) {
    el = wrapMark(mark.type, mark.attrs, el);
  }
  return <>{el}</>;
}

function wrapMark(
  type: string,
  attrs: Record<string, unknown> | undefined,
  child: React.ReactNode,
): React.ReactElement {
  switch (type) {
    case 'bold':
      return <strong className="font-semibold text-paper-50">{child}</strong>;
    case 'italic':
      return <em>{child}</em>;
    case 'code':
      return (
        <code className="font-mono text-mono-sm text-brand-300 bg-ink-800/60 px-1 rounded">
          {child}
        </code>
      );
    case 'link': {
      const href = typeof attrs?.href === 'string' ? attrs.href : '#';
      return (
        <a
          href={href}
          className="text-brand-400 underline underline-offset-4 hover:text-paper-50"
          target={href.startsWith('http') ? '_blank' : undefined}
          rel={href.startsWith('http') ? 'noreferrer' : undefined}
        >
          {child}
        </a>
      );
    }
    // ─── custom brand marks (must mirror src/components/admin/rich-text/marks.ts) ───
    case 'serifItalic':
      return (
        <span className="font-serif italic font-normal text-brand-400">
          {child}
        </span>
      );
    case 'accent':
      return <span className="text-brand-400">{child}</span>;
    case 'monospace':
      return (
        <span className="font-mono text-mono-sm tracking-[0.18em] uppercase">
          {child}
        </span>
      );
    default:
      return <>{child}</>;
  }
}
