import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ref, onValue } from '@firebase/database';
import { database } from '../../firebase/config';
import AnimatedSection from '../common/AnimatedSection';

interface Project {
  title: string;
  description: string;
  image: string | string[];
  video?: string;
  technologies: string[];
  liveUrl?: string;
  githubUrl?: string;
}

interface ProjectsContent {
  title: string;
  description: string;
  projects: Project[];
}

const Projects: React.FC = () => {
  const [content, setContent] = useState<ProjectsContent>({
    title: '',
    description: '',
    projects: []
  });
  const [loading, setLoading] = useState(true);
  const [currentImageIndices, setCurrentImageIndices] = useState<{ [key: number]: number }>({});
  const [direction, setDirection] = useState<{ [key: number]: 'left' | 'right' }>({});
  const [touchStart, setTouchStart] = useState<{ [key: number]: number }>({});
  const [touchEnd, setTouchEnd] = useState<{ [key: number]: number }>({});
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  useEffect(() => {
    const projectsRef = ref(database, 'content/projects');
    const unsubscribe = onValue(projectsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setContent({
          title: data.title || 'My Projects',
          description: data.description || '',
          projects: Array.isArray(data.projects) ? data.projects : Object.values(data.projects || {})
        });
      } else {
        setContent({
          title: 'My Projects',
          description: '',
          projects: []
        });
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleNextImage = (projectIndex: number, totalImages: number) => {
    setDirection(prev => ({ ...prev, [projectIndex]: 'right' }));
    setCurrentImageIndices(prev => ({
      ...prev,
      [projectIndex]: ((prev[projectIndex] || 0) + 1) % totalImages
    }));
  };

  const handlePrevImage = (projectIndex: number, totalImages: number) => {
    setDirection(prev => ({ ...prev, [projectIndex]: 'left' }));
    setCurrentImageIndices(prev => ({
      ...prev,
      [projectIndex]: ((prev[projectIndex] || 0) - 1 + totalImages) % totalImages
    }));
  };

  const handleImageClick = (projectIndex: number, imageIndex: number) => {
    const currentIndex = currentImageIndices[projectIndex] || 0;
    setDirection(prev => ({ 
      ...prev, 
      [projectIndex]: imageIndex > currentIndex ? 'right' : 'left' 
    }));
    setCurrentImageIndices(prev => ({
      ...prev,
      [projectIndex]: imageIndex
    }));
  };

  const handleTouchStart = (index: number, e: React.TouchEvent) => {
    setTouchStart({ ...touchStart, [index]: e.touches[0].clientX });
  };

  const handleTouchMove = (index: number, e: React.TouchEvent) => {
    setTouchEnd({ ...touchEnd, [index]: e.touches[0].clientX });
  };

  const handleTouchEnd = (index: number, totalImages: number) => {
    if (!touchStart[index] || !touchEnd[index]) return;
    
    const distance = touchStart[index] - touchEnd[index];
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe) {
      handleNextImage(index, totalImages);
    }
    if (isRightSwipe) {
      handlePrevImage(index, totalImages);
    }
  };

  const getStackedImages = (images: string[], currentIndex: number) => {
    const totalImages = images.length;
    const stack = [];
    
    // Current image
    stack.push({
      index: currentIndex,
      style: {
        x: 0,
        y: 0,
        scale: 1,
        opacity: 1,
        zIndex: 3,
        filter: 'brightness(1)'
      }
    });

    // Next image
    if (totalImages > 1) {
      const nextIndex = (currentIndex + 1) % totalImages;
      stack.push({
        index: nextIndex,
        style: {
          x: 30,
          y: 15,
          scale: 0.95,
          opacity: 0.6,
          zIndex: 2,
          filter: 'brightness(0.7)'
        }
      });
    }

    // Third image
    if (totalImages > 2) {
      const thirdIndex = (currentIndex + 2) % totalImages;
      stack.push({
        index: thirdIndex,
        style: {
          x: 60,
          y: 30,
          scale: 0.9,
          opacity: 0.4,
          zIndex: 1,
          filter: 'brightness(0.5)'
        }
      });
    }

    return stack;
  };

  const handleVideoClick = (project: Project) => {
    setSelectedProject(project);
  };

  const handleCloseVideo = () => {
    setSelectedProject(null);
  };

  if (loading) {
    return (
      <section id="projects" className="py-20 bg-gray-50 dark:bg-dark">
        <div className="container-custom">
          <div className="flex justify-center items-center min-h-[200px]">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="projects" className="py-20 bg-dark">
      <div className="container-custom">
        <AnimatedSection>
          <h2 className="text-3xl font-bold text-center mb-4 text-primary">{content.title}</h2>
          {content.description && (
            <p className="text-white text-center max-w-2xl mx-auto mb-12">
              {content.description}
            </p>
          )}
        </AnimatedSection>

        <div className="space-y-20">
          {content.projects.map((project, index) => {
            const images = Array.isArray(project.image) ? project.image : [project.image];
            const currentImageIndex = currentImageIndices[index] || 0;
            const stackedImages = getStackedImages(images, currentImageIndex);
            const hasMultipleImages = images.length > 1;

            return (
              <AnimatedSection key={index} delay={index * 0.1}>
                <div className={`grid grid-cols-1 md:grid-cols-2 gap-12 items-center ${
                  index % 2 === 1 ? 'md:flex-row-reverse' : ''
                }`}>
                  <div className="relative aspect-video rounded-xl overflow-visible group">
                    {project.video ? (
                      <div className="absolute inset-0 bg-dark-light rounded-xl">
                        <video
                          src={project.video}
                          controls
                          className="w-full h-full object-contain rounded-xl"
                          poster={images[0]}
                        >
                          Your browser does not support the video tag.
                        </video>
                      </div>
                    ) : images.length > 0 ? (
                      <>
                        <div className="relative w-full h-full">
                          {hasMultipleImages ? (
                            <AnimatePresence mode="wait">
                              {stackedImages.map(({ index: imgIndex, style }) => (
                                <motion.div
                                  key={imgIndex}
                                  initial={direction[index] === 'right' ? { x: 0, scale: 1, opacity: 1 } : { x: -100, scale: 0.9, opacity: 0.4 }}
                                  animate={style}
                                  exit={direction[index] === 'right' ? { x: -100, scale: 0.9, opacity: 0.4 } : { x: 0, scale: 1, opacity: 1 }}
                                  transition={{
                                    type: "spring",
                                    stiffness: 200,
                                    damping: 25,
                                    mass: 1
                                  }}
                                  className="absolute inset-0 bg-dark-light rounded-xl"
                                  style={{
                                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)'
                                  }}
                                  onTouchStart={(e) => handleTouchStart(index, e)}
                                  onTouchMove={(e) => handleTouchMove(index, e)}
                                  onTouchEnd={() => handleTouchEnd(index, images.length)}
                                >
                                  <div className="w-full h-full flex items-center justify-center">
                                    <img
                                      src={images[imgIndex]}
                                      alt={`${project.title} - Image ${imgIndex + 1}`}
                                      className="max-w-full max-h-full object-contain rounded-xl"
                                    />
                                  </div>
                                </motion.div>
                              ))}
                            </AnimatePresence>
                          ) : (
                            <div 
                              className="absolute inset-0 bg-dark-light rounded-xl"
                              onTouchStart={(e) => handleTouchStart(index, e)}
                              onTouchMove={(e) => handleTouchMove(index, e)}
                              onTouchEnd={() => handleTouchEnd(index, images.length)}
                            >
                              <div className="w-full h-full flex items-center justify-center">
                                <img
                                  src={images[0]}
                                  alt={`${project.title}`}
                                  className="max-w-full max-h-full object-contain rounded-xl"
                                />
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Navigation Arrows */}
                        {hasMultipleImages && (
                          <>
                            <button
                              onClick={() => handlePrevImage(index, images.length)}
                              className="absolute -left-4 top-1/2 -translate-y-1/2 bg-dark-light/90 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 shadow-lg hover:bg-dark-light z-10"
                              aria-label="Previous image"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleNextImage(index, images.length)}
                              className="absolute -right-4 top-1/2 -translate-y-1/2 bg-dark-light/90 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 shadow-lg hover:bg-dark-light z-10"
                              aria-label="Next image"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                            </button>
                          </>
                        )}

                        {/* Navigation Dots */}
                        {hasMultipleImages && (
                          <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 flex gap-2 z-10">
                            {images.map((_, imgIndex) => (
                              <button
                                key={imgIndex}
                                onClick={() => handleImageClick(index, imgIndex)}
                                className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                                  currentImageIndex === imgIndex
                                    ? 'bg-primary scale-125'
                                    : 'bg-dark-light hover:bg-primary/50'
                                }`}
                                aria-label={`Go to image ${imgIndex + 1}`}
                              />
                            ))}
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="w-full h-full bg-dark-light flex items-center justify-center rounded-xl">
                        <span className="text-white">No image available</span>
                      </div>
                    )}
                  </div>
                  <div className="space-y-4">
                    <h3 className="text-2xl font-bold text-primary">{project.title}</h3>
                    <div 
                      className="text-white prose prose-invert max-w-none"
                      dangerouslySetInnerHTML={{ __html: project.description }}
                    />
                    <div className="flex flex-wrap gap-2">
                      {project.technologies?.map((tech, techIndex) => (
                        <span
                          key={techIndex}
                          className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm"
                        >
                          {tech}
                        </span>
                      ))}
                    </div>
                    <div className="flex gap-4 pt-4">
                      {project.liveUrl && (
                        <a
                          href={project.liveUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:text-primary-dark transition-colors"
                        >
                          Live Demo →
                        </a>
                      )}
                      {project.githubUrl && (
                        <a
                          href={project.githubUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:text-primary-dark transition-colors"
                        >
                          GitHub →
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </AnimatedSection>
            );
          })}
        </div>
      </div>

      {/* Video Modal */}
      {selectedProject && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-75"
          onClick={handleCloseVideo}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="relative w-full max-w-4xl aspect-video bg-dark-light rounded-lg overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={handleCloseVideo}
              className="absolute top-4 right-4 z-10 w-8 h-8 flex items-center justify-center bg-black bg-opacity-50 rounded-full text-white hover:bg-opacity-75 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <iframe
              src={selectedProject.video}
              title={selectedProject.title}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </motion.div>
        </motion.div>
      )}
    </section>
  );
};

export default Projects; 