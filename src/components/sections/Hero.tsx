import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ref, onValue } from '@firebase/database';
import { database } from '../../firebase/config';
import AnimatedSection from '../common/AnimatedSection';

const Hero: React.FC = () => {
  const [content, setContent] = useState<{
    title?: string;
    subtitle?: string;
    description?: string;
    image?: string;
  }>({});

  useEffect(() => {
    const contentRef = ref(database, 'content/hero');
    const unsubscribe = onValue(contentRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setContent(data);
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <section className="relative min-h-[90vh] flex items-center justify-center bg-gradient-to-b from-dark to-dark-light">
      {/* Decorative circles */}
      <div className="absolute top-20 left-10 w-48 sm:w-72 h-48 sm:h-72 bg-primary/10 rounded-full mix-blend-multiply filter blur-xl animate-blob" />
      <div className="absolute top-40 right-10 w-48 sm:w-72 h-48 sm:h-72 bg-primary-dark/10 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-2000" />
      <div className="absolute -bottom-8 left-20 w-48 sm:w-72 h-48 sm:h-72 bg-primary/10 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-4000" />

      <div className="container-custom relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center">
          {/* Image - Show first on mobile */}
          {content.image && (
            <AnimatedSection className="order-first md:order-last">
              <motion.div
                whileHover={{ scale: 1.02 }}
                className="relative aspect-square rounded-lg overflow-hidden shadow-xl"
              >
                <div className="absolute -inset-1 bg-gradient-to-r from-primary to-primary-dark rounded-lg blur opacity-30" />
                <img
                  src={content.image}
                  alt="Hero"
                  className="relative w-full h-full object-cover"
                />
              </motion.div>
            </AnimatedSection>
          )}

          {/* Content */}
          <AnimatedSection className="order-last md:order-first">
            <div className="space-y-6 md:space-y-8">
              <div className="space-y-4">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  className="inline-block"
                >
                  <span className="inline-block px-3 py-1.5 sm:px-4 sm:py-2 rounded-full bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary-light text-sm font-medium">
                    Welcome
                  </span>
                </motion.div>
                <motion.h1 
                  className="text-3xl sm:text-4xl md:text-6xl font-bold text-white leading-tight"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                >
                  {content.title || 'Welcome to My Portfolio'}
                </motion.h1>
                {content.subtitle && (
                  <motion.h2 
                    className="text-lg sm:text-xl md:text-2xl text-primary font-medium"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                  >
                    {content.subtitle}
                  </motion.h2>
                )}
              </div>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="text-base sm:text-lg text-white prose prose-invert max-w-none"
                dangerouslySetInnerHTML={{ __html: content.description || 'I am a passionate developer dedicated to creating beautiful and functional web applications.' }}
              />
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.6 }}
                className="flex flex-col sm:flex-row gap-3 sm:gap-4"
              >
                <motion.a
                  href="#contact"
                  className="inline-block px-4 sm:px-6 py-2 sm:py-3 text-center text-sm sm:text-base bg-primary text-white rounded-lg hover:bg-primary-dark transition-all duration-300 shadow-lg hover:shadow-xl"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Get in Touch
                </motion.a>
                <motion.a
                  href="#projects"
                  className="inline-block px-4 sm:px-6 py-2 sm:py-3 text-center text-sm sm:text-base border-2 border-primary text-primary dark:text-primary-light rounded-lg hover:bg-primary/10 transition-all duration-300"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  View Projects
                </motion.a>
              </motion.div>
            </div>
          </AnimatedSection>
        </div>
      </div>
    </section>
  );
};

export default Hero; 