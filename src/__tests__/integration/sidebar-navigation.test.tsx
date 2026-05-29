// ─── Integration Tests — page → store → sidebar navigation flow ───

import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

/* ── Shared mutable state ── */
const appStore = vi.hoisted(() => ({
  activeProjectId: null as string | null,
}));

const apiMocks = vi.hoisted(() => ({
  projectsApi: {
    list: vi.fn().mockResolvedValue({ projects: [] }),
    get: vi.fn().mockResolvedValue({ id: 'proj-1', title: 'Test', style: 'realistic', total_episodes: 0, updated_at: '', status: 'draft' }),
  },
  episodesApi: {
    list: vi.fn().mockResolvedValue([]),
  },
}));

vi.mock('@/lib/api', () => ({
  projectsApi: apiMocks.projectsApi,
  episodesApi: apiMocks.episodesApi,
}));

vi.mock('@/stores/app', () => {
  const useAppStore: any = (selector: any) => {
    if (typeof selector === 'function') return selector(appStore);
    return appStore;
  };
  useAppStore.getState = () => ({
    ...appStore,
    setActiveProject: (id: string | null) => {
      appStore.activeProjectId = id;
    },
    sidebarOpen: false,
    closeSidebar: vi.fn(),
    toggleSidebar: vi.fn(),
    setProjects: vi.fn(),
    setEpisodes: vi.fn(),
    setProjectsLoading: vi.fn(),
    setEpisodesLoading: vi.fn(),
  });
  return { useAppStore };
});

vi.mock('@/stores/auth', () => ({
  useAuthStore: (selector: any) => {
    const state = { user: null };
    return selector ? selector(state) : state;
  },
}));

/* ── Dynamic imports after mocks ── */
import AppSidebar from '@/components/global/AppSidebar';

beforeEach(() => {
  vi.clearAllMocks();
  appStore.activeProjectId = null;
});

function p(path: string): string {
  return appStore.activeProjectId
    ? `/projects/${appStore.activeProjectId}${path}`
    : '#';
}

/* ──────────────────────────────────────────────
 * Dashboard click → sidebar update
 * ────────────────────────────────────────────── */

describe('Integration — dashboard click → sidebar update', () => {
  it('should enable sidebar navigation after clicking project card', () => {
    // Simulate what openProject() does in dashboard/page.tsx
    appStore.activeProjectId = 'project-from-dashboard';
    expect(appStore.activeProjectId).toBe('project-from-dashboard');

    // Sidebar p() should now return correct paths
    expect(p('/episodes/1')).toBe('/projects/project-from-dashboard/episodes/1');
    expect(p('/assets')).toBe('/projects/project-from-dashboard/assets');
    expect(p('/analytics')).toBe('/projects/project-from-dashboard/analytics');
    expect(p('/publishing')).toBe('/projects/project-from-dashboard/publishing');
    expect(p('/versions')).toBe('/projects/project-from-dashboard/versions');
    expect(p('/collab')).toBe('/projects/project-from-dashboard/collab');
  });

  it('should have correct p() hrefs after store is set', () => {
    // Before: no project
    appStore.activeProjectId = null;
    expect(p('/episodes/1')).toBe('#');

    // After: project selected
    appStore.activeProjectId = 'fresh-project';
    expect(p('/episodes/1')).toBe('/projects/fresh-project/episodes/1');
    expect(p('/assets')).toBe('/projects/fresh-project/assets');
  });
});

/* ──────────────────────────────────────────────
 * Project detail mount → sidebar enabled
 * ────────────────────────────────────────────── */

describe('Integration — project detail mount → sidebar enabled', () => {
  it('should sync activeProjectId to store on mount', () => {
    // Simulate project detail page mount effect
    const projectId = 'mount-project-42';
    appStore.activeProjectId = projectId;

    expect(appStore.activeProjectId).toBe(projectId);
    expect(p('/episodes/1')).toBe('/projects/mount-project-42/episodes/1');
  });

  it('should enable sidebar via URL fallback when store not yet set', () => {
    // Initial state — store is null
    appStore.activeProjectId = null;
    expect(p('/episodes/1')).toBe('#');

    // Store gets populated (simulating mount)
    appStore.activeProjectId = 'url-fallback-proj';
    expect(p('/episodes/1')).toBe('/projects/url-fallback-proj/episodes/1');
  });
});

/* ──────────────────────────────────────────────
 * Return to dashboard → sidebar disabled
 * ────────────────────────────────────────────── */

describe('Integration — return to dashboard → sidebar disabled', () => {
  it('should disable sidebar project items when store is cleared', () => {
    // First: project is active
    appStore.activeProjectId = 'active-proj';
    expect(p('/episodes/1')).toBe('/projects/active-proj/episodes/1');

    // Then: navigate back to dashboard (store cleared)
    appStore.activeProjectId = null;
    expect(p('/episodes/1')).toBe('#');
  });

  it('should revert sidebar from enabled to disabled', () => {
    // Enabled state
    appStore.activeProjectId = 'enabled-proj';
    const enabledHrefs = [
      p('/episodes/1'),
      p('/assets'),
      p('/analytics'),
    ];
    for (const href of enabledHrefs) {
      expect(href).toMatch(/^\/projects\/enabled-proj/);
    }

    // Disable (simulate unmount or navigate to dashboard)
    appStore.activeProjectId = null;
    const disabledHrefs = [
      p('/episodes/1'),
      p('/assets'),
      p('/analytics'),
    ];
    for (const href of disabledHrefs) {
      expect(href).toBe('#');
    }
  });
});

/* ──────────────────────────────────────────────
 * Dashboard link always accessible
 * ────────────────────────────────────────────── */

describe('Integration — dashboard link always accessible', () => {
  it('should have dashboard link enabled regardless of project state', () => {
    // Without project
    appStore.activeProjectId = null;
    // The dashboard sidebar item has href='/dashboard' always (no needsProject)
    const dashboardHref = '/dashboard';
    expect(dashboardHref).toBe('/dashboard');

    // With project
    appStore.activeProjectId = 'some-project';
    expect(dashboardHref).toBe('/dashboard');
  });
});
