/**
 * Appwrite environment, validated on first use (not at import, so a build
 * without Appwrite variables still succeeds until something reads them).
 *
 * Public values (endpoint, project, database IDs) are identifiers, not
 * secrets. The API key is server-only: never prefix it with NEXT_PUBLIC_,
 * never log it, and never import `readServerEnv` into a client component.
 * Error messages name the variable, never its value.
 */
import { z } from 'zod';

type Env = Record<string, string | undefined>;

const endpoint = z
  .string()
  .url()
  .refine((v) => /^https:\/\//.test(v) || /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?\//.test(v), 'must use https')
  .refine((v) => /\/v1\/?$/.test(v), 'must end with /v1')
  .transform((v) => v.replace(/\/$/, ''));

const id = z.string().regex(/^[a-zA-Z0-9][a-zA-Z0-9._-]{0,35}$/, 'not a valid Appwrite ID');

const publicSchema = z.object({
  NEXT_PUBLIC_APPWRITE_ENDPOINT: endpoint,
  NEXT_PUBLIC_APPWRITE_PROJECT_ID: id,
  NEXT_PUBLIC_APPWRITE_DATABASE_ID: id,
});

const serverSchema = publicSchema.extend({
  APPWRITE_API_KEY: z.string().min(32, 'looks too short to be an API key'),
});

export type PublicEnv = { endpoint: string; projectId: string; databaseId: string };
export type ServerEnv = PublicEnv & { apiKey: string };

function parse<T extends z.ZodType>(schema: T, env: Env): z.output<T> {
  const result = schema.safeParse(env);
  if (!result.success) {
    const problems = result.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ');
    throw new Error(`Invalid Appwrite environment (${problems}). See .env.example.`);
  }
  return result.data;
}

export function readPublicEnv(env: Env = process.env): PublicEnv {
  const e = parse(publicSchema, env);
  return {
    endpoint: e.NEXT_PUBLIC_APPWRITE_ENDPOINT,
    projectId: e.NEXT_PUBLIC_APPWRITE_PROJECT_ID,
    databaseId: e.NEXT_PUBLIC_APPWRITE_DATABASE_ID,
  };
}

export function readServerEnv(env: Env = process.env): ServerEnv {
  if (typeof window !== 'undefined') {
    throw new Error('The Appwrite API key must never be read in the browser.');
  }
  const e = parse(serverSchema, env);
  return {
    endpoint: e.NEXT_PUBLIC_APPWRITE_ENDPOINT,
    projectId: e.NEXT_PUBLIC_APPWRITE_PROJECT_ID,
    databaseId: e.NEXT_PUBLIC_APPWRITE_DATABASE_ID,
    apiKey: e.APPWRITE_API_KEY,
  };
}
