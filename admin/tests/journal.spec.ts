import { expect, test, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { Client, TablesDB } from 'node-appwrite';
import { publishPost } from '../../packages/cms/src/content/post.ts';

const MOCK = 'http://127.0.0.1:4010/v1';
const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', 'base64');
const IP = { 'x-real-ip': '10.0.0.3' };

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
const body = (page: Page) => page.getByRole('textbox', { name: 'Body' });
let rowId = '';

test('editor writes a post with the visual editor; only safe links get in', async ({ page, request }) => {
  await signIn(page, 'editor3@test.local');
  await page.getByRole('link', { name: 'Journal' }).first().click();
  await expect(page.getByRole('link', { name: 'Legacy post' })).toBeVisible();
  await page.getByRole('button', { name: 'New post' }).click();
  await expect(page).toHaveURL(/\/journal\/[a-z0-9]{20}$/);
  rowId = page.url().split('/').pop()!;

  await page.getByLabel('Title', { exact: true }).fill('Practical notes on editors');
  await page.getByRole('button', { name: 'From title' }).click();
  await page.getByLabel('Summary (shown on the journal list)').fill('What we learned.');

  await body(page).click();
  await page.keyboard.type('An opening paragraph.');
  await page.keyboard.press('Enter');
  await page.getByRole('button', { name: 'Heading', exact: true }).click();
  await page.keyboard.type('A section');
  await expect(page.getByRole('button', { name: 'Heading', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await page.keyboard.press('Enter');
  await page.getByRole('button', { name: 'Bulleted list' }).click();
  await page.keyboard.type('First point');
  await page.keyboard.press('Enter');
  await page.keyboard.type('Second point');
  await page.keyboard.press('Enter');
  await page.keyboard.press('Enter');

  // Link: javascript: refused in the editor, https accepted.
  await page.keyboard.type('Read the docs');
  // Select just those words (Shift+Home means "to document start" on macOS).
  await page.keyboard.press('Shift+ArrowLeft', { delay: 0 });
  for (let i = 1; i < 'Read the docs'.length; i++) await page.keyboard.press('Shift+ArrowLeft');
  await page.getByRole('button', { name: 'Link', exact: true }).click();
  await page.getByLabel('Link address').fill('javascript:alert(1)');
  await page.getByRole('button', { name: 'Apply' }).click();
  await expect(page.getByRole('alert').filter({ hasText: 'https://' })).toBeVisible();
  await page.getByLabel('Link address').fill('https://example.com/docs');
  await page.getByRole('button', { name: 'Apply' }).click();

  await expect(body(page).getByRole('link', { name: 'Read the docs' })).toHaveAttribute('href', 'https://example.com/docs');
  // Image in the body, in the empty paragraph after the link (a click is a
  // deterministic caret; arrow keys race ProseMirror's async selection restore).
  await body(page).locator('p').last().click();
  await page.getByRole('button', { name: 'Image', exact: true }).click();
  await page.getByLabel('Image file').setInputFiles({ name: 'chart.png', mimeType: 'image/png', buffer: PNG });
  await page.getByRole('button', { name: 'Insert image' }).click();
  await expect(page.getByRole('alert').filter({ hasText: 'Describe the image' })).toBeVisible();
  await page.getByLabel('Image description (alt text)').fill('A chart of results');
  await page.getByRole('button', { name: 'Insert image' }).click();
  await expect(body(page).locator('img[data-file-id]')).toHaveAttribute('alt', 'A chart of results');

  await page.getByRole('button', { name: 'Save draft' }).click();
  await expect(statusBar(page)).toHaveText('Draft saved.');

  const draft = (await rows(request, 'contentDraft')).find((d: { rowId: string }) => d.rowId === rowId);
  const doc = JSON.parse(draft.data).body;
  const types = doc.content.map((b: { type: string }) => b.type);
  expect(types).toEqual(expect.arrayContaining(['paragraph', 'heading', 'bulletList', 'image']));
  expect(doc.content.find((b: { type: string }) => b.type === 'heading').attrs).toEqual({ level: 2 });
  const json = JSON.stringify(doc);
  expect(json).toContain('"href":"https://example.com/docs"');
  expect(json).not.toMatch(/javascript:|"target"|"rel"|"class"|"src"/);
  expect(doc.content.find((b: { type: string }) => b.type === 'image').attrs).toMatchObject({ alt: 'A chart of results', fileId: expect.stringMatching(/^file\d+$/) });
  expect((await new AxeBuilder({ page }).exclude('.fixed.bottom-0').analyze()).violations).toEqual([]);
});

test('pasted hostile HTML is neutralised before it is saved', async ({ page, request }) => {
  await signIn(page, 'editor3@test.local');
  await page.goto(`/journal/${rowId}`);
  // Paste at the end of the document.
  await body(page).locator('p').last().click();
  await page.evaluate(() => {
    const html = [
      '<p>Pasted <a href="javascript:alert(1)">bad link</a> and <a href="https://ok.example/" onclick="alert(1)" target="_blank" style="color:red">good link</a></p>',
      '<script>alert(1)</script>',
      '<img src="https://evil.example/track.png" onerror="alert(1)">',
      '<iframe src="https://evil.example"></iframe>',
      '<h1 style="color:red" onclick="alert(1)">Big heading</h1>',
    ].join('');
    const data = new DataTransfer();
    data.setData('text/html', html);
    data.setData('text/plain', 'fallback');
    document.querySelector('.ProseMirror')!.dispatchEvent(new ClipboardEvent('paste', { clipboardData: data, bubbles: true, cancelable: true }));
  });
  await page.getByRole('button', { name: 'Save draft' }).click();
  await expect(statusBar(page)).toHaveText('Draft saved.');
  const json = JSON.parse((await rows(request, 'contentDraft')).find((d: { rowId: string }) => d.rowId === rowId).data).body;
  const s = JSON.stringify(json);
  expect(s).toContain('Pasted');
  expect(s).toContain('"href":"https://ok.example/"');
  expect(s).not.toMatch(/javascript:|onclick|onerror|<script|iframe|evil\.example|style|"level":1\b/);
  // The foreign image never became an image node.
  expect(json.content.filter((b: { type: string }) => b.type === 'image')).toHaveLength(1);
});

test('legacy plain-text post opens as paragraphs', async ({ page }) => {
  await signIn(page, 'editor3@test.local');
  await page.goto('/journal/jp-legacy');
  await expect(body(page).locator('p')).toHaveText(['First paragraph.', 'Second paragraph.']);
});

test('Appwrite rejects an editor writing journalPost directly', async ({ page, context, request }) => {
  await signIn(page, 'editor3@test.local');
  const secret = (await context.cookies()).find((c) => c.name === '__Host-cmd_admin')!.value;
  const asEditor = new TablesDB(new Client().setEndpoint(MOCK).setProject('e2e-project').setSession(secret));
  const data = JSON.parse((await rows(request, 'contentDraft')).find((d: { rowId: string }) => d.rowId === rowId).data);
  await expect(publishPost(asEditor, { databaseId: 'e2e-db', rowId, data, actorId: 'u-editor3' })).rejects.toMatchObject({ code: 401 });
});

test('editor submits, admin publishes: live row has the rich body and reading time', async ({ page, request, browser }) => {
  await signIn(page, 'editor3@test.local');
  await page.goto(`/journal/${rowId}`);
  await page.getByRole('button', { name: 'Submit for review' }).click();
  await expect(statusBar(page)).toContainText('Submitted for review');

  const admin = await (await browser.newContext({ baseURL: 'http://localhost:3011', extraHTTPHeaders: IP })).newPage();
  await signIn(admin, 'admin3@test.local');
  await admin.goto('/journal');
  await expect(admin.getByRole('listitem').filter({ hasText: 'Practical notes on editors' }).getByText('In review')).toBeVisible();
  await admin.goto(`/journal/${rowId}`);
  await admin.getByRole('button', { name: 'Publish' }).click();
  await expect(admin).toHaveURL(/notice=published/);

  const live = (await rows(request, 'journalPost')).find((r: { $id: string }) => r.$id === rowId);
  expect(live).toMatchObject({ slug: 'practical-notes-on-editors', state: 'published', status: 'published', readingTime: '1 min read', publishedBy: 'u-admin3' });
  expect(JSON.parse(live.bodyJson).content.some((b: { type: string }) => b.type === 'heading')).toBe(true);
  expect(live.body).toContain('An opening paragraph.');
  expect((await rows(request, 'contentDraft')).some((d: { rowId: string }) => d.rowId === rowId)).toBe(false);
  await admin.goto('/audit');
  await expect(admin.getByRole('cell', { name: 'post.publish' }).first()).toBeVisible();
});
