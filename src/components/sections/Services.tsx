'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';

const Services = () => {
  const services = [
    {
      title: 'Web Development',
      description: 'We build responsive, high-performance websites and web applications using modern technologies like React, Next.js, and Node.js.',
      features: ['Custom Design', 'Mobile Responsive', 'SEO Optimized', 'Fast Loading'],
      cta: 'Start Your Project',
      icon: '🚀',
      color: 'bg-blue-50 border-blue-200',
      textColor: 'text-blue-600'
    },
    {
      title: 'Mobile Apps',
      description: 'Native and cross-platform mobile applications for iOS and Android using React Native, Flutter, and Swift.',
      features: ['iOS & Android', 'Cross-Platform', 'Native Performance', 'App Store Ready'],
      cta: 'Build My App',
      icon: '📱',
      color: 'bg-purple-50 border-purple-200',
      textColor: 'text-purple-600'
    },
    {
      title: 'UI/UX Design',
      description: 'User-centered design solutions that create intuitive, engaging experiences across all digital touchpoints.',
      features: ['User Research', 'Wireframing', 'Prototyping', 'Design Systems'],
      cta: 'Design With Us',
      icon: '🎨',
      color: 'bg-green-50 border-green-200',
      textColor: 'text-green-600'
    },
    {
      title: 'Cloud & DevOps',
      description: 'Scalable cloud infrastructure, CI/CD pipelines, and DevOps practices for reliable, high-performance applications.',
      features: ['AWS/Azure/GCP', 'CI/CD Pipelines', 'Auto Scaling', 'Monitoring'],
      cta: 'Scale Up',
      icon: '☁️',
      color: 'bg-orange-50 border-orange-200',
      textColor: 'text-orange-600'
    },
    {
      title: 'E-commerce Solutions',
      description: 'Custom online stores and marketplaces with secure payment processing, inventory management, and analytics.',
      features: ['Payment Integration', 'Inventory Management', 'Analytics', 'Mobile Commerce'],
      cta: 'Sell Online',
      icon: '🛒',
      color: 'bg-red-50 border-red-200',
      textColor: 'text-red-600'
    },
    {
      title: 'Digital Strategy',
      description: 'Strategic consulting to help businesses leverage technology for growth, efficiency, and competitive advantage.',
      features: ['Technology Audit', 'Growth Strategy', 'Digital Transformation', 'Competitive Analysis'],
      cta: 'Get Strategy',
      icon: '📊',
      color: 'bg-indigo-50 border-indigo-200',
      textColor: 'text-indigo-600'
    }
  ];

  return (
    <section id="services" className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="text-secondary-600 font-semibold text-lg tracking-wide uppercase">
            WHAT WE OFFER
          </span>
          <h2 className="text-4xl font-bold text-gray-800 mb-4">
            Our Services
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            We craft digital experiences that transform businesses and engage users.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map((service, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
              className={`${service.color} p-8 rounded-2xl border-2 hover:shadow-lg transition-all duration-300`}
            >
              <div className="flex items-start justify-between mb-6">
                <div className="text-4xl">{service.icon}</div>
                <Link 
                  href="#contact" 
                  className={`${service.textColor} bg-white px-4 py-2 rounded-lg text-sm font-medium hover:shadow-md transition-shadow`}
                >
                  {service.cta}
                </Link>
              </div>
              
              <h3 className="text-2xl font-bold text-gray-800 mb-3">
                {service.title}
              </h3>
              
              <p className="text-gray-700 mb-6 leading-relaxed">
                {service.description}
              </p>
              
              <ul className="space-y-2">
                {service.features.map((feature, featureIndex) => (
                  <li key={featureIndex} className="flex items-center text-gray-700">
                    <svg className="w-4 h-4 text-green-500 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Services;