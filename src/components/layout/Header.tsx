'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState('Home');

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);

      // Track active section
      const sections = ['home', 'about', 'services', 'portfolio', 'testimonials', 'contact'];
      const scrollPosition = window.scrollY + 100;

      for (const sectionId of sections) {
        const element = document.getElementById(sectionId);
        if (element) {
          const { offsetTop, offsetHeight } = element;
          if (scrollPosition >= offsetTop && scrollPosition < offsetTop + offsetHeight) {
            setActiveSection(sectionId.charAt(0).toUpperCase() + sectionId.slice(1));
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navItems = [
    { name: 'Home', href: '#', icon: '⌂' },
    { name: 'About', href: '#about', icon: '◉' },
    { name: 'Services', href: '#services', icon: '⚙' },
    { name: 'Portfolio', href: '#portfolio', icon: '◈' },
    { name: 'Testimonials', href: '#testimonials', icon: '✦' },
    { name: 'Contact', href: '#contact', icon: '✉' },
  ];

  return (
    <motion.header
      className={`fixed w-full z-50 transition-all duration-300 ${isScrolled ? 'bg-white/95 dark:bg-gray-900/95 backdrop-blur-md shadow-lg py-3' : 'bg-transparent py-5'}`}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ type: 'spring', stiffness: 50, damping: 20 }}
    >
      <div className="container flex items-center justify-between">
        <Link href="#" className="flex items-center group">
          <span className="text-2xl font-heading font-bold text-gray-800 dark:text-white relative">
            <span className="text-secondary-600 dark:text-secondary-400">Create</span>
            <span className="text-gray-800 dark:text-white">Studio</span>
            <motion.span
              className="absolute -bottom-1 left-0 h-[3px] bg-gradient-to-r from-secondary-500 to-primary-600 w-0 group-hover:w-full transition-all duration-300"
              initial={{ width: 0 }}
              animate={{ width: isScrolled ? '100%' : 0 }}
              transition={{ duration: 0.5 }}
            />
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-8">
          {navItems.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={`font-medium transition-colors flex items-center gap-1.5 relative py-2 ${activeSection === item.name
                ? 'text-secondary-600 dark:text-secondary-400'
                : 'text-gray-800 dark:text-gray-200 hover:text-secondary-600 dark:hover:text-secondary-400'
                }`}

              onMouseEnter={() => setHoveredItem(item.name)}
              onMouseLeave={() => setHoveredItem(null)}
            >
              <span>{item.name}</span>
              {(hoveredItem === item.name || activeSection === item.name) && (
                <motion.span
                  className="absolute -bottom-1 left-0 right-0 h-[2px] bg-gradient-to-r from-secondary-500 to-primary-600"
                  layoutId="navIndicator"
                  initial={{ opacity: 0, width: '0%' }}
                  animate={{ opacity: 1, width: '100%' }}
                  exit={{ opacity: 0, width: '0%' }}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
            </Link>
          ))}
          <Link
            href="#contact"
            className="bg-gradient-to-r from-secondary-500 to-primary-600 text-white font-medium rounded-lg px-5 py-2 transition-all duration-300 hover:shadow-lg hover:shadow-secondary-500/25 hover:-translate-y-0.5"
          >
            Get Started
          </Link>
        </nav>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden text-gray-800 dark:text-white focus:outline-none relative z-20"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          <div className="w-8 h-8 flex items-center justify-center">
            <motion.div
              animate={isMobileMenuOpen ? "open" : "closed"}
              className="w-6 flex flex-col items-center justify-center gap-1.5"
            >
              <motion.span
                className="w-full h-0.5 bg-gradient-to-r from-secondary-500 to-primary-600 block"
                variants={{
                  closed: { rotate: 0, translateY: 0 },
                  open: { rotate: 45, translateY: 8 }
                }}
                transition={{ duration: 0.3 }}
              />
              <motion.span
                className="w-full h-0.5 bg-primary-600 block"
                variants={{
                  closed: { opacity: 1 },
                  open: { opacity: 0 }
                }}
                transition={{ duration: 0.3 }}
              />
              <motion.span
                className="w-full h-0.5 bg-primary-600 block"
                variants={{
                  closed: { rotate: 0, translateY: 0 },
                  open: { rotate: -45, translateY: -8 }
                }}
                transition={{ duration: 0.3 }}
              />
            </motion.div>
          </div>
        </button>
      </div>

      {/* Mobile Navigation */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            className="md:hidden fixed inset-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md z-10 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <motion.div
              className="container py-4 flex flex-col space-y-6 items-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.3 }}
            >
              {navItems.map((item, index) => (
                <motion.div
                  key={item.name}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + index * 0.1, duration: 0.3 }}
                >
                  <Link
                    href={item.href}
                    className="text-gray-800 dark:text-white hover:text-primary-600 dark:hover:text-primary-500 font-medium transition-colors py-2 text-2xl flex items-center gap-3"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <span className="text-primary-600">{item.icon}</span>
                    {item.name}
                  </Link>
                </motion.div>
              ))}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + navItems.length * 0.1, duration: 0.3 }}
              >
                <Link
                  href="#contact"
                  className="btn-primary w-full text-center block mt-4"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Get Started
                </Link>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
};

export default Header;