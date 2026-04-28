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

export const viewport = {
  width: 'device-width',
  initialScale: 1,
};

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://codeminds.digital';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: 'Codeminds Digital | Award-Winning Web Development & Digital Design Agency',
  description: 'Transform your business with Codeminds Digital. We craft award-winning websites, mobile apps, and digital experiences that drive growth. Professional results delivered in 2-4 weeks.',
  keywords: 'web development, mobile app development, UI/UX design, digital design, custom software, Codeminds Digital, website design, e-commerce development, digital agency, award-winning design',
  authors: [{ name: 'Codeminds Digital' }],
  creator: 'Codeminds Digital',
  publisher: 'Codeminds Digital',
  robots: 'index, follow',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://codeminds.digital',
    siteName: 'Codeminds Digital',
    title: 'Codeminds Digital | Award-Winning Web Development & Digital Design Agency',
    description: 'Transform your business with Codeminds Digital. We craft award-winning websites, mobile apps, and digital experiences that drive growth.',
    images: [
      {
        url: '/api/og',
        width: 1200,
        height: 630,
        alt: 'Codeminds Digital - Award-Winning Digital Design Agency',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@codeminds',
    creator: '@codeminds',
    title: 'Codeminds Digital | Award-Winning Web Development & Digital Design Agency',
    description: 'Transform your business with Codeminds Digital. We craft award-winning websites, mobile apps, and digital experiences that drive growth.',
    images: ['/api/og'],
  },
  alternates: {
    canonical: 'https://codeminds.digital',
  },
  category: 'technology',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="theme-color" content="#0a0a0c" />
        <meta name="color-scheme" content="dark" />
        <link rel="icon" href="/icons/logo.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/icons/logo.svg" />
      </head>
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