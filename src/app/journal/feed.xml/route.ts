import { getPosts } from '@/lib/cms/posts';
import { getSiteSettings } from '@/lib/cms/site-settings';

export const runtime = 'nodejs';
// Don't pre-render at build — feed must reflect the latest publish.
export const dynamic = 'force-dynamic';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://codeminds.digital';

/**
 * RSS 2.0 feed for /journal. Auto-generated from the `journalPost`
 * collection (already filtered to published-only by getPosts).
 */
export async function GET() {
  const [posts, settings] = await Promise.all([getPosts(), getSiteSettings()]);

  const items = posts
    .map((p) => {
      const url = `${SITE_URL}/journal/${p.slug}`;
      const pubDate = p.date ? new Date(p.date).toUTCString() : new Date().toUTCString();
      return `
    <item>
      <title>${escapeXml(p.title)}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <description>${escapeXml(p.excerpt)}</description>
      <pubDate>${pubDate}</pubDate>
      ${p.tags.map((t) => `<category>${escapeXml(t)}</category>`).join('\n      ')}
    </item>`;
    })
    .join('');

  const xml = `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(settings.ogTitle)} — Journal</title>
    <link>${SITE_URL}/journal</link>
    <atom:link href="${SITE_URL}/journal/feed.xml" rel="self" type="application/rss+xml" />
    <description>${escapeXml(settings.ogSubtitle)}</description>
    <language>en</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
