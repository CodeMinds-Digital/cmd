import { expect, test, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { Client, TablesDB } from 'node-appwrite';
import { publishSection } from '../../packages/cms/src/content/sections.ts';

const MOCK = 'http://127.0.0.1:4010/v1';
const IP = { 'x-real-ip': '10.0.0.4' };

test.describe.configure({ mode: 'serial' });
test.use({ extraHTTPHeaders: IP });

async function signIn(page: Page, email: string) {
  await page.goto('/login');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill('correct-horse-battery');
  await page.getByRole('button', { name: 'Sign in' }).click();
  if (email.startsWith('admin')) {
    await page.getByLabel(/6-digit code/).fill('123456');
    await page.getByRole('button', { name: 'Verify' }).click();
  }
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Hello');
}
const rows = async (request: import('@playwright/test').APIRequestContext, table: string) => (await request.get(`${MOCK}/__table/${table}`)).json();
const statusBar = (page: Page) => page.locator('.fixed.bottom-0 [role="status"], .fixed.bottom-0 [role="alert"]');

test('editor: edits capabilities as a draft (validation, groups), submits for review', async ({ page, request }) => {
  await signIn(page, 'editor4@test.local');
  await page.getByRole('link', { name: 'Site content' }).click();
  for (const s of ['Capabilities', 'How we work', 'Tech stack', 'Client logos', 'Studio details']) await expect(page.getByRole('link', { name: s })).toBeVisible();
  await page.getByRole('link', { name: 'Capabilities' }).click();
  await expect(page.getByLabel('Capability 01 Title')).toHaveValue('Web platforms');
  await expect(page.getByLabel('Capability 02 group 1 Group title')).toHaveValue('Custom backends');
  expect((await new AxeBuilder({ page }).exclude('.fixed.bottom-0').analyze()).violations).toEqual([]);

  await page.getByLabel('Capability 01 Title').fill('');
  await page.getByRole('button', { name: 'Save draft' }).click();
  await expect(statusBar(page)).toContainText('Fix the highlighted fields');
  await expect(page.getByLabel('Capability 01 Title')).toBeFocused();

  await page.getByLabel('Capability 01 Title').fill('Web platforms & sites');
  await page.getByLabel('Capability 02 group 1 Items (one per line)').fill('REST APIs\nGraphQL');
  await page.getByRole('button', { name: 'Save draft' }).click();
  await expect(statusBar(page)).toHaveText('Draft saved.');
  expect((await rows(request, 'capability')).find((r: { $id: string }) => r.$id === 'cap-web').title).toBe('Web platforms');
  await expect(page.getByRole('button', { name: 'Publish' })).toHaveCount(0);
  await page.getByRole('button', { name: 'Submit for review' }).click();
  await expect(statusBar(page)).toContainText('Submitted for review');
});

test('editor: stack and studio details validation', async ({ page }) => {
  await signIn(page, 'editor4@test.local');
  await page.goto('/content/stack');
  await page.getByRole('button', { name: 'Add technology' }).click();
  await page.getByLabel('Item 3 Name').fill('Svelte');
  await page.getByLabel('Item 3 Group').selectOption('web');
  await page.getByLabel('Item 3 Icon').selectOption('code');
  await page.getByRole('button', { name: 'Save draft' }).click();
  await expect(statusBar(page)).toHaveText('Draft saved.');

  await page.goto('/content/settings');
  await page.getByLabel('Delivery: from (weeks)').fill('6');
  await page.getByLabel('Delivery: to (weeks)').fill('3');
  await page.getByLabel('Booking link (https://…)').fill('http://insecure.example');
  await page.getByRole('button', { name: 'Save draft' }).click();
  await expect(page.locator('#err-deliveryMaxWeeks')).toHaveText('Must be at least the minimum.');
  await expect(page.locator('#err-calUrl')).toContainText('https://');
  await page.getByLabel('Delivery: to (weeks)').fill('8');
  await page.getByLabel('Booking link (https://…)').fill('https://cal.example/new');
  await page.getByRole('button', { name: 'Save draft' }).click();
  await expect(statusBar(page)).toHaveText('Draft saved.');
});

test('Appwrite rejects an editor writing a section directly', async ({ page, context, request }) => {
  await signIn(page, 'editor4@test.local');
  const secret = (await context.cookies()).find((c) => c.name === '__Host-cmd_admin')!.value;
  const asEditor = new TablesDB(new Client().setEndpoint(MOCK).setProject('e2e-project').setSession(secret));
  await expect(publishSection(asEditor, { databaseId: 'e2e-db', key: 'process', data: { items: [] }, actorId: 'u-editor4' })).rejects.toMatchObject({ code: 401 });
  expect((await rows(request, 'processStep')).length).toBe(2);
});

test('admin publishes sections: rows rewritten in place, drafts cleared, audited', async ({ page, request }) => {
  await signIn(page, 'admin4@test.local');
  await page.goto('/content');
  await expect(page.getByRole('listitem').filter({ hasText: 'Capabilities' }).getByText('In review')).toBeVisible();

  await page.goto('/content/capabilities');
  await page.getByRole('button', { name: 'Publish' }).click();
  await expect(page).toHaveURL(/notice=published/);
  const caps = await rows(request, 'capability');
  expect(caps.map((c: { $id: string; title: string; orderIndex: number }) => `${c.$id}:${c.orderIndex}:${c.title}`).sort()).toEqual(['cap-backend:1:Backend & APIs', 'cap-web:0:Web platforms & sites']);
  const groups = await rows(request, 'capabilityGroup');
  expect(groups.map((g: { $id: string; items: string[] }) => `${g.$id}:${g.items.join('|')}`)).toEqual(['cap-backend-g1:REST APIs|GraphQL']);

  for (const [section, check] of [
    ['stack', async () => expect((await rows(request, 'stackItem')).map((r: { label: string }) => r.label).sort()).toEqual(['React', 'Rust', 'Svelte'])],
    ['settings', async () => expect((await rows(request, 'siteSettings'))[0]).toMatchObject({ deliveryMinWeeks: 6, deliveryMaxWeeks: 8, bookingUrl: 'https://cal.example/new' })],
  ] as const) {
    await page.goto(`/content/${section}`);
    await page.getByRole('button', { name: 'Publish' }).click();
    await expect(page).toHaveURL(/notice=published/);
    await check();
  }
  expect((await rows(request, 'contentDraft')).filter((d: { rowId: string }) => d.rowId === 'all')).toEqual([]);
  await page.goto('/audit');
  await expect(page.getByRole('cell', { name: 'section.publish' }).first()).toBeVisible();
});

test('admin inbox: filter, update, audit without personal data, CSV escaped, delete', async ({ page, request }) => {
  await signIn(page, 'admin4@test.local');
  await page.getByRole('link', { name: 'Enquiries' }).click();
  await expect(page.getByRole('link', { name: /Priya Prospect/ })).toBeVisible();
  await page.getByRole('link', { name: /^Spam \(1\)/ }).click();
  await expect(page.getByRole('link', { name: /Priya Prospect/ })).toHaveCount(0);
  await page.getByRole('link', { name: 'All', exact: true }).click();
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);

  await page.getByRole('link', { name: /Priya Prospect/ }).click();
  await expect(page.getByText('Hello, we need an app.')).toBeVisible();
  await page.getByLabel('Status', { exact: true }).selectOption('replied');
  await page.getByLabel('Assigned to').selectOption({ label: 'Lee Lead' });
  await page.getByLabel('Internal notes').fill('Sent a proposal.');
  await page.getByRole('button', { name: 'Save' }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Saved.' })).toBeVisible();
  expect((await rows(request, 'lead')).find((r: { $id: string }) => r.$id === 'lead-1')).toMatchObject({ status: 'replied', assignedTo: 'u-admin4', notes: 'Sent a proposal.' });

  const audit = await (await request.get(`${MOCK}/__audit`)).json();
  const entry = audit.find((a: { action: string }) => a.action === 'enquiry.update');
  expect(entry).toMatchObject({ documentId: 'lead-1', diffSummary: 'status new → replied; notes edited; reassigned' });
  expect(JSON.stringify(entry)).not.toMatch(/Priya|priya@|proposal/);

  const csvRes = await page.request.get('/api/enquiries/export');
  expect(csvRes.headers()['content-type']).toContain('text/csv');
  const csv = await csvRes.text();
  expect(csv).toContain('received,status,name,email');
  expect(csv).toContain(`"'=HYPERLINK(""https://evil.example"",""click"")"`);
  expect(csv).toContain(`"'+cmd|calc"`);
  expect(csv).not.toMatch(/(^|,)"=/m);

  await page.goto('/enquiries/lead-2');
  await page.getByText('Delete this enquiry…').click();
  await page.getByRole('button', { name: 'Delete permanently' }).click();
  await expect(page).toHaveURL(/\/enquiries\?notice=deleted$/);
  expect((await rows(request, 'lead')).some((r: { $id: string }) => r.$id === 'lead-2')).toBe(false);
});

test('editors cannot reach the inbox or its export', async ({ page }) => {
  await signIn(page, 'editor4@test.local');
  await expect(page.getByRole('link', { name: 'Enquiries' })).toHaveCount(0);
  await page.goto('/enquiries');
  await expect(page).toHaveURL(/\/no-access\?needed=admin$/);
  await page.goto('/enquiries/lead-1');
  await expect(page).toHaveURL(/\/no-access\?needed=admin$/);
  expect((await page.request.get('/api/enquiries/export')).status()).toBe(403);
});
