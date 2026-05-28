// ─── Zustand Store Tests (5+ cases) ───

import { describe, it, expect, beforeEach } from 'vitest';

// Simplified store logic for unit testing (no React dependency)
interface Project {
  id: string;
  title: string;
  description: string;
  status: 'draft' | 'active' | 'published' | 'archived';
  episode_count: number;
  created_at: string;
}

interface ProjectState {
  projects: Project[];
  selectedProjectId: string | null;
  isLoading: boolean;
  error: string | null;

  setProjects: (projects: Project[]) => void;
  addProject: (project: Project) => void;
  updateProject: (id: string, updates: Partial<Project>) => void;
  removeProject: (id: string) => void;
  selectProject: (id: string | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

function createTestStore(): ProjectState {
  const state: ProjectState = {
    projects: [],
    selectedProjectId: null,
    isLoading: false,
    error: null,

    setProjects(projects) { this.projects = projects; },
    addProject(project) { this.projects.push(project); },
    updateProject(id, updates) {
      const idx = this.projects.findIndex((p) => p.id === id);
      if (idx >= 0) this.projects[idx] = { ...this.projects[idx], ...updates };
    },
    removeProject(id) {
      this.projects = this.projects.filter((p) => p.id !== id);
    },
    selectProject(id) { this.selectedProjectId = id; },
    setLoading(loading) { this.isLoading = loading; },
    setError(error) { this.error = error; },
  };
  return state;
}

describe('ProjectStore', () => {
  let store: ProjectState;

  beforeEach(() => {
    store = createTestStore();
  });

  it('should start with empty projects', () => {
    expect(store.projects).toHaveLength(0);
    expect(store.isLoading).toBe(false);
    expect(store.error).toBeNull();
  });

  it('should add a project', () => {
    const project: Project = {
      id: 'p1', title: 'Test', description: 'Desc',
      status: 'draft', episode_count: 0,
      created_at: new Date().toISOString(),
    };

    store.addProject(project);
    expect(store.projects).toHaveLength(1);
    expect(store.projects[0].title).toBe('Test');
  });

  it('should update a project', () => {
    store.addProject({
      id: 'p1', title: 'Original', description: '',
      status: 'draft', episode_count: 0,
      created_at: new Date().toISOString(),
    });

    store.updateProject('p1', { title: 'Updated', status: 'published' });
    expect(store.projects[0].title).toBe('Updated');
    expect(store.projects[0].status).toBe('published');
  });

  it('should remove a project', () => {
    store.addProject({
      id: 'p1', title: 'Test', description: '',
      status: 'draft', episode_count: 0,
      created_at: new Date().toISOString(),
    });
    store.addProject({
      id: 'p2', title: 'Test 2', description: '',
      status: 'draft', episode_count: 0,
      created_at: new Date().toISOString(),
    });

    store.removeProject('p1');
    expect(store.projects).toHaveLength(1);
    expect(store.projects[0].id).toBe('p2');
  });

  it('should select a project', () => {
    store.selectProject('p1');
    expect(store.selectedProjectId).toBe('p1');

    store.selectProject(null);
    expect(store.selectedProjectId).toBeNull();
  });

  it('should set loading state', () => {
    store.setLoading(true);
    expect(store.isLoading).toBe(true);

    store.setLoading(false);
    expect(store.isLoading).toBe(false);
  });

  it('should set error state', () => {
    store.setError('Network error');
    expect(store.error).toBe('Network error');

    store.setError(null);
    expect(store.error).toBeNull();
  });

  it('should handle concurrent updates correctly', () => {
    store.addProject({
      id: 'p1', title: 'A', description: '',
      status: 'draft', episode_count: 0,
      created_at: new Date().toISOString(),
    });
    store.addProject({
      id: 'p2', title: 'B', description: '',
      status: 'draft', episode_count: 0,
      created_at: new Date().toISOString(),
    });

    store.updateProject('p1', { title: 'A-updated' });
    store.updateProject('p2', { status: 'published' });

    expect(store.projects.find((p) => p.id === 'p1')?.title).toBe('A-updated');
    expect(store.projects.find((p) => p.id === 'p2')?.status).toBe('published');
  });
});
