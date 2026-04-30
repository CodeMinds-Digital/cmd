import Script from 'next/script';
import { getSiteSettings } from '@/lib/cms/site-settings';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://codeminds.digital';

/**
 * JSON-LD structured data. The strings come from siteSettings in
 * Appwrite (with baked-in fallbacks). All values are JSON-stringified
 * with `</` → `<\/` escaped, so even if a CMS field contained the
 * literal string "</script>" it could not break out of the script tag.
 */
const StructuredData = async () => {
  const s = await getSiteSettings();
  const orgName = s.ogTitle;

  const sameAs = [
    s.twitterHandle && `https://twitter.com/${s.twitterHandle}`,
    s.linkedinHandle && `https://linkedin.com/company/${s.linkedinHandle}`,
    s.githubHandle && `https://github.com/${s.githubHandle}`,
  ].filter((x): x is string => !!x);

  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: orgName,
    url: SITE_URL,
    description: s.ogSubtitle,
    email: s.contactEmail,
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Chennai',
      addressRegion: 'TN',
      addressCountry: 'IN',
    },
    sameAs,
    contactPoint: {
      '@type': 'ContactPoint',
      email: s.contactEmail,
      contactType: 'Customer Service',
      availableLanguage: 'English',
    },
  };

  const serviceSchema = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: 'Software studio — web, mobile, AI',
    description: s.ogSubtitle,
    provider: { '@type': 'Organization', name: orgName, url: SITE_URL },
    serviceType: 'Web, Mobile, and AI software development',
    areaServed: 'Worldwide',
  };

  const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: orgName,
    url: SITE_URL,
    description: s.ogSubtitle,
    publisher: { '@type': 'Organization', name: orgName },
  };

  // JSON-LD escape: prevents `</script>` from breaking out even if a CMS
  // value somehow contained it. Standard hardening for inline LD+JSON.
  const safeJson = (obj: unknown) =>
    JSON.stringify(obj).replace(/</g, '\\u003c');

  return (
    <>
      <Script
        id="organization-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJson(organizationSchema) }}
      />
      <Script
        id="service-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJson(serviceSchema) }}
      />
      <Script
        id="website-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJson(websiteSchema) }}
      />
    </>
  );
};

export default StructuredData;