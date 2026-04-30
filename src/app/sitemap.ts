import type { MetadataRoute } from 'next';
import { getCases } from '@/lib/cms/cases';
import { getPosts } from '@/lib/cms/posts';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://codeminds.digital';

/**
 * Auto-generated sitemap. Pulls live slugs from Appwrite for case studies
 * and journal posts. Static routes are listed inline. Updated at request
 * time — Next regenerates on revalidation, so a publish triggers a fresh
 * sitemap within seconds.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`,        lastModified: now, changeFrequency: 'weekly',  priority: 1.0 },
    { url: `${SITE_URL}/work`,    lastModified: now, changeFrequency: 'weekly',  priority: 0.9 },
    { url: `${SITE_URL}/studio`,  lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${SITE_URL}/journal`, lastModified: now, changeFrequency: 'weekly',  priority: 0.7 },
  ];

  const [cases, posts] = await Promise.all([getCases(), getPosts()]);

  const caseRoutes: MetadataRoute.Sitemap = cases
    // Hide drafts and stub "coming soon" cases from search engines.
    .filter((c) => c.status === 'live' || c.status === 'published')
    .map((c) => ({
      url: `${SITE_URL}/work/${c.slug}`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.8,
    }));

  const postRoutes: MetadataRoute.Sitemap = posts.map((p) => ({
    url: `${SITE_URL}/journal/${p.slug}`,
    lastModified: p.date ? new Date(p.date) : now,
    changeFrequency: 'monthly',
    priority: 0.6,
  }));

  return [...staticRoutes, ...caseRoutes, ...postRoutes];
}
