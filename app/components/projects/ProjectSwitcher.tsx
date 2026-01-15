/**
 * ProjectSwitcher Component
 * Allows users to switch between projects
 */

import { useStore } from '@nanostores/react';
import { useState } from 'react';
import { projectsStore, setActiveProject, addProject } from '~/lib/stores/projects';
import styles from './ProjectSwitcher.module.css';

export function ProjectSwitcher() {
    const { projects, activeProjectId } = useStore(projectsStore);
    const [isOpen, setIsOpen] = useState(false);
    const [showNewProject, setShowNewProject] = useState(false);

    const activeProject = projects.find((p) => p.id === activeProjectId);
    const activeProjects = projects.filter((p) => !p.archived);

    return (
        <div className={styles.container}>
            <button className={styles.trigger} onClick={() => setIsOpen(!isOpen)}>
                <span className={styles.projectName}>
                    {activeProject?.name || 'Select Project'}
                </span>
                <span className={styles.arrow}>▼</span>
            </button>

            {isOpen && (
                <div className={styles.dropdown}>
                    <div className={styles.projectList}>
                        {activeProjects.map((project) => (
                            <button
                                key={project.id}
                                className={`${styles.projectItem} ${project.id === activeProjectId ? styles.active : ''
                                    }`}
                                onClick={() => {
                                    setActiveProject(project.id);
                                    setIsOpen(false);
                                }}
                            >
                                <div className={styles.projectInfo}>
                                    <span className={styles.projectTitle}>{project.name}</span>
                                    {project.description && (
                                        <span className={styles.projectDesc}>{project.description}</span>
                                    )}
                                </div>
                                {project.id === activeProjectId && (
                                    <span className={styles.checkmark}>✓</span>
                                )}
                            </button>
                        ))}
                    </div>

                    <div className={styles.divider} />

                    <button
                        className={styles.newProject}
                        onClick={() => {
                            setShowNewProject(true);
                            setIsOpen(false);
                        }}
                    >
                        + New Project
                    </button>
                </div>
            )}

            {showNewProject && (
                <NewProjectDialog onClose={() => setShowNewProject(false)} />
            )}
        </div>
    );
}

function NewProjectDialog({ onClose }: { onClose: () => void }) {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');

    const handleCreate = () => {
        if (!name.trim()) return;

        const newProject = {
            id: `project_${Date.now()}`,
            name: name.trim(),
            description: description.trim(),
            northId: null,
            createdAt: new Date().toISOString(),
            lastActive: new Date().toISOString(),
            archived: false,
        };

        addProject(newProject);
        setActiveProject(newProject.id);
        onClose();
    };

    return (
        <div className={styles.dialog}>
            <div className={styles.dialogContent}>
                <h3>New Project</h3>
                <input
                    type="text"
                    placeholder="Project name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className={styles.input}
                    autoFocus
                />
                <textarea
                    placeholder="Description (optional)"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className={styles.textarea}
                />
                <div className={styles.dialogButtons}>
                    <button onClick={onClose} className={styles.cancelButton}>
                        Cancel
                    </button>
                    <button onClick={handleCreate} className={styles.createButton}>
                        Create
                    </button>
                </div>
            </div>
        </div>
    );
}
