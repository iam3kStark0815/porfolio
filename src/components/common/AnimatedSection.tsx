import React from 'react';
import { motion } from 'framer-motion';

interface AnimatedSectionProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}

const AnimatedSection: React.FC<AnimatedSectionProps> = ({ 
  children, 
  className = '', 
  delay = 0 
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: false, margin: "-100px" }}
      transition={{ 
        duration: 0.8,
        delay: delay,
        ease: [0.17, 0.55, 0.55, 1] // Custom easing for smooth iPhone-like animation
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

export default AnimatedSection; 