import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ref, onValue } from '@firebase/database';
import { database } from '../../firebase/config';
import AnimatedSection from '../common/AnimatedSection';

interface ContactLink {
  type: 'messenger' | 'instagram' | 'email' | 'telegram';
  link: string;
  message: string;
  icon?: string;
}

interface ContactDetails {
  email?: string;
  phone?: string;
  location?: string;
}

const Contact: React.FC = () => {
  const [content, setContent] = useState<{
    title?: string;
    description?: string;
    contact?: ContactDetails;
    links?: ContactLink[];
  }>({});

  useEffect(() => {
    const contentRef = ref(database, 'content/contact');
    const unsubscribe = onValue(contentRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setContent(data);
      }
    });

    return () => unsubscribe();
  }, []);

  const getInitials = (type: string) => {
    switch (type) {
      case 'messenger':
        return 'M';
      case 'instagram':
        return 'I';
      case 'email':
        return 'E';
      case 'telegram':
        return 'T';
      default:
        return type.charAt(0).toUpperCase();
    }
  };

  const getMessengerLink = (username: string) => {
    // Remove any leading/trailing slashes and 'm.me/' if present
    const cleanUsername = username.replace(/^\/|^m\.me\/|\/$/g, '');
    return `https://www.messenger.com/t/${cleanUsername}`;
  };

  const getInstagramLink = (username: string) => {
    // Remove any leading/trailing slashes, @ symbol, and 'instagram.com/' if present
    const cleanUsername = username.replace(/^\/|^@|^instagram\.com\/|\/$/g, '');
    return `https://www.instagram.com/${cleanUsername}`;
  };

  const getTelegramLink = (username: string) => {
    // Remove any leading/trailing slashes, @ symbol, and 't.me/' if present
    const cleanUsername = username.replace(/^\/|^@|^t\.me\/|\/$/g, '');
    return `https://t.me/${cleanUsername}`;
  };

  const getSocialLink = (type: string, link: string) => {
    switch (type) {
      case 'messenger':
        return getMessengerLink(link);
      case 'instagram':
        return getInstagramLink(link);
      case 'telegram':
        return getTelegramLink(link);
      default:
        return link;
    }
  };

  return (
    <section id="contact" className="py-20 bg-dark">
      <div className="container-custom">
        <AnimatedSection className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4 text-primary">{content.title || 'Get in Touch'}</h2>
          <p className="text-white max-w-2xl mx-auto">
            {content.description || 'Feel free to reach out to me through any of these platforms.'}
          </p>
        </AnimatedSection>

        <div className="max-w-4xl mx-auto space-y-12">
          {content.contact && (
            <AnimatedSection delay={0.2} className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {content.contact.email && (
                <motion.div 
                  whileHover={{ scale: 1.05 }}
                  className="bg-dark-light p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow"
                >
                  <h3 className="text-lg font-semibold mb-2 text-primary">Email</h3>
                  <a href={`mailto:${content.contact.email}`} className="text-white hover:text-primary">
                    {content.contact.email}
                  </a>
                </motion.div>
              )}
              {content.contact.phone && (
                <motion.div 
                  whileHover={{ scale: 1.05 }}
                  className="bg-dark-light p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow"
                >
                  <h3 className="text-lg font-semibold mb-2 text-primary">Phone</h3>
                  <a href={`tel:${content.contact.phone}`} className="text-white hover:text-primary">
                    {content.contact.phone}
                  </a>
                </motion.div>
              )}
              {content.contact.location && (
                <motion.div 
                  whileHover={{ scale: 1.05 }}
                  className="bg-dark-light p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow"
                >
                  <h3 className="text-lg font-semibold mb-2 text-primary">Location</h3>
                  <p className="text-white">{content.contact.location}</p>
                </motion.div>
              )}
            </AnimatedSection>
          )}

          {content.links && content.links.length > 0 && (
            <AnimatedSection delay={0.4}>
              <h3 className="text-2xl font-semibold text-center mb-6 text-primary">Connect with Me</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {content.links.map((link, index) => (
                  <motion.a
                    key={index}
                    href={getSocialLink(link.type, link.link)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-3 p-4 bg-dark-light rounded-lg shadow-md hover:shadow-lg transition-shadow"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <div className="text-primary">
                      {link.icon ? (
                        <img 
                          src={link.icon} 
                          alt={link.type} 
                          className="w-6 h-6 object-contain"
                        />
                      ) : (
                        <div className="w-6 h-6 flex items-center justify-center bg-primary text-white rounded-full text-sm font-medium">
                          {getInitials(link.type)}
                        </div>
                      )}
                    </div>
                    <span className="text-white">
                      {link.message}
                    </span>
                  </motion.a>
                ))}
              </div>
            </AnimatedSection>
          )}
        </div>
      </div>
    </section>
  );
};

export default Contact; 