import { test } from 'node:test';
import assert from 'node:assert/strict';
import { renderToStaticMarkup } from 'react-dom/server';
import { createElement } from 'react';
import { renderRichText } from '../../src/lib/cms/rich-text.ts';
import { docFromPlainText, isSafeHref, plainText, readingTime, richDocSchema } from '../../packages/cms/src/content/rich-text.ts';

const fileUrl = (id) => `https://files.example/${id}`;
const html = (doc) => renderToStaticMarkup(createElement('div', null, renderRichText(doc, { fileUrl })));
const para = (...content) => ({ type: 'doc', content: [{ type: 'paragraph', content }] });
// Executable markup = a real tag (not escaped text) that is dangerous or carries a dangerous attribute.
const DANGER = /<(script|iframe|object|embed|svg|math)\b|<[^>]*\s(on\w+|style|srcdoc)=|<[^>]*(href|src)="\s*(javascript|vbscript|data):|<[^>]*(href|src)="\/\//i;

test('normal content renders with the expected elements', () => {
  const out = html({
    type: 'doc',
    content: [
      { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Why' }] },
      { type: 'paragraph', content: [{ type: 'text', text: 'bold', marks: [{ type: 'bold' }] }, { type: 'text', text: ' and ' }, { type: 'text', text: 'link', marks: [{ type: 'link', attrs: { href: 'https://example.com' } }] }] },
      { type: 'bulletList', content: [{ type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'one' }] }] }] },
      { type: 'codeBlock', attrs: { language: 'ts' }, content: [{ type: 'text', text: 'const a = "<b>";' }] },
      { type: 'image', attrs: { fileId: 'f1', alt: 'A chart' } },
    ],
  });
  assert.match(out, /<h2[^>]*>Why<\/h2>/);
  assert.match(out, /<strong>bold<\/strong>/);
  assert.match(out, /<a href="https:\/\/example.com" class="[^"]+" rel="noopener noreferrer nofollow ugc">link<\/a>/);
  assert.match(out, /<li[^>]*><p>one<\/p><\/li>/);
  assert.match(out, /&lt;b&gt;/); // code is escaped, not parsed
  assert.match(out, /<img src="https:\/\/files.example\/f1" alt="A chart"/);
});

const PAYLOADS = [
  ['script in text', para({ type: 'text', text: '<script>alert(1)</script><img src=x onerror=alert(1)>' })],
  ['javascript: link', para({ type: 'text', text: 'x', marks: [{ type: 'link', attrs: { href: 'javascript:alert(1)' } }] })],
  ['JaVaScRiPt with spaces', para({ type: 'text', text: 'x', marks: [{ type: 'link', attrs: { href: ' JaVaScRiPt:alert(1)' } }] })],
  ['data: link', para({ type: 'text', text: 'x', marks: [{ type: 'link', attrs: { href: 'data:text/html,<script>alert(1)</script>' } }] })],
  ['protocol-relative link', para({ type: 'text', text: 'x', marks: [{ type: 'link', attrs: { href: '//evil.example' } }] })],
  ['unknown node type', { type: 'doc', content: [{ type: 'iframe', attrs: { src: 'https://evil.example' } }] }],
  ['raw html node', { type: 'doc', content: [{ type: 'html', content: '<script>alert(1)</script>' }] }],
  ['image by URL', { type: 'doc', content: [{ type: 'image', attrs: { src: 'https://evil.example/x.png', alt: 'x' } }] }],
  ['image id injection', { type: 'doc', content: [{ type: 'image', attrs: { fileId: '"><script>', alt: 'x' } }] }],
  ['heading level 1', { type: 'doc', content: [{ type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: 'h' }] }] }],
  ['code language injection', { type: 'doc', content: [{ type: 'codeBlock', attrs: { language: '"><script>' }, content: [{ type: 'text', text: 'x' }] }] }],
];

for (const [name, doc] of PAYLOADS) {
  test(`inert: ${name}`, () => {
    const out = html(doc);
    assert.doesNotMatch(out, DANGER, out);
    // The only tags present are the safe ones we emit.
    for (const tag of out.match(/<\/?([a-z0-9]+)/g) ?? []) assert.match(tag, /^<\/?(div|p|strong|em|u|s|code|a|br|h[234]|blockquote|ul|ol|li|pre|hr|figure|img)$/, tag);
  });
}

test('extra attributes are stripped (style, class, on*, target)', () => {
  const doc = {
    type: 'doc',
    content: [{ type: 'paragraph', attrs: { style: 'x', onclick: 'alert(1)' }, content: [{ type: 'text', text: 'x', marks: [{ type: 'link', attrs: { href: 'https://ok.example', target: '_blank', onclick: 'alert(1)', class: 'evil', style: 'x' } }] }] }],
  };
  const parsed = richDocSchema.parse(doc);
  assert.deepEqual(parsed.content[0], { type: 'paragraph', content: [{ type: 'text', text: 'x', marks: [{ type: 'link', attrs: { href: 'https://ok.example' } }] }] });
  assert.doesNotMatch(html(doc), DANGER);
});

test('hostile documents are rejected outright by the schema', () => {
  for (const [, doc] of PAYLOADS.slice(1)) assert.equal(richDocSchema.safeParse(doc).success, false);
  // Text that merely contains markup is fine: it's escaped on render.
  assert.equal(richDocSchema.safeParse(PAYLOADS[0][1]).success, true);
});

test('size and depth limits', () => {
  let deep = { type: 'paragraph', content: [{ type: 'text', text: 'x' }] };
  for (let i = 0; i < 20; i++) deep = { type: 'blockquote', content: [deep] };
  assert.equal(richDocSchema.safeParse({ type: 'doc', content: [deep] }).success, false);
  assert.equal(richDocSchema.safeParse(para({ type: 'text', text: 'x'.repeat(10_001) })).success, false);
});

test('safe hrefs', () => {
  for (const ok of ['https://a.example/x?y=1', 'http://a.example', 'mailto:hi@a.example', '/work/x']) assert.ok(isSafeHref(ok), ok);
  for (const bad of ['javascript:x', 'data:text/html,x', '//a.example', 'vbscript:x', 'file:///etc/passwd', '/ space', '/\\\\evil']) assert.equal(isSafeHref(bad), false, bad);
});

test('plain text, reading time, legacy bodies', () => {
  const doc = docFromPlainText('First para.\n\nSecond para.');
  assert.equal(doc.content.length, 2);
  assert.equal(plainText(doc), 'First para.\n\nSecond para.');
  assert.equal(readingTime(doc), '1 min read');
  assert.equal(readingTime(docFromPlainText(Array(1000).fill('word').join(' '))), '5 min read');
});
