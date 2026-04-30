import HeaderClient from './HeaderClient';
import { getNavByLocation, getSiteSettings } from '@/lib/cms/site-settings';
import { Wordmark } from '@/components/site/Wordmark';

/**
 * Server-component wrapper. Fetches header nav + site settings from
 * Appwrite (cached + tagged) and pre-renders the wordmark, then hands
 * off to the interactive client. Keeping the wordmark on the server
 * avoids shipping the font registry to the client bundle.
 */
export default async function Header() {
  const [items, settings] = await Promise.all([
    getNavByLocation('header'),
    getSiteSettings(),
  ]);
  const navItems = items.map((i) => ({ href: i.href, label: i.label }));
  return <HeaderClient navItems={navItems} wordmark={<Wordmark settings={settings} />} />;
}
