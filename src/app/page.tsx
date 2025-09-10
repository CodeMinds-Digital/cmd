'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Hero from '@/components/sections/Hero';
import About from '@/components/sections/About';
import Services from '@/components/sections/Services';
import Portfolio from '@/components/sections/Portfolio';
import Process from '@/components/sections/Process';
import Testimonials from '@/components/sections/Testimonials';
import Blog from '@/components/sections/Blog';
import CallToAction from '@/components/sections/CallToAction';
import Contact from '@/components/sections/Contact';
import Footer from '@/components/layout/Footer';
import Header from '@/components/layout/Header';

export default function Home() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <About />
        <Services />
        <Portfolio />
        <Process />
        <Testimonials />
        <Blog />
        <CallToAction />
        <Contact />
      </main>
      <Footer />
    </>
  );
}