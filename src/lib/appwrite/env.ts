/**
 * Centralised Appwrite env-var access. Throws at module load if a
 * required variable is missing in the current execution context, so we
 * fail fast at boot rather than at first request.
 */

function readEnv(name: string, required = true): string {
  const v = process.env[name];
  if (!v) {
    if (required) {
      throw new Error(
        `Missing required env var: ${name}. ` +
          `Set it in .env.local (see .env.example for the template).`,
      );
    }
    return '';
  }
  return v;
}

// Public — safe to read on client + server.
export const APPWRITE_ENDPOINT = readEnv('NEXT_PUBLIC_APPWRITE_ENDPOINT');
export const APPWRITE_PROJECT_ID = readEnv('NEXT_PUBLIC_APPWRITE_PROJECT_ID');
export const APPWRITE_DATABASE_ID = readEnv('NEXT_PUBLIC_APPWRITE_DATABASE_ID');

// Server-only — never imported into a client component bundle.
// We only read this when the module is loaded on the server.
export function getServerApiKey(): string {
  if (typeof window !== 'undefined') {
    throw new Error(
      'APPWRITE_API_KEY must never be imported into a client component.',
    );
  }
  return readEnv('APPWRITE_API_KEY');
}

export function getWebhookSecret(): string {
  if (typeof window !== 'undefined') {
    throw new Error(
      'APPWRITE_WEBHOOK_SECRET must never be imported into a client component.',
    );
  }
  return readEnv('APPWRITE_WEBHOOK_SECRET');
}
