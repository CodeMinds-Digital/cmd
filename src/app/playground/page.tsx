'use client';

import Magnetic from '@/components/animations/Magnetic';
import Tilt from '@/components/animations/Tilt';
import SplitText from '@/components/animations/SplitText';
import DrawIcon from '@/components/animations/DrawIcon';

export default function Playground() {
  return (
    <main className="min-h-dvh bg-neutral-50 px-6 py-20 md:px-12">
      <header className="mx-auto mb-16 max-w-5xl">
        <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-brand-600">
          Animation primitives
        </p>
        <h1 className="text-4xl font-bold text-neutral-900 md:text-5xl">
          Playground
        </h1>
        <p className="mt-3 max-w-2xl text-neutral-600">
          Live catalog of the reusable motion primitives. Hover, click, and
          scroll to interact. Not linked from the public site — internal use
          only.
        </p>
      </header>

      <section className="mx-auto max-w-5xl space-y-20">
        <Demo
          title="<SplitText>"
          desc="Per-word reveal, screen-reader safe (full text in sr-only label)."
        >
          <h2 className="text-3xl font-bold text-neutral-900 md:text-5xl">
            <SplitText className="block">The quick brown fox</SplitText>
            <SplitText className="block text-brand-600" delay={0.2}>
              jumps over the lazy dog
            </SplitText>
          </h2>
        </Demo>

        <Demo
          title="<Magnetic> + ripple"
          desc="Pointer pull (mouse only) plus an expanding ripple on click."
        >
          <div className="flex flex-wrap gap-6">
            <Magnetic>
              <button className="btn-primary btn-lg">Primary CTA</button>
            </Magnetic>
            <Magnetic strength={0.6} max={28}>
              <button className="btn-secondary btn-lg">Stronger pull</button>
            </Magnetic>
            <Magnetic ripple={false}>
              <button className="btn-ghost btn-lg">No ripple</button>
            </Magnetic>
          </div>
        </Demo>

        <Demo
          title="<Tilt>"
          desc="Pointer-parallax 3D tilt + lift on hover. Touch and reduced-motion bypass."
        >
          <div className="grid gap-6 md:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Tilt key={i}>
                <div className="h-48 rounded-2xl bg-gradient-to-br from-brand-500 to-electric-500 p-6 text-white shadow-medium">
                  <div className="text-sm opacity-80">Card {i}</div>
                  <div className="mt-3 text-2xl font-bold">Hover me</div>
                </div>
              </Tilt>
            ))}
          </div>
        </Demo>

        <Demo
          title="<DrawIcon>"
          desc="pathLength stroke-draw on whileInView. Quint-out cubic-bezier."
        >
          <div className="flex gap-8 text-brand-600">
            <DrawIcon className="h-16 w-16" d="M5 13l4 4L19 7" />
            <DrawIcon
              className="h-16 w-16"
              d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
            />
            <DrawIcon
              className="h-16 w-16"
              d="M13 10V3L4 14h7v7l9-11h-7z"
              duration={1.6}
            />
          </div>
        </Demo>

        <div className="h-[60vh]" aria-hidden />
        <p className="text-sm text-neutral-500">
          Scroll-triggered primitives demo above. Add new primitives here as
          they ship.
        </p>
      </section>
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
    <section className="rounded-3xl border border-neutral-200 bg-white p-8 shadow-soft">
      <header className="mb-6">
        <h2 className="font-mono text-sm font-semibold text-brand-600">
          {title}
        </h2>
        <p className="text-sm text-neutral-600">{desc}</p>
      </header>
      <div className="rounded-2xl bg-neutral-50 p-8">{children}</div>
    </section>
  );
}
