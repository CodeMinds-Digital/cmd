export type ProcessStep = {
  index: string;
  title: string;
  body: string;
  duration: string;
  deliverables: string[];
};

export const processSteps: ProcessStep[] = [
  {
    index: '01',
    title: 'Brief',
    body: 'We listen, scope, and price-fix. You leave the kickoff with a one-page proposal — not a 40-slide deck.',
    duration: '1 week',
    deliverables: ['Scope · price · timeline locked', 'Risk assessment', 'Tech stack agreed'],
  },
  {
    index: '02',
    title: 'Design',
    body: 'Mockups, prototype, sign-off. Real Figma files you keep, not screenshots.',
    duration: '1–2 weeks',
    deliverables: ['Hi-fi mockups', 'Interactive prototype', 'Component library'],
  },
  {
    index: '03',
    title: 'Build',
    body: 'Daily Looms, weekly demos. You see progress every 24h, not at milestone gates.',
    duration: '2–4 weeks',
    deliverables: ['Daily progress recordings', 'Staging environment', 'CI/CD set up'],
  },
  {
    index: '04',
    title: 'Ship',
    body: 'Production deploy, monitoring, hand-off documentation. We stay on retainer if you want it.',
    duration: 'Week N+1',
    deliverables: ['Production deployment', 'Monitoring + alerts', 'Runbook + ownership transfer'],
  },
];
