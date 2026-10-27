/**
 * Journal article renderer: allow-listed JSON (packages/cms rich-text) →
 * React elements. No HTML strings and no dangerouslySetInnerHTML, so text is
 * always escaped; links are re-checked here; images come only from Appwrite
 * file IDs. Anything that fails validation renders nothing.
 * Plain createElement (no JSX) so the unit tests can run it under Node.
 */
import { createElement as h, Fragment, type ReactNode } from 'react';
import { isSafeHref, richDocSchema, type RichBlock, type RichDoc, type RichInline } from '@codeminds/cms/content/rich-text';

type Options = { fileUrl: (fileId: string) => string };

const HEADING = {
  2: 'mt-14 mb-5 font-display text-step-3 font-bold text-fg text-balance',
  3: 'mt-10 mb-4 font-display text-step-2 font-bold text-fg',
  4: 'mt-8 mb-3 font-display text-step-1 font-semibold text-fg',
} as const;

function inline(nodes: RichInline[] | undefined): ReactNode[] {
  return (nodes ?? []).map((n, i) => {
    if (n.type === 'hardBreak') return h('br', { key: i });
    let out: ReactNode = n.text;
    for (const m of n.marks ?? []) {
      switch (m.type) {
        case 'bold':
          out = h('strong', null, out);
          break;
        case 'italic':
          out = h('em', null, out);
          break;
        case 'underline':
          out = h('u', null, out);
          break;
        case 'strike':
          out = h('s', null, out);
          break;
        case 'code':
          out = h('code', { className: 'rounded bg-surface-sunk px-1.5 py-0.5 font-mono text-[0.9em]' }, out);
          break;
        case 'link': {
          if (!isSafeHref(m.attrs.href)) break;
          const external = !m.attrs.href.startsWith('/');
          out = h(
            'a',
            {
              href: m.attrs.href,
              className: 'text-accent-ink underline underline-offset-4 hover:text-fg',
              ...(external ? { rel: 'noopener noreferrer nofollow ugc' } : {}),
            },
            out,
          );
          break;
        }
      }
    }
    return h(Fragment, { key: i }, out);
  });
}

function block(b: RichBlock, key: number, o: Options): ReactNode {
  switch (b.type) {
    case 'paragraph':
      return b.content?.length ? h('p', { key }, ...inline(b.content)) : null;
    case 'heading':
      return h(`h${b.attrs.level}`, { key, className: HEADING[b.attrs.level] }, ...inline(b.content));
    case 'blockquote':
      return h('blockquote', { key, className: 'border-l-2 border-accent pl-6 text-step-1 text-fg-muted italic space-y-4' }, ...b.content.map((c, i) => block(c, i, o)));
    case 'bulletList':
    case 'orderedList':
      return h(
        b.type === 'bulletList' ? 'ul' : 'ol',
        { key, className: `${b.type === 'bulletList' ? 'list-disc' : 'list-decimal'} space-y-2 pl-6`, ...(b.type === 'orderedList' && b.attrs?.start && b.attrs.start !== 1 ? { start: b.attrs.start } : {}) },
        ...b.content.map((li, i) => h('li', { key: i, className: 'space-y-2 pl-1' }, ...li.content.map((c, j) => block(c, j, o)))),
      );
    case 'codeBlock':
      return h(
        'pre',
        { key, className: 'overflow-x-auto rounded-xl bg-inverse p-5 text-sm leading-relaxed text-inverse-fg' },
        h('code', { className: 'font-mono' }, (b.content ?? []).map((t) => t.text).join('')),
      );
    case 'horizontalRule':
      return h('hr', { key, className: 'my-12 border-line' });
    case 'image':
      return h(
        'figure',
        { key, className: 'my-10' },
        h('img', { src: o.fileUrl(b.attrs.fileId), alt: b.attrs.alt, loading: 'lazy', decoding: 'async', className: 'h-auto w-full rounded-2xl border border-line' }),
      );
  }
}

/** Validated render; returns null for anything that isn't an allowed document. */
export function renderRichText(doc: unknown, o: Options): ReactNode {
  const parsed = richDocSchema.safeParse(doc);
  if (!parsed.success) return null;
  return (parsed.data as RichDoc).content.map((b, i) => block(b, i, o));
}
