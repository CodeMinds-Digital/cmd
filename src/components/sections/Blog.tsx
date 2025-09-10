'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';

const blogPosts = [
  {
    id: 1,
    title: '10 Web Design Trends That Will Dominate 2025',
    excerpt: 'Discover the latest design trends that are shaping the future of web development and user experience.',
    category: 'Design',
    readTime: '5 min read',
    date: 'Dec 15, 2024',
    image: '/api/placeholder/400/250',
    author: 'Sarah Johnson',
    tags: ['Web Design', 'Trends', 'UX/UI']
  },
  {
    id: 2,
    title: 'The Complete Guide to Website Performance Optimization',
    excerpt: 'Learn how to make your website lightning-fast with these proven optimization techniques and best practices.',
    category: 'Development',
    readTime: '8 min read',
    date: 'Dec 12, 2024',
    image: '/api/placeholder/400/250',
    author: 'Michael Chen',
    tags: ['Performance', 'SEO', 'Development']
  },
  {
    id: 3,
    title: 'How to Choose the Right Technology Stack for Your Project',
    excerpt: 'A comprehensive guide to selecting the best technologies for your web development project in 2025.',
    category: 'Technology',
    readTime: '6 min read',
    date: 'Dec 10, 2024',
    image: '/api/placeholder/400/250',
    author: 'David Park',
    tags: ['Technology', 'Planning', 'Development']
  },
  {
    id: 4,
    title: 'Building Accessible Websites: A Developer\'s Guide',
    excerpt: 'Essential tips and techniques for creating websites that are accessible to all users, regardless of their abilities.',
    category: 'Accessibility',
    readTime: '7 min read',
    date: 'Dec 8, 2024',
    image: '/api/placeholder/400/250',
    author: 'Emily Rodriguez',
    tags: ['Accessibility', 'UX', 'Best Practices']
  },
  {
    id: 5,
    title: 'The ROI of Professional Web Design: Real Case Studies',
    excerpt: 'See how investing in professional web design has transformed businesses and delivered measurable results.',
    category: 'Business',
    readTime: '4 min read',
    date: 'Dec 5, 2024',
    image: '/api/placeholder/400/250',
    author: 'Lisa Park',
    tags: ['Business', 'ROI', 'Case Studies']
  },
  {
    id: 6,
    title: 'Mobile-First Design: Why It Matters More Than Ever',
    excerpt: 'Understanding the importance of mobile-first design and how to implement it effectively in your projects.',
    category: 'Mobile',
    readTime: '5 min read',
    date: 'Dec 3, 2024',
    image: '/api/placeholder/400/250',
    author: 'James Wilson',
    tags: ['Mobile', 'Responsive', 'UX']
  }
];

const categories = ['All', 'Design', 'Development', 'Technology', 'Business', 'Accessibility', 'Mobile'];

const Blog = () => {
  return (
    <section id="blog" className="py-24 bg-neutral-50 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute top-0 right-0 w-1/3 h-1/3 bg-neon-100 rounded-full blur-3xl opacity-50"></div>
      <div className="absolute bottom-0 left-0 w-1/2 h-1/2 bg-sunset-100 rounded-full blur-3xl opacity-50"></div>
      
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
            className="inline-block px-4 py-2 rounded-full bg-sunset-100 text-sunset-700 text-sm font-semibold mb-6"
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            INSIGHTS & RESOURCES
          </motion.span>

          <motion.h2
            className="heading-lg mb-6 text-neutral-900"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.3 }}
          >
            Latest from Our <span className="text-brand-600">Blog</span>
          </motion.h2>

          <motion.p
            className="text-xl text-neutral-600 max-w-3xl mx-auto leading-relaxed"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            Stay updated with the latest trends, tips, and insights from the world of web development and digital design.
          </motion.p>
        </motion.div>

        {/* Featured Post */}
        <motion.div
          className="mb-16"
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <div className="bg-white rounded-3xl overflow-hidden shadow-large border border-neutral-100 hover:shadow-xl transition-all duration-300">
            <div className="grid lg:grid-cols-2 gap-0">
              <div className="aspect-video lg:aspect-auto bg-brand-100 flex items-center justify-center">
                <div className="text-brand-600 text-6xl">📝</div>
              </div>
              <div className="p-8 lg:p-12 flex flex-col justify-center">
                <div className="flex items-center gap-4 mb-4">
                  <span className="px-3 py-1 bg-brand-100 text-brand-700 text-sm font-semibold rounded-full">
                    {blogPosts[0].category}
                  </span>
                  <span className="text-neutral-500 text-sm">{blogPosts[0].readTime}</span>
                </div>
                <h3 className="text-2xl lg:text-3xl font-bold text-neutral-900 mb-4 leading-tight">
                  {blogPosts[0].title}
                </h3>
                <p className="text-lg text-neutral-600 mb-6 leading-relaxed">
                  {blogPosts[0].excerpt}
                </p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-brand-100 rounded-full flex items-center justify-center text-brand-600 font-semibold">
                      {blogPosts[0].author.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <div className="font-semibold text-neutral-900">{blogPosts[0].author}</div>
                      <div className="text-sm text-neutral-500">{blogPosts[0].date}</div>
                    </div>
                  </div>
                  <Link
                    href={`/blog/${blogPosts[0].id}`}
                    className="inline-flex items-center text-brand-600 hover:text-brand-700 font-semibold transition-colors"
                  >
                    Read More
                    <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Blog Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {blogPosts.slice(1, 7).map((post, index) => (
            <motion.article
              key={post.id}
              className="bg-white rounded-2xl overflow-hidden shadow-soft border border-neutral-100 hover:shadow-lg transition-all duration-300 group"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
            >
              <div className="aspect-video bg-neutral-100 flex items-center justify-center">
                <div className="text-neutral-400 text-4xl">📄</div>
              </div>
              
              <div className="p-6">
                <div className="flex items-center gap-3 mb-3">
                  <span className="px-2 py-1 bg-electric-100 text-electric-700 text-xs font-semibold rounded-full">
                    {post.category}
                  </span>
                  <span className="text-neutral-500 text-xs">{post.readTime}</span>
                </div>
                
                <h3 className="text-lg font-bold text-neutral-900 mb-3 group-hover:text-brand-600 transition-colors line-clamp-2">
                  {post.title}
                </h3>
                
                <p className="text-neutral-600 mb-4 text-sm leading-relaxed line-clamp-3">
                  {post.excerpt}
                </p>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-neutral-100 rounded-full flex items-center justify-center text-neutral-600 text-xs font-semibold">
                      {post.author.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-neutral-900">{post.author}</div>
                      <div className="text-xs text-neutral-500">{post.date}</div>
                    </div>
                  </div>
                  
                  <Link
                    href={`/blog/${post.id}`}
                    className="text-brand-600 hover:text-brand-700 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </Link>
                </div>
              </div>
            </motion.article>
          ))}
        </div>

        {/* CTA */}
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <Link
            href="/blog"
            className="btn-secondary btn-lg"
          >
            View All Articles
          </Link>
        </motion.div>
      </div>
    </section>
  );
};

export default Blog;
