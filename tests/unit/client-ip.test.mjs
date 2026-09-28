import { test } from 'node:test';
import assert from 'node:assert/strict';
import { clientIp } from '../../src/lib/client-ip.ts';

const h = (obj) => new Headers(obj);

test('prefers X-Real-IP set by the proxy', () => {
  assert.equal(clientIp(h({ 'x-real-ip': '203.0.113.7', 'x-forwarded-for': '1.1.1.1, 203.0.113.7' })), '203.0.113.7');
});

test('uses the rightmost X-Forwarded-For hop, ignoring a forged leftmost one', () => {
  assert.equal(clientIp(h({ 'x-forwarded-for': '6.6.6.6, 198.51.100.4' })), '198.51.100.4');
  assert.equal(clientIp(h({ 'x-forwarded-for': ' 198.51.100.4 ' })), '198.51.100.4');
});

test("falls back to 'unknown' without proxy headers", () => {
  assert.equal(clientIp(h({})), 'unknown');
  assert.equal(clientIp(h({ 'x-forwarded-for': ' , ' })), 'unknown');
});
