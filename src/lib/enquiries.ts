import 'server-only';
import { hashIp } from '@codeminds/cms/privacy';
import { adminClient, ID } from '@codeminds/cms/server';
import type { ContactInput } from '@/lib/contact-schema';

/**
 * Stores contact enquiries in Appwrite (`lead`, Admin-only). Written with the
 * server key; the table grants no create permission to anyone else.
 * Personal data: the IP is kept only as a keyed hash, and nothing about the
 * enquiry is ever logged. Failures return null so email delivery still runs.
 */
const LEGACY_MESSAGE_MAX = 4000;

export async function storeEnquiry(
  input: ContactInput,
  meta: { source: 'contact-form' | 'api'; ip: string; userAgent: string | null },
): Promise<string | null> {
  try {
    const { env, tablesDB } = adminClient();
    let ipHash: string | null = null;
    if (meta.ip !== 'unknown') {
      try {
        ipHash = hashIp(meta.ip);
      } catch {
        console.error('Enquiry stored without ipHash: IP_HASH_SALT is not configured.');
      }
    }
    const row = await tablesDB.createRow({
      databaseId: env.databaseId,
      tableId: 'lead',
      rowId: ID.unique(),
      data: {
        name: input.name,
        email: input.email,
        project: input.project ?? null,
        budget: input.budget ?? null,
        timeline: input.timeline ?? null,
        message: input.message.slice(0, LEGACY_MESSAGE_MAX),
        messageBody: input.message,
        source: meta.source,
        status: 'new',
        userAgent: meta.userAgent?.slice(0, 500) ?? null,
        ipHash,
      },
    });
    return row.$id;
  } catch (e) {
    console.error('Could not store enquiry in Appwrite:', (e as Error).message);
    return null;
  }
}

export async function markEmailDelivered(id: string, delivered: boolean) {
  try {
    const { env, tablesDB } = adminClient();
    await tablesDB.updateRow({ databaseId: env.databaseId, tableId: 'lead', rowId: id, data: { emailDelivered: delivered } });
  } catch (e) {
    console.error('Could not update enquiry delivery status:', (e as Error).message);
  }
}
