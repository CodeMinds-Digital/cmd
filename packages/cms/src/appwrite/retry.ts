/**
 * Retry wrapper for SDK services on flaky networks.
 *
 *   - calls that failed to *connect* are retried (the request never left);
 *   - reads (get*, list*) that stalled or were reset are retried;
 *   - a write that stalled is NOT retried (it may have been applied).
 */
const CONNECT = new Set(['UND_ERR_CONNECT_TIMEOUT', 'ECONNREFUSED', 'ENETUNREACH', 'EHOSTUNREACH', 'EAI_AGAIN']);
const STALLED = new Set(['UND_ERR_HEADERS_TIMEOUT', 'UND_ERR_BODY_TIMEOUT', 'UND_ERR_SOCKET', 'ECONNRESET']);

const code = (e: unknown) => (e as { cause?: { code?: string } })?.cause?.code ?? '';

export function retrying<T extends object>(service: T, { attempts = 4, log = false } = {}): T {
  return new Proxy(service, {
    get(target, prop, receiver) {
      const value = Reflect.get(target, prop, receiver);
      if (typeof value !== 'function') return value;
      const isRead = /^(get|list)/.test(String(prop));
      return async (...args: unknown[]) => {
        for (let i = 1; ; i++) {
          try {
            return await value.apply(target, args);
          } catch (e) {
            const c = code(e);
            if (!(CONNECT.has(c) || (isRead && STALLED.has(c))) || i >= attempts) throw e;
            if (log) console.log(`  (${String(prop)}: ${c}, retry ${i}/${attempts - 1})`);
            await new Promise((r) => setTimeout(r, 500 * i));
          }
        }
      };
    },
  });
}
