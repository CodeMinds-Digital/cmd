/**
 * Enquiries keep a keyed hash of the sender's IP, never the IP itself: enough
 * to spot repeat spam from one address, useless for locating anyone.
 * The key (IP_HASH_SALT) is server-only; rotating it breaks matching with
 * older hashes, nothing else.
 */
import { createHmac } from 'node:crypto';

export function hashIp(ip: string, salt: string | undefined = process.env.IP_HASH_SALT): string {
  if (!salt || salt.length < 32) throw new Error('IP_HASH_SALT is missing or shorter than 32 characters.');
  return createHmac('sha256', salt).update(ip.trim().toLowerCase()).digest('hex');
}
