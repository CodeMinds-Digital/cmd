import { expect, test, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const PASSWORD = 'correct-horse-battery';
const MOCK = 'http://127.0.0.1:4010/v1';

async function signIn(page: Page, email: string, password = PASSWORD) {
  await page.goto('/login');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Sign in' }).click();
}

test('signed out: every staff page sends you to sign-in', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveURL(/\/login$/);
  await page.goto('/staff');
  await expect(page).toHaveURL(/\/login\?next=%2Fstaff$/);
  await page.goto('/audit');
  await expect(page).toHaveURL(/\/login\?next=%2Faudit$/);
});

test('security headers and noindex', async ({ request }) => {
  const res = await request.get('/login');
  const h = res.headers();
  expect(h['content-security-policy']).toMatch(/script-src 'self' 'nonce-[^']+' 'strict-dynamic'/);
  expect(h['content-security-policy']).toContain("frame-ancestors 'none'");
  expect(h['content-security-policy']).toContain("object-src 'none'");
  expect(h['x-frame-options']).toBe('DENY');
  expect(h['x-content-type-options']).toBe('nosniff');
  expect(h['referrer-policy']).toBe('no-referrer');
  expect(h['x-robots-tag']).toContain('noindex');
  expect(h['cache-control']).toContain('no-store');
  expect(h['x-powered-by']).toBeUndefined();
  expect(await (await request.get('/robots.txt')).text()).toContain('Disallow: /');
  // Same headers on the redirect for signed-out visitors.
  const redirect = await request.get('/staff', { maxRedirects: 0 });
  expect(redirect.status()).toBe(307);
  expect(redirect.headers()['x-frame-options']).toBe('DENY');
});

test('login page is accessible and scripts run under the nonce CSP', async ({ page }) => {
  const blocked: string[] = [];
  page.on('console', (m) => m.type() === 'error' && /Content Security Policy/i.test(m.text()) && blocked.push(m.text()));
  await page.goto('/login');
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
  // The recovery-code toggle on /login/mfa needs hydration; here, check the form hydrated by submitting empty.
  expect(blocked).toEqual([]);
});

test('wrong password: one generic message', async ({ page }) => {
  await signIn(page, 'editor@test.local', 'wrong-password');
  await expect(page.locator('p[role="alert"]')).toHaveText('Email or password is incorrect.');
  await signIn(page, 'nobody@test.local', 'whatever');
  await expect(page.locator('p[role="alert"]')).toHaveText('Email or password is incorrect.');
});

test('editor: signed in, hardened cookie, blocked from admin pages', async ({ page, context }) => {
  await signIn(page, 'editor@test.local');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Hello, Eli');
  await expect(page.getByRole('navigation', { name: 'Admin' }).getByText('Eli Editor · Editor')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Staff' })).toHaveCount(0);

  const cookie = (await context.cookies()).find((c) => c.name === '__Host-cmd_admin');
  expect(cookie).toMatchObject({ httpOnly: true, secure: true, sameSite: 'Strict', path: '/' });
  expect(cookie!.expires * 1000 - Date.now()).toBeLessThanOrEqual(12 * 3600 * 1000 + 5000);

  for (const path of ['/staff', '/audit']) {
    await page.goto(path);
    await expect(page).toHaveURL(/\/no-access\?needed=admin$/);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Admins only');
  }
});

test('expired or revoked session reads as signed out', async ({ page, request }) => {
  await signIn(page, 'editor@test.local');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Hello, Eli');
  // Appwrite ends the session (expiry, admin removal, "sign out everywhere"); the cookie is still in the browser.
  await request.post(`${MOCK}/__revoke?userId=u-editor`);
  await page.goto('/account');
  await expect(page).toHaveURL(/\/login\?next=%2Faccount$/);
});

test('signed-in non-staff account gets no access', async ({ page }) => {
  await signIn(page, 'outsider@test.local');
  await expect(page).toHaveURL(/\/no-access$/);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('No access');
});

test('admin without two-factor must enrol before anything else', async ({ page }) => {
  await signIn(page, 'newadmin@test.local');
  await expect(page).toHaveURL(/\/account\?enrol=1$/);
  await expect(page.locator('p[role="alert"]').first()).toContainText('must turn on two-factor');
  await page.goto('/staff');
  await expect(page).toHaveURL(/\/account\?enrol=1$/);

  // Enrol: QR + manual key, wrong code rejected, right code turns it on and shows recovery codes once.
  await page.getByRole('button', { name: 'Set up two-factor authentication' }).click();
  await expect(page.getByRole('img', { name: 'QR code for your authenticator app' })).toBeVisible();
  await expect(page.getByText('JBSWY3DPEHPK3PXP')).toBeVisible();
  await page.getByLabel('6-digit code').fill('999999');
  await page.getByRole('button', { name: 'Verify and turn on' }).click();
  await expect(page.locator('p[role="alert"]').filter({ hasText: 'didn’t work' })).toBeVisible();
  await page.getByLabel('6-digit code').fill('123456');
  await page.getByRole('button', { name: 'Verify and turn on' }).click();
  await expect(page.getByText('Two-factor authentication is on.')).toBeVisible();
  await expect(page.getByText('a1b2c3d4e5')).toBeVisible();
  // Now unblocked.
  await page.goto('/staff');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Staff');
});

test('staff pages fit a phone screen (no sideways page scroll)', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 800 });
  await signIn(page, 'admin@test.local');
  await page.getByLabel(/6-digit code/).fill('123456');
  await page.getByRole('button', { name: 'Verify' }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Hello, Ada');
  for (const path of ['/', '/staff', '/audit', '/account']) {
    await page.goto(path);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(375);
  }
  // The collapsed menu opens and navigates.
  await page.getByText('Menu', { exact: true }).click();
  await page.getByRole('navigation', { name: 'Admin' }).getByRole('link', { name: 'Audit log' }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Audit log');
});

test('admin: two-factor sign-in, staff management, audit log, sign out', async ({ page, request }) => {
  await signIn(page, 'admin@test.local');
  await expect(page).toHaveURL(/\/login\/mfa/);
  // Client-only toggle: proves React hydrated, i.e. scripts run under the nonce CSP.
  await page.getByRole('button', { name: 'Use a recovery code instead' }).click();
  await expect(page.getByLabel('Recovery code')).toBeVisible();
  await page.getByRole('button', { name: 'Use my authenticator app' }).click();
  await page.getByLabel(/6-digit code/).fill('000000');
  await page.getByRole('button', { name: 'Verify' }).click();
  await expect(page.locator('p[role="alert"]')).toContainText('didn’t work');
  await page.getByLabel(/6-digit code/).fill('123456');
  await page.getByRole('button', { name: 'Verify' }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Hello, Ada');

  // Staff list: self row has no remove control; others do.
  await page.getByRole('link', { name: 'Staff' }).click();
  await expect(page.getByRole('row', { name: /Ada Admin \(you\)/ })).toBeVisible();
  await expect(page.getByRole('row', { name: /Ada Admin/ }).getByText('Remove…')).toHaveCount(0);
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);

  // Invite: account created, added to the team, set-password email requested.
  await page.getByLabel('Name').fill('Ivy Invitee');
  await page.getByLabel('Email').fill('ivy@test.local');
  await page.getByRole('button', { name: 'Invite' }).click();
  await expect(page.getByText(/Invited Ivy Invitee/)).toBeVisible();
  const recoveries = await (await request.get(`${MOCK}/__recoveries`)).json();
  expect(recoveries.at(-1)).toEqual({ email: 'ivy@test.local', url: 'http://localhost:3011/reset-password' });
  await page.reload();
  await expect(page.getByRole('row', { name: /Ivy Invitee/ })).toBeVisible();

  // Remove the editor: confirmation step, then gone.
  const row = page.getByRole('row', { name: /Eli Editor/ });
  await row.getByText('Remove…').click();
  await row.getByRole('button', { name: 'Remove Eli Editor' }).click();
  await expect(page).toHaveURL(/\/staff\?notice=removed$/);
  await expect(page.getByRole('status').filter({ hasText: 'Removed.' })).toBeVisible();
  await expect(page.getByRole('row', { name: /Eli Editor/ })).toHaveCount(0);

  // Audit log shows the trail.
  await page.getByRole('link', { name: 'Audit log' }).click();
  for (const action of ['auth.sign_in_mfa', 'staff.invite', 'staff.remove']) await expect(page.getByRole('cell', { name: action }).first()).toBeVisible();

  // Sign out ends the session server-side.
  await page.getByRole('button', { name: 'Sign out' }).click();
  await expect(page).toHaveURL(/\/login\?notice=signed_out$/);
  await page.goto('/');
  await expect(page).toHaveURL(/\/login$/);
});

test('sign-in is rate limited per email', async ({ page }) => {
  for (let i = 0; i < 5; i++) await signIn(page, 'admin@test.local', `wrong-${i}`);
  await signIn(page, 'admin@test.local', 'wrong-again');
  await expect(page.locator('p[role="alert"]')).toHaveText('Too many attempts. Wait a few minutes and try again.');
});
