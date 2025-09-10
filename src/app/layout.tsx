import type { Metadata } from 'next';
import React from 'react';
import { Inter, Poppins, Space_Grotesk, DM_Sans } from 'next/font/google';
import dynamic from 'next/dynamic';
import StructuredData from '@/components/seo/StructuredData';
import '../styles/globals.css';

const CustomCursor = dynamic(() => import('@/components/layout/CustomCursor'), {
  ssr: false
});

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const poppins = Poppins({
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
  variable: '--font-poppins',
  display: 'swap',
});

const spaceGrotesk = Space_Grotesk({
  weight: ['300', '400', '500', '600', '700'],
  subsets: ['latin'],
  variable: '--font-space-grotesk',
  display: 'swap',
});

const dmSans = DM_Sans({
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
  variable: '--font-dm-sans',
  display: 'swap',
});

export const viewport = {
  width: 'device-width',
  initialScale: 1,
};

export const metadata: Metadata = {
  title: 'CodeMinds Digital | Professional Web Development & Digital Solutions',
  description: 'Transform your business with CodeMinds Digital. We specialize in custom web development, mobile apps, UI/UX design, and digital marketing solutions. Get your project delivered in 2-4 weeks.',
  keywords: 'web development, mobile app development, UI/UX design, digital marketing, custom software, CodeMinds Digital, website design, e-commerce development',
  authors: [{ name: 'CodeMinds Digital' }],
  creator: 'CodeMinds Digital',
  publisher: 'CodeMinds Digital',
  robots: 'index, follow',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://codeminds.digital',
    siteName: 'CodeMinds Digital',
    title: 'CodeMinds Digital | Professional Web Development & Digital Solutions',
    description: 'Transform your business with CodeMinds Digital. We specialize in custom web development, mobile apps, UI/UX design, and digital marketing solutions.',
    images: [
      {
        url: '/images/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'CodeMinds Digital - Professional Web Development Services',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@codemindsdigital',
    creator: '@codemindsdigital',
    title: 'CodeMinds Digital | Professional Web Development & Digital Solutions',
    description: 'Transform your business with CodeMinds Digital. We specialize in custom web development, mobile apps, UI/UX design, and digital marketing solutions.',
    images: ['/images/twitter-card.jpg'],
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
    <html lang="en" className="scroll-smooth">
      <body className={`${inter.variable} ${poppins.variable} ${spaceGrotesk.variable} ${dmSans.variable} font-sans antialiased dark:bg-gray-900 dark:text-gray-100`}>
        <StructuredData />
        <CustomCursor />
        {children}
      </body>
    </html>
  );
}