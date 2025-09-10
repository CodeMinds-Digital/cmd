'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

const Services = () => {
  const [hoveredService, setHoveredService] = useState<number | null>(null);

  const services = [
    {
      title: 'Web Development',
      description: 'Award-winning websites and web applications built with cutting-edge technologies. From concept to deployment, we create digital experiences that drive results.',
      features: ['Next.js & React', 'Performance Optimized', 'SEO & Analytics', 'Responsive Design'],
      technologies: ['React', 'Next.js', 'TypeScript', 'Tailwind CSS'],
      cta: 'Start Your Project',
      icon: '🚀',


    },
    {
      title: 'Mobile Applications',
      description: 'Native iOS and Android apps that deliver exceptional user experiences. Cross-platform solutions that reach your audience everywhere.',
      features: ['iOS & Android', 'React Native', 'Native Performance', 'App Store Optimization'],
      technologies: ['React Native', 'Swift', 'Kotlin', 'Flutter'],
      cta: 'Build My App',
      icon: '📱',


    },
    {
      title: 'UI/UX Design',
      description: 'User-centered design that converts visitors into customers. We create intuitive interfaces backed by research and data.',
      features: ['User Research', 'Design Systems', 'Prototyping', 'Usability Testing'],
      technologies: ['Figma', 'Adobe XD', 'Principle', 'Framer'],
      cta: 'Design With Us',
      icon: '🎨',


    },
    {
      title: 'Cloud & DevOps',
      description: 'Scalable infrastructure and automated deployment pipelines. We ensure your applications are fast, secure, and always available.',
      features: ['AWS/Azure/GCP', 'CI/CD Pipelines', 'Auto Scaling', 'Security & Monitoring'],
      technologies: ['Docker', 'Kubernetes', 'Terraform', 'GitHub Actions'],
      cta: 'Scale Up',
      icon: '☁️',


    },
    {
      title: 'E-commerce Solutions',
      description: 'Complete online stores that drive sales and growth. From payment processing to inventory management, we handle it all.',
      features: ['Payment Integration', 'Inventory Management', 'Analytics Dashboard', 'Mobile Commerce'],
      technologies: ['Shopify', 'WooCommerce', 'Stripe', 'PayPal'],
      cta: 'Sell Online',
      icon: '🛒',


    },
    {
      title: 'Digital Strategy',
      description: 'Strategic consulting to help businesses leverage technology for growth, efficiency, and competitive advantage in the digital landscape.',
      features: ['Technology Audit', 'Growth Strategy', 'Digital Transformation', 'Competitive Analysis'],
      technologies: ['Analytics', 'Research', 'Strategy', 'Consulting'],
      cta: 'Get Strategy',
      icon: '📊',


    }
  ];

  return (
    <section id="services" className="section bg-neutral-50 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-20 right-20 w-64 h-64 bg-gradient-to-r from-brand-400/10 to-electric-400/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 left-20 w-80 h-80 bg-gradient-to-r from-neon-400/10 to-sunset-400/10 rounded-full blur-3xl" />
      </div>

      <div className="container">
        {/* Section Header */}
        <motion.div
          className="text-center mb-20"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8 }}
        >
          <motion.span
            className="inline-block px-4 py-2 rounded-full bg-brand-100 text-brand-700 text-sm font-semibold mb-6"
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            OUR SERVICES
          </motion.span>

          <motion.h2
            className="heading-lg mb-6 text-neutral-900"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.3 }}
          >
            Everything You Need to{' '}
            <span className="text-brand-600">Succeed Online</span>
          </motion.h2>

          <motion.p
            className="text-xl text-neutral-600 max-w-3xl mx-auto leading-relaxed text-balance"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            From initial concept to final launch, we provide comprehensive digital solutions
            that help your business thrive in the modern marketplace.
          </motion.p>
        </motion.div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map((service, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
              onHoverStart={() => setHoveredService(index)}
              onHoverEnd={() => setHoveredService(null)}
              className="group relative"
            >
              <div className={`
                relative p-8 rounded-3xl border-2 transition-all duration-500 h-full flex flex-col
                bg-white border-neutral-200
                hover:shadow-large hover:-translate-y-2 hover:border-brand-300
                ${hoveredService === index ? 'scale-105' : ''}
              `}>
                {/* Subtle overlay on hover */}
                <motion.div
                  className="absolute inset-0 rounded-3xl bg-brand-50 opacity-0 transition-opacity duration-500"
                  animate={{ opacity: hoveredService === index ? 0.3 : 0 }}
                />

                {/* Header */}
                <div className="flex items-start justify-between mb-6 relative z-10">
                  <motion.div
                    className="text-5xl"
                    animate={{
                      scale: hoveredService === index ? 1.1 : 1,
                      rotate: hoveredService === index ? 5 : 0
                    }}
                    transition={{ duration: 0.3 }}
                  >
                    {service.icon}
                  </motion.div>


                </div>

                {/* Content */}
                <div className="relative z-10 flex flex-col h-full">
                  <h3 className="text-2xl font-bold text-neutral-900 mb-4 group-hover:text-brand-600 transition-all duration-300">
                    {service.title}
                  </h3>

                  <p className="text-neutral-600 mb-6 leading-relaxed">
                    {service.description}
                  </p>

                  {/* Features */}
                  <ul className="space-y-3 mb-6">
                    {service.features.map((feature, featureIndex) => (
                      <motion.li
                        key={featureIndex}
                        className="flex items-center text-neutral-700"
                        initial={{ opacity: 0, x: -10 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: featureIndex * 0.1 }}
                        viewport={{ once: true }}
                      >
                        <div className="w-2 h-2 rounded-full bg-brand-500 mr-3 flex-shrink-0" />
                        {feature}
                      </motion.li>
                    ))}
                  </ul>

                  {/* Technologies */}
                  <div className="mb-6">
                    <div className="text-sm font-semibold text-neutral-500 mb-2">
                      Technologies:
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {service.technologies.map((tech, techIndex) => (
                        <span
                          key={techIndex}
                          className="px-2 py-1 text-xs font-medium bg-neutral-100 text-neutral-600 rounded-md"
                        >
                          {tech}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* CTA Button - Fixed alignment */}
                  <div className="mt-auto pt-4">
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Link
                        href="#contact"
                        className="inline-flex items-center justify-center w-full px-6 py-4 rounded-xl font-semibold text-white bg-brand-600 hover:bg-brand-700 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300"
                      >
                        {service.cta}
                        <svg className="ml-2 w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                        </svg>
                      </Link>
                    </motion.div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Bottom CTA */}
        <motion.div
          className="text-center mt-20 bg-neutral-50 rounded-3xl p-12"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <h3 className="text-2xl font-bold text-neutral-900 mb-4">
            Ready to Grow Your Business?
          </h3>
          <p className="text-lg text-neutral-700 mb-8 max-w-2xl mx-auto leading-relaxed">
            Let's create a website that works as hard as you do. Get started with a free consultation and see how we can help you succeed online.
          </p>
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Link
              href="#contact"
              className="btn-primary btn-lg"
            >
              Start Your Free Consultation
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default Services;