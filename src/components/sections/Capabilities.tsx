import SplitText from '@/components/animations/SplitText';
import Icon from '@/components/icons/Icon';
import Bento from '@/components/ui/Bento';
import Chip from '@/components/ui/Chip';
import Eyebrow from '@/components/ui/Eyebrow';
import Highlight from '@/components/ui/Highlight';
import Tile from '@/components/ui/Tile';
import { capabilities } from '@/data/capabilities';

export default function Capabilities() {
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
            One studio. Four capabilities. Pick any combination.
          </p>
        </div>

        <Bento as="ul">
          {capabilities.map((cap, i) => (
            <Tile
              key={cap.index}
              as="li"
              interactive
              reveal
              index={i}
              className="group col-span-12 flex flex-col gap-8 md:col-span-6"
            >
              <div className="flex items-start justify-between gap-4">
                <span className="font-mono text-mono-sm text-accent-ink">{cap.index}</span>
                <ul className="flex flex-wrap justify-end gap-1.5" aria-label="Stack">
                  {cap.tags.map((t) => (
                    <li key={t}>
                      <Chip>{t}</Chip>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="mt-auto">
                <h3 className="text-step-3 font-bold text-fg">{cap.title}</h3>
                <p className="mt-3 max-w-md text-step-0 text-fg-muted">{cap.description}</p>
                <p className="mt-5 flex items-start gap-2 border-t border-line pt-4 text-sm font-medium text-fg">
                  <Icon
                    name="arrow-right"
                    className="mt-0.5 size-4 shrink-0 text-accent-ink transition-transform duration-300 ease-expo-out group-hover:translate-x-1"
                  />
                  {cap.proof}
                </p>
              </div>
            </Tile>
          ))}
        </Bento>
      </div>
    </section>
  );
}
