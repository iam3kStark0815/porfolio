import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const Navbar: React.FC = () => {
  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="sticky top-0 z-50 bg-dark-light border-b border-primary/10"
    >
      <div className="container-custom">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="text-xl font-bold text-primary">
            My Portfolio
          </Link>

          <div className="hidden md:flex items-center space-x-8">
            {/* Add your links here */}
          </div>

          <div className="flex items-center space-x-4">
            <button
              className="p-2 text-white hover:text-primary transition-colors"
              aria-label="Toggle theme"
            >
              {/* Add theme toggle logic here */}
            </button>

            <button
              className="md:hidden p-2 text-white hover:text-primary transition-colors"
              aria-label="Toggle menu"
            >
              {/* Add menu toggle logic here */}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: 'auto' }}
        exit={{ opacity: 0, height: 0 }}
        className="md:hidden bg-dark-light border-t border-primary/10"
      >
        <div className="container-custom py-4 space-y-4">
          {/* Add mobile menu links here */}
        </div>
      </motion.div>
    </motion.nav>
  );
};

export default Navbar; 