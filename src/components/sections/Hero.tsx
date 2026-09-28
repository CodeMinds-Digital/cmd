'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
  m,
  AnimatePresence,
  useReducedMotion,
  useScroll,
  useTransform,
  type TargetAndTransition,
  type Transition,
} from 'motion/react';
import Link from 'next/link';
import Magnetic from '@/components/animations/Magnetic';
import SplitText from '@/components/animations/SplitText';
import Highlight from '@/components/ui/Highlight';

const Hero = () => {
  const [isLoaded, setIsLoaded] = useState(false);
  const prefersReducedMotion = useReducedMotion();
  const sectionRef = useRef<HTMLElement>(null);

  // Mount-gate for the status pill's enter animation. The Phase 3 hero rebuild
  // server-renders the pill and drops this state entirely.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsLoaded(true);
  }, []);

  const loop = (anim: TargetAndTransition): TargetAndTransition =>
    prefersReducedMotion ? {} : anim;
  const loopTransition = (t: Transition): Transition =>
    prefersReducedMotion ? { duration: 0 } : t;

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start start', 'end start'],
  });
  const contentY = useTransform(scrollYProgress, [0, 1], ['0%', '15%']);
  const contentOpacity = useTransform(scrollYProgress, [0, 0.6, 1], [1, 0.85, 0]);

  return (
    <section
      id="home"
      ref={sectionRef}
      style={{ position: 'relative' }}
      className="min-h-screen min-h-dvh flex items-center justify-center overflow-hidden bg-canvas"
    >

      {/* Main Content */}
      <m.div
        className="container relative z-10"
        style={prefersReducedMotion ? undefined : { y: contentY, opacity: contentOpacity }}
      >
        <div className="text-center max-w-5xl mx-auto">
          {/* Status — quiet, type-driven */}
          <AnimatePresence>
            {isLoaded && (
              <m.div
                className="inline-flex items-center gap-2.5 mb-12 font-mono text-mono-xs text-fg-muted"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                <m.span
                  className="h-1.5 w-1.5 rounded-full bg-accent"
                  animate={loop({ opacity: [1, 0.4, 1] })}
                  transition={loopTransition({
                    duration: 2,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  })}
                />
                Booking new projects
              </m.div>
            )}
          </AnimatePresence>

          {/* Headline — Space Grotesk with the orange highlight chip */}
          <h1 className="mb-10 text-balance">
            <SplitText
              className="block text-h1 md:text-display font-bold text-fg"
              delay={0.2}
            >
              Software,
            </SplitText>
            <SplitText
              className="block text-h1 md:text-display font-bold text-fg"
              delay={0.55}
            >
              built with{' '}
              <Highlight>care.</Highlight>
            </SplitText>
          </h1>

          {/* Subline */}
          <m.p
            className="text-lead text-fg-muted max-w-2xl mx-auto mb-12 text-balance"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 1.1 }}
          >
            A digital studio for web, mobile, and AI. Two-to-four-week delivery
            from Chennai → worldwide.
          </m.p>

          {/* CTAs */}
          <m.div
            className="flex flex-col sm:flex-row justify-center items-center gap-2 sm:gap-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 1.4 }}
          >
            <Magnetic>
              <Link
                href="#contact"
                className="btn-primary btn-lg group"
              >
                Start a project
                <svg
                  className="ml-2 w-4 h-4 transition-transform group-hover:translate-x-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 8l4 4m0 0l-4 4m4-4H3"
                  />
                </svg>
              </Link>
            </Magnetic>

            <Link
              href="#work"
              className="px-6 py-3 text-fg-muted hover:text-fg transition-colors flex items-center gap-2 group"
            >
              See selected work
              <span
                aria-hidden
                className="inline-block h-px w-6 bg-fg-subtle group-hover:w-10 group-hover:bg-fg transition-all"
              />
            </Link>
          </m.div>
        </div>
      </m.div>

      {/* Editorial bottom anchor */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-6 z-10 flex items-center justify-between px-6 md:px-12 font-mono text-mono-sm text-fg-subtle"
      >
        <span>Codeminds Digital · v2026.1</span>
        <span className="hidden md:inline">Chennai · India</span>
        <span className="flex items-center gap-2">
          <span className="h-px w-8 bg-fg-subtle" />
          Scroll
        </span>
      </div>
    </section>
  );
};

export default Hero;
