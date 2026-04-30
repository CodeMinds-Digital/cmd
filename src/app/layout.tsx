import type { Metadata } from 'next';
import React from 'react';
import { Geist, Geist_Mono, Instrument_Serif } from 'next/font/google';
import StructuredData from '@/components/seo/StructuredData';
import WebVitals from '@/components/perf/WebVitals';
import FrameBudget from '@/components/perf/FrameBudget';
import CustomCursor from '@/components/layout/CustomCursor';
import SmoothScroll from '@/components/animations/SmoothScrollLoader';
import MotionRoot from '@/components/animations/MotionRoot';
import IconSprite from '@/components/icons/IconSprite';

import '../styles/globals.css';

const geist = Geist({
  subsets: ['latin'],
  variable: '--font-geist',
  display: 'swap',
  preload: true,
});

const geistMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-geist-mono',
  display: 'swap',
  preload: true,
});

const instrumentSerif = Instrument_Serif({
  weight: '400',
  style: ['normal', 'italic'],
  subsets: ['latin'],
  variable: '--font-serif',
  display: 'swap',
  preload: true,
});

import type { Viewport } from 'next';

export async function generateViewport(): Promise<Viewport> {
  const s = await getSiteSettings();
  return {
    width: 'device-width',
    initialScale: 1,
    themeColor: s.themeColor,
    colorScheme: 'dark',
  };
}

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://codeminds.digital';

import { getSiteSettings } from '@/lib/cms/site-settings';
import { urlForFile, BUCKETS } from '@/lib/appwrite/url-for-asset';

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSiteSettings();
  const title = `${s.ogTitle} | Software studio · Web · Mobile · AI`;
  const ogTwitter = s.twitterHandle ? `@${s.twitterHandle}` : undefined;

  // Favicon + apple-touch icons resolve to Appwrite URLs when the editor
  // has uploaded one; otherwise we fall back to the static SVG in /public.
  const faviconHref = s.faviconFileId
    ? urlForFile(s.faviconFileId, BUCKETS.publicAssets)
    : '/icons/logo.svg';
  const appleIconHref = s.appleTouchIconFileId
    ? urlForFile(s.appleTouchIconFileId, BUCKETS.publicAssets)
    : '/icons/logo.svg';

  return {
    metadataBase: new URL(siteUrl),
    title: { default: title, template: `%s | ${s.ogTitle}` },
    description: s.ogSubtitle,
    keywords:
      'web development, mobile app development, UI/UX design, AI integration, Next.js, Codeminds Digital, software studio, Chennai',
    authors: [{ name: s.ogTitle }],
    creator: s.ogTitle,
    publisher: s.ogTitle,
    robots: 'index, follow',
    icons: {
      icon: [{ url: faviconHref }],
      apple: [{ url: appleIconHref }],
    },
    openGraph: {
      type: 'website',
      locale: 'en_US',
      url: siteUrl,
      siteName: s.ogTitle,
      title,
      description: s.ogSubtitle,
      images: [
        {
          url: '/api/og',
          width: 1200,
          height: 630,
          alt: `${s.ogTitle} — software studio`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      site: ogTwitter,
      creator: ogTwitter,
      title,
      description: s.ogSubtitle,
      images: ['/api/og'],
    },
    alternates: { canonical: siteUrl },
    category: 'technology',
  };
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      {/* `theme-color` + `color-scheme` come from generateViewport().
          Favicon + apple-touch-icon come from app/icon.tsx + app/apple-icon.tsx,
          both reading from siteSettings in Appwrite. */}
      <body
        className={`
          ${geist.variable}
          ${geistMono.variable}
          ${instrumentSerif.variable}
          font-sans antialiased
          bg-ink-900 text-paper-100
          selection:bg-brand-400/30 selection:text-paper-50
        `}
        suppressHydrationWarning
      >
        <IconSprite />
        <StructuredData />
        <WebVitals />
        <FrameBudget />
        <CustomCursor />
        <SmoothScroll />
        <MotionRoot>
          <div id="root" className="relative min-h-screen">
            {children}
          </div>
        </MotionRoot>
      </body>
    </html>
  );
}