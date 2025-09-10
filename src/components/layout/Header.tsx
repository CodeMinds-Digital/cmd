'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';


const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState('home');

  const { scrollY } = useScroll();
  const headerOpacity = useTransform(scrollY, [0, 100], [0.95, 1]);
  const headerBlur = useTransform(scrollY, [0, 100], [8, 20]);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);

      // Track active section with improved logic
      const sections = ['home', 'about', 'services', 'portfolio', 'process', 'testimonials', 'blog', 'contact'];
      const scrollPosition = window.scrollY + 100;

      for (const sectionId of sections) {
        const element = document.getElementById(sectionId);
        if (element) {
          const { offsetTop, offsetHeight } = element;
          if (scrollPosition >= offsetTop && scrollPosition < offsetTop + offsetHeight) {
            setActiveSection(sectionId);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Initial call

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Modern navigation items
  const navItems = [
    { name: 'Home', href: '#home', icon: '🏠', id: 'home' },
    { name: 'About', href: '#about', icon: '👥', id: 'about' },
    { name: 'Services', href: '#services', icon: '⚡', id: 'services' },
    { name: 'Portfolio', href: '#portfolio', icon: '💼', id: 'portfolio' },
    { name: 'Process', href: '#process', icon: '🔄', id: 'process' },
    { name: 'Reviews', href: '#testimonials', icon: '⭐', id: 'testimonials' },
    { name: 'Blog', href: '#blog', icon: '📝', id: 'blog' },
    { name: 'Contact', href: '#contact', icon: '📧', id: 'contact' },
  ];



  return (
    <motion.header
      className={`fixed w-full z-50 transition-all duration-500 ${
        isScrolled
          ? 'glass shadow-large py-3'
          : 'bg-transparent py-6'
      }`}
      style={{
        backdropFilter: isScrolled ? 'blur(20px)' : 'none',
        backgroundColor: isScrolled
          ? 'rgba(255, 255, 255, 0.8)'
          : 'transparent'
      }}
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 100, damping: 20 }}
    >
      <div className="container flex items-center justify-between">
        {/* Logo */}
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Link href="#home" className="flex items-center group">
            <div className="relative">
              <Image
                src="/icons/logo.svg"
                alt="CodeMinds Digital"
                width={40}
                height={40}
                className="w-10 h-10 transition-transform duration-300 group-hover:rotate-12"
              />
            </div>
            <span className="ml-3 text-xl font-heading font-bold text-neutral-900 relative">
              <span className="text-brand-600">Code</span>
              <span>Minds</span>
              <motion.span
                className="absolute -bottom-1 left-0 h-[3px] bg-gradient-brand w-0 group-hover:w-full transition-all duration-300"
                initial={{ width: 0 }}
                animate={{ width: isScrolled ? '100%' : 0 }}
                transition={{ duration: 0.5 }}
              />
            </span>
          </Link>
        </motion.div>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center space-x-1">
          {navItems.map((item) => (
            <motion.div
              key={item.name}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Link
                href={item.href}
                className={`relative px-4 py-2 rounded-xl font-medium transition-all duration-300 flex items-center gap-2 z-10 ${
                  activeSection === item.id
                    ? 'text-brand-600'
                    : 'text-neutral-700 hover:text-brand-600'
                }`}
                onMouseEnter={() => setHoveredItem(item.name)}
                onMouseLeave={() => setHoveredItem(null)}
              >
                <span className="text-sm">{item.icon}</span>
                <span>{item.name}</span>

                {/* Active indicator */}
                {activeSection === item.id && (
                  <motion.div
                    className="absolute inset-0 bg-brand-100 rounded-xl border border-brand-200 -z-10"
                    layoutId="activeNavItem"
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  />
                )}

                {/* Hover indicator */}
                {hoveredItem === item.name && activeSection !== item.id && (
                  <motion.div
                    className="absolute inset-0 bg-brand-50/50 rounded-xl -z-10"
                    layoutId="hoveredNavItem"
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  />
                )}
              </Link>
            </motion.div>
          ))}
        </nav>

        {/* Right side actions */}
        <div className="hidden lg:flex items-center space-x-4">


          {/* CTA Button */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Link
              href="#contact"
              className="btn-primary"
            >
              Get Started
            </Link>
          </motion.div>
        </div>

        {/* Mobile Menu Button */}
        <motion.button
          className="lg:hidden p-2 rounded-xl bg-neutral-100 text-neutral-600 hover:bg-neutral-200 transition-colors focus:outline-none relative z-20"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          aria-label="Toggle mobile menu"
        >
          <div className="w-6 h-6 flex items-center justify-center">
            <motion.div
              animate={isMobileMenuOpen ? "open" : "closed"}
              className="w-5 flex flex-col items-center justify-center gap-1"
            >
              <motion.span
                className="w-full h-0.5 bg-gradient-brand block rounded-full"
                variants={{
                  closed: { rotate: 0, translateY: 0 },
                  open: { rotate: 45, translateY: 6 }
                }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
              />
              <motion.span
                className="w-full h-0.5 bg-gradient-brand block rounded-full"
                variants={{
                  closed: { opacity: 1, scaleX: 1 },
                  open: { opacity: 0, scaleX: 0 }
                }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
              />
              <motion.span
                className="w-full h-0.5 bg-gradient-brand block rounded-full"
                variants={{
                  closed: { rotate: 0, translateY: 0 },
                  open: { rotate: -45, translateY: -6 }
                }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
              />
            </motion.div>
          </div>
        </motion.button>
      </div>

      {/* Mobile Navigation */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            className="md:hidden fixed inset-0 bg-white/95 backdrop-blur-md z-10 flex items-center justify-center"
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
                    className={`font-medium transition-colors py-2 text-2xl flex items-center gap-3 ${
                      activeSection === item.id
                        ? 'text-brand-600'
                        : 'text-neutral-800 hover:text-brand-600'
                    }`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <span className="text-brand-600">{item.icon}</span>
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