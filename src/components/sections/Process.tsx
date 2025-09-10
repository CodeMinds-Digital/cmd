'use client';

import { motion } from 'framer-motion';

const processSteps = [
  {
    step: '01',
    title: 'Discovery & Strategy',
    description: 'We start by understanding your business goals, target audience, and competitive landscape to create a strategic foundation.',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
    ),
    duration: '1-2 weeks',
    deliverables: ['Project roadmap', 'User personas', 'Technical requirements', 'Design strategy']
  },
  {
    step: '02',
    title: 'Design & Prototyping',
    description: 'Our design team creates wireframes, mockups, and interactive prototypes that bring your vision to life.',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4h4a2 2 0 002-2V5z" />
      </svg>
    ),
    duration: '2-3 weeks',
    deliverables: ['Wireframes', 'Visual designs', 'Interactive prototype', 'Design system']
  },
  {
    step: '03',
    title: 'Development & Testing',
    description: 'We build your project using cutting-edge technologies, ensuring optimal performance and user experience.',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
      </svg>
    ),
    duration: '3-6 weeks',
    deliverables: ['Frontend development', 'Backend integration', 'Quality assurance', 'Performance optimization']
  },
  {
    step: '04',
    title: 'Launch & Optimization',
    description: 'We deploy your project and provide ongoing support to ensure continued success and growth.',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
    duration: '1 week',
    deliverables: ['Production deployment', 'Performance monitoring', 'Training & documentation', 'Ongoing support']
  }
];

const Process = () => {
  return (
    <section id="process" className="py-24 bg-white relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute top-1/4 right-0 w-1/3 h-1/3 bg-electric-100 rounded-full blur-3xl opacity-50"></div>
      <div className="absolute bottom-1/4 left-0 w-1/2 h-1/2 bg-brand-100 rounded-full blur-3xl opacity-50"></div>
      
      <div className="container relative z-10">
        {/* Section Header */}
        <motion.div
          className="text-center mb-20"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8 }}
        >
          <motion.span
            className="inline-block px-4 py-2 rounded-full bg-neon-100 text-neon-700 text-sm font-semibold mb-6"
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            OUR PROCESS
          </motion.span>

          <motion.h2
            className="heading-lg mb-6 text-neutral-900"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.3 }}
          >
            How We <span className="text-brand-600">Work Together</span>
          </motion.h2>

          <motion.p
            className="text-xl text-neutral-600 max-w-3xl mx-auto leading-relaxed"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            Our proven 4-step process ensures your project is delivered on time, within budget, and exceeds expectations.
          </motion.p>
        </motion.div>

        {/* Process Steps */}
        <div className="max-w-6xl mx-auto">
          {processSteps.map((step, index) => (
            <motion.div
              key={index}
              className="relative mb-16 last:mb-0"
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: index * 0.2 }}
            >
              {/* Connecting Line */}
              {index < processSteps.length - 1 && (
                <div className="absolute left-1/2 top-32 w-px h-16 bg-neutral-200 transform -translate-x-1/2 hidden lg:block"></div>
              )}

              <div className={`flex flex-col lg:flex-row items-center gap-12 ${
                index % 2 === 1 ? 'lg:flex-row-reverse' : ''
              }`}>
                {/* Content */}
                <div className="flex-1 text-center lg:text-left">
                  <div className="bg-white rounded-3xl p-8 shadow-large border border-neutral-100 hover:shadow-xl transition-all duration-300">
                    <div className="flex items-center justify-center lg:justify-start mb-6">
                      <div className="w-16 h-16 bg-brand-100 text-brand-600 rounded-2xl flex items-center justify-center mr-4">
                        {step.icon}
                      </div>
                      <div>
                        <div className="text-sm font-bold text-brand-600 mb-1">STEP {step.step}</div>
                        <h3 className="text-2xl font-bold text-neutral-900">{step.title}</h3>
                      </div>
                    </div>

                    <p className="text-lg text-neutral-600 mb-6 leading-relaxed">
                      {step.description}
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="text-sm font-semibold text-neutral-800 mb-3">Timeline</h4>
                        <div className="flex items-center text-brand-600">
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span className="font-medium">{step.duration}</span>
                        </div>
                      </div>

                      <div>
                        <h4 className="text-sm font-semibold text-neutral-800 mb-3">Deliverables</h4>
                        <ul className="space-y-1">
                          {step.deliverables.map((deliverable, idx) => (
                            <li key={idx} className="flex items-center text-neutral-600 text-sm">
                              <div className="w-1.5 h-1.5 bg-brand-500 rounded-full mr-2 flex-shrink-0"></div>
                              {deliverable}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Step Number Circle */}
                <div className="flex-shrink-0">
                  <div className="w-24 h-24 bg-brand-600 text-white rounded-full flex items-center justify-center text-2xl font-bold shadow-lg">
                    {step.step}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* CTA Section */}
        <motion.div
          className="text-center mt-20 bg-neutral-50 rounded-3xl p-12"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <h3 className="text-2xl font-bold text-neutral-900 mb-4">
            Ready to Start Your Project?
          </h3>
          <p className="text-lg text-neutral-600 mb-8 max-w-2xl mx-auto">
            Let's discuss your goals and create a custom plan that delivers exceptional results for your business.
          </p>
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <a
              href="#contact"
              className="btn-primary btn-lg"
            >
              Start Your Project Today
            </a>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default Process;
