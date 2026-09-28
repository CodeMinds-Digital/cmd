import type { Metadata } from 'next';
import type React from 'react';
import Magnetic from '@/components/animations/Magnetic';
import Tilt from '@/components/animations/Tilt';
import SplitText from '@/components/animations/SplitText';
import DrawIcon from '@/components/animations/DrawIcon';
import ChennaiClock from '@/components/islands/ChennaiClock';
import Bento from '@/components/ui/Bento';
import Tile from '@/components/ui/Tile';
import Button from '@/components/ui/Button';
import Chip from '@/components/ui/Chip';
import Stat from '@/components/ui/Stat';
import Eyebrow from '@/components/ui/Eyebrow';
import Highlight, { highlightClass } from '@/components/ui/Highlight';
import Marquee from '@/components/ui/Marquee';

export const metadata: Metadata = {
  title: 'Playground | Codeminds Digital',
  robots: { index: false, follow: false },
};

const STEPS = [
  ['text-step-6', 'Hero H1 · 48 → 128'],
  ['text-step-5', 'Closing · 40 → 88'],
  ['text-step-4', 'Section · 32 → 56'],
  ['text-step-3', 'Stat · 28 → 40'],
  ['text-step-2', 'Tile title · 22 → 28'],
  ['text-step-1', 'Lead · 18 → 22'],
  ['text-step-0', 'Body · 16 → 17'],
] as const;

const STACK = ['Next.js', 'SwiftUI', 'React Native', 'Postgres', 'Tailwind', 'Expo', 'pgvector', 'Vercel AI SDK'];

export default function Playground() {
  return (
    <main id="main" className="min-h-dvh bg-canvas px-6 py-20 md:px-12">
      <header className="mx-auto mb-16 max-w-6xl">
        <Eyebrow index="—" label="Voltage primitives" className="mb-4" />
        <h1 className="text-step-5 font-bold text-fg">
          Play<Highlight>ground</Highlight>
        </h1>
        <p className="mt-4 max-w-2xl text-step-1 text-fg-muted">
          Live catalogue of the Voltage UI and motion primitives. Hover, click and scroll to
          interact. Not linked from the public site.
        </p>
      </header>

      <div className="mx-auto max-w-6xl space-y-16">
        <Demo title="Fluid type scale" desc="clamp() steps, 360 → 1440px. Resize the window.">
          <div className="space-y-3">
            {STEPS.map(([cls, label]) => (
              <div key={cls} className="flex items-baseline gap-4">
                <span className="w-44 shrink-0 font-mono text-mono-xs uppercase text-fg-subtle">
                  {label}
                </span>
                <span className={`${cls} truncate font-display font-bold text-fg`}>Built with care</span>
              </div>
            ))}
          </div>
        </Demo>

        <Demo
          title="<SplitText> + <Highlight>"
          desc="Server-rendered words; CSS reveal on load or in view. The chip wipes in when it enters."
        >
          <h2 className="text-step-4 font-bold text-fg">
            <SplitText className="block">On load, per word</SplitText>
            <SplitText className="block" delay={0.3}>
              built with <Highlight delayMs={700}>care.</Highlight>
            </SplitText>
          </h2>
          <h2 className="mt-10 text-step-4 font-bold text-fg">
            <SplitText inView>Revealed in view, </SplitText>
            <SplitText inView className={highlightClass} delay={0.25}>
              what we ship.
            </SplitText>
          </h2>
        </Demo>

        <Demo
          title="<Bento> + <Tile>"
          desc="12-col grid, tiles stagger in as a group. Interactive tiles lift and glow under the pointer."
        >
          <Bento>
            <Tile interactive reveal index={0} className="col-span-12 md:col-span-7 md:row-span-2 flex min-h-64 flex-col justify-end">
              <h3 className="text-step-4 font-bold">
                Software, built with <Highlight>care.</Highlight>
              </h3>
            </Tile>
            <Tile tone="accent" reveal index={1} className="col-span-6 md:col-span-5">
              <div className="font-display text-step-5 font-bold leading-none">
                <Stat value={2} index={0} />–<Stat value={4} index={1} />
              </div>
              <div className="mt-2 font-mono text-mono-xs uppercase">Week delivery</div>
            </Tile>
            <Tile tone="inverse" reveal index={2} className="col-span-6 md:col-span-3 font-mono text-mono-xs uppercase">
              Web · Mobile · AI
              <div className="mt-2 text-accent">→ Chennai / world</div>
            </Tile>
            <Tile tone="sunk" reveal index={3} className="col-span-12 md:col-span-2">
              <div className="font-mono text-mono-xs uppercase text-fg-subtle">Chennai</div>
              <ChennaiClock className="mt-1 block font-display text-step-2 font-bold" />
            </Tile>
            <Tile href="#chips" interactive reveal index={4} className="col-span-12">
              <div className="flex flex-col gap-2 @md:flex-row @md:items-center @md:justify-between">
                <span className="text-step-2 font-bold">Tile as a link (container-query layout)</span>
                <Chip tone="accent">Read case →</Chip>
              </div>
            </Tile>
          </Bento>
        </Demo>

        <Demo title="<Button>" desc="Black pill → orange on hover. Link or button. Optional arrow, optional <Magnetic>.">
          <div className="flex flex-wrap items-center gap-4">
            <Magnetic>
              <Button size="lg" arrow>
                Start a project
              </Button>
            </Magnetic>
            <Button variant="secondary" arrow href="#chips">
              See selected work
            </Button>
            <Button variant="ghost">Ghost</Button>
            <Button size="sm">Small</Button>
            <Button disabled>Disabled</Button>
          </div>
        </Demo>

        <div id="chips">
          <Demo title="<Chip>" desc="Mono pills for tags, ETAs and metric callouts. 12px minimum.">
            <div className="flex flex-wrap gap-3">
              <Chip>Next.js</Chip>
              <Chip tone="accent">ETA May 2026</Chip>
              <Chip tone="outline">Lighthouse 41 → 98</Chip>
              <Chip tone="inverse">Live</Chip>
            </div>
          </Demo>
        </div>

        <Demo title="<Stat>" desc="Counts up when in view (@property --n). Screen readers get the real value.">
          <div className="grid grid-cols-3 gap-6 font-display text-step-5 font-bold" data-inview="">
            <div>
              <Stat value={98} from={41} index={0} />
              <div className="font-mono text-mono-xs font-normal uppercase text-fg-subtle">Lighthouse</div>
            </div>
            <div>
              <Stat value={47} index={1} />%
              <div className="font-mono text-mono-xs font-normal uppercase text-fg-subtle">Conversion</div>
            </div>
            <div>
              <Stat value={24} index={2} />h
              <div className="font-mono text-mono-xs font-normal uppercase text-fg-subtle">Reply time</div>
            </div>
          </div>
        </Demo>

        <Demo title="<Eyebrow>" desc="Section header chrome, light and inverse.">
          <div className="space-y-4">
            <Eyebrow index="01" label="Selected work" />
            <div className="rounded-inner bg-inverse p-4">
              <Eyebrow index="03" label="How we work" tone="inverse" />
            </div>
          </div>
        </Demo>

        <Demo title="<Marquee>" desc="CSS-only loop, pauses on hover. Static wrapped row under reduced motion.">
          <Marquee
            label="Stack"
            durationS={30}
            items={STACK.map((name) => (
              <span key={name} className="font-mono text-mono-sm uppercase text-fg-muted">
                {name}
              </span>
            ))}
          />
        </Demo>

        <section className="timeline-section rounded-tile bg-inverse p-8 text-inverse-fg">
          <Eyebrow index="—" label="Scroll-driven progress" tone="inverse" className="mb-6" />
          <p className="mb-6 max-w-xl text-step-1 text-inverse-fg/80">
            The bar fills as this section scrolls through the viewport (<code>view()</code>{' '}
            timeline). Browsers without scroll-driven animations show it full.
          </p>
          <div className="h-1 w-full overflow-hidden rounded-full bg-inverse-fg/15">
            <div className="progress-x h-full bg-accent" />
          </div>
          <div className="h-[40vh]" aria-hidden />
        </section>

        <Demo title="<Tilt> · <DrawIcon>" desc="Legacy primitives still used by current pages.">
          <div className="grid gap-6 md:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Tilt key={i}>
                <div className="h-40 rounded-tile bg-accent p-6 text-accent-fg">
                  <div className="font-mono text-mono-xs uppercase">Card {i}</div>
                  <div className="mt-3 text-step-2 font-bold">Hover me</div>
                </div>
              </Tilt>
            ))}
          </div>
          <div className="mt-8 flex gap-8 text-accent-ink">
            <DrawIcon className="size-14" d="M5 13l4 4L19 7" />
            <DrawIcon className="size-14" d="M13 10V3L4 14h7v7l9-11h-7z" duration={1.6} />
          </div>
        </Demo>

        <div className="h-[50vh]" aria-hidden />
      </div>
    </main>
  );
}

function Demo({
  title,
  desc,
  children,
}: {
  title: string;
  desc: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-tile border border-line bg-surface p-6 md:p-8">
      <header className="mb-6">
        <h2 className="font-mono text-mono-sm font-semibold text-accent-ink">{title}</h2>
        <p className="mt-1 text-body">{desc}</p>
      </header>
      <div className="rounded-inner bg-canvas p-6 md:p-8">{children}</div>
    </section>
  );
}
