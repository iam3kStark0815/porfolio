import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ref, onValue } from '@firebase/database';
import { database } from '../../firebase/config';
import AnimatedSection from '../common/AnimatedSection';

const About: React.FC = () => {
  const [content, setContent] = useState<{
    title?: string;
    description?: string;
    image?: string;
  }>({});

  useEffect(() => {
    const contentRef = ref(database, 'content/about');
    const unsubscribe = onValue(contentRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setContent(data);
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <section id="about" className="py-12 sm:py-20 bg-dark-light">
      <div className="container-custom">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center">
          {content.image && (
            <AnimatedSection>
              <motion.div
                whileHover={{ scale: 1.02 }}
                className="relative aspect-square rounded-lg overflow-hidden shadow-xl"
              >
                <div className="absolute -inset-1 bg-gradient-to-r from-primary to-primary-dark rounded-lg blur opacity-30" />
                <img
                  src={content.image}
                  alt="About"
                  className="relative w-full h-full object-cover"
                />
              </motion.div>
            </AnimatedSection>
          )}

          <AnimatedSection delay={0.2}>
            <div className="space-y-4 sm:space-y-6">
              <h2 className="text-2xl sm:text-3xl font-bold text-primary">{content.title || 'About Me'}</h2>
              <div 
                className="text-base sm:text-lg text-white leading-relaxed prose prose-invert max-w-none"
                dangerouslySetInnerHTML={{ __html: content.description || 'I am a dedicated developer with a passion for creating beautiful and functional web applications.' }}
              />
            </div>
          </AnimatedSection>
        </div>
      </div>
    </section>
  );
};

export default About; 