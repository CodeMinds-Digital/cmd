import { test } from 'node:test';
import assert from 'node:assert/strict';
import { escapeHtml } from '../../src/lib/escape-html.ts';

test('escapes the five HTML-significant characters', () => {
  assert.equal(escapeHtml(`<img src=x onerror="alert('1')"> & co`), '&lt;img src=x onerror=&quot;alert(&#39;1&#39;)&quot;&gt; &amp; co');
});

test('leaves ordinary text alone', () => {
  assert.equal(escapeHtml('Chennai → worldwide, 2–4 weeks'), 'Chennai → worldwide, 2–4 weeks');
});
