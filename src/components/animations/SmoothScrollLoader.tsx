'use client';

import dynamic from 'next/dynamic';

const SmoothScroll = dynamic(() => import('./SmoothScroll'), { ssr: false });

export default function SmoothScrollLoader() {
  return <SmoothScroll />;
}
