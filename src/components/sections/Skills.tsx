import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { database } from '../../firebase/config';
import { ref, onValue } from '@firebase/database';
import AnimatedSection from '../common/AnimatedSection';

interface Skill {
  name: string;
  level: number;
  icon?: string;
}

interface Category {
  name: string;
  skills: Skill[];
}

const Skills: React.FC = () => {
  const [content, setContent] = useState({
    title: '',
    description: '',
    categories: [] as Category[]
  });

  useEffect(() => {
    const skillsRef = ref(database, 'content/skills');
    const unsubscribe = onValue(skillsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setContent(data);
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <section id="skills" className="py-12 sm:py-20 bg-dark">
      <div className="container-custom">
        <AnimatedSection>
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-primary mb-4">
              {content.title || 'My Skills'}
            </h2>
            <div 
              className="text-base sm:text-lg text-white max-w-2xl mx-auto prose prose-invert"
              dangerouslySetInnerHTML={{ __html: content.description || 'Here are some of the technologies and tools I work with.' }}
            />
          </div>
        </AnimatedSection>

        <div className="space-y-8 sm:space-y-12">
          {content.categories?.map((category, categoryIndex) => (
            <AnimatedSection key={categoryIndex} delay={categoryIndex * 0.1}>
              <div className="space-y-4 sm:space-y-6">
                <h3 className="text-xl sm:text-2xl font-bold text-center text-primary">{category.name}</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                  {category.skills?.map((skill, skillIndex) => (
                    <motion.div
                      key={skillIndex}
                      whileHover={{ scale: 1.02 }}
                      className="bg-dark-light p-4 sm:p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow"
                    >
                      <div className="flex items-center justify-between mb-3 sm:mb-4">
                        <div className="flex items-center space-x-2 sm:space-x-3">
                          {skill.icon && (
                            <img
                              src={skill.icon}
                              alt={skill.name}
                              className="w-6 h-6 sm:w-8 sm:h-8 object-contain"
                            />
                          )}
                          <h4 className="text-lg sm:text-xl font-semibold text-white">{skill.name}</h4>
                        </div>
                        <span className="text-white font-medium">{skill.level}%</span>
                      </div>
                      <div className="w-full bg-dark rounded-full h-2">
                        <motion.div
                          initial={{ width: 0 }}
                          whileInView={{ width: `${skill.level}%` }}
                          viewport={{ once: true }}
                          transition={{ duration: 1, delay: (categoryIndex * 0.1) + (skillIndex * 0.05) }}
                          className="bg-primary h-2 rounded-full"
                        />
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </AnimatedSection>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Skills; 