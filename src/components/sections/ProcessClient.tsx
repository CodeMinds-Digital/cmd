'use client';

import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import DrawIcon from '@/components/animations/DrawIcon';
import SplitText from '@/components/animations/SplitText';
import SectionEyebrow from '@/components/ui/SectionEyebrow';

function ProcessSteps({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start 80%', 'end 20%'],
  });
  const pathLength = useTransform(scrollYProgress, [0, 1], [0, 1]);

  return (
    <div
      ref={ref}
      style={{ position: 'relative' }}
      className="max-w-6xl mx-auto"
    >
      <svg
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-0 hidden h-full w-px -translate-x-1/2 lg:block"
        preserveAspectRatio="none"
        viewBox="0 0 1 100"
      >
        <line x1="0.5" y1="0" x2="0.5" y2="100" stroke="rgb(34, 34, 42)" strokeWidth="1" />
        <motion.line
          x1="0.5"
          y1="0"
          x2="0.5"
          y2="100"
          stroke="rgb(165, 180, 252)"
          strokeWidth="2"
          style={{ pathLength }}
        />
      </svg>
      {children}
    </div>
  );
}

import type { ProcessStep } from '@/lib/cms/blocks';

export default function ProcessClient({ steps }: { steps: ProcessStep[] }) {
  if (steps.length === 0) return null;
  return (
    <section
      id="process"
      className="section-padding relative bg-ink-900 border-t border-ink-700 overflow-hidden"
    >
      <div className="container relative z-10">
        {/* Section header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-8 mb-16 md:mb-24">
          <div>
            <SectionEyebrow index="03" label="How We Work" className="mb-6" />
            <h2 className="text-h2 md:text-h1 font-bold text-paper-50 max-w-2xl text-balance">
              <SplitText>From kickoff to ship</SplitText>
              <SplitText
                className="font-serif italic font-normal text-brand-400"
                delay={0.4}
              >
                in 4–8 weeks.
              </SplitText>
            </h2>
          </div>
          <p className="text-body text-paper-300 max-w-xs md:text-right">
            One sprint per phase. No status reports. No invoices for setup calls.
          </p>
        </div>

        {/* Steps */}
        <ProcessSteps>
          {steps.map((step, index) => (
            <div key={step.$id} className="relative mb-12 last:mb-0">
              <div
                className={`flex flex-col lg:flex-row items-start gap-8 lg:gap-16 ${
                  index % 2 === 1 ? 'lg:flex-row-reverse' : ''
                }`}
              >
                {/* Content card */}
                <div className="flex-1">
                  <div className="rounded-2xl border border-ink-600 bg-ink-800 p-6 md:p-8">
                    <div className="flex items-center gap-4 mb-5">
                      <div className="w-12 h-12 rounded-xl bg-ink-700 text-brand-400 flex items-center justify-center flex-shrink-0">
                        <DrawIcon className="w-6 h-6" d={step.iconPath} />
                      </div>
                      <div>
                        <div className="font-mono text-mono-sm text-brand-400 mb-0.5">
                          Step {step.displayIndex} · {step.duration}
                        </div>
                        <h3 className="text-h3 font-semibold text-paper-50">
                          {step.title}
                        </h3>
                      </div>
                    </div>

                    <p className="text-body text-paper-200 mb-6">{step.body}</p>

                    <ul className="space-y-2">
                      {step.deliverables.map((d) => (
                        <li
                          key={d}
                          className="flex items-start gap-2.5 text-body text-paper-300"
                        >
                          <span
                            aria-hidden
                            className="font-mono text-mono-sm text-paper-400 mt-1"
                          >
                            ─
                          </span>
                          <span>{d}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Step number disc — sits on the spine */}
                <div className="flex-shrink-0 hidden lg:flex">
                  <div className="w-16 h-16 rounded-full bg-ink-900 border border-brand-400 text-paper-50 flex items-center justify-center font-mono text-mono-sm">
                    {step.displayIndex}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </ProcessSteps>
      </div>
    </section>
  );
}
