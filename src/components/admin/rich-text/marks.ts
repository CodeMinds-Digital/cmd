import { Mark, mergeAttributes } from '@tiptap/core';

/**
 * Brand-bound inline marks. Each one renders to a <span> with a
 * specific Tailwind class set, so editors pick a *role* in the toolbar
 * and the design system resolves it on render.
 *
 *   - serif-italic  → italic Instrument Serif accent (the brand motif)
 *   - accent        → brand-400 indigo
 *   - monospace     → tracked-out Geist Mono caption
 *
 * Each is registered with both the TipTap editor (for the admin edit
 * surface) and the renderer (lib/render-rich-text.tsx), keeping
 * input/output in sync.
 */

export const SerifItalicMark = Mark.create({
  name: 'serifItalic',
  parseHTML() {
    return [{ tag: 'span[data-mark="serif-italic"]' }];
  },
  renderHTML({ HTMLAttributes }) {
    return [
      'span',
      mergeAttributes(HTMLAttributes, {
        'data-mark': 'serif-italic',
        class: 'font-serif italic font-normal text-brand-400',
      }),
      0,
    ];
  },
});

export const AccentMark = Mark.create({
  name: 'accent',
  parseHTML() {
    return [{ tag: 'span[data-mark="accent"]' }];
  },
  renderHTML({ HTMLAttributes }) {
    return [
      'span',
      mergeAttributes(HTMLAttributes, {
        'data-mark': 'accent',
        class: 'text-brand-400',
      }),
      0,
    ];
  },
});

export const MonospaceMark = Mark.create({
  name: 'monospace',
  parseHTML() {
    return [{ tag: 'span[data-mark="monospace"]' }];
  },
  renderHTML({ HTMLAttributes }) {
    return [
      'span',
      mergeAttributes(HTMLAttributes, {
        'data-mark': 'monospace',
        class: 'font-mono text-mono-sm tracking-[0.18em] uppercase',
      }),
      0,
    ];
  },
});

/** Convenience array — pass to TipTap's `extensions`. */
export const customMarks = [SerifItalicMark, AccentMark, MonospaceMark];
