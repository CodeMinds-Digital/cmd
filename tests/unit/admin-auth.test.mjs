import { test } from 'node:test';
import assert from 'node:assert/strict';
import { gate, hasRole, roleFromTeams } from '../../packages/cms/src/roles.ts';
import { clearedSessionCookie, sessionCookieName, sessionCookieOptions, SESSION_MAX_AGE_S } from '../../packages/cms/src/appwrite/session.ts';

test('roles come from team membership; highest wins; others get nothing', () => {
  assert.equal(roleFromTeams(['editor', 'admin']), 'admin');
  assert.equal(roleFromTeams(['editor']), 'editor');
  assert.equal(roleFromTeams(['writer', 'viewer']), null);
  assert.equal(roleFromTeams([]), null);
  assert.equal(hasRole('admin', 'editor'), true);
  assert.equal(hasRole('editor', 'admin'), false);
  assert.equal(hasRole(null, 'editor'), false);
});

test('gate: non-staff blocked; admins without two-factor confined to /account', () => {
  assert.equal(gate({ role: null, mfa: true, path: '/' }), '/no-access');
  assert.equal(gate({ role: 'admin', mfa: false, path: '/staff' }), '/account?enrol=1');
  assert.equal(gate({ role: 'admin', mfa: false, path: '/account' }), null);
  assert.equal(gate({ role: 'admin', mfa: true, path: '/staff' }), null);
  assert.equal(gate({ role: 'editor', mfa: false, path: '/' }), null);
});

test('session cookie: __Host- in production, strict, capped at 12 h', () => {
  const now = Date.UTC(2026, 9, 27);
  const o = sessionCookieOptions(new Date(now + 365 * 864e5).toISOString(), true, now);
  assert.equal(o.name, '__Host-cmd_admin');
  assert.equal(sessionCookieName(false), 'cmd_admin');
  assert.deepEqual([o.httpOnly, o.secure, o.sameSite, o.path], [true, true, 'strict', '/']);
  assert.equal(o.expires.getTime(), now + SESSION_MAX_AGE_S * 1000);
  // A shorter Appwrite session wins over the cap.
  assert.equal(sessionCookieOptions(new Date(now + 3600e3).toISOString(), true, now).expires.getTime(), now + 3600e3);
  // Clearing keeps the attributes a __Host- cookie needs.
  assert.deepEqual(clearedSessionCookie(true), { name: '__Host-cmd_admin', value: '', httpOnly: true, secure: true, sameSite: 'strict', path: '/', maxAge: 0 });
});
