import type React from 'react';
import SplitText from '@/components/animations/SplitText';
import ChennaiClock from '@/components/islands/ChennaiClock';
import ContactForm from '@/components/islands/ContactForm';
import Eyebrow from '@/components/ui/Eyebrow';
import Highlight from '@/components/ui/Highlight';
import Tile from '@/components/ui/Tile';
import { site } from '@/data/site';

/**
 * Closing moment — a full-bleed orange band (plan §4) with the enquiry form
 * and the direct channels. The form is the only client island here.
 */
export default function Conversation() {
  const channels: { label: string; value: React.ReactNode; href?: string }[] = [
    { label: 'Email', value: site.email, href: `mailto:${site.email}` },
    { label: 'Book a call', value: site.calUrl.replace('https://', ''), href: site.calUrl },
    { label: 'Studio', value: `${site.city} · ${site.timezoneLabel}` },
    { label: 'Local time', value: <ChennaiClock /> },
    { label: 'Response', value: `Within ${site.replyWithin}` },
  ];

  return (
    <section id="contact" className="section-padding scroll-mt-20 bg-accent text-accent-fg">
      <div className="container">
        <Eyebrow index="04" label="Let's talk" tone="accent" className="mb-6" />
        <h2 className="mb-10 max-w-4xl text-step-5 font-bold text-accent-fg text-balance md:mb-14">
          <SplitText inView>
            Let&apos;s make <Highlight inverse delayMs={500}>something.</Highlight>
          </SplitText>
        </h2>

        <div className="grid grid-cols-12 gap-bento">
          <Tile className="col-span-12 lg:col-span-7">
            <ContactForm />
          </Tile>

          <Tile tone="inverse" className="col-span-12 flex flex-col justify-between gap-10 lg:col-span-5">
            <div>
              <p className="mb-2 font-mono text-mono-xs uppercase text-inverse-fg/70">Prefer to talk?</p>
              <p className="text-step-3 font-bold font-display">A 20-minute call is usually enough to scope it.</p>
            </div>
            <dl className="divide-y divide-inverse-fg/10 border-y border-inverse-fg/10">
              {channels.map((c) => (
                <div key={c.label} className="flex min-h-14 items-center justify-between gap-4 py-1">
                  <dt className="font-mono text-mono-xs uppercase text-inverse-fg/70">{c.label}</dt>
                  <dd className="text-right text-step-0">
                    {c.href ? (
                      <a
                        href={c.href}
                        target={c.href.startsWith('http') ? '_blank' : undefined}
                        rel={c.href.startsWith('http') ? 'noreferrer' : undefined}
                        className="inline-flex min-h-11 items-center text-inverse-fg underline decoration-inverse-fg/30 underline-offset-4 hover:text-accent hover:decoration-accent"
                      >
                        {c.value}
                      </a>
                    ) : (
                      c.value
                    )}
                  </dd>
                </div>
              ))}
            </dl>
          </Tile>
        </div>

        <div
          aria-hidden
          className="mt-12 flex items-center justify-between border-t border-accent-fg/25 pt-5 font-mono text-mono-xs uppercase"
        >
          <span>We reply within 24h</span>
          <span className="hidden md:inline">
            {site.city} · IST
          </span>
          <span>{site.version}</span>
        </div>
      </div>
    </section>
  );
}
