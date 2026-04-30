/**
 * Seed data for the Phase A4 reusable blocks: capabilities, process steps,
 * client logos, and hero copy. The runtime app reads these from Appwrite
 * after migration. Edit live values in /admin, not here.
 */

export type CapabilitySeed = {
  displayIndex: string;
  title: string;
  description: string;
  orderIndex: number;
};

export type ProcessStepSeed = {
  displayIndex: string;
  title: string;
  duration: string;
  body: string;
  deliverables: string[];
  iconPath: string;
  orderIndex: number;
};

export type ClientLogoSeed = {
  name: string;
  ndaBound: boolean;
  orderIndex: number;
};

export type HeroCopySeed = {
  heroEyebrow: string;
  heroLine1: string;
  heroLine2: string;
  heroLine2Accent: string;
  heroSub: string;
  heroPrimaryCtaLabel: string;
  heroPrimaryCtaHref: string;
  heroSecondaryCtaLabel: string;
  heroSecondaryCtaHref: string;
  heroAnchorLeft: string;
  heroAnchorCenter: string;
};

export const capabilities: CapabilitySeed[] = [
  {
    displayIndex: '01',
    title: 'Web platforms',
    description:
      'We rebuild slow marketing sites and ship product MVPs. Lighthouse 95+ by default.',
    orderIndex: 0,
  },
  {
    displayIndex: '02',
    title: 'Mobile',
    description:
      'iOS + Android in a single sprint. Native where it matters, cross-platform where it ships faster.',
    orderIndex: 1,
  },
  {
    displayIndex: '03',
    title: 'AI integration',
    description:
      'Practical AI features in production code, not demos. Search, summarisation, agents on your data.',
    orderIndex: 2,
  },
  {
    displayIndex: '04',
    title: 'Performance & rebuilds',
    description:
      'Existing-stack rebuilds, perf audits, and incremental migrations from monoliths.',
    orderIndex: 3,
  },
];

export const processSteps: ProcessStepSeed[] = [
  {
    displayIndex: '01',
    title: 'Brief',
    duration: '1 week',
    body: 'We listen, scope, and price-fix. You leave the kickoff with a one-page proposal — not a 40-slide deck.',
    deliverables: ['Scope · price · timeline locked', 'Risk assessment', 'Tech stack agreed'],
    iconPath:
      'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z',
    orderIndex: 0,
  },
  {
    displayIndex: '02',
    title: 'Design',
    duration: '1–2 weeks',
    body: 'Mockups, prototype, sign-off. Real Figma files you keep, not screenshots.',
    deliverables: ['Hi-fi mockups', 'Interactive prototype', 'Component library'],
    iconPath:
      'M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4h4a2 2 0 002-2V5z',
    orderIndex: 1,
  },
  {
    displayIndex: '03',
    title: 'Build',
    duration: '2–4 weeks',
    body: 'Daily Looms, weekly demos. You see progress every 24h, not at milestone gates.',
    deliverables: ['Daily progress recordings', 'Staging environment', 'CI/CD set up'],
    iconPath: 'M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4',
    orderIndex: 2,
  },
  {
    displayIndex: '04',
    title: 'Ship',
    duration: 'week N+1',
    body: 'Production deploy, monitoring, hand-off documentation. We stay on retainer if you want it.',
    deliverables: ['Production deployment', 'Monitoring + alerts', 'Runbook + ownership transfer'],
    iconPath: 'M13 10V3L4 14h7v7l9-11h-7z',
    orderIndex: 3,
  },
];

export const clientLogos: ClientLogoSeed[] = [
  { name: 'Lattice',   ndaBound: false, orderIndex: 0 },
  { name: 'Vercel',    ndaBound: false, orderIndex: 1 },
  { name: 'Linear',    ndaBound: false, orderIndex: 2 },
  { name: 'Notion',    ndaBound: false, orderIndex: 3 },
  { name: 'Anthropic', ndaBound: false, orderIndex: 4 },
  { name: 'Stripe',    ndaBound: false, orderIndex: 5 },
];

export const heroCopy: HeroCopySeed = {
  heroEyebrow: 'Booking new projects',
  heroLine1: 'Software,',
  heroLine2: 'built with',
  heroLine2Accent: 'care.',
  heroSub:
    'A digital studio for web, mobile, and AI. Two-to-four-week delivery from Chennai → worldwide.',
  heroPrimaryCtaLabel: 'Start a project',
  heroPrimaryCtaHref: '#contact',
  heroSecondaryCtaLabel: 'See selected work',
  heroSecondaryCtaHref: '#work',
  heroAnchorLeft: 'Codeminds Digital · v2026.1',
  heroAnchorCenter: 'Chennai · India',
};
