import { ref, set } from '@firebase/database';
import { database } from '../firebase/config';

export const initializeDatabase = async () => {
  const sections = {
    hero: { name: 'Hero', enabled: true },
    about: { name: 'About', enabled: true },
    skills: { name: 'Skills', enabled: true },
    projects: { name: 'Projects', enabled: true },
    experience: { name: 'Experience', enabled: true },
    contact: { name: 'Contact', enabled: true }
  };

  const defaultContent = {
    hero: {
      title: 'Welcome to My Portfolio',
      description: 'I am a passionate developer creating amazing web experiences.',
      image: ''
    },
    about: {
      title: 'About Me',
      description: 'I am a dedicated developer with a passion for creating beautiful and functional web applications.',
      image: ''
    },
    skills: {
      title: 'My Skills',
      description: 'Here are some of the technologies I work with:',
      skills: [
        'JavaScript',
        'TypeScript',
        'React',
        'Node.js',
        'HTML/CSS',
        'Firebase'
      ]
    },
    projects: [
      {
        title: "Portfolio Website",
        description: "A modern, responsive portfolio website built with React and Firebase. Features a dynamic admin panel for content management and smooth animations.",
        image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
        technologies: ["React", "TypeScript", "Firebase", "Tailwind CSS"],
        liveUrl: "https://your-portfolio.com",
        githubUrl: "https://github.com/yourusername/portfolio"
      },
      {
        title: "E-commerce Platform",
        description: "A full-featured e-commerce platform with user authentication, product management, and secure payment processing.",
        image: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
        technologies: ["Node.js", "Express", "MongoDB", "Stripe"],
        liveUrl: "https://your-ecommerce.com",
        githubUrl: "https://github.com/yourusername/ecommerce"
      }
    ],
    experience: {
      title: 'Work Experience',
      description: 'My professional journey:',
      experience: [
        {
          title: 'Senior Developer',
          company: 'Tech Company',
          period: '2020 - Present',
          description: 'Leading development of web applications'
        }
      ]
    },
    contact: {
      title: 'Get in Touch',
      description: 'Feel free to reach out to me through any of these platforms.',
      contact: {
        email: 'your.email@example.com',
        phone: '+1234567890',
        location: 'Your Location'
      },
      links: [
        {
          type: 'messenger',
          link: 'https://m.me/yourusername',
          message: 'Message me on Messenger',
          icon: ''
        },
        {
          type: 'instagram',
          link: 'https://instagram.com/yourusername',
          message: 'Follow me on Instagram',
          icon: ''
        },
        {
          type: 'email',
          link: 'mailto:your.email@example.com',
          message: 'Send me an email',
          icon: ''
        }
      ]
    }
  };

  try {
    await set(ref(database, 'sections'), sections);
    await set(ref(database, 'content'), defaultContent);
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
  }
}; 