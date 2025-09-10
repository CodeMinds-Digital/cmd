'use client';

import React from 'react';
import { motion } from 'framer-motion';

const Testimonials = () => {
  const testimonials = [
    {
      id: 1,
      name: 'Sarah Mitchell',
      role: 'CEO, GrowthCorp',
      content: 'Our new website has transformed how customers find and engage with us. Within 3 months, we saw a 150% increase in qualified leads and our conversion rate doubled.',
      rating: 5,
      result: '150% more leads'
    },
    {
      id: 2,
      name: 'David Park',
      role: 'Founder, LocalBiz',
      content: 'The team delivered exactly what they promised - a fast, professional website that actually brings in business. Our online bookings increased by 200% in the first month.',
      rating: 5,
      result: '200% booking increase'
    },
    {
      id: 3,
      name: 'Lisa Chen',
      role: 'Marketing Director, TechFlow',
      content: 'Finally, a website that works as hard as we do. The design is beautiful and the performance is incredible. Our bounce rate dropped by 60% and sales are up significantly.',
      rating: 5,
      result: '60% lower bounce rate'
    },
    {
      id: 4,
      name: 'Mark Thompson',
      role: 'Owner, ServicePro',
      content: 'Best investment we\'ve made for our business. The website pays for itself every month through new customer acquisitions. Couldn\'t be happier with the results.',
      rating: 5,
      result: 'ROI in first month'
    }
  ];

  return (
    <section id="testimonials" className="py-24 bg-neutral-50 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute top-0 left-0 w-1/3 h-1/3 bg-brand-100 rounded-full blur-3xl opacity-50"></div>
      <div className="absolute bottom-0 right-0 w-1/2 h-1/2 bg-electric-100 rounded-full blur-3xl opacity-50"></div>

      <div className="container relative z-10">
        <motion.div 
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-4xl font-bold text-gray-800 mb-4">
            Real Results from Real Clients
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Don't just take our word for it. See how we've helped businesses like yours grow online.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={testimonial.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="bg-gray-50 rounded-2xl p-8 border border-gray-100 hover:shadow-lg transition-shadow duration-300"
            >
              {/* Rating Stars */}
              <div className="flex items-center mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <svg key={i} className="w-5 h-5 text-yellow-400 fill-current" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>

              {/* Quote */}
              <svg className="h-8 w-8 text-gray-300 mb-4" fill="currentColor" viewBox="0 0 32 32">
                <path d="M9.352 4C4.456 7.456 1 13.12 1 19.36c0 5.088 3.072 8.064 6.624 8.064 3.36 0 5.856-2.688 5.856-5.856 0-3.168-2.208-5.472-5.088-5.472-.576 0-1.344.096-1.536.192.48-3.264 3.552-7.104 6.624-9.024L9.352 4zm16.512 0c-4.8 3.456-8.256 9.12-8.256 15.36 0 5.088 3.072 8.064 6.624 8.064 3.264 0 5.856-2.688 5.856-5.856 0-3.168-2.304-5.472-5.184-5.472-.576 0-1.248.096-1.44.192.48-3.264 3.456-7.104 6.528-9.024L25.864 4z" />
              </svg>

              <p className="text-gray-700 text-lg mb-6 leading-relaxed">
                {testimonial.content}
              </p>

              {/* Result Badge */}
              <div className="inline-flex items-center px-3 py-1 rounded-full bg-green-100 text-green-800 text-sm font-medium mb-6">
                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                {testimonial.result}
              </div>

              {/* Author */}
              <div className="flex items-center">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold mr-4">
                  {testimonial.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <h4 className="font-semibold text-gray-800">{testimonial.name}</h4>
                  <p className="text-gray-600 text-sm">{testimonial.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;