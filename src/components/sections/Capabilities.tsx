import SplitText from '@/components/animations/SplitText';
import SectionEyebrow from '@/components/ui/SectionEyebrow';
import { getCapabilities } from '@/lib/cms/blocks';

export default async function Capabilities() {
  const capabilities = await getCapabilities();
  if (capabilities.length === 0) return null;
  return (
    <section
      id="capabilities"
      className="section-padding relative bg-ink-900 border-t border-ink-700"
    >
      <div className="container">
        {/* Section header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-8 mb-16 md:mb-24">
          <div>
            <SectionEyebrow index="02" label="Capabilities" className="mb-6" />
            <h2 className="text-h2 md:text-h1 font-bold text-paper-50 max-w-2xl text-balance">
              <SplitText>What we ship,</SplitText>
              <SplitText
                className="font-serif italic font-normal text-brand-400"
                delay={0.4}
              >
                end to end.
              </SplitText>
            </h2>
          </div>
          <p className="text-body text-paper-300 max-w-xs md:text-right">
            One studio. Four capabilities. Pick any combination.
          </p>
        </div>

        {/* Editorial rows */}
        <ul className="border-t border-ink-600">
          {capabilities.map((cap) => (
            <li
              key={cap.$id}
              className="border-b border-ink-600 group hover:bg-ink-800/40 transition-colors"
            >
              <div className="grid grid-cols-12 gap-4 md:gap-8 py-8 md:py-12 px-2 md:px-4">
                <div className="col-span-2 md:col-span-1">
                  <span className="font-mono text-mono-sm text-brand-400">
                    {cap.displayIndex}
                  </span>
                </div>

                <div className="col-span-10 md:col-span-4">
                  <h3 className="text-h3 font-semibold text-paper-50 mb-2 group-hover:text-paper-50 transition-colors">
                    {cap.title}
                  </h3>
                </div>

                <div className="col-span-12 md:col-span-7">
                  <p className="text-lead text-paper-200 max-w-2xl">
                    {cap.description}
                  </p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
