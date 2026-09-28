import type { Metadata } from 'next';
import React from 'react';
import { Geist, Geist_Mono, Space_Grotesk } from 'next/font/google';
import StructuredData from '@/components/seo/StructuredData';
import WebVitals from '@/components/perf/WebVitals';
import FrameBudget from '@/components/perf/FrameBudget';
import CustomCursor from '@/components/layout/CustomCursor';
import SmoothScroll from '@/components/animations/SmoothScrollLoader';
import IconSprite from '@/components/icons/IconSprite';
import MotionRuntime from '@/components/islands/MotionRuntime';

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
  // Preloaded: mono labels sit in the hero, and a late swap reflows them.
  preload: true,
  // Fall back to a real monospace (≈0.6em advance, like Geist Mono) rather
  // than size-adjusted Arial, which is proportional and rewraps labels on swap.
  adjustFontFallback: false,
  fallback: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Consolas', 'monospace'],
});

// Display face for headings (Voltage). Variable font — weights 300–700.
// Uses a hand-tuned fallback ('Space Grotesk Fallback' in globals.css):
// next/font's automatic one is ~3.6% narrower than Space Grotesk on bold
// headlines, which rewrapped the hero H1 when the font swapped in (CLS).
const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space-grotesk',
  display: 'swap',
  preload: true,
  adjustFontFallback: false,
  fallback: ['Space Grotesk Fallback', 'Arial', 'sans-serif'],
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
    <html
      lang="en"
      // Font variables live on <html> so every CSS variable built from them
      // (e.g. --font-display in @theme) resolves at :root too.
      className={`${geist.variable} ${geistMono.variable} ${spaceGrotesk.variable}`}
      suppressHydrationWarning
    >
      <head>
        <meta name="theme-color" content="#F2EFE8" />
        <meta name="color-scheme" content="light" />
        <link rel="icon" href="/icons/logo.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/icons/logo.svg" />
        {/*
          Motion gate (styles/motion.css): "before" states for in-view
          animations only apply under html.js-motion. Fail-safe: if
          <MotionRuntime> hasn't hydrated within 4s, drop the class so no
          content can stay hidden.
        */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "(function(d){d.classList.add('js-motion');setTimeout(function(){if(!d.classList.contains('motion-ready'))d.classList.remove('js-motion')},4000)})(document.documentElement)",
          }}
        />
      </head>
      <body
        className="bg-canvas font-sans text-fg antialiased"
        suppressHydrationWarning
      >
        <IconSprite />
        <StructuredData />
        <WebVitals />
        <FrameBudget />
        <SmoothScroll />
        <MotionRuntime />
        <a
          href="#main"
          className="fixed left-4 top-4 z-[10000] -translate-y-24 rounded-full bg-inverse px-5 py-3 text-sm font-medium text-inverse-fg transition-transform focus:translate-y-0"
        >
          Skip to content
        </a>
        <CustomCursor />
        <div id="root" className="relative min-h-screen">
          {children}
        </div>
      </body>
    </html>
  );
}