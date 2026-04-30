import 'server-only';

/**
 * Best-effort Slack notifier. POSTs to a webhook URL configured via
 * env. Silent no-op when the env var is missing. Never throws.
 *
 * Set SLACK_PUBLISH_WEBHOOK in .env.local. Format: a Slack Incoming
 * Webhook URL — Slack ignores anything beyond `text` so a plain string
 * payload is enough.
 */
export async function notifyPublish(input: {
  title: string;
  collectionId: string;
  slug?: string;
  actor: string;
  url?: string;
}): Promise<void> {
  const webhook = process.env.SLACK_PUBLISH_WEBHOOK;
  if (!webhook) return;

  const labelByCollection: Record<string, string> = {
    caseStudy: 'Case study',
    journalPost: 'Journal post',
    siteSettings: 'Site settings',
  };
  const what = labelByCollection[input.collectionId] ?? input.collectionId;

  const link = input.url
    ? `<${input.url}|${input.title}>`
    : input.title;

  const text = `📣 *${what} published* — ${link}\n_by ${input.actor}_`;

  try {
    await fetch(webhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
      // Don't block the response — fire-and-forget feel.
      keepalive: true,
    });
  } catch {
    // Never fatal.
  }
}
