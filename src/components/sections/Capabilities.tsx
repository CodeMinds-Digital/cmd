import SplitText from '@/components/animations/SplitText';
import SectionEyebrow from '@/components/ui/SectionEyebrow';

type Capability = {
  index: string;
  title: string;
  tags: string[];
  description: string;
};

const capabilities: Capability[] = [
  {
    index: '01',
    title: 'Web platforms',
    tags: ['Next.js', 'Postgres', 'Tailwind'],
    description:
      'We rebuild slow marketing sites and ship product MVPs. Lighthouse 95+ by default.',
  },
  {
    index: '02',
    title: 'Mobile',
    tags: ['SwiftUI', 'React Native', 'Expo'],
    description:
      'iOS + Android in a single sprint. Native where it matters, cross-platform where it ships faster.',
  },
  {
    index: '03',
    title: 'AI integration',
    tags: ['OpenAI', 'embeddings', 'RAG'],
    description:
      'Practical AI features in production code, not demos. Search, summarisation, agents on your data.',
  },
  {
    index: '04',
    title: 'Performance & rebuilds',
    tags: ['Lighthouse 95+', 'Core Web Vitals', 'Audits'],
    description:
      'Existing-stack rebuilds, perf audits, and incremental migrations from monoliths.',
  },
];

export default function Capabilities() {
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
              key={cap.index}
              className="border-b border-ink-600 group hover:bg-ink-800/40 transition-colors"
            >
              <div className="grid grid-cols-12 gap-4 md:gap-8 py-8 md:py-12 px-2 md:px-4">
                {/* Number */}
                <div className="col-span-2 md:col-span-1">
                  <span className="font-mono text-mono-sm text-brand-400">
                    {cap.index}
                  </span>
                </div>

                {/* Title + tags */}
                <div className="col-span-10 md:col-span-4">
                  <h3 className="text-h3 font-semibold text-paper-50 mb-2 group-hover:text-paper-50 transition-colors">
                    {cap.title}
                  </h3>
                  <div className="flex flex-wrap gap-x-2 gap-y-1">
                    {cap.tags.map((tag, i) => (
                      <span
                        key={tag}
                        className="font-mono text-mono-sm text-paper-400"
                      >
                        {tag}
                        {i < cap.tags.length - 1 && (
                          <span aria-hidden className="ml-2 text-paper-400/40">
                            ·
                          </span>
                        )}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Description */}
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
