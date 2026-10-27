import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isSafePath } from '../../packages/cms/src/signing.ts';

test('isSafePath: no open redirect via control characters or protocol-relative forms', () => {
  for (const bad of ['https://evil.example', '//evil.example', '/\\evil', '/\t/evil.tld', '/\n/evil.tld', '/\r/evil.tld', '/\u0000x', '/\u007fx', 'evil', '']) {
    assert.equal(isSafePath(bad), false, JSON.stringify(bad));
  }
  for (const ok of ['/', '/work/x', '/journal?y=1', '/a%2F%2Fb', '/%09/x']) assert.ok(isSafePath(ok), ok);
  // What a browser would do with the old bypass: resolve to another host.
  assert.equal(new URL('/\t/evil.tld', 'https://admin.example').host, 'evil.tld');
});

import { signPreviewSession, verifyPreviewSession } from '../../packages/cms/src/signing.ts';

test('preview session cookie: valid 10 minutes, tamper-proof', () => {
  const secret = 's'.repeat(40);
  const now = 1_900_000_000;
  const v = signPreviewSession(secret, now);
  assert.equal(verifyPreviewSession(secret, v, now + 1), true);
  assert.equal(verifyPreviewSession(secret, v, now + 601), false);
  assert.equal(verifyPreviewSession('t'.repeat(40), v, now + 1), false);
  const [exp, sig] = v.split('.');
  assert.equal(verifyPreviewSession(secret, `${Number(exp) + 3600}.${sig}`, now + 1), false);
  assert.equal(verifyPreviewSession(secret, undefined, now), false);
  assert.equal(verifyPreviewSession(secret, 'garbage', now), false);
});

import { readBodyCapped } from '../../src/lib/read-body.ts';

test('request bodies are cut off at the cap, even without Content-Length', async () => {
  const stream = (n) => new ReadableStream({ start(c) { for (let i = 0; i < n; i++) c.enqueue(new Uint8Array(1024)); c.close(); } });
  const chunked = (n) => new Request('http://x/', { method: 'POST', body: stream(n), duplex: 'half' });
  assert.equal(await readBodyCapped(chunked(20), 16 * 1024), null);
  assert.equal((await readBodyCapped(chunked(4), 16 * 1024)).length, 4096);
  const lying = new Request('http://x/', { method: 'POST', body: 'x'.repeat(100), headers: { 'content-length': '999999' } });
  assert.equal(await readBodyCapped(lying, 1024), null);
  assert.equal(await readBodyCapped(new Request('http://x/', { method: 'POST', body: '{"a":1}' }), 1024), '{"a":1}');
});
