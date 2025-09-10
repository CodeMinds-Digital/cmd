'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import ScrollReveal from '../animations/ScrollReveal';

const About = () => {
  const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  const values = [
    {
      title: 'Innovation',
      description: 'We embrace cutting-edge technologies and creative solutions to solve complex problems.',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
      color: 'bg-primary-100 text-primary-600 dark:bg-primary-900 dark:text-primary-300',
    },
    {
      title: 'Quality',
      description: 'We maintain the highest standards in code quality, design, and user experience.',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      color: 'bg-secondary-100 text-secondary-600 dark:bg-secondary-900 dark:text-secondary-300',
    },
    {
      title: 'Collaboration',
      description: 'We work closely with our clients, ensuring their vision is realized through open communication.',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ),
      color: 'bg-accent-100 text-accent-600 dark:bg-accent-900 dark:text-accent-300',
    },
    {
      title: 'Reliability',
      description: 'We deliver projects on time and within budget, with a focus on long-term partnerships.',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      color: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
    },
  ];

  return (
    <section id="about" className="py-24 bg-white dark:bg-gray-900 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-1/3 h-1/3 bg-gradient-to-br from-secondary-500/10 to-primary-600/5 dark:from-secondary-500/20 dark:to-primary-600/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 left-0 w-1/2 h-1/2 bg-gradient-to-tr from-primary-600/5 to-secondary-500/10 dark:from-primary-600/10 dark:to-secondary-500/20 rounded-full blur-3xl"></div>
      
      <div className="container relative z-10">
        <motion.div 
          className="text-center max-w-3xl mx-auto mb-20"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5 }}
          variants={fadeInUp}
        >
          <span className="inline-block px-4 py-2 rounded-full bg-gradient-to-r from-primary-100 to-secondary-100 text-primary-700 text-sm font-semibold mb-6">WHO WE ARE</span>
          <h2 className="heading-lg mb-6 text-gray-900 dark:text-white">
            About Our <span className="text-secondary-600 dark:text-secondary-400">Agency</span>
          </h2>
          <p className="text-xl text-gray-600 leading-relaxed">
            We are a collective of creative minds, tech enthusiasts, and strategic thinkers dedicated to crafting exceptional digital experiences.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-16 items-center">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.5, delay: 0.2 }}
            variants={fadeInUp}
          >
            <div className="relative h-[450px] rounded-2xl overflow-hidden shadow-soft border border-gray-200">
              <div className="absolute inset-0 bg-gradient-to-tr from-secondary-500/10 to-primary-600/10 z-10"></div>
              {/* Replace with actual image in production */}
              <Image 
                src="/images/team.svg" 
                alt="CodeMinds Digital team collaborating on innovative web development projects" 
                fill 
                style={{ objectFit: 'cover' }} 
                className="transition-transform duration-700 hover:scale-110"
                loading="lazy"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            </div>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.5, delay: 0.4 }}
            variants={fadeInUp}
            className="pl-0 md:pl-6"
          >
            <h3 className="heading-md mb-4">
              <span className="text-secondary-600 dark:text-secondary-400">Our Mission</span>
            </h3>
            <p className="text-lg text-gray-600 mb-6 leading-relaxed">
              At Create Studio, we transform ideas into exceptional digital experiences that elevate brands and engage users in meaningful ways.
            </p>
            <p className="text-lg text-gray-700 dark:text-gray-200 mb-8">
              Founded by a team of creative technologists, we blend artistry with technical expertise to craft solutions that stand out in today's digital landscape.
            </p>

            <div className="grid grid-cols-2 gap-6">
              {values.slice(0, 2).map((value, index) => (
                <ScrollReveal key={index} direction="up" delay={0.4 + index * 0.1}>
                  <div className="flex items-start group hover:-translate-y-1 transition-all duration-300">
                    <div className={`flex-shrink-0 h-14 w-14 rounded-xl bg-gradient-to-br from-secondary-500/20 to-primary-600/20 dark:from-secondary-500/30 dark:to-primary-600/30 text-secondary-500 dark:text-secondary-400 flex items-center justify-center mr-4 transition-all duration-300 group-hover:from-secondary-500/30 group-hover:to-primary-600/30`}>
                      {value.icon}
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-1 group-hover:text-secondary-500 dark:group-hover:text-secondary-400 transition-colors duration-300">{value.title}</h4>
                      <p className="text-gray-800 dark:text-gray-200">{value.description}</p>
                    </div>
                  </div>
                </ScrollReveal>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-6 mt-6">
              {values.slice(2, 4).map((value, index) => (
                <ScrollReveal key={index} direction="up" delay={0.6 + index * 0.1}>
                  <div className="flex items-start group hover:-translate-y-1 transition-all duration-300">
                    <div className={`flex-shrink-0 h-14 w-14 rounded-xl bg-gradient-to-br from-secondary-500/20 to-primary-600/20 dark:from-secondary-500/30 dark:to-primary-600/30 text-secondary-500 dark:text-secondary-400 flex items-center justify-center mr-4 transition-all duration-300 group-hover:from-secondary-500/30 group-hover:to-primary-600/30`}>
                      {value.icon}
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-1 group-hover:text-secondary-500 dark:group-hover:text-secondary-400 transition-colors duration-300">{value.title}</h4>
                      <p className="text-gray-800 dark:text-gray-200">{value.description}</p>
                    </div>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default About;