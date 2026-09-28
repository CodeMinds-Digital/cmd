import type { CaseMetricItem } from '@/data/cases';

export default function CaseMetric({
  metrics,
}: {
  metrics: CaseMetricItem[];
}) {
  if (!metrics?.length) return null;

  return (
    <section className="section-padding border-t border-line">
      <div className="container">
        <p className="font-mono text-mono-sm text-accent-ink mb-12">Result</p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12 max-w-6xl">
          {metrics.map((m) => (
            <div key={m.label}>
              <div className="font-display text-h1 md:text-display font-bold text-fg leading-none mb-3 tracking-tight md:leading-(--text-display--line-height) md:tracking-(--text-display--letter-spacing)">
                {m.value}
              </div>
              <div className="font-mono text-mono-sm text-fg-subtle border-t border-line pt-3">
                {m.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
