import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { database } from '../../firebase/config';
import { ref, onValue } from '@firebase/database';

interface Experience {
  title: string;
  company: string;
  location: string;
  period: string;
  description: string[];
  technologies: string[];
}

const Experience: React.FC = () => {
  const [content, setContent] = useState({
    title: '',
    description: '',
    experiences: [] as Experience[]
  });

  useEffect(() => {
    const experienceRef = ref(database, 'content/experience');
    const unsubscribe = onValue(experienceRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setContent(data);
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <section id="experience" className="py-20 bg-light dark:bg-dark">
      <div className="container-custom">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            {content.title || 'Work Experience'}
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            {content.description || 'My professional journey and achievements.'}
          </p>
        </motion.div>

        <div className="space-y-8">
          {content.experiences?.map((exp, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="bg-white dark:bg-dark p-6 rounded-lg shadow-md"
            >
              <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
                <div>
                  <h3 className="text-xl font-semibold">{exp.title}</h3>
                  <p className="text-primary">{exp.company}</p>
                </div>
                <div className="text-right mt-2 md:mt-0">
                  <p className="text-gray-600 dark:text-gray-400">{exp.period}</p>
                  <p className="text-sm text-gray-500">{exp.location}</p>
                </div>
              </div>
              <div className="space-y-4">
                <ul className="list-disc list-inside space-y-2">
                  {exp.description?.map((item, itemIndex) => (
                    <li key={itemIndex} className="text-gray-600 dark:text-gray-400">
                      {item}
                    </li>
                  ))}
                </ul>
                <div className="flex flex-wrap gap-2">
                  {exp.technologies?.map((tech, techIndex) => (
                    <span
                      key={techIndex}
                      className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Experience; 