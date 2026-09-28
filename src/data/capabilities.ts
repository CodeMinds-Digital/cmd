export type Capability = {
  index: string;
  title: string;
  tags: string[];
  description: string;
  /** One concrete, verifiable line of evidence (sourced from data/cases.ts). */
  proof: string;
};

export const capabilities: Capability[] = [
  {
    index: '01',
    title: 'Web platforms',
    tags: ['Next.js', 'Postgres', 'Tailwind'],
    description:
      'We rebuild slow marketing sites and ship product MVPs. Lighthouse 95+ by default.',
    proof: 'Fintech rebuild: LCP 4.1s → 1.6s, +47% lead conversion.',
  },
  {
    index: '02',
    title: 'Mobile',
    tags: ['SwiftUI', 'React Native', 'Expo'],
    description:
      'iOS + Android in a single sprint. Native where it matters, cross-platform where it ships faster.',
    proof: 'YC-backed startup: iOS + Android in one sprint — shipping May 2026.',
  },
  {
    index: '03',
    title: 'AI integration',
    tags: ['OpenAI', 'Embeddings', 'RAG'],
    description:
      'Practical AI features in production code, not demos. Search, summarisation, agents on your data.',
    proof: 'Enterprise search: RAG over 1.2M documents, sub-200ms, source-cited.',
  },
  {
    index: '04',
    title: 'Performance & rebuilds',
    tags: ['Lighthouse 95+', 'Core Web Vitals', 'Audits'],
    description:
      'Existing-stack rebuilds, perf audits, and incremental migrations from monoliths.',
    proof: 'CI gates block any PR below Lighthouse 95 desktop / 85 mobile.',
  },
];
