import { createHmac } from 'node:crypto';

/**
 * Triggered by row create/update/delete events on the site's content tables
 * (see scripts/appwrite/deploy-function.mts). Forwards the event name to the
 * site's /api/revalidate, signed with HMAC-SHA256 over `${timestamp}.${body}`,
 * so the matching page cache expires within seconds.
 *
 * Variables: SITE_REVALIDATE_URL, REVALIDATE_SECRET (same value as the site's
 * APPWRITE_WEBHOOK_SECRET). Never logs row data.
 */
export default async function revalidateSite({ req, res, log, error }) {
  const event = req.headers['x-appwrite-event'];
  const url = process.env.SITE_REVALIDATE_URL;
  const secret = process.env.REVALIDATE_SECRET;
  if (!url || !secret) {
    error('SITE_REVALIDATE_URL or REVALIDATE_SECRET is not set.');
    return res.json({ ok: false }, 500);
  }
  if (!event) return res.json({ ok: false, reason: 'no event' }, 400);

  const body = JSON.stringify({ events: [event] });
  const timestamp = Math.floor(Date.now() / 1000);
  const signature = createHmac('sha256', secret).update(`${timestamp}.${body}`).digest('hex');

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-cmd-timestamp': String(timestamp), 'x-cmd-signature': signature },
      body,
      signal: AbortSignal.timeout(10_000),
    });
    log(`${event.replace(/\.rows\.[^.]+/, '.rows.*')} → ${response.status}`);
    return res.json({ ok: response.ok, status: response.status });
  } catch (e) {
    error(`Revalidate request failed: ${e.message}`);
    return res.json({ ok: false }, 502);
  }
}
