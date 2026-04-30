/**
 * Server-side Appwrite SDK with the admin API key. Used by:
 *   - server components for cached page reads
 *   - route handlers (/api/*) for privileged operations
 *   - migration scripts
 *
 * `import 'server-only'` ensures Next.js refuses to bundle this into a
 * client component. The check in env.ts is a runtime double-guard.
 */

import 'server-only';
import { Client, Databases, Storage, Teams, Users } from 'node-appwrite';
import {
  APPWRITE_ENDPOINT,
  APPWRITE_PROJECT_ID,
  getServerApiKey,
} from './env';

let cachedClient: Client | undefined;

function getClient(): Client {
  if (!cachedClient) {
    cachedClient = new Client()
      .setEndpoint(APPWRITE_ENDPOINT)
      .setProject(APPWRITE_PROJECT_ID)
      .setKey(getServerApiKey());
  }
  return cachedClient;
}

export const databases = new Databases(getClient());
export const storage = new Storage(getClient());
export const teams = new Teams(getClient());
export const users = new Users(getClient());

export { ID, Permission, Role, Query } from 'node-appwrite';
