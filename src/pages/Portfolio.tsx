import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { database } from '../firebase/config';
import { ref, onValue } from '@firebase/database';

// Components
import Hero from '../components/sections/Hero';
import About from '../components/sections/About';
import Skills from '../components/sections/Skills';
import Projects from '../components/sections/Projects';
import Experience from '../components/sections/Experience';
import Contact from '../components/sections/Contact';

const Portfolio: React.FC = () => {
  const [sections, setSections] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const sectionsRef = ref(database, 'sections');
    const unsubscribe = onValue(sectionsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setSections(Object.keys(data).filter(key => data[key].enabled));
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <main>
      {sections.includes('hero') && <Hero />}
      {sections.includes('about') && <About />}
      {sections.includes('skills') && <Skills />}
      {sections.includes('projects') && <Projects />}
      {sections.includes('experience') && <Experience />}
      {sections.includes('contact') && <Contact />}
    </main>
  );
};

export default Portfolio; 