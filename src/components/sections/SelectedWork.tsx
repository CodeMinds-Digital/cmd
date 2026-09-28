import SplitText from '@/components/animations/SplitText';
import Button from '@/components/ui/Button';
import Eyebrow from '@/components/ui/Eyebrow';
import Highlight from '@/components/ui/Highlight';
import CaseBento from '@/components/work/CaseBento';
import { cases } from '@/data/cases';

export default function SelectedWork() {
  return (
    <section id="work" className="section-padding scroll-mt-20">
      <div className="container">
        <div className="mb-10 flex flex-col gap-6 md:mb-14 md:flex-row md:items-end md:justify-between">
          <div>
            <Eyebrow index="01" label="Selected work" className="mb-5" />
            <h2 className="max-w-2xl text-step-4 font-bold text-fg text-balance">
              <SplitText inView>
                Three cases that show <Highlight delayMs={500}>what we ship.</Highlight>
              </SplitText>
            </h2>
          </div>
          <Button href="/work" variant="secondary" arrow className="self-start md:self-auto">
            All work
          </Button>
        </div>

        <CaseBento cases={cases} />
      </div>
    </section>
  );
}
