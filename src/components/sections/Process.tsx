import SplitText from '@/components/animations/SplitText';
import Chip from '@/components/ui/Chip';
import Eyebrow from '@/components/ui/Eyebrow';
import Highlight from '@/components/ui/Highlight';
import Tile from '@/components/ui/Tile';
import { processSteps } from '@/data/process';

/**
 * How we work — the one inverse (black) section on the page (plan §3.4).
 * Desktop: a horizontal 4-step track whose orange bar fills as the section
 * scrolls through (scroll-driven `.progress-x` on the section's view
 * timeline). Mobile: a vertical list on a rail.
 */
export default function Process() {
  return (
    <section
      id="process"
      className="timeline-section section-padding scroll-mt-20 bg-inverse text-inverse-fg"
    >
      <div className="container">
        <div className="mb-12 flex flex-col gap-6 md:mb-16 md:flex-row md:items-end md:justify-between">
          <div>
            <Eyebrow index="03" label="How we work" inverse className="mb-5" />
            <h2 className="max-w-2xl text-step-4 font-bold text-inverse-fg text-balance">
              <SplitText inView>
                From kickoff to ship <Highlight delayMs={500}>in 4–8 weeks.</Highlight>
              </SplitText>
            </h2>
          </div>
          <p className="max-w-xs text-body text-inverse-fg/70 md:text-right">
            One sprint per phase. No status reports. No invoices for setup calls.
          </p>
        </div>

        {/* Progress track (desktop). Decorative: the list below carries the content. */}
        <div aria-hidden className="relative mb-6 hidden lg:block">
          <div className="h-0.5 w-full rounded-full bg-inverse-fg/15">
            <div className="progress-x h-full rounded-full bg-accent" />
          </div>
          <div className="absolute inset-x-0 top-1/2 grid -translate-y-1/2 grid-cols-4 gap-bento">
            {processSteps.map((step) => (
              <span
                key={step.index}
                className="grid size-9 place-items-center rounded-full border border-inverse-fg/25 bg-inverse font-mono text-mono-xs text-inverse-fg"
              >
                {step.index}
              </span>
            ))}
          </div>
        </div>

        <ol className="relative grid gap-bento border-l border-inverse-fg/15 pl-5 lg:grid-cols-4 lg:border-l-0 lg:pl-0" data-inview="">
          {processSteps.map((step, i) => (
            // The rail dot lives on the <li> because tiles clip their overflow.
            <li
              key={step.index}
              className="relative flex before:absolute before:top-7 before:-left-[27px] before:size-3 before:rounded-full before:bg-accent before:content-[''] lg:before:hidden"
            >
              <Tile
                tone="inverse-raised"
                reveal
                index={i}
                className="flex w-full flex-col gap-5"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="font-mono text-mono-xs uppercase text-inverse-fg/70">
                    Step {step.index}
                  </span>
                  <Chip tone="accent">{step.duration}</Chip>
                </div>
                <div>
                  <h3 className="text-step-3 font-bold text-inverse-fg">{step.title}</h3>
                  <p className="mt-3 text-body text-inverse-fg/75">{step.body}</p>
                </div>
                <ul className="mt-auto space-y-2 border-t border-inverse-fg/10 pt-4">
                  {step.deliverables.map((d) => (
                    <li key={d} className="flex items-start gap-2 text-sm text-inverse-fg/80">
                      <span aria-hidden className="text-accent">
                        —
                      </span>
                      {d}
                    </li>
                  ))}
                </ul>
              </Tile>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
