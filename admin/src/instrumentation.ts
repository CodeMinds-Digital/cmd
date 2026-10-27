/**
 * Runs once when the admin server starts: validates configuration and logs
 * exactly what is missing or malformed (variable names only, never values),
 * so a bad Dokploy env shows up in the logs instead of as "Sign-in is
 * unavailable" later.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return;
  const problems: string[] = [];
  try {
    const { readServerEnv } = await import('@codeminds/cms/env');
    readServerEnv();
  } catch (e) {
    problems.push((e as Error).message);
  }
  for (const name of ['ADMIN_URL', 'SITE_URL']) {
    const v = process.env[name];
    if (!v) problems.push(`${name} is not set`);
    else if (/^["']|["']$/.test(v)) problems.push(`${name} is wrapped in quotes; remove them`);
    else if (!/^https?:\/\/[^/]+/.test(v)) problems.push(`${name} must be a full URL like https://…`);
  }
  if (!process.env.PREVIEW_SECRET || process.env.PREVIEW_SECRET.length < 32) problems.push('PREVIEW_SECRET is not set (same value as the site)');
  for (const name of ['NEXT_PUBLIC_APPWRITE_ENDPOINT', 'NEXT_PUBLIC_APPWRITE_PROJECT_ID', 'NEXT_PUBLIC_APPWRITE_DATABASE_ID', 'APPWRITE_API_KEY']) {
    if (/^["']|["']$/.test(process.env[name] ?? '')) problems.push(`${name} is wrapped in quotes; remove them`);
  }
  if (problems.length) console.error(`[admin] Configuration problems — sign-in and password emails will fail:\n  - ${problems.join('\n  - ')}`);
  else console.log('[admin] Configuration OK.');
}
