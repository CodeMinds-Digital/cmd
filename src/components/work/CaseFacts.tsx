import type { CaseStub } from '@/types/case';

type Fact = { label: string; value: string };

export default function CaseFacts({ data }: { data: CaseStub }) {
  const facts: Fact[] = [
    { label: 'Client', value: data.client ?? 'Confidential' },
    { label: 'Year', value: String(data.year) },
    { label: 'Role', value: data.role ?? '—' },
    { label: 'Duration', value: data.duration ?? '—' },
    { label: 'Stack', value: data.tags.join(' · ') },
  ];

  return (
    <section className="section-padding pt-0 pb-16 md:pb-24">
      <div className="container">
        <ul className="border-t border-ink-600 max-w-5xl">
          {facts.map((f) => (
            <li
              key={f.label}
              className="border-b border-ink-600 grid grid-cols-12 gap-4 md:gap-8 py-5 md:py-6 items-baseline"
            >
              <span className="col-span-4 md:col-span-3 font-mono text-mono-sm text-paper-400">
                {f.label}
              </span>
              <span className="col-span-8 md:col-span-9 text-body text-paper-100">
                {f.value}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
