// ─── Project Detail Page Tests — mount, store sync, episodes, add ───

import React from 'react';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

/* ── Controllable mocks ── */
const apiMocks = vi.hoisted(() => ({
  projectsApi: {
    get: vi.fn(),
  },
  episodesApi: {
    list: vi.fn(),
    create: vi.fn(),
  },
}));

const routerMocks = vi.hoisted(() => ({
  push: vi.fn(),
}));

const appStore = vi.hoisted(() => ({
  activeProjectId: null as string | null,
}));

let mockProjectId = 'test-project-1';

vi.mock('@/lib/api', () => ({
  projectsApi: apiMocks.projectsApi,
  episodesApi: apiMocks.episodesApi,
}));

vi.mock('next/navigation', () => ({
  useRouter: () => routerMocks,
  usePathname: () => `/short-series/projects/${mockProjectId}`,
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({ id: mockProjectId }),
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
  });
  return { useAppStore };
});

vi.mock('@/stores/auth', () => ({
  useAuthStore: (selector: any) => {
    const state = { user: null };
    return selector ? selector(state) : state;
  },
}));

import ProjectDetailPage from '@/app/(app)/short-series/projects/[id]/page';

beforeEach(() => {
  vi.clearAllMocks();
  mockProjectId = 'test-project-1';
  appStore.activeProjectId = null;
  apiMocks.projectsApi.get.mockResolvedValue({
    id: 'test-project-1',
    title: 'Test Project Title',
    style: 'cinematic',
    total_episodes: 5,
    updated_at: new Date().toISOString(),
    status: 'active',
  });
  apiMocks.episodesApi.list.mockResolvedValue([
    { episode_number: 1, title: 'Episode One', script_status: 'completed', duration_seconds: 0 },
    { episode_number: 2, title: 'Episode Two', script_status: 'pending', duration_seconds: 0 },
  ]);
  apiMocks.episodesApi.create.mockResolvedValue({
    episode_number: 3, title: 'New Episode', script_status: 'pending', duration_seconds: 0,
  });
  routerMocks.push.mockClear();
  // Clear localStorage if available (jsdom provides it but clear may be restricted)
  try { localStorage.clear(); } catch { /* jsdom restriction */ }
});

/* ──────────────────────────────────────────────
 * Loading state
 * ────────────────────────────────────────────── */

describe('ProjectDetailPage — loading state', () => {
  it('should display loading text initially', () => {
    apiMocks.projectsApi.get.mockReturnValue(new Promise(() => {}));
    apiMocks.episodesApi.list.mockReturnValue(new Promise(() => {}));
    render(<ProjectDetailPage />);
    expect(screen.getByText('加载中...')).toBeDefined();
  });
});

/* ──────────────────────────────────────────────
 * Project detail rendering
 * ────────────────────────────────────────────── */

describe('ProjectDetailPage — project detail rendering', () => {
  it('should render project title from API', async () => {
    render(<ProjectDetailPage />);
    await waitFor(() => {
      expect(screen.getByText('Test Project Title')).toBeDefined();
    });
  });

  it('should render style tag', async () => {
    render(<ProjectDetailPage />);
    await waitFor(() => {
      expect(screen.getByText('电影级')).toBeDefined();
    });
  });
});

/* ──────────────────────────────────────────────
 * API error state
 * ────────────────────────────────────────────── */

describe('ProjectDetailPage — API error state', () => {
  it('should display error message on project API failure', async () => {
    apiMocks.projectsApi.get.mockRejectedValue(new Error('Not Found'));
    render(<ProjectDetailPage />);
    await waitFor(() => {
      expect(screen.getByText(/加载失败/)).toBeDefined();
    });
  });

  it('should show retry button on error', async () => {
    apiMocks.projectsApi.get.mockRejectedValue(new Error('Fail'));
    render(<ProjectDetailPage />);
    await waitFor(() => {
      expect(screen.getByText('重试')).toBeDefined();
    });
  });
});

/* ──────────────────────────────────────────────
 * activeProjectId sync
 * ────────────────────────────────────────────── */

describe('ProjectDetailPage — activeProjectId sync', () => {
  it('should set activeProjectId to project id on mount', async () => {
    const { unmount } = render(<ProjectDetailPage />);
    await waitFor(() => {
      expect(screen.getByText('Test Project Title')).toBeDefined();
    });
    // The useEffect sets store on mount
    expect(appStore.activeProjectId).toBe('test-project-1');
    unmount();
  });

  it('should clear activeProjectId on unmount', async () => {
    const { unmount } = render(<ProjectDetailPage />);
    await waitFor(() => {
      expect(screen.getByText('Test Project Title')).toBeDefined();
    });
    expect(appStore.activeProjectId).toBe('test-project-1');

    unmount();
    // After unmount, the cleanup effect should clear the project
    expect(appStore.activeProjectId).toBeNull();
  });
});

/* ──────────────────────────────────────────────
 * Episode list
 * ────────────────────────────────────────────── */

describe('ProjectDetailPage — episode list', () => {
  it('should render episodes from API', async () => {
    render(<ProjectDetailPage />);
    await waitFor(() => {
      expect(screen.getByText('Episode One')).toBeDefined();
      expect(screen.getByText('Episode Two')).toBeDefined();
    });
  });

  it('should show empty episode list message', async () => {
    apiMocks.episodesApi.list.mockResolvedValue([]);
    render(<ProjectDetailPage />);
    await waitFor(() => {
      expect(screen.getByText(/创建第一集/)).toBeDefined();
    });
  });
});

/* ──────────────────────────────────────────────
 * Add episode
 * ────────────────────────────────────────────── */

describe('ProjectDetailPage — add episode', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('should create episode and call API on add', async () => {
    render(<ProjectDetailPage />);
    await waitFor(() => {
      expect(screen.getByText('添加集')).toBeDefined();
    });

    // Open add dialog
    fireEvent.click(screen.getByText('添加集'));
    await waitFor(() => {
      expect(screen.getByText('创建新集')).toBeDefined();
    });

    // Click create button — handleAddEpisode creates with n = episodes.length + 1 = 3
    fireEvent.click(screen.getByText('创建并锁定配置'));

    await waitFor(() => {
      expect(apiMocks.episodesApi.create).toHaveBeenCalledWith('test-project-1', {
        episode_number: 3,
        title: '第 3 集',
      });
    });
  });

  it('should navigate to the new episode after creation', async () => {
    render(<ProjectDetailPage />);
    await waitFor(() => {
      expect(screen.getByText('添加集')).toBeDefined();
    });

    fireEvent.click(screen.getByText('添加集'));
    await waitFor(() => {
      expect(screen.getByText('创建新集')).toBeDefined();
    });

    // Enable fake timers only for the setTimeout(500ms) in handleAddEpisode
    vi.useFakeTimers();
    fireEvent.click(screen.getByText('创建并锁定配置'));

    // Flush the async episode creation
    await vi.advanceTimersByTimeAsync(0);
    // Advance past the 500ms setTimeout
    await vi.advanceTimersByTimeAsync(600);

    expect(routerMocks.push).toHaveBeenCalledWith('/short-series/projects/test-project-1/episodes/3');
  });
});
