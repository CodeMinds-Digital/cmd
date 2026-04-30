/**
 * Browser-side Appwrite SDK. Used by the /admin route (editors) for
 * authenticated reads/writes scoped to the logged-in user. NEVER import
 * `node-appwrite` from this file or any file it transitively imports.
 */

import { Account, Client, Databases, Storage, Teams } from 'appwrite';
import { APPWRITE_ENDPOINT, APPWRITE_PROJECT_ID } from './env';

let cachedClient: Client | undefined;

function getClient(): Client {
  if (!cachedClient) {
    cachedClient = new Client()
      .setEndpoint(APPWRITE_ENDPOINT)
      .setProject(APPWRITE_PROJECT_ID);
  }
  return cachedClient;
}

export const browserAccount = new Account(getClient());
export const browserDatabases = new Databases(getClient());
export const browserStorage = new Storage(getClient());
export const browserTeams = new Teams(getClient());

export { ID, Permission, Role, Query } from 'appwrite';
