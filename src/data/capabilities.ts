export type Capability = {
  index: string;
  title: string;
  tags: string[];
  description: string;
  /** Services offered under this capability (rendered as a list). */
  services?: string[];
  /** One concrete, verifiable line of evidence (sourced from data/cases.ts). */
  proof?: string;
  /** Visual weight in the bento; one inverse tile per grid. */
  tone?: 'surface' | 'inverse';
};

export const capabilities: Capability[] = [
  {
    index: '01',
    title: 'Web platforms',
    tags: ['React', 'Next.js', 'TypeScript'],
    description:
      'We rebuild slow marketing sites and ship product MVPs. Lighthouse 95+ by default.',
    proof: 'Fintech rebuild: LCP 4.1s → 1.6s, +47% lead conversion.',
  },
  {
    index: '02',
    title: 'Mobile',
    tags: ['Flutter', 'React Native', 'SwiftUI'],
    description:
      'iOS and Android in a single sprint. Flutter or React Native for shared code; native SwiftUI and Android where it matters.',
    proof: 'YC-backed startup: iOS + Android in one sprint — shipping May 2026.',
  },
  {
    index: '03',
    title: 'AI apps & agents',
    tags: ['LLMs', 'Agents', 'RAG'],
    description: 'AI features and products in production code, not demos.',
    services: [
      'AI application development',
      'LLM integration and implementation',
      'AI agents and workflow automation',
      'AI-powered business applications',
      'Model integration and orchestration',
      'Document processing and analysis',
    ],
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
  {
    index: '05',
    title: 'Cloud & infrastructure',
    tags: ['VPS', 'CI/CD', 'Monitoring'],
    description: 'We host and run what we build — or take over what you already have.',
    services: [
      'VPS setup and management',
      'Private cloud infrastructure',
      'Cloud deployment and maintenance',
      'Application hosting',
      'Domains, DNS and SSL',
      'CI/CD and deployment automation',
      'Monitoring, backups and security hardening',
    ],
    tone: 'inverse',
  },
  {
    index: '06',
    title: 'AI-native delivery',
    tags: ['Claude Code', 'Cursor', 'Replit', 'Codex'],
    description:
      'Senior engineers working with AI coding tools for scaffolding, refactors, tests and reviews — how 2–4-week delivery stays realistic.',
    proof: 'Engineers own the architecture and review every AI-assisted change before merge.',
  },
];
