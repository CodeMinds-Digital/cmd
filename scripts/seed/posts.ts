/**
 * One-time seed data for `npx tsx scripts/migrate-content.ts`.
 * The runtime reads from Appwrite (src/lib/cms/posts.ts).
 */
import type { Post } from '../../src/types/post';

export const posts: Post[] = [
  {
    slug: 'why-we-stopped-pricing-by-the-hour',
    title: 'Why we stopped pricing by the hour',
    excerpt:
      'Hourly billing rewards slow work. Fixed-price scoping forces both sides to agree on outcomes — and pays better when you ship fast.',
    date: '2026-04-12',
    readingTime: '6 min read',
    tags: ['Studio', 'Pricing'],
    body: 'Long-form post coming soon. The TL;DR: we now scope every engagement on outcomes, not hours, and our average effective rate went up while our clients\' costs went down.',
  },
  {
    slug: 'shipping-mobile-in-a-single-sprint',
    title: 'Shipping mobile in a single sprint',
    excerpt:
      'How we get iOS and Android into TestFlight in two weeks using SwiftUI for the iOS-native bits and React Native for the shared core.',
    date: '2026-03-28',
    readingTime: '9 min read',
    tags: ['Mobile', 'Engineering'],
    body: 'Long-form post coming soon.',
  },
  {
    slug: 'practical-rag-not-demo-rag',
    title: 'Practical RAG, not demo RAG',
    excerpt:
      'Most RAG demos fall apart on real datasets. Here is what we ship in production: chunking, eval, citations, and the boring infra.',
    date: '2026-03-08',
    readingTime: '11 min read',
    tags: ['AI', 'Engineering'],
    body: 'Long-form post coming soon.',
  },
];
