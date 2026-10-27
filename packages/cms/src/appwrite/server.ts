/**
 * Server-side Appwrite with the project API key. For server components,
 * route handlers, server actions and scripts only.
 *
 * Uses TablesDB (Databases is deprecated since server 1.8.0) and the SDK's
 * object-parameter style (positional arguments are deprecated in
 * node-appwrite 31). The app-level wrapper adds `import 'server-only'`; it is
 * not imported here so Node scripts can share this module.
 */
import { Account, Client, Storage, TablesDB, Teams, Users } from 'node-appwrite';
import { readServerEnv, type ServerEnv } from '../env.ts';

export type AdminClient = {
  env: ServerEnv;
  /** For services not listed here (e.g. Functions in deploy scripts). */
  client: Client;
  /** For creating sessions during sign-in: only a keyed client gets the session secret back. */
  account: Account;
  tablesDB: TablesDB;
  storage: Storage;
  teams: Teams;
  users: Users;
};

let cached: AdminClient | undefined;

export function createAdminClient(env: ServerEnv = readServerEnv()): AdminClient {
  const client = new Client().setEndpoint(env.endpoint).setProject(env.projectId).setKey(env.apiKey);
  return {
    env,
    client,
    account: new Account(client),
    tablesDB: new TablesDB(client),
    storage: new Storage(client),
    teams: new Teams(client),
    users: new Users(client),
  };
}

/** Process-wide admin client (reads env once). */
export function adminClient(): AdminClient {
  return (cached ??= createAdminClient());
}

export { AppwriteException, AuthenticationFactor, AuthenticatorType, ID, Permission, Query, Role } from 'node-appwrite';
