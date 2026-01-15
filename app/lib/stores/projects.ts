/**
 * Projects Store
 * Multi-project support with nanostores
 */

import { map } from 'nanostores';

export interface Project {
    id: string;
    name: string;
    description: string;
    northId: string | null;
    createdAt: string;
    lastActive: string;
    archived: boolean;
}

export interface ProjectsState {
    projects: Project[];
    activeProjectId: string | null;
    loading: boolean;
}

export const projectsStore = map<ProjectsState>({
    projects: [],
    activeProjectId: null,
    loading: false,
});

/**
 * Actions
 */

export function setProjects(projects: Project[]) {
    projectsStore.setKey('projects', projects);
}

export function addProject(project: Project) {
    const current = projectsStore.get();
    projectsStore.setKey('projects', [...current.projects, project]);
}

export function updateProject(id: string, updates: Partial<Project>) {
    const current = projectsStore.get();
    const projects = current.projects.map((p) =>
        p.id === id ? { ...p, ...updates, lastActive: new Date().toISOString() } : p,
    );
    projectsStore.setKey('projects', projects);
}

export function deleteProject(id: string) {
    const current = projectsStore.get();
    projectsStore.setKey(
        'projects',
        current.projects.filter((p) => p.id !== id),
    );
}

export function setActiveProject(id: string | null) {
    projectsStore.setKey('activeProjectId', id);

    if (id) {
        // Update last active timestamp
        updateProject(id, {});
    }
}

export function archiveProject(id: string) {
    updateProject(id, { archived: true });
}

export function getActiveProject(): Project | null {
    const { projects, activeProjectId } = projectsStore.get();
    return projects.find((p) => p.id === activeProjectId) || null;
}

export function getProjects(includeArchived = false): Project[] {
    const { projects } = projectsStore.get();
    return includeArchived ? projects : projects.filter((p) => !p.archived);
}
