import Marquee from '@/components/ui/Marquee';
import TechLogo from '@/components/ui/TechLogo';
import { getStack } from '@/lib/cms/repository';
import type { StackCategory } from '@/lib/cms/types';

const stackCategories: { id: StackCategory; label: string }[] = [
  { id: 'languages', label: 'Languages' },
  { id: 'web', label: 'Web' },
  { id: 'mobile', label: 'Mobile' },
  { id: 'backend', label: 'Backend' },
  { id: 'ai-tools', label: 'AI tools' },
  { id: 'devops', label: 'Cloud & DevOps' },
];

/**
 * The "Built with" band: one monochrome marquee of the technologies and AI
 * tools we work with, grouped by a mono category label. Pure CSS motion via
 * <Marquee> (pauses on hover/focus; static wrapped row under reduced motion).
 */
export async function StackBand({ headingId = 'stack-heading' }: { headingId?: string }) {
  const stack = await getStack();
  const items = stackCategories.flatMap((cat) => [
    <span key={`cat-${cat.id}`} className="font-mono text-mono-xs uppercase text-accent-ink">
      {cat.label}
    </span>,
    ...stack
      .filter((s) => s.category === cat.id)
      .map((s) => (
        <TechLogo
          key={`${cat.id}-${s.label}`}
          icon={s.icon}
          label={s.label}
          className="text-step-0 text-fg-muted transition-colors duration-200 hover:text-fg"
        />
      )),
  ]);

  return (
    <div className="flex flex-col gap-4 border-y border-line py-5 sm:flex-row sm:items-center sm:gap-8">
      <h2 id={headingId} className="shrink-0 font-mono text-mono-xs font-normal uppercase text-fg-subtle">
        Built with
      </h2>
      <Marquee
        label="Technologies and tools we use"
        items={items}
        // Keep the speed constant (~30 px/s) as the list grows.
        durationS={Math.round(items.length * 3.3)}
        gap="2.5rem"
        className="min-w-0 flex-1"
      />
    </div>
  );
}

/** Stand-alone section form, used directly under the hero. */
export default function StackStrip() {
  return (
    <section aria-labelledby="stack-heading" className="pb-16 md:pb-20">
      <div className="container">
        <StackBand />
      </div>
    </section>
  );
}
