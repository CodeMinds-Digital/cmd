import { expect, test, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { Client, TablesDB } from 'node-appwrite';
import { publishProject } from '../../packages/cms/src/content/project.ts';
import { verifyPreview } from '../../packages/cms/src/signing.ts';

const MOCK = 'http://127.0.0.1:4010/v1';
const PASSWORD = 'correct-horse-battery';
const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', 'base64');

test.describe.configure({ mode: 'serial' });
// Own rate-limit bucket: the admin suite already used most of this IP's sign-in budget.
const IP = { 'x-real-ip': '10.0.0.2' };
test.use({ extraHTTPHeaders: IP });

async function signIn(page: Page, email: string) {
  await page.goto('/login');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(PASSWORD);
  await page.getByRole('button', { name: 'Sign in' }).click();
  if (email.startsWith('admin')) {
    await page.getByLabel(/6-digit code/).fill('123456');
    await page.getByRole('button', { name: 'Verify' }).click();
  }
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Hello');
}
const rows = async (request: import('@playwright/test').APIRequestContext, table: string) => (await request.get(`${MOCK}/__table/${table}`)).json();
const statusBar = (page: Page) => page.locator('.fixed.bottom-0 [role="status"], .fixed.bottom-0 [role="alert"]');

test('editor: edit a live project as a draft, validation, submit for review', async ({ page, request }) => {
  await signIn(page, 'editor2@test.local');
  await page.getByRole('link', { name: 'Projects' }).first().click();
  await expect(page.getByRole('link', { name: 'Alpha project' })).toBeVisible();
  await page.getByRole('link', { name: 'Alpha project' }).click();

  // Loaded from the live rows.
  await expect(page.getByLabel('Title', { exact: true })).toHaveValue('Alpha project');
  await expect(page.getByLabel('Step 01 Title')).toHaveValue('First step');
  expect((await new AxeBuilder({ page }).exclude('.fixed.bottom-0').analyze()).violations).toEqual([]);

  // Validation: an empty title is refused and focused.
  await page.getByLabel('Title', { exact: true }).fill('');
  await page.getByRole('button', { name: 'Save draft' }).click();
  await expect(statusBar(page)).toContainText('Fix the highlighted fields');
  await expect(page.getByLabel('Title', { exact: true })).toBeFocused();

  await page.getByLabel('Title', { exact: true }).fill('Alpha project (edited)');
  await page.getByRole('button', { name: 'Add step' }).click();
  await page.getByLabel('Step 02 Title').fill('Second step');
  await page.getByLabel('Step 02 What we did').fill('Then another.');
  await page.getByRole('button', { name: 'Save draft' }).click();
  await expect(statusBar(page)).toHaveText('Draft saved.');

  // Live rows untouched; a draft exists.
  expect((await rows(request, 'caseStudy')).find((r: { $id: string }) => r.$id === 'cs-alpha').title).toBe('Alpha project');
  const draft = (await rows(request, 'contentDraft')).find((d: { rowId: string }) => d.rowId === 'cs-alpha');
  expect(JSON.parse(draft.data).approach.map((s: { index: string }) => s.index)).toEqual(['01', '02']);

  // Editors can't publish: no button.
  await expect(page.getByRole('button', { name: 'Publish' })).toHaveCount(0);
  await page.getByRole('button', { name: 'Submit for review' }).click();
  await expect(statusBar(page)).toContainText('Submitted for review');
  await page.goto('/projects');
  await expect(page.getByRole('listitem').filter({ hasText: 'Alpha project (edited)' }).getByText('In review')).toBeVisible();
});

test('preview opens a signed, short-lived link to the draft on the site', async ({ page, context }) => {
  await signIn(page, 'editor2@test.local');
  await page.goto('/projects/cs-alpha');
  const popup = context.waitForEvent('page');
  await page.getByRole('button', { name: 'Preview' }).click();
  const tab = await popup;
  // Nothing listens on the fake site URL; the request itself is what matters.
  const req = await tab.waitForRequest(/\/api\/preview\?/);
  const url = new URL(req.url());
  expect(url.origin).toBe('http://127.0.0.1:4999');
  expect(url.searchParams.get('path')).toBe('/work/alpha-project');
  const ok = verifyPreview('e2e-preview-secret-not-real-000000000000', url.searchParams.get('path')!, url.searchParams.get('expires'), url.searchParams.get('signature'));
  expect(ok).toBe(true);
});

test('Appwrite rejects an editor writing live project tables', async ({ page, context, request }) => {
  await signIn(page, 'editor2@test.local');
  const secret = (await context.cookies()).find((c) => c.name === '__Host-cmd_admin')!.value;
  const asEditor = new TablesDB(new Client().setEndpoint(MOCK).setProject('e2e-project').setSession(secret));
  const draft = JSON.parse((await rows(request, 'contentDraft')).find((d: { rowId: string }) => d.rowId === 'cs-alpha').data);
  await expect(publishProject(asEditor, { databaseId: 'e2e-db', rowId: 'cs-alpha', data: draft, actorId: 'u-editor2' })).rejects.toMatchObject({ code: 401 });
  expect((await rows(request, 'caseStudy')).find((r: { $id: string }) => r.$id === 'cs-alpha').title).toBe('Alpha project');
});

test('admin publishes the reviewed draft; live rows replaced, draft removed, audited', async ({ page, request }) => {
  await signIn(page, 'admin2@test.local');
  await page.goto('/projects/cs-alpha');
  await page.getByRole('button', { name: 'Publish' }).click();
  await expect(page).toHaveURL(/notice=published/);
  await expect(page.getByRole('status').filter({ hasText: 'Published.' })).toBeVisible();
  const live = (await rows(request, 'caseStudy')).find((r: { $id: string }) => r.$id === 'cs-alpha');
  expect(live).toMatchObject({ title: 'Alpha project (edited)', state: 'published', publishedBy: 'u-admin2' });
  const steps = (await rows(request, 'caseApproachStep')).filter((s: { caseStudyId: string }) => s.caseStudyId === 'cs-alpha');
  expect(steps.map((s: { $id: string; title: string }) => `${s.$id}:${s.title}`).sort()).toEqual(['cs-alpha-a1:First step', 'cs-alpha-a2:Second step']);
  expect((await rows(request, 'contentDraft')).some((d: { rowId: string }) => d.rowId === 'cs-alpha')).toBe(false);
  await page.goto('/audit');
  await expect(page.getByRole('cell', { name: 'project.publish' }).first()).toBeVisible();
  await expect(page.getByRole('cell', { name: 'project.submit' }).first()).toBeVisible();
});

test('admin creates a project with an uploaded cover, publishes, reorders, hides and deletes it', async ({ page, request }) => {
  await signIn(page, 'admin2@test.local');
  await page.goto('/projects');
  await page.getByRole('button', { name: 'New project' }).click();
  await expect(page).toHaveURL(/\/projects\/[a-z0-9]{20}$/);
  const rowId = page.url().split('/').pop()!;

  await page.getByLabel('Title', { exact: true }).fill('Gamma launch');
  await page.getByRole('button', { name: 'From title' }).click();
  await expect(page.getByLabel('Address')).toHaveValue('gamma-launch');
  await page.getByLabel('One-line brief').fill('A new project.');

  // SVG is refused by content, not just by name.
  await page.locator('input[type=file]').first().setInputFiles({ name: 'evil.png', mimeType: 'image/png', buffer: Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>') });
  await expect(page.getByRole('alert').filter({ hasText: 'no SVG' })).toBeVisible();
  await page.locator('input[type=file]').first().setInputFiles({ name: 'cover.png', mimeType: 'image/png', buffer: PNG });
  await expect(page.getByRole('button', { name: 'Replace image (Cover)' })).toBeVisible();
  await page.getByLabel('Cover description (alt text)').fill('Gamma cover');

  await page.getByRole('button', { name: 'Publish' }).click();
  await expect(page).toHaveURL(new RegExp(`/projects/${rowId}\\?notice=published`));
  const live = (await rows(request, 'caseStudy')).find((r: { $id: string }) => r.$id === rowId);
  expect(live).toMatchObject({ slug: 'gamma-launch', state: 'published', orderIndex: 2 });
  expect(live.coverFileId).toMatch(/^file\d+$/);

  // Reorder: move Gamma up one place.
  await page.goto('/projects');
  await page.getByRole('button', { name: 'Move Gamma launch up' }).click();
  await expect.poll(async () => (await rows(request, 'caseStudy')).find((r: { $id: string }) => r.$id === rowId).orderIndex).toBe(1);

  // Hide, then delete.
  await page.goto(`/projects/${rowId}`);
  await page.getByRole('button', { name: 'Hide from site' }).click();
  await expect(page).toHaveURL(/notice=unpublished/);
  expect((await rows(request, 'caseStudy')).find((r: { $id: string }) => r.$id === rowId).state).toBe('draft');
  await page.getByText('Delete…').click();
  await page.getByRole('button', { name: 'Delete “Gamma launch”' }).click();
  await expect(page).toHaveURL(/\/projects\?notice=deleted$/);
  expect((await rows(request, 'caseStudy')).some((r: { $id: string }) => r.$id === rowId)).toBe(false);
});

test('a stale editor tab cannot overwrite a newer draft', async ({ browser }) => {
  const a = await browser.newContext({ baseURL: 'http://localhost:3011', extraHTTPHeaders: IP });
  const b = await browser.newContext({ baseURL: 'http://localhost:3011', extraHTTPHeaders: IP });
  const pa = await a.newPage();
  const pb = await b.newPage();
  await signIn(pa, 'editor2@test.local');
  await signIn(pb, 'editor2@test.local');
  await pa.goto('/projects/cs-beta');
  await pb.goto('/projects/cs-beta');
  await pa.getByLabel('One-line brief').fill('Saved first.');
  await pa.getByRole('button', { name: 'Save draft' }).click();
  await expect(statusBar(pa)).toHaveText('Draft saved.');
  await pa.getByLabel('One-line brief').fill('Saved second, same tab.');
  await pa.getByRole('button', { name: 'Save draft' }).click();
  await expect(statusBar(pa)).toHaveText('Draft saved.');
  // Tab B opened before A's saves (no draft then); its save must not clobber A's.
  await pb.getByLabel('One-line brief').fill('Stale overwrite.');
  await pb.getByRole('button', { name: 'Save draft' }).click();
  await expect(statusBar(pb)).toContainText('Someone else saved this draft');
  await a.close();
  await b.close();
});

test('upload endpoint refuses signed-out and cross-site requests', async ({ page, request }) => {
  const file = { name: 'a.png', mimeType: 'image/png', buffer: PNG };
  const anon = await request.post('/api/upload', { headers: { origin: 'http://localhost:3011' }, multipart: { file }, maxRedirects: 0 });
  expect(anon.status()).toBe(401);
  // Signed in (cookie sent), but the request comes from another site: CSRF refused.
  // (Admin account: the editor's per-email sign-in budget is spent by now — that limit working.)
  await signIn(page, 'admin2@test.local');
  const cross = await page.request.post('/api/upload', { headers: { origin: 'https://evil.example' }, multipart: { file } });
  expect(cross.status()).toBe(403);
  const same = await page.request.post('/api/upload', { headers: { origin: 'http://localhost:3011' }, multipart: { file } });
  expect(same.status()).toBe(200);
});
