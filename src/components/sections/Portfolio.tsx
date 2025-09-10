'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';

const Portfolio = () => {
  const [activeFilter, setActiveFilter] = useState('all');
  
  const filters = [
    { id: 'all', name: 'All Projects' },
    { id: 'web', name: 'Web Development' },
    { id: 'mobile', name: 'Mobile Apps' },
    { id: 'design', name: 'UI/UX Design' },
  ];

  const projects = [
    {
      id: 1,
      title: 'E-commerce Platform',
      category: 'web',
      tags: ['React', 'Node.js', 'MongoDB'],
      imageUrl: '/images/project-1.svg',
      description: 'A full-featured e-commerce platform with advanced filtering, cart functionality, and secure payments.',
      liveUrl: '#',
      githubUrl: '#'
    },
    {
      id: 2,
      title: 'Fitness Tracking App',
      category: 'mobile',
      tags: ['React Native', 'Firebase', 'Redux'],
      imageUrl: '/images/project-2.svg',
      description: 'A cross-platform mobile app for tracking workouts, nutrition, and fitness goals.',
      liveUrl: '#',
      githubUrl: '#'
    },
    {
      id: 3,
      title: 'Banking Dashboard',
      category: 'design',
      tags: ['Figma', 'UI/UX', 'Design System'],
      imageUrl: '/images/project-3.svg',
      description: 'A comprehensive banking dashboard design with intuitive user experience and accessibility features.',
      liveUrl: '#',
      githubUrl: '#'
    },
    {
      id: 4,
      title: 'Real Estate Platform',
      category: 'web',
      tags: ['Next.js', 'Tailwind CSS', 'Prisma'],
      imageUrl: '/images/project-4.svg',
      description: 'A modern real estate platform with property listings, advanced search, and virtual tours.',
      liveUrl: '#',
      githubUrl: '#'
    },
    {
      id: 5,
      title: 'Food Delivery App',
      category: 'mobile',
      tags: ['Flutter', 'Firebase', 'Google Maps'],
      imageUrl: '/images/project-5.svg',
      description: 'A food delivery application with real-time order tracking and restaurant management.',
      liveUrl: '#',
      githubUrl: '#'
    },
    {
      id: 6,
      title: 'SaaS Dashboard',
      category: 'design',
      tags: ['Adobe XD', 'UI/UX', 'Wireframing'],
      imageUrl: '/images/project-6.svg',
      description: 'A SaaS dashboard design with data visualization, user management, and settings panels.',
      liveUrl: '#',
      githubUrl: '#'
    },
  ];

  const filteredProjects = activeFilter === 'all' 
    ? projects 
    : projects.filter(project => project.category === activeFilter);

  return (
    <section id="portfolio" className="py-24 bg-white relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-secondary-200/20 rounded-full blur-3xl"></div>
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-primary-200/20 rounded-full blur-3xl"></div>
      
      <div className="container mx-auto px-6 relative z-10">
        <motion.div 
          className="text-center mb-20"
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <span className="text-secondary-500 font-semibold text-sm uppercase tracking-wider mb-4 block">
            Our Work
          </span>
          <h2 className="text-4xl md:text-5xl font-bold mb-6 text-gray-800 dark:text-white">
            <span className="text-gray-800 dark:text-white">Featured</span> <span className="text-secondary-600 dark:text-secondary-400">Projects</span>
          </h2>
          <p className="text-lg text-gray-800 dark:text-gray-200 max-w-2xl mx-auto leading-relaxed mb-8">
            Discover our latest work and see how we bring innovative ideas to life through cutting-edge technology and creative design.
          </p>
          
          <div className="flex flex-wrap justify-center gap-3 mb-8">
            {filters.map((filter) => (
              <button
                key={filter.id}
                onClick={() => setActiveFilter(filter.id)}
                className={`px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-300 ${
                  activeFilter === filter.id 
                    ? 'bg-gradient-to-r from-secondary-500 to-primary-600 text-white shadow-lg shadow-secondary-500/25' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow-md'
                }`}
              >
                {filter.name}
              </button>
            ))}
          </div>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredProjects.map((project, index) => (
            <motion.div 
              key={project.id}
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="group relative overflow-hidden rounded-2xl shadow-soft hover:shadow-medium bg-white border border-gray-100 transition-all duration-500 hover:-translate-y-2"
            >
              <div className="relative overflow-hidden">
                <Image
                  src={project.imageUrl}
                  alt={`${project.title} - Professional web development project by CodeMinds Digital`}
                  width={600}
                  height={400}
                  className="w-full h-48 object-cover transition-transform duration-700 group-hover:scale-110"
                  loading="lazy"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <a 
                    href={project.liveUrl}
                    className="p-2 bg-white/90 rounded-lg hover:bg-white transition-colors"
                  >
                    <svg className="w-4 h-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                  <a 
                    href={project.githubUrl}
                    className="p-2 bg-white/90 rounded-lg hover:bg-white transition-colors"
                  >
                    <svg className="w-4 h-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                    </svg>
                  </a>
                </div>
              </div>
              
              <div className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-secondary-500 bg-secondary-50 px-3 py-1 rounded-full">
                    {project.category.charAt(0).toUpperCase() + project.category.slice(1)}
                  </span>
                </div>
                
                <h3 className="text-xl font-bold text-gray-800 mb-3 group-hover:text-secondary-500 transition-colors">
                  {project.title}
                </h3>
                
                <p className="text-gray-600 mb-4 leading-relaxed">
                  {project.description}
                </p>
                
                <div className="flex flex-wrap gap-2">
                  {project.tags.map((tag, tagIndex) => (
                    <span 
                      key={tagIndex}
                      className="text-xs font-medium text-gray-600 bg-gray-100 px-2 py-1 rounded-md"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
        
        <motion.div 
          className="text-center mt-16"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
        >
          <button className="bg-gradient-to-r from-secondary-500 to-primary-600 text-white px-8 py-4 rounded-xl font-semibold hover:shadow-lg hover:shadow-secondary-500/25 transition-all duration-300 hover:-translate-y-1">
            View All Projects
          </button>
        </motion.div>
      </div>
    </section>
  );
};

export default Portfolio;