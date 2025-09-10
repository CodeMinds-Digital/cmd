import type { Metadata } from 'next';
import React from 'react';
import { Inter, Poppins, Space_Grotesk, DM_Sans, JetBrains_Mono } from 'next/font/google';
import StructuredData from '@/components/seo/StructuredData';

import '../styles/globals.css';



// Modern font configurations
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
  preload: true,
});

const poppins = Poppins({
  weight: ['300', '400', '500', '600', '700', '800', '900'],
  subsets: ['latin'],
  variable: '--font-poppins',
  display: 'swap',
  preload: true,
});

const spaceGrotesk = Space_Grotesk({
  weight: ['300', '400', '500', '600', '700'],
  subsets: ['latin'],
  variable: '--font-space-grotesk',
  display: 'swap',
  preload: true,
});

const dmSans = DM_Sans({
  weight: ['300', '400', '500', '600', '700', '800', '900'],
  subsets: ['latin'],
  variable: '--font-dm-sans',
  display: 'swap',
  preload: true,
});

const jetbrainsMono = JetBrains_Mono({
  weight: ['300', '400', '500', '600', '700', '800'],
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',
  display: 'swap',
  preload: false,
});

export const viewport = {
  width: 'device-width',
  initialScale: 1,
};

export const metadata: Metadata = {
  title: 'Create Studio | Award-Winning Web Development & Digital Design Agency',
  description: 'Transform your business with Create Studio. We craft award-winning websites, mobile apps, and digital experiences that drive growth. Professional results delivered in 2-4 weeks.',
  keywords: 'web development, mobile app development, UI/UX design, digital design, custom software, Create Studio, website design, e-commerce development, digital agency, award-winning design',
  authors: [{ name: 'Create Studio' }],
  creator: 'Create Studio',
  publisher: 'Create Studio',
  robots: 'index, follow',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://createstudio.digital',
    siteName: 'Create Studio',
    title: 'Create Studio | Award-Winning Web Development & Digital Design Agency',
    description: 'Transform your business with Create Studio. We craft award-winning websites, mobile apps, and digital experiences that drive growth.',
    images: [
      {
        url: '/images/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Create Studio - Award-Winning Digital Design Agency',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@createstudio',
    creator: '@createstudio',
    title: 'Create Studio | Award-Winning Web Development & Digital Design Agency',
    description: 'Transform your business with Create Studio. We craft award-winning websites, mobile apps, and digital experiences that drive growth.',
    images: ['/images/twitter-card.jpg'],
  },
  alternates: {
    canonical: 'https://createstudio.digital',
  },
  category: 'technology',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="scroll-smooth" suppressHydrationWarning>
      <head>
        <meta name="theme-color" content="#6366f1" />
        <meta name="color-scheme" content="light" />
        <link rel="icon" href="/icons/logo.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/icons/logo.svg" />
      </head>
      <body
        className={`
          ${inter.variable}
          ${poppins.variable}
          ${spaceGrotesk.variable}
          ${dmSans.variable}
          ${jetbrainsMono.variable}
          font-sans antialiased
          bg-white
          text-neutral-900
        `}
        suppressHydrationWarning
      >
        <StructuredData />
        <div id="root" className="relative min-h-screen">
          {children}
        </div>
      </body>
    </html>
  );
}