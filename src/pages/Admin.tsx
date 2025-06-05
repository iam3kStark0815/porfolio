import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { auth, database, storage } from '../firebase/config';
import { ref, set, get, onValue, DatabaseReference, DataSnapshot } from '@firebase/database';
import { ref as storageRef, uploadBytes, getDownloadURL, StorageReference } from '@firebase/storage';
import { initializeDatabase } from '../scripts/initializeDatabase';
import RichTextEditor from '../components/common/RichTextEditor';
import { toast } from 'react-hot-toast';
import { User } from '@firebase/auth';

interface Section {
  id: string;
  name: string;
  enabled: boolean;
}

interface Skill {
  name: string;
  level: number;
  icon?: string;
}

interface Project {
  title: string;
  description: string;
  image: string | string[];
  video?: string;
  technologies: string[];
  liveUrl?: string;
  githubUrl?: string;
}

interface Experience {
  title: string;
  company: string;
  location: string;
  period: string;
  description: string[];
  technologies: string[];
}

interface ContactInfo {
  type: string;
  value: string;
  icon?: string;
}

interface ContactLink {
  type: 'messenger' | 'instagram' | 'telegram' | 'email';
  link: string;
  message: string;
  icon?: string;
}

interface ContactDetails {
  email?: string;
  phone?: string;
  location?: string;
}

interface Category {
  name: string;
  skills: Skill[];
}

interface Content {
  title?: string;
  subtitle?: string;
  description?: string;
  image?: string;
  details?: string[];
  categories?: Category[];
  projects?: Project[];
  experiences?: Experience[];
  contactInfo?: ContactInfo[];
  links?: ContactLink[];
  contact?: ContactDetails;
}

const Admin: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sections, setSections] = useState<Section[]>([]);
  const [selectedSection, setSelectedSection] = useState<string>('');
  const [content, setContent] = useState<Content>({});
  const [uploadingImage, setUploadingImage] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<{ type: 'success' | 'error' | null; message: string }>({
    type: null,
    message: ''
  });
  const [projects, setProjects] = useState<Project[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [projectsContent, setProjectsContent] = useState({
    title: '',
    description: '',
    projects: [] as Project[]
  });
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user: User | null) => {
      if (user) {
        setIsAuthenticated(true);
        loadSections();
      } else {
        navigate('/login');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (selectedSection === 'projects') {
      setLoadingProjects(true);
      const projectsRef = ref(database, 'content/projects');
      const unsubscribe = onValue(projectsRef, (snapshot: DataSnapshot) => {
        const data = snapshot.val();
        if (data) {
          setProjectsContent({
            title: data.title || '',
            description: data.description || '',
            projects: Array.isArray(data.projects) ? data.projects : Object.values(data.projects || {})
          });
        } else {
          setProjectsContent({
            title: '',
            description: '',
            projects: []
          });
        }
        setLoadingProjects(false);
      });
      return () => unsubscribe();
    }
  }, [selectedSection]);

  const loadSections = async () => {
    const sectionsRef = ref(database, 'sections');
    const unsubscribe = onValue(sectionsRef, (snapshot: DataSnapshot) => {
      const data = snapshot.val();
      if (data) {
        const sectionsList = Object.entries(data).map(([id, section]: [string, any]) => ({
          id,
          name: section.name,
          enabled: section.enabled
        }));
        setSections(sectionsList);
      }
    });

    return () => unsubscribe();
  };

  const toggleSection = async (sectionId: string, enabled: boolean) => {
    const sectionRef = ref(database, `sections/${sectionId}`);
    await set(sectionRef, {
      ...sections.find(s => s.id === sectionId),
      enabled
    });
  };

  const handleImageUpload = async (file: File, path: string) => {
    try {
      setUploadingImage(true);
      const imageRef = storageRef(storage, path);
      await uploadBytes(imageRef, file);
      const url = await getDownloadURL(imageRef);
      return url;
    } catch (error) {
      console.error('Error uploading image:', error);
      throw error;
    } finally {
      setUploadingImage(false);
    }
  };

  const updateContent = async (sectionId: string, newContent: Content) => {
    try {
      setSaving(true);
      setSaveStatus({ type: null, message: '' });

      if (!sectionId) {
        throw new Error('No section selected');
      }

      if (sectionId === 'projects') {
        const contentToSave = {
          ...projectsContent,
          projects: projectsContent.projects.map(project => ({
            ...project,
            description: project.description || ''
          }))
        };
        const contentRef = ref(database, `content/${sectionId}`);
        await set(contentRef, contentToSave);
        setSaveStatus({
          type: 'success',
          message: 'Projects saved successfully!'
        });
      } else {
        const contentToSave = { ...newContent };
        Object.keys(contentToSave).forEach(key => {
          if (contentToSave[key as keyof Content] === undefined || contentToSave[key as keyof Content] === null) {
            delete contentToSave[key as keyof Content];
          }
        });
        const contentRef = ref(database, `content/${sectionId}`);
        await set(contentRef, contentToSave);
        setSaveStatus({
          type: 'success',
          message: 'Changes saved successfully!'
        });
      }

      setTimeout(() => {
        setSaveStatus({ type: null, message: '' });
      }, 3000);
    } catch (error) {
      console.error('Error saving content:', error);
      setSaveStatus({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to save changes'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSectionSelect = async (sectionId: string) => {
    setSelectedSection(sectionId);
    const contentRef = ref(database, `content/${sectionId}`);
    const unsubscribe = onValue(contentRef, (snapshot: DataSnapshot) => {
      if (snapshot.exists()) {
        setContent(snapshot.val());
      } else {
        setContent({});
      }
    });
    return () => unsubscribe();
  };

  const handleContentChange = (field: string, value: any) => {
    setContent((prev: Content) => ({
      ...prev,
      [field]: value
    }));
  };

  const handleArrayItemChange = (field: keyof Content, index: number, value: any, subField?: string) => {
    setContent(prev => {
      const newArray = [...(prev[field] as any[] || [])];
      if (subField) {
        newArray[index] = { ...newArray[index], [subField]: value };
      } else {
        newArray[index] = value;
      }
      return { ...prev, [field]: newArray };
    });
  };

  const handleAddArrayItem = (field: keyof Content) => {
    if (field === 'categories') {
      const newCategory: Category = {
        name: '',
        skills: []
      };
      setContent(prev => ({
        ...prev,
        [field]: [...(prev[field] as any[] || []), newCategory]
      }));
    } else if (field === 'links') {
      const newLink = {
        type: 'messenger',
        link: '',
        message: '',
        icon: ''
      };
      setContent(prev => ({
        ...prev,
        [field]: [...(prev[field] as any[] || []), newLink]
      }));
    } else {
      setContent(prev => ({
        ...prev,
        [field]: [...(prev[field] as any[] || []), '']
      }));
    }
  };

  const handleRemoveArrayItem = (field: string, index: number) => {
    setContent((prev: Content) => ({
      ...prev,
      [field]: (prev[field as keyof Content] as any[] || []).filter((_: any, i: number) => i !== index)
    }));
  };

  const handleContactLinkChange = (index: number, field: keyof ContactLink, value: string) => {
    setContent((prev: Content) => {
      const links = [...(prev.links || [])];
      links[index] = {
        ...links[index],
        [field]: value
      };
      return { ...prev, links };
    });
  };

  const handleAddContactLink = () => {
    setContent((prev: Content) => ({
      ...prev,
      links: [...(prev.links || []), { type: 'messenger', link: '', message: '' }]
    }));
  };

  const handleRemoveContactLink = (index: number) => {
    setContent((prev: Content) => ({
      ...prev,
      links: (prev.links || []).filter((_, i) => i !== index)
    }));
  };

  const handleInitializeDatabase = async () => {
    try {
      await initializeDatabase();
      loadSections();
    } catch (error) {
      console.error('Error initializing database:', error);
    }
  };

  const handleIconUpload = async (index: number, file: File) => {
    if (!file) return;

    try {
      setUploadingImage(true);
      const iconRef = storageRef(storage, `contact-icons/${file.name}`);
      const snapshot = await uploadBytes(iconRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      setContent(prev => {
        const newLinks = [...(prev.links || [])];
        newLinks[index] = { ...newLinks[index], icon: downloadURL };
        return { ...prev, links: newLinks };
      });
    } catch (error) {
      console.error('Error uploading icon:', error);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleAddProject = () => {
    setProjects([...projects, {
      title: '',
      description: '',
      image: '',
      technologies: [],
      liveUrl: '',
      githubUrl: ''
    }]);
  };

  const handleRemoveProject = (index: number) => {
    setProjects(projects.filter((_, i) => i !== index));
  };

  const handleProjectChange = (index: number, field: keyof Project, value: string | string[]) => {
    const newProjects = [...projects];
    newProjects[index] = {
      ...newProjects[index],
      [field]: value
    };
    setProjects(newProjects);
  };

  const handleAddTechnology = (projectIndex: number) => {
    const newProjects = [...projects];
    newProjects[projectIndex].technologies = [...newProjects[projectIndex].technologies, ''];
    setProjects(newProjects);
  };

  const handleRemoveTechnology = (projectIndex: number, techIndex: number) => {
    const newProjects = [...projects];
    newProjects[projectIndex].technologies = newProjects[projectIndex].technologies.filter((_, i) => i !== techIndex);
    setProjects(newProjects);
  };

  const handleTechnologyChange = (projectIndex: number, techIndex: number, value: string) => {
    const newProjects = [...projects];
    newProjects[projectIndex].technologies[techIndex] = value;
    setProjects(newProjects);
  };

  const handleProjectImageUpload = async (index: number, file: File) => {
    if (!file) return;

    try {
      setUploadingImage(true);
      const imageRef = storageRef(storage, `project-images/${file.name}`);
      const snapshot = await uploadBytes(imageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      const newProjects = [...projectsContent.projects];
      newProjects[index] = { ...newProjects[index], image: downloadURL };
      setProjectsContent(prev => ({ ...prev, projects: newProjects }));
    } catch (error) {
      console.error('Error uploading project image:', error);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleVideoUpload = async (projectIndex: number, file: File) => {
    try {
      const videoStorageRef = storageRef(storage, `videos/${Date.now()}_${file.name}`);
      const uploadResult = await uploadBytes(videoStorageRef, file);
      const videoUrl = await getDownloadURL(uploadResult.ref);

      // Update local state first
      const newProjects = [...projectsContent.projects];
      newProjects[projectIndex] = {
        ...newProjects[projectIndex],
        video: videoUrl
      };
      setProjectsContent(prev => ({ ...prev, projects: newProjects }));

      // Then update database
      const projectsRef = ref(database, 'content/projects');
      await set(projectsRef, {
        ...projectsContent,
        projects: newProjects
      });

      toast.success('Video uploaded successfully!');
    } catch (error) {
      console.error('Error uploading video:', error);
      toast.error('Failed to upload video');
    }
  };

  const handleDeleteVideo = (index: number) => {
    const newProjects = [...projectsContent.projects];
    newProjects[index] = {
      ...newProjects[index],
      video: undefined
    };
    setProjectsContent(prev => ({ ...prev, projects: newProjects }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="container-custom py-12"
    >
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <button
          onClick={handleInitializeDatabase}
          className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
        >
          Initialize Database
        </button>
      </div>
      
      {/* Sections Management */}
      <div className="bg-white dark:bg-dark p-6 rounded-lg shadow-md mb-8">
        <h2 className="text-xl font-semibold mb-4">Manage Sections</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sections.map((section) => (
            <div key={section.id} className="flex items-center justify-between p-4 border rounded-lg">
              <span>{section.name}</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={section.enabled}
                  onChange={(e) => toggleSection(section.id, e.target.checked)}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* Content Management */}
      <div className="bg-white dark:bg-dark p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">Edit Content</h2>
        <select
          className="w-full p-2 mb-4 border rounded-lg"
          value={selectedSection}
          onChange={(e) => handleSectionSelect(e.target.value)}
        >
          <option value="">Select a section</option>
          {sections.map((section) => (
            <option key={section.id} value={section.id}>
              {section.name}
            </option>
          ))}
        </select>

        {selectedSection && (
          <div className="space-y-6">
            {selectedSection === 'projects' ? (
              <div className="bg-white dark:bg-dark-light rounded-lg shadow-lg p-6 mb-8">
                <h3 className="text-xl font-bold mb-4">Projects Section</h3>
                {loadingProjects ? (
                  <div className="flex justify-center items-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
                  </div>
                ) : (
                  <div className="space-y-8">
                    {/* Section Title and Description */}
                    <div className="space-y-6">
                      <div>
                        <label className="block text-sm font-medium mb-2">Section Title</label>
                        <input
                          type="text"
                          value={projectsContent.title}
                          onChange={(e) => setProjectsContent(prev => ({ ...prev, title: e.target.value }))}
                          className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-dark focus:ring-2 focus:ring-primary focus:border-transparent"
                          placeholder="e.g., My Projects"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Section Description</label>
                        <textarea
                          value={projectsContent.description}
                          onChange={(e) => setProjectsContent(prev => ({ ...prev, description: e.target.value }))}
                          className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-dark focus:ring-2 focus:ring-primary focus:border-transparent"
                          rows={4}
                          placeholder="A brief description of your projects section"
                        />
                        <p className="text-sm text-gray-500 mt-2">
                          You can use HTML tags for formatting. Example: &lt;p&gt;Your description here&lt;/p&gt;
                        </p>
                      </div>
                    </div>

                    {/* Projects List */}
                    <div className="space-y-6">
                      <h4 className="text-lg font-semibold">Projects</h4>
                      {projectsContent.projects.map((project, index) => (
                        <div key={index} className="p-6 border border-gray-200 dark:border-gray-700 rounded-lg space-y-6 bg-gray-50 dark:bg-dark-light">
                          <div className="flex justify-between items-center">
                            <h5 className="text-lg font-semibold">Project {index + 1}</h5>
                            <button
                              onClick={() => {
                                const newProjects = [...projectsContent.projects];
                                newProjects.splice(index, 1);
                                setProjectsContent(prev => ({ ...prev, projects: newProjects }));
                              }}
                              className="text-red-500 hover:text-red-700 font-medium"
                            >
                              Remove
                            </button>
                          </div>
                          <div className="space-y-6">
                            <div>
                              <label className="block text-sm font-medium mb-2">Title</label>
                              <input
                                type="text"
                                value={project.title}
                                onChange={(e) => {
                                  const newProjects = [...projectsContent.projects];
                                  newProjects[index] = { ...project, title: e.target.value };
                                  setProjectsContent(prev => ({ ...prev, projects: newProjects }));
                                }}
                                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-dark focus:ring-2 focus:ring-primary focus:border-transparent"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium mb-2">Description</label>
                              <div className="space-y-2">
                                <textarea
                                  value={project.description || ''}
                                  onChange={(e) => {
                                    const newProjects = [...projectsContent.projects];
                                    newProjects[index] = { ...project, description: e.target.value };
                                    setProjectsContent(prev => ({ ...prev, projects: newProjects }));
                                  }}
                                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-dark focus:ring-2 focus:ring-primary focus:border-transparent"
                                  rows={8}
                                  placeholder="Enter project description..."
                                />
                                <p className="text-sm text-gray-500">
                                  For hyperlinks, use this format: &lt;a href="URL" target="_blank" rel="noopener noreferrer"&gt;Link Text&lt;/a&gt;
                                </p>
                              </div>
                            </div>
                            <div>
                              <label className="block text-sm font-medium mb-2">Project Images</label>
                              <div className="space-y-4">
                                {Array.isArray(project.image) ? project.image.map((img, imgIndex) => (
                                  <div key={imgIndex} className="relative">
                                    <div className="relative w-48 h-32 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                                      <img
                                        src={img}
                                        alt={`Project preview ${imgIndex + 1}`}
                                        className="w-full h-full object-cover"
                                      />
                                      <button
                                        onClick={() => {
                                          const newProjects = [...projectsContent.projects];
                                          const currentImages = (Array.isArray(newProjects[index].image) 
                                            ? newProjects[index].image 
                                            : [newProjects[index].image as string]) as string[];
                                          const filteredImages = currentImages.filter((_: string, i: number) => i !== imgIndex);
                                          newProjects[index].image = filteredImages.length === 1 ? filteredImages[0] : filteredImages;
                                          setProjectsContent(prev => ({ ...prev, projects: newProjects }));
                                        }}
                                        className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 transition-colors"
                                        aria-label="Remove image"
                                      >
                                        ×
                                      </button>
                                    </div>
                                  </div>
                                )) : project.image && (
                                  <div className="relative w-48 h-32 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                                    <img
                                      src={project.image}
                                      alt="Project preview"
                                      className="w-full h-full object-cover"
                                    />
                                  </div>
                                )}
                                <div className="flex items-center gap-4">
                                  <div className="flex-1">
                                    <input
                                      type="file"
                                      accept="image/*"
                                      onChange={async (e) => {
                                        const file = e.target.files?.[0];
                                        if (file) {
                                          try {
                                            setUploadingImage(true);
                                            const imageRef = storageRef(storage, `project-images/${file.name}`);
                                            const snapshot = await uploadBytes(imageRef, file);
                                            const downloadURL = await getDownloadURL(snapshot.ref);
                                            
                                            const newProjects = [...projectsContent.projects];
                                            const currentImages = (Array.isArray(newProjects[index].image) 
                                              ? newProjects[index].image 
                                              : [newProjects[index].image as string]) as string[];
                                            const updatedImages = currentImages.concat(downloadURL);
                                            newProjects[index].image = updatedImages;
                                            setProjectsContent(prev => ({ ...prev, projects: newProjects }));
                                          } catch (error) {
                                            console.error('Error uploading image:', error);
                                          } finally {
                                            setUploadingImage(false);
                                          }
                                        }
                                      }}
                                      className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-dark focus:ring-2 focus:ring-primary focus:border-transparent"
                                      disabled={uploadingImage}
                                    />
                                  </div>
                                  {uploadingImage && (
                                    <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary"></div>
                                  )}
                                </div>
                                <p className="text-sm text-gray-500">
                                  You can upload multiple images. They will be displayed in a carousel on the project page.
                                </p>
                              </div>
                            </div>
                            <div>
                              <label className="block text-sm font-medium mb-2">Video</label>
                              <div className="mt-4">
                                {project.video ? (
                                  <div className="relative">
                                    <video
                                      src={project.video}
                                      controls
                                      className="w-full max-w-md rounded-lg"
                                      poster={Array.isArray(project.image) ? project.image[0] : project.image}
                                    />
                                    <button
                                      onClick={() => handleDeleteVideo(index)}
                                      className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 transition-colors"
                                    >
                                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                      </svg>
                                    </button>
                                  </div>
                                ) : (
                                  <div className="flex items-center space-x-4">
                                    <input
                                      type="file"
                                      accept="video/*"
                                      onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) {
                                          handleVideoUpload(index, file);
                                        }
                                      }}
                                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                                    />
                                  </div>
                                )}
                              </div>
                            </div>
                            <div>
                              <label className="block text-sm font-medium mb-2">Technologies</label>
                              <div className="space-y-4">
                                {project.technologies?.map((tech, techIndex) => (
                                  <div key={techIndex} className="flex gap-4">
                                    <input
                                      type="text"
                                      value={tech}
                                      onChange={(e) => {
                                        const newProjects = [...projectsContent.projects];
                                        newProjects[index].technologies[techIndex] = e.target.value;
                                        setProjectsContent(prev => ({ ...prev, projects: newProjects }));
                                      }}
                                      className="flex-1 p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-dark focus:ring-2 focus:ring-primary focus:border-transparent"
                                    />
                                    <button
                                      onClick={() => {
                                        const newProjects = [...projectsContent.projects];
                                        newProjects[index].technologies.splice(techIndex, 1);
                                        setProjectsContent(prev => ({ ...prev, projects: newProjects }));
                                      }}
                                      className="px-4 py-2 text-red-500 hover:text-red-700 font-medium"
                                    >
                                      Remove
                                    </button>
                                  </div>
                                ))}
                                <button
                                  onClick={() => {
                                    const newProjects = [...projectsContent.projects];
                                    newProjects[index].technologies = [...(newProjects[index].technologies || []), ''];
                                    setProjectsContent(prev => ({ ...prev, projects: newProjects }));
                                  }}
                                  className="text-primary hover:text-primary-dark font-medium"
                                >
                                  Add Technology
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                      <button
                        onClick={() => {
                          setProjectsContent(prev => ({
                            ...prev,
                            projects: [...prev.projects, {
                              title: '',
                              description: '',
                              image: '',
                              technologies: []
                            }]
                          }));
                        }}
                        className="w-full py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors font-medium"
                      >
                        Add Project
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : selectedSection === 'about' ? (
              <div className="bg-white dark:bg-dark-light rounded-lg shadow-lg p-6 mb-8">
                <h3 className="text-xl font-bold mb-4">About Section</h3>
                <div className="space-y-8">
                  {/* Section Title and Description */}
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium mb-2">Title</label>
                      <input
                        type="text"
                        value={content.title || ''}
                        onChange={(e) => handleContentChange('title', e.target.value)}
                        className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-dark focus:ring-2 focus:ring-primary focus:border-transparent"
                        placeholder="e.g., About Me"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Description</label>
                      <RichTextEditor
                        content={content.description || ''}
                        onChange={(content) => handleContentChange('description', content)}
                        placeholder="Write about yourself..."
                      />
                    </div>
                  </div>

                  {/* About Image */}
                  <div>
                    <label className="block text-sm font-medium mb-2">About Image</label>
                    <div className="space-y-4">
                      {content.image && (
                        <div className="relative w-48 h-48 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                          <img
                            src={content.image}
                            alt="About preview"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <div className="flex items-center gap-4">
                        <div className="flex-1">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                try {
                                  const url = await handleImageUpload(file, `images/${selectedSection}/${file.name}`);
                                  handleContentChange('image', url);
                                } catch (error) {
                                  console.error('Error uploading image:', error);
                                }
                              }
                            }}
                            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-dark focus:ring-2 focus:ring-primary focus:border-transparent"
                            disabled={uploadingImage}
                          />
                        </div>
                        {uploadingImage && (
                          <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary"></div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : selectedSection === 'skills' ? (
              <div className="bg-white dark:bg-dark-light rounded-lg shadow-lg p-6 mb-8">
                <h3 className="text-xl font-bold mb-4">Skills Section</h3>
                <div className="space-y-8">
                  {/* Section Title and Description */}
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium mb-2">Title</label>
                      <input
                        type="text"
                        value={content.title || ''}
                        onChange={(e) => handleContentChange('title', e.target.value)}
                        className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-dark focus:ring-2 focus:ring-primary focus:border-transparent"
                        placeholder="e.g., My Skills"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Description</label>
                      <RichTextEditor
                        content={content.description || ''}
                        onChange={(content) => handleContentChange('description', content)}
                        placeholder="Write a brief introduction about your skills..."
                      />
                    </div>
                  </div>

                  {/* Categories and Skills */}
                  <div className="space-y-8">
                    <div className="flex justify-between items-center">
                      <h4 className="text-lg font-semibold">Categories & Skills</h4>
                      <button
                        onClick={() => handleAddArrayItem('categories')}
                        className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
                      >
                        Add Category
                      </button>
                    </div>
                    {content.categories?.map((category: Category, categoryIndex: number) => (
                      <div key={categoryIndex} className="p-6 border border-gray-200 dark:border-gray-700 rounded-lg space-y-6 bg-gray-50 dark:bg-dark-light">
                        <div className="flex justify-between items-center">
                          <div className="flex-1">
                            <input
                              type="text"
                              value={category.name || ''}
                              onChange={(e) => handleArrayItemChange('categories', categoryIndex, { ...category, name: e.target.value })}
                              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-dark focus:ring-2 focus:ring-primary focus:border-transparent"
                              placeholder="Category name (e.g., Frontend)"
                            />
                          </div>
                          <button
                            onClick={() => handleRemoveArrayItem('categories', categoryIndex)}
                            className="ml-4 text-red-500 hover:text-red-700 font-medium"
                          >
                            Remove Category
                          </button>
                        </div>

                        <div className="space-y-4">
                          <div className="flex justify-between items-center">
                            <h5 className="text-lg font-semibold">Skills</h5>
                            <button
                              onClick={() => {
                                const newCategories = [...(content.categories || [])];
                                if (!newCategories[categoryIndex].skills) {
                                  newCategories[categoryIndex].skills = [];
                                }
                                newCategories[categoryIndex].skills.push({ name: '', level: 0 });
                                setContent(prev => ({ ...prev, categories: newCategories }));
                              }}
                              className="text-primary hover:text-primary-dark font-medium"
                            >
                              Add Skill
                            </button>
                          </div>
                          {category.skills?.map((skill: Skill, skillIndex: number) => (
                            <div key={skillIndex} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-dark space-y-4">
                              <div className="flex justify-between items-center">
                                <h6 className="text-md font-medium">Skill {skillIndex + 1}</h6>
                                <button
                                  onClick={() => {
                                    const newCategories = [...(content.categories || [])];
                                    if (newCategories[categoryIndex]?.skills) {
                                      newCategories[categoryIndex].skills.splice(skillIndex, 1);
                                      setContent(prev => ({ ...prev, categories: newCategories }));
                                    }
                                  }}
                                  className="text-red-500 hover:text-red-700 font-medium"
                                >
                                  Remove
                                </button>
                              </div>
                              <div className="space-y-4">
                                <div>
                                  <label className="block text-sm font-medium mb-2">Name</label>
                                  <input
                                    type="text"
                                    value={skill.name || ''}
                                    onChange={(e) => {
                                      const newCategories = [...(content.categories || [])];
                                      if (newCategories[categoryIndex]?.skills) {
                                        newCategories[categoryIndex].skills[skillIndex] = {
                                          ...skill,
                                          name: e.target.value
                                        };
                                        setContent(prev => ({ ...prev, categories: newCategories }));
                                      }
                                    }}
                                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-dark focus:ring-2 focus:ring-primary focus:border-transparent"
                                    placeholder="e.g., React"
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-medium mb-2">Proficiency Level (0-100)</label>
                                  <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    value={skill.level || 0}
                                    onChange={(e) => {
                                      const newCategories = [...(content.categories || [])];
                                      if (newCategories[categoryIndex]?.skills) {
                                        const updatedSkill = {
                                          ...skill,
                                          level: parseInt(e.target.value)
                                        };
                                        newCategories[categoryIndex].skills[skillIndex] = updatedSkill;
                                        setContent(prev => ({ ...prev, categories: newCategories }));
                                      }
                                    }}
                                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-dark focus:ring-2 focus:ring-primary focus:border-transparent"
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-medium mb-2">Icon (Optional)</label>
                                  <div className="space-y-4">
                                    {skill.icon && (
                                      <div className="relative w-12 h-12 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                                        <img
                                          src={skill.icon}
                                          alt="Skill icon"
                                          className="w-full h-full object-contain"
                                        />
                                      </div>
                                    )}
                                    <div className="flex items-center gap-4">
                                      <div className="flex-1">
                                        <input
                                          type="file"
                                          accept="image/*"
                                          onChange={async (e) => {
                                            const file = e.target.files?.[0];
                                            if (file) {
                                              try {
                                                const url = await handleImageUpload(file, `skill-icons/${file.name}`);
                                                const newCategories = [...(content.categories || [])];
                                                if (newCategories[categoryIndex]?.skills) {
                                                  newCategories[categoryIndex].skills[skillIndex] = {
                                                    ...skill,
                                                    icon: url
                                                  };
                                                  setContent(prev => ({ ...prev, categories: newCategories }));
                                                }
                                              } catch (error) {
                                                console.error('Error uploading icon:', error);
                                              }
                                            }
                                          }}
                                          className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-dark focus:ring-2 focus:ring-primary focus:border-transparent"
                                          disabled={uploadingImage}
                                        />
                                      </div>
                                      {uploadingImage && (
                                        <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary"></div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : selectedSection === 'contact' ? (
              <div className="bg-white dark:bg-dark-light rounded-lg shadow-lg p-6 mb-8">
                <h3 className="text-xl font-bold mb-4">Contact Section</h3>
                <div className="space-y-8">
                  {/* Section Title and Description */}
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium mb-2">Section Title</label>
                      <input
                        type="text"
                        value={content.title || ''}
                        onChange={(e) => handleContentChange('title', e.target.value)}
                        className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-dark focus:ring-2 focus:ring-primary focus:border-transparent"
                        placeholder="e.g., Get in Touch"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Section Description</label>
                      <textarea
                        value={content.description || ''}
                        onChange={(e) => handleContentChange('description', e.target.value)}
                        className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-dark focus:ring-2 focus:ring-primary focus:border-transparent"
                        rows={4}
                        placeholder="A brief description of your contact section"
                      />
                    </div>
                  </div>

                  {/* Contact Details */}
                  <div className="space-y-6">
                    <h4 className="text-lg font-semibold">Contact Details</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div>
                        <label className="block text-sm font-medium mb-2">Email</label>
                        <input
                          type="email"
                          value={content.contact?.email || ''}
                          onChange={(e) => handleContentChange('contact', { ...content.contact, email: e.target.value })}
                          className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-dark focus:ring-2 focus:ring-primary focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Phone</label>
                        <input
                          type="tel"
                          value={content.contact?.phone || ''}
                          onChange={(e) => handleContentChange('contact', { ...content.contact, phone: e.target.value })}
                          className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-dark focus:ring-2 focus:ring-primary focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Location</label>
                        <input
                          type="text"
                          value={content.contact?.location || ''}
                          onChange={(e) => handleContentChange('contact', { ...content.contact, location: e.target.value })}
                          className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-dark focus:ring-2 focus:ring-primary focus:border-transparent"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Social Media Links */}
                  <div className="space-y-6">
                    <div className="flex justify-between items-center">
                      <h4 className="text-lg font-semibold">Social Media Links</h4>
                      <button
                        onClick={() => handleAddArrayItem('links')}
                        className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
                      >
                        Add Link
                      </button>
                    </div>
                    {content.links?.map((link, index) => (
                      <div key={index} className="p-6 border border-gray-200 dark:border-gray-700 rounded-lg space-y-6 bg-gray-50 dark:bg-dark-light">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <label className="block text-sm font-medium mb-2">Type</label>
                            <select
                              value={link.type}
                              onChange={(e) => handleArrayItemChange('links', index, e.target.value, 'type')}
                              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-dark focus:ring-2 focus:ring-primary focus:border-transparent"
                            >
                              <option value="messenger">Messenger</option>
                              <option value="instagram">Instagram</option>
                              <option value="telegram">Telegram</option>
                              <option value="email">Email</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-2">Link</label>
                            <input
                              type="text"
                              value={link.link}
                              onChange={(e) => handleArrayItemChange('links', index, e.target.value, 'link')}
                              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-dark focus:ring-2 focus:ring-primary focus:border-transparent"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-2">Message</label>
                          <input
                            type="text"
                            value={link.message}
                            onChange={(e) => handleArrayItemChange('links', index, e.target.value, 'message')}
                            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-dark focus:ring-2 focus:ring-primary focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-2">Icon</label>
                          <div className="flex items-center gap-4">
                            {link.icon && (
                              <div className="w-12 h-12 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                                <img src={link.icon} alt="Icon preview" className="w-full h-full object-contain" />
                              </div>
                            )}
                            <div className="flex-1">
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => e.target.files?.[0] && handleIconUpload(index, e.target.files[0])}
                                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-dark focus:ring-2 focus:ring-primary focus:border-transparent"
                                disabled={uploadingImage}
                              />
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => handleRemoveArrayItem('links', index)}
                          className="text-red-500 hover:text-red-700 font-medium"
                        >
                          Remove Link
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : selectedSection === 'hero' ? (
              <div className="bg-white dark:bg-dark-light rounded-lg shadow-lg p-6 mb-8">
                <h3 className="text-xl font-bold mb-4">Hero Section</h3>
                <div className="space-y-8">
                  {/* Section Title and Description */}
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium mb-2">Title</label>
                      <input
                        type="text"
                        value={content.title || ''}
                        onChange={(e) => handleContentChange('title', e.target.value)}
                        className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-dark focus:ring-2 focus:ring-primary focus:border-transparent"
                        placeholder="e.g., Welcome to My Portfolio"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Subtitle</label>
                      <input
                        type="text"
                        value={content.subtitle || ''}
                        onChange={(e) => handleContentChange('subtitle', e.target.value)}
                        className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-dark focus:ring-2 focus:ring-primary focus:border-transparent"
                        placeholder="e.g., Full Stack Developer"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Description</label>
                      <RichTextEditor
                        content={content.description || ''}
                        onChange={(content) => handleContentChange('description', content)}
                        placeholder="A brief introduction about yourself"
                      />
                    </div>
                  </div>

                  {/* Hero Image */}
                  <div>
                    <label className="block text-sm font-medium mb-2">Hero Image</label>
                    <div className="space-y-4">
                      {content.image && (
                        <div className="relative w-48 h-48 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                          <img
                            src={content.image}
                            alt="Hero preview"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <div className="flex items-center gap-4">
                        <div className="flex-1">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                try {
                                  const url = await handleImageUpload(file, `images/${selectedSection}/${file.name}`);
                                  handleContentChange('image', url);
                                } catch (error) {
                                  console.error('Error uploading image:', error);
                                }
                              }
                            }}
                            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-dark focus:ring-2 focus:ring-primary focus:border-transparent"
                            disabled={uploadingImage}
                          />
                        </div>
                        {uploadingImage && (
                          <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary"></div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <>
                {/* Title */}
                <div>
                  <label className="block text-sm font-medium mb-2">Title</label>
                  <input
                    type="text"
                    value={content.title || ''}
                    onChange={(e) => handleContentChange('title', e.target.value)}
                    className="w-full p-2 border rounded-lg"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium mb-2">Description</label>
                  <textarea
                    value={content.description || ''}
                    onChange={(e) => handleContentChange('description', e.target.value)}
                    className="w-full p-2 border rounded-lg"
                    rows={3}
                  />
                </div>

                {/* Image Upload */}
                <div>
                  <label className="block text-sm font-medium mb-2">Image</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        try {
                          const url = await handleImageUpload(file, `images/${selectedSection}/${file.name}`);
                          handleContentChange('image', url);
                        } catch (error) {
                          console.error('Error uploading image:', error);
                        }
                      }
                    }}
                    className="w-full p-2 border rounded-lg"
                  />
                  {content.image && (
                    <img
                      src={content.image}
                      alt="Preview"
                      className="mt-2 w-32 h-32 object-cover rounded-lg"
                    />
                  )}
                </div>

                {/* Array Fields */}
                {['details', 'skills', 'experiences', 'contactInfo'].map((field) => (
                  <div key={field}>
                    <label className="block text-sm font-medium mb-2">
                      {field.charAt(0).toUpperCase() + field.slice(1)}
                    </label>
                    {(content[field as keyof Content] as any[] || []).map((item: any, index: number) => (
                      <div key={index} className="flex gap-2 mb-2">
                        <input
                          type="text"
                          value={typeof item === 'string' ? item : item.name || ''}
                          onChange={(e) => handleArrayItemChange(field as keyof Content, index, e.target.value)}
                          className="flex-1 p-2 border rounded-lg"
                        />
                        <button
                          onClick={() => handleRemoveArrayItem(field, index)}
                          className="px-3 py-2 bg-red-500 text-white rounded-lg"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={() => handleAddArrayItem(field as keyof Content)}
                      className="mt-2 px-4 py-2 bg-primary text-white rounded-lg"
                    >
                      Add {field.slice(0, -1)}
                    </button>
                  </div>
                ))}
              </>
            )}

            {/* Save Button and Status */}
            <div className="space-y-4">
              <button
                onClick={() => updateContent(selectedSection, content)}
                className="w-full px-4 py-2 bg-primary text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={uploadingImage || saving || loadingProjects}
              >
                {uploadingImage ? 'Uploading...' : saving ? 'Saving...' : 'Save Changes'}
              </button>

              {saveStatus.type && (
                <div
                  className={`p-4 rounded-lg ${
                    saveStatus.type === 'success'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-red-100 text-red-700'
                  }`}
                >
                  {saveStatus.message}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default Admin; 