import { defineConfig } from '@playwright/test';

/**
 * Admin E2E against a local mock of Appwrite (tests/mock-appwrite.mjs):
 * test accounts only, nothing reaches the real project. Runs the production
 * build (`next build` first) so cookies, CSP and headers are the real ones.
 */
const PORT = 3011;
const MOCK = 4010;

export default defineConfig({
  testDir: './tests',
  workers: 1,
  fullyParallel: false,
  use: { baseURL: `http://localhost:${PORT}` },
  webServer: [
    { command: `node tests/mock-appwrite.mjs`, port: MOCK, env: { MOCK_PORT: String(MOCK) }, reuseExistingServer: false },
    {
      command: `npx next start -p ${PORT}`,
      url: `http://localhost:${PORT}/login`,
      reuseExistingServer: false,
      timeout: 120_000,
      env: {
        NEXT_PUBLIC_APPWRITE_ENDPOINT: `http://127.0.0.1:${MOCK}/v1`,
        NEXT_PUBLIC_APPWRITE_PROJECT_ID: 'e2e-project',
        NEXT_PUBLIC_APPWRITE_DATABASE_ID: 'e2e-db',
        APPWRITE_API_KEY: 'e2e-test-key-not-a-real-secret-0000000000',
        ADMIN_URL: `http://localhost:${PORT}`,
        // Preview links point here; nothing listens, the tests only check the signed URL.
        SITE_URL: 'http://127.0.0.1:4999',
        PREVIEW_SECRET: 'e2e-preview-secret-not-real-000000000000',
      },
    },
  ],
});
