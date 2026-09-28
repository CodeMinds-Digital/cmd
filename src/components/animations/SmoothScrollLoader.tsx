'use client';

import dynamic from 'next/dynamic';
import { useMediaQuery } from '@/lib/use-media-query';

const SmoothScroll = dynamic(() => import('./SmoothScroll'), { ssr: false });

/**
 * Loads Lenis only for mouse/trackpad users who haven't asked for reduced
 * motion — touch devices keep native scrolling and never download it.
 */
export default function SmoothScrollLoader() {
  const wanted = useMediaQuery('(pointer: fine) and (prefers-reduced-motion: no-preference)');
  return wanted ? <SmoothScroll /> : null;
}
