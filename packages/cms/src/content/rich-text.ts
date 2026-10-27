/**
 * Journal article bodies: Tiptap/ProseMirror JSON, accepted only through this
 * allow-list (D9). The admin saves `richDocSchema.parse(...)` output and the
 * site validates again before rendering, so a hand-crafted or tampered
 * document can't introduce scripts, event handlers, styles or foreign images:
 *
 *   - node types: the ones below only; anything else rejects the document;
 *   - attributes: only the listed ones survive (zod strips the rest:
 *     class, style, target, on*…);
 *   - links: http(s), mailto or site-relative paths only;
 *   - images: an Appwrite file ID + alt text — never a URL.
 */
import { z } from 'zod';

export const LIMITS = { textPerNode: 10_000, totalText: 100_000, nodes: 5_000, depth: 12 } as const;

/** http(s), mailto, or a site path ("/work/x", not "//host"). */
export function isSafeHref(href: string): boolean {
  const h = href.trim();
  if (/^\/(?!\/)/.test(h)) return !/[\s\\]/.test(h);
  try {
    const u = new URL(h);
    return u.protocol === 'https:' || u.protocol === 'http:' || u.protocol === 'mailto:';
  } catch {
    return false;
  }
}

const mark = z.discriminatedUnion('type', [
  z.object({ type: z.literal('bold') }),
  z.object({ type: z.literal('italic') }),
  z.object({ type: z.literal('underline') }),
  z.object({ type: z.literal('strike') }),
  z.object({ type: z.literal('code') }),
  z.object({ type: z.literal('link'), attrs: z.object({ href: z.string().max(2000).refine(isSafeHref, 'Links must be https://, mailto: or a site path.') }) }),
]);

const text = z.object({ type: z.literal('text'), text: z.string().min(1).max(LIMITS.textPerNode), marks: z.array(mark).max(6).optional() });
const hardBreak = z.object({ type: z.literal('hardBreak') });
const inline = z.discriminatedUnion('type', [text, hardBreak]);

export type RichInline = z.infer<typeof inline>;
export type RichBlock =
  | { type: 'paragraph'; content?: RichInline[] }
  | { type: 'heading'; attrs: { level: 2 | 3 | 4 }; content?: RichInline[] }
  | { type: 'blockquote'; content: RichBlock[] }
  | { type: 'bulletList'; content: RichListItem[] }
  | { type: 'orderedList'; attrs?: { start?: number }; content: RichListItem[] }
  | { type: 'codeBlock'; attrs?: { language?: string | null }; content?: { type: 'text'; text: string }[] }
  | { type: 'horizontalRule' }
  | { type: 'image'; attrs: { fileId: string; alt: string } };
export type RichListItem = { type: 'listItem'; content: RichBlock[] };
export type RichDoc = { type: 'doc'; content: RichBlock[] };

const listItem: z.ZodType<RichListItem> = z.lazy(() => z.object({ type: z.literal('listItem'), content: z.array(block).min(1).max(50) }));

const block: z.ZodType<RichBlock> = z.lazy(() =>
  z.discriminatedUnion('type', [
    z.object({ type: z.literal('paragraph'), content: z.array(inline).max(500).optional() }),
    z.object({ type: z.literal('heading'), attrs: z.object({ level: z.union([z.literal(2), z.literal(3), z.literal(4)]) }), content: z.array(inline).max(100).optional() }),
    z.object({ type: z.literal('blockquote'), content: z.array(block).min(1).max(50) }),
    z.object({ type: z.literal('bulletList'), content: z.array(listItem).min(1).max(200) }),
    z.object({ type: z.literal('orderedList'), attrs: z.object({ start: z.number().int().min(0).max(10_000).optional() }).optional(), content: z.array(listItem).min(1).max(200) }),
    z.object({
      type: z.literal('codeBlock'),
      attrs: z.object({ language: z.string().regex(/^[a-z0-9+#-]{1,20}$/).nullable().optional() }).optional(),
      content: z.array(z.object({ type: z.literal('text'), text: z.string().max(LIMITS.textPerNode) })).max(50).optional(),
    }),
    z.object({ type: z.literal('horizontalRule') }),
    z.object({ type: z.literal('image'), attrs: z.object({ fileId: z.string().regex(/^[a-zA-Z0-9._-]{1,36}$/), alt: z.string().trim().min(1, 'Every image needs a description.').max(300) }) }),
  ]),
);

function walk(node: unknown, depth: number, acc: { nodes: number; text: number; depth: number }) {
  if (!node || typeof node !== 'object') return;
  acc.nodes++;
  acc.depth = Math.max(acc.depth, depth);
  const n = node as { text?: unknown; content?: unknown };
  if (typeof n.text === 'string') acc.text += n.text.length;
  if (Array.isArray(n.content)) for (const c of n.content) walk(c, depth + 1, acc);
}

export const richDocSchema: z.ZodType<RichDoc> = z
  .object({ type: z.literal('doc'), content: z.array(block).max(2000) })
  .superRefine((doc, ctx) => {
    const acc = { nodes: 0, text: 0, depth: 0 };
    walk(doc, 0, acc);
    if (acc.nodes > LIMITS.nodes || acc.text > LIMITS.totalText || acc.depth > LIMITS.depth) {
      ctx.addIssue({ code: 'custom', message: 'The article is too long or too deeply nested.' });
    }
  });

export const emptyDoc = (): RichDoc => ({ type: 'doc', content: [{ type: 'paragraph' }] });

/** Plain text (paragraphs separated by blank lines) — search, excerpts, word counts. */
export function plainText(doc: RichDoc): string {
  const out: string[] = [];
  const inlineText = (c?: RichInline[]) => (c ?? []).map((i) => (i.type === 'text' ? i.text : '\n')).join('');
  const visit = (b: RichBlock) => {
    switch (b.type) {
      case 'paragraph':
      case 'heading':
        out.push(inlineText(b.content));
        break;
      case 'codeBlock':
        out.push((b.content ?? []).map((t) => t.text).join(''));
        break;
      case 'blockquote':
        b.content.forEach(visit);
        break;
      case 'bulletList':
      case 'orderedList':
        b.content.forEach((li) => li.content.forEach(visit));
        break;
      case 'image':
        out.push(b.attrs.alt);
        break;
    }
  };
  doc.content.forEach(visit);
  return out.filter((s) => s.trim()).join('\n\n');
}

/** "6 min read" at 200 words a minute (at least 1). */
export function readingTime(doc: RichDoc): string {
  const words = plainText(doc).split(/\s+/).filter(Boolean).length;
  return `${Math.max(1, Math.round(words / 200))} min read`;
}

/** Legacy plain-text bodies → paragraphs. */
export function docFromPlainText(text: string | null | undefined): RichDoc {
  const paras = (text ?? '').split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
  return { type: 'doc', content: paras.length ? paras.map((p) => ({ type: 'paragraph', content: [{ type: 'text', text: p.slice(0, LIMITS.textPerNode) }] })) : [{ type: 'paragraph' }] };
}
