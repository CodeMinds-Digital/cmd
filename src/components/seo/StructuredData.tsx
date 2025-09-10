'use client';

import Script from 'next/script';

const StructuredData = () => {
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "CodeMinds Digital",
    "url": "https://codeminds.digital",
    "logo": "https://codeminds.digital/images/logo.png",
    "description": "Professional web development and digital solutions company specializing in custom software, mobile apps, and UI/UX design.",
    "email": "cmd@codeminds.digital",
    "address": {
      "@type": "PostalAddress",
      "addressCountry": "US"
    },
    "sameAs": [
      "https://twitter.com/codemindsdigital",
      "https://linkedin.com/company/codeminds-digital"
    ],
    "contactPoint": {
      "@type": "ContactPoint",
      "email": "cmd@codeminds.digital",
      "contactType": "Customer Service"
    }
  };

  const serviceSchema = {
    "@context": "https://schema.org",
    "@type": "Service",
    "name": "Web Development Services",
    "description": "Custom web development, mobile app development, UI/UX design, and digital marketing solutions",
    "provider": {
      "@type": "Organization",
      "name": "CodeMinds Digital",
      "url": "https://codeminds.digital"
    },
    "serviceType": "Web Development",
    "areaServed": "Worldwide",
    "hasOfferCatalog": {
      "@type": "OfferCatalog",
      "name": "Web Development Services",
      "itemListElement": [
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "Custom Web Development",
            "description": "Tailored web applications and websites built with modern technologies"
          }
        },
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "Mobile App Development",
            "description": "Native and cross-platform mobile applications for iOS and Android"
          }
        },
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "UI/UX Design",
            "description": "User interface and user experience design for web and mobile applications"
          }
        },
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "Digital Marketing",
            "description": "SEO, social media marketing, and digital advertising solutions"
          }
        }
      ]
    }
  };

  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "CodeMinds Digital",
    "url": "https://codeminds.digital",
    "description": "Professional web development and digital solutions",
    "publisher": {
      "@type": "Organization",
      "name": "CodeMinds Digital"
    },
    "potentialAction": {
      "@type": "SearchAction",
      "target": "https://codeminds.digital/search?q={search_term_string}",
      "query-input": "required name=search_term_string"
    }
  };

  return (
    <>
      <Script
        id="organization-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(organizationSchema),
        }}
      />
      <Script
        id="service-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(serviceSchema),
        }}
      />
      <Script
        id="website-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(websiteSchema),
        }}
      />
    </>
  );
};

export default StructuredData;