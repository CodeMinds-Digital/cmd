import type { CaseTestimonial } from '@/data/cases';

export default function CasePullquote({
  testimonial,
}: {
  testimonial: CaseTestimonial;
}) {
  if (!testimonial) return null;

  return (
    <section className="section-padding border-t border-line">
      <div className="container max-w-4xl">
        <p className="font-mono text-mono-sm text-accent-ink mb-12">
          What they said
        </p>

        <figure>
          <blockquote
            className="text-h2 md:text-h1 font-display font-medium text-fg leading-tight tracking-tight md:leading-(--text-h1--line-height) mb-10 text-balance"
            cite={testimonial.author}
          >
            <span aria-hidden className="text-accent-ink mr-2">&ldquo;</span>
            {testimonial.quote}
            <span aria-hidden className="text-accent-ink ml-1">&rdquo;</span>
          </blockquote>

          <figcaption className="font-mono text-mono-sm text-fg-subtle flex items-center gap-3">
            <span aria-hidden className="inline-block h-px w-8 bg-fg-subtle" />
            <span>
              {testimonial.author} · {testimonial.role}
            </span>
          </figcaption>
        </figure>
      </div>
    </section>
  );
}
