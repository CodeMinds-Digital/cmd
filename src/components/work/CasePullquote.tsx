import type { CaseTestimonial } from '@/data/cases';

export default function CasePullquote({
  testimonial,
}: {
  testimonial: CaseTestimonial;
}) {
  if (!testimonial) return null;

  return (
    <section className="section-padding border-t border-ink-700">
      <div className="container max-w-4xl">
        <p className="font-mono text-mono-sm text-brand-400 mb-12">
          What they said
        </p>

        <figure>
          <blockquote
            className="text-h2 md:text-h1 font-serif italic font-normal text-paper-50 leading-tight tracking-tight mb-10 text-balance"
            cite={testimonial.author}
          >
            <span aria-hidden className="text-brand-400 mr-2">&ldquo;</span>
            {testimonial.quote}
            <span aria-hidden className="text-brand-400 ml-1">&rdquo;</span>
          </blockquote>

          <figcaption className="font-mono text-mono-sm text-paper-400 flex items-center gap-3">
            <span aria-hidden className="inline-block h-px w-8 bg-paper-400" />
            <span>
              {testimonial.author} · {testimonial.role}
            </span>
          </figcaption>
        </figure>
      </div>
    </section>
  );
}
