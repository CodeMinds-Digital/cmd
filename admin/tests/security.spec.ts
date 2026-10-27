import { expect, test, type Browser, type Page } from '@playwright/test';

const MOCK = 'http://127.0.0.1:4010/v1';
const IP = { 'x-real-ip': '10.0.0.5' };
const BASE = 'http://localhost:3011';

test.describe.configure({ mode: 'serial' });
test.use({ extraHTTPHeaders: IP });

async function signIn(page: Page, email: string, password = 'correct-horse-battery') {
  await page.goto('/login');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Sign in' }).click();
  if (email.startsWith('admin')) {
    await page.getByLabel(/6-digit code/).fill('123456');
    await page.getByRole('button', { name: 'Verify' }).click();
  }
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Hello');
}
const fresh = async (browser: Browser) => (await browser.newContext({ baseURL: BASE, extraHTTPHeaders: IP })).newPage();
const statusBar = (page: Page) => page.locator('.fixed.bottom-0 [role="status"], .fixed.bottom-0 [role="alert"]');

test('an Admin cannot publish a draft that changed after they opened it', async ({ page, browser, request }) => {
  const editor = await fresh(browser);
  await signIn(editor, 'editor5@test.local');
  await editor.goto('/projects/cs-beta');
  await editor.getByLabel('One-line brief').fill('Reviewed version.');
  await editor.getByRole('button', { name: 'Save draft' }).click();
  await expect(statusBar(editor)).toHaveText('Draft saved.');

  await signIn(page, 'admin5@test.local');
  await page.goto('/projects/cs-beta');
  await expect(page.getByLabel('One-line brief')).toHaveValue('Reviewed version.');

  // The editor changes it after the Admin opened it.
  await editor.getByLabel('One-line brief').fill('Swapped after review!');
  await editor.getByRole('button', { name: 'Save draft' }).click();
  await expect(statusBar(editor)).toHaveText('Draft saved.');

  await page.getByRole('button', { name: 'Publish' }).click();
  await expect(statusBar(page)).toContainText('Someone saved this draft after you opened it');
  const live = (await (await request.get(`${MOCK}/__table/caseStudy`)).json()).find((r: { $id: string }) => r.$id === 'cs-beta');
  expect(live.brief).not.toBe('Swapped after review!');
});

test('inviting a pre-registered account resets it before granting access', async ({ page, request }) => {
  const squat = await (await request.post(`${MOCK}/__session?userId=u-squatter`)).json();
  expect(squat.secret).toBeTruthy();
  await signIn(page, 'admin5@test.local');
  await page.goto('/staff');
  await page.getByLabel('Name').fill('Future Hire');
  await page.getByLabel('Email').fill('future-hire@test.local');
  await page.getByRole('button', { name: 'Invite' }).click();
  await expect(page.getByText(/Invited Future Hire/)).toBeVisible();
  const resets = await (await request.get(`${MOCK}/__resets`)).json();
  expect(resets).toEqual(expect.arrayContaining(['PATCH password u-squatter', 'DELETE mfa/authenticators/totp u-squatter', 'PATCH mfa u-squatter']));
  // Their earlier session is gone.
  expect(await (await request.get(`${MOCK}/__sessions`)).json()).not.toContain('u-squatter');
});

test('changing your password signs you out everywhere else', async ({ page, browser }) => {
  const other = await fresh(browser);
  await signIn(other, 'editor5@test.local');
  await signIn(page, 'editor5@test.local');
  await page.goto('/account');
  await page.getByLabel('Current password').fill('correct-horse-battery');
  await page.getByLabel('New password', { exact: true }).fill('a-much-longer-new-passphrase');
  await page.getByLabel('Repeat new password').fill('a-much-longer-new-passphrase');
  await page.getByRole('button', { name: 'Change password' }).click();
  await expect(page.getByRole('status').filter({ hasText: 'signed out everywhere else' })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Account');
  await other.goto('/');
  await expect(other).toHaveURL(/\/login/);
});

test('sign-in redirect refuses control-character tricks (no open redirect)', async ({ page }) => {
  await page.goto('/login?next=' + encodeURIComponent('/\t/evil.example'));
  await page.getByLabel('Email').fill('editor5@test.local');
  await page.getByLabel('Password').fill('correct-horse-battery');
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page).toHaveURL(`${BASE}/`);
});
