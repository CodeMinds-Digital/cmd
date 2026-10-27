import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readPublicEnv, readServerEnv } from '../../packages/cms/src/env.ts';
import { filePreviewUrl, fileViewUrl } from '../../packages/cms/src/appwrite/assets.ts';
import { hashIp } from '../../packages/cms/src/privacy/ip-hash.ts';

const base = {
  NEXT_PUBLIC_APPWRITE_ENDPOINT: 'https://sgp.cloud.appwrite.io/v1',
  NEXT_PUBLIC_APPWRITE_PROJECT_ID: 'proj123',
  NEXT_PUBLIC_APPWRITE_DATABASE_ID: 'cmd_website_db',
};
const KEY = 'standard_' + 'a'.repeat(64);

test('public env parses and drops a trailing slash', () => {
  const env = readPublicEnv({ ...base, NEXT_PUBLIC_APPWRITE_ENDPOINT: 'https://sgp.cloud.appwrite.io/v1/' });
  assert.deepEqual(env, { endpoint: 'https://sgp.cloud.appwrite.io/v1', projectId: 'proj123', databaseId: 'cmd_website_db' });
});

test('endpoint must be https (localhost excepted) and end with /v1', () => {
  assert.throws(() => readPublicEnv({ ...base, NEXT_PUBLIC_APPWRITE_ENDPOINT: 'http://example.com/v1' }), /must use https/);
  assert.throws(() => readPublicEnv({ ...base, NEXT_PUBLIC_APPWRITE_ENDPOINT: 'https://example.com' }), /must end with \/v1/);
  assert.equal(readPublicEnv({ ...base, NEXT_PUBLIC_APPWRITE_ENDPOINT: 'http://localhost/v1' }).endpoint, 'http://localhost/v1');
});

test('missing variables are named, values never echoed', () => {
  assert.throws(() => readServerEnv(base), /APPWRITE_API_KEY/);
  try {
    readServerEnv({ ...base, APPWRITE_API_KEY: 'short-secret-value' });
    assert.fail('should throw');
  } catch (e) {
    assert.match(e.message, /APPWRITE_API_KEY/);
    assert.doesNotMatch(e.message, /short-secret-value/);
  }
});

test('server env includes the key', () => {
  assert.equal(readServerEnv({ ...base, APPWRITE_API_KEY: KEY }).apiKey, KEY);
});

test('server env refuses to load in a browser', () => {
  globalThis.window = {};
  try {
    assert.throws(() => readServerEnv({ ...base, APPWRITE_API_KEY: KEY }), /browser/);
  } finally {
    delete globalThis.window;
  }
});

test('file URLs carry the project and clamp preview options', () => {
  const env = readPublicEnv(base);
  assert.equal(
    fileViewUrl('public-assets', 'abc', env),
    'https://sgp.cloud.appwrite.io/v1/storage/buckets/public-assets/files/abc/view?project=proj123',
  );
  const url = new URL(filePreviewUrl('public-assets', 'abc', { width: 640.4, quality: 140, output: 'avif' }, env));
  assert.equal(url.pathname, '/v1/storage/buckets/public-assets/files/abc/preview');
  assert.equal(url.searchParams.get('width'), '640');
  assert.equal(url.searchParams.get('quality'), '100');
  assert.equal(url.searchParams.get('output'), 'avif');
});

test('IP hash is keyed, stable, and never the raw IP', () => {
  const salt = 's'.repeat(32);
  const h = hashIp(' 203.0.113.7 ', salt);
  assert.match(h, /^[0-9a-f]{64}$/);
  assert.equal(h, hashIp('203.0.113.7', salt));
  assert.notEqual(h, hashIp('203.0.113.7', 't'.repeat(32)));
  assert.throws(() => hashIp('203.0.113.7', 'short'), /IP_HASH_SALT/);
});
