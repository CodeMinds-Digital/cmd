'use client';

import Script from 'next/script';

const StructuredData = () => {
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Create Studio",
    "url": "https://createstudio.digital",
    "logo": "https://createstudio.digital/images/logo.png",
    "description": "Award-winning digital design agency specializing in web development, mobile apps, UI/UX design, and digital experiences that drive business growth.",
    "email": "hello@createstudio.digital",
    "address": {
      "@type": "PostalAddress",
      "addressLocality": "San Francisco",
      "addressRegion": "CA",
      "addressCountry": "US"
    },
    "sameAs": [
      "https://twitter.com/createstudio",
      "https://linkedin.com/company/create-studio",
      "https://dribbble.com/createstudio",
      "https://behance.net/createstudio"
    ],
    "contactPoint": {
      "@type": "ContactPoint",
      "email": "hello@createstudio.digital",
      "contactType": "Customer Service",
      "availableLanguage": "English"
    }
  };

  const serviceSchema = {
    "@context": "https://schema.org",
    "@type": "Service",
    "name": "Digital Design & Development Services",
    "description": "Award-winning web development, mobile app development, UI/UX design, and digital experiences that transform businesses",
    "provider": {
      "@type": "Organization",
      "name": "Create Studio",
      "url": "https://createstudio.digital"
    },
    "serviceType": "Digital Design & Development",
    "areaServed": "Worldwide",
    "hasOfferCatalog": {
      "@type": "OfferCatalog",
      "name": "Digital Design & Development Services",
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
    "name": "Create Studio",
    "url": "https://createstudio.digital",
    "description": "Award-winning digital design agency crafting exceptional web experiences",
    "publisher": {
      "@type": "Organization",
      "name": "Create Studio"
    },
    "potentialAction": {
      "@type": "SearchAction",
      "target": "https://createstudio.digital/search?q={search_term_string}",
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