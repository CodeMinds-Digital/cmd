export type CaseStatus = 'live' | 'coming';

export type CaseApproachStep = {
  index: string; // "01", "02"…
  title: string;
  body: string;
};

export type CaseScreen = {
  /** Optional image src — falls back to a generated gradient placeholder. */
  src?: string;
  alt: string;
  caption?: string;
  /** Visual treatment of the placeholder when no src. */
  tone?: 'indigo' | 'cyan' | 'mixed';
};

export type CaseMetricItem = {
  label: string;
  value: string;
};

export type CaseTestimonial = {
  quote: string;
  author: string;
  role: string;
};

export type CaseStub = {
  slug: string;
  title: string;
  client?: string;
  year: number;
  brief: string;
  tags: string[];
  status: CaseStatus;
  eta?: string;

  /** Square or 16:10 cover image — used by tiles + case hero. */
  cover?: string;
  /** Optional alt for the cover image. Falls back to title. */
  coverAlt?: string;

  // — Long-form fields (R4)
  role?: string;
  duration?: string;
  liveUrl?: string;
  problem?: string;
  approach?: CaseApproachStep[];
  screens?: CaseScreen[];
  metrics?: CaseMetricItem[];
  testimonial?: CaseTestimonial;
};

/**
 * Single source of truth for the work index. R4 layers structured rich
 * content on top of the basic stubs from R3. R5+ may graduate this to
 * MDX once the case count justifies the dependency weight.
 */
export const cases: CaseStub[] = [
  {
    slug: 'fintech-marketing-rebuild',
    title: 'Marketing rebuild for a fintech',
    client: 'Confidential',
    year: 2026,
    brief:
      'Cut LCP from 4.1s to 1.6s and lifted lead conversion 47% on the same content.',
    tags: ['Next.js', 'Postgres', 'Tailwind'],
    status: 'live',
    cover: '/work/fintech-cover.svg',
    coverAlt: 'Performance chart — before 4.1s LCP, after 1.6s LCP',
    role: 'Lead engineer + designer',
    duration: '3 weeks',
    liveUrl: undefined, // Confidential — leave hidden in CTA
    problem:
      'A growth-stage fintech was losing about a third of paid traffic to a 4-second LCP and a marketing site the in-house team could not edit without an engineer. Brand, content, and information architecture were all working — the rendering and the editing workflow were not. We had three weeks before the next paid campaign launched.',
    approach: [
      {
        index: '01',
        title: 'Static-first rebuild on Next.js',
        body: 'Migrated the site to Next.js App Router with full ISR for marketing routes. Pages now serve from the edge with HTML in under 200ms cold and zero JS for content viewers.',
      },
      {
        index: '02',
        title: 'Typed CMS layer the in-house team owns',
        body: 'Replaced the legacy WYSIWYG with a typed Sanity schema. Marketing now ships copy and layout changes without a deploy. We documented every block and shipped a Loom-recorded handover.',
      },
      {
        index: '03',
        title: 'Image and font discipline',
        body: 'Self-hosted variable fonts via next/font, swapped JPEGs for AVIF with explicit aspect ratios, killed the third-party hero video library. Net asset weight dropped 68% on the home route.',
      },
      {
        index: '04',
        title: 'Performance budget with CI gates',
        body: 'Added Lighthouse CI on every PR with a hard gate at 95+ desktop, 85+ mobile. Web Vitals reporting wired to PostHog so regressions surface within 24h, not next quarter.',
      },
    ],
    screens: [
      {
        src: '/work/fintech-screen-1.svg',
        alt: 'Home page hero — before / after comparison',
        caption: 'Home hero — before (left): 4.1s LCP, layout shift on hero video. After (right): 1.6s LCP, no CLS.',
        tone: 'indigo',
      },
      {
        src: '/work/fintech-screen-2.svg',
        alt: 'Editor view of typed Sanity schema',
        caption: 'Marketing now ships copy without engineering involvement. Every block is type-checked at the schema layer.',
        tone: 'cyan',
      },
      {
        src: '/work/fintech-screen-3.svg',
        alt: 'Lighthouse CI gate failing a PR',
        caption: 'CI hard-gate at 95+ desktop. The PR pipeline blocks merges that regress vitals.',
        tone: 'mixed',
      },
    ],
    metrics: [
      { label: 'LCP', value: '1.6s' },
      { label: 'Conversion', value: '+47%' },
      { label: 'Asset weight', value: '−68%' },
      { label: 'Lighthouse', value: '98 / 100' },
    ],
    testimonial: {
      quote:
        'Three weeks. Site that used to take 4 seconds opens instantly. Marketing is shipping pages without us. The whole stack is the boring kind of stable.',
      author: 'Head of Engineering',
      role: 'Confidential fintech, Series B',
    },
  },
  {
    slug: 'yc-startup-mobile-mvp',
    title: 'Mobile app for a YC-backed startup',
    year: 2026,
    brief: 'iOS + Android shipped in a single sprint. SwiftUI + React Native.',
    tags: ['SwiftUI', 'React Native', 'Expo'],
    status: 'coming',
    eta: 'Shipping May 2026',
    cover: '/work/yc-mobile-cover.svg',
    coverAlt: 'Twin device mockup — iOS and Android',
  },
  {
    slug: 'enterprise-ai-search',
    title: 'AI search for an enterprise dataset',
    year: 2026,
    brief:
      'Practical RAG over 1.2M documents. Sub-200ms response, source-cited.',
    tags: ['OpenAI', 'pgvector', 'Embeddings'],
    status: 'coming',
    eta: 'Shipping May 2026',
    cover: '/work/ai-search-cover.svg',
    coverAlt: 'Embedding space and search result stream',
  },
];

export function getCase(slug: string): CaseStub | undefined {
  return cases.find((c) => c.slug === slug);
}

export function getNextCase(slug: string): CaseStub | undefined {
  const i = cases.findIndex((c) => c.slug === slug);
  if (i === -1) return undefined;
  return cases[(i + 1) % cases.length];
}
