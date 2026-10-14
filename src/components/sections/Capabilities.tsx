import SplitText from '@/components/animations/SplitText';
import Icon from '@/components/icons/Icon';
import Bento from '@/components/ui/Bento';
import Chip from '@/components/ui/Chip';
import Eyebrow from '@/components/ui/Eyebrow';
import Highlight from '@/components/ui/Highlight';
import Tile from '@/components/ui/Tile';
import { StackBand } from '@/components/sections/StackStrip';
import { capabilities, type Capability } from '@/data/capabilities';

const TONE = {
  surface: {
    index: 'text-accent-ink', title: 'text-fg', body: 'text-fg-muted', rule: 'border-line',
    proof: 'text-fg', arrow: 'text-accent-ink', bullet: 'text-accent-ink', chip: 'sunk' as const,
  },
  inverse: {
    index: 'text-accent', title: 'text-inverse-fg', body: 'text-inverse-fg/75', rule: 'border-inverse-fg/15',
    proof: 'text-inverse-fg', arrow: 'text-accent', bullet: 'text-accent', chip: 'on-inverse' as const,
  },
};

export default function Capabilities({ showStack = false }: { showStack?: boolean }) {
  return (
    <section id="capabilities" className="section-padding scroll-mt-20">
      <div className="container">
        <div className="mb-10 flex flex-col gap-6 md:mb-14 md:flex-row md:items-end md:justify-between">
          <div>
            <Eyebrow index="02" label="Capabilities" className="mb-5" />
            <h2 className="max-w-2xl text-step-4 font-bold text-fg text-balance">
              <SplitText inView>
                What we ship, <Highlight delayMs={500}>end to end.</Highlight>
              </SplitText>
            </h2>
          </div>
          <p className="max-w-xs text-body md:text-right">
            Engineering, AI and cloud — one studio. Pick any combination.
          </p>
        </div>

        {/* When client logos hold the slot under the hero, the stack strip lives here. */}
        {showStack && (
          <div className="mb-10">
            <StackBand headingId="stack-heading-capabilities" />
          </div>
        )}

        <Bento as="ul">
          {capabilities.map((cap, i) => (
            <CapabilityTile key={cap.index} cap={cap} index={i} />
          ))}
        </Bento>
      </div>
    </section>
  );
}

function CapabilityTile({ cap, index }: { cap: Capability; index: number }) {
  const tone = cap.tone ?? 'surface';
  const t = TONE[tone];
  return (
    <Tile
      as="li"
      tone={tone}
      interactive
      reveal
      index={index}
      className="group col-span-12 flex flex-col gap-8 md:col-span-6 lg:col-span-4"
    >
      <div className="flex items-start justify-between gap-4">
        <span className={`font-mono text-mono-sm ${t.index}`}>{cap.index}</span>
        <ul className="flex flex-wrap justify-end gap-1.5" aria-label="Stack">
          {cap.tags.map((tag) => (
            <li key={tag}>
              <Chip tone={t.chip}>{tag}</Chip>
            </li>
          ))}
        </ul>
      </div>
      <div className="mt-auto">
        <h3 className={`text-step-3 font-bold ${t.title}`}>{cap.title}</h3>
        <p className={`mt-3 max-w-md text-step-0 ${t.body}`}>{cap.description}</p>
        {cap.services && (
          <ul className={`mt-4 space-y-1.5 text-sm ${t.body}`} aria-label={`${cap.title} services`}>
            {cap.services.map((s) => (
              <li key={s} className="flex items-start gap-2">
                <span aria-hidden className={t.bullet}>—</span>
                {s}
              </li>
            ))}
          </ul>
        )}
        {cap.proof && (
          <p className={`mt-5 flex items-start gap-2 border-t pt-4 text-sm font-medium ${t.rule} ${t.proof}`}>
            <Icon
              name="arrow-right"
              className={`mt-0.5 size-4 shrink-0 transition-transform duration-300 ease-expo-out group-hover:translate-x-1 ${t.arrow}`}
            />
            {cap.proof}
          </p>
        )}
      </div>
    </Tile>
  );
}
