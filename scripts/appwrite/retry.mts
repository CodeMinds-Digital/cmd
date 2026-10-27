/**
 * Script-side resilience: node-appwrite calls undici's fetch with no timeout,
 * so a stalled response would hang a script forever. Importing this module
 * installs a global undici dispatcher with timeouts; `retrying` (shared with
 * the site, packages/cms) then retries connect failures and stalled reads.
 * A stalled write is not retried: re-run the idempotent script instead.
 */
import { Agent, setGlobalDispatcher } from 'undici';
import { retrying as retryingBase } from '../../packages/cms/src/appwrite/retry.ts';

setGlobalDispatcher(new Agent({ connect: { timeout: 10_000 }, headersTimeout: 30_000, bodyTimeout: 30_000 }));

export function retrying<T extends object>(service: T): T {
  return retryingBase(service, { attempts: 6, log: true });
}
