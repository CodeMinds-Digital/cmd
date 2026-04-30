import HeaderClient from './HeaderClient';
import { getNavByLocation } from '@/lib/cms/site-settings';

/**
 * Server-component wrapper. Fetches header nav from Appwrite
 * (cached + tagged), then hands off to the interactive client.
 * If Appwrite is unreachable, the data layer falls back to the
 * baked-in nav so the header never goes blank.
 */
export default async function Header() {
  const items = await getNavByLocation('header');
  const navItems = items.map((i) => ({ href: i.href, label: i.label }));
  return <HeaderClient navItems={navItems} />;
}
