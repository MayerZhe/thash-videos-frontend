// ─── Dashboard Page Tests — project list, create, delete, store sync ───

import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

/* ── Controllable mocks ── */
const apiMocks = vi.hoisted(() => ({
  projectsApi: {
    list: vi.fn(),
    create: vi.fn(),
    delete: vi.fn(),
  },
}));

const routerMocks = vi.hoisted(() => ({
  push: vi.fn(),
}));

const appStore = vi.hoisted(() => ({
  activeProjectId: null as string | null,
}));

vi.mock('@/lib/api', () => ({
  projectsApi: apiMocks.projectsApi,
}));

vi.mock('next/navigation', () => ({
  useRouter: () => routerMocks,
  usePathname: () => '/dashboard',
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({}),
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

import DashboardPage from '@/app/(app)/dashboard/page';

function buildProject(id: string, title: string, status = 'draft', style = 'realistic') {
  return {
    id, title, style, status,
    total_episodes: 3,
    updated_at: new Date().toISOString(),
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  appStore.activeProjectId = null;
  apiMocks.projectsApi.list.mockResolvedValue({ projects: [] });
  apiMocks.projectsApi.create.mockResolvedValue({
    id: 'new-p1', title: 'New Project', style: 'anime',
    updated_at: new Date().toISOString(), status: 'draft',
  });
  apiMocks.projectsApi.delete.mockResolvedValue({ ok: true });
  routerMocks.push.mockClear();
});

/* ──────────────────────────────────────────────
 * Loading state
 * ────────────────────────────────────────────── */

describe('DashboardPage — loading state', () => {
  it('should display loading text initially', () => {
    apiMocks.projectsApi.list.mockReturnValue(new Promise(() => {}));
    render(<DashboardPage />);
    expect(screen.getByText('加载中...')).toBeDefined();
  });
});

/* ──────────────────────────────────────────────
 * Empty project list
 * ────────────────────────────────────────────── */

describe('DashboardPage — empty project list', () => {
  it('should show empty state when no projects exist', async () => {
    apiMocks.projectsApi.list.mockResolvedValue({ projects: [] });
    render(<DashboardPage />);
    await waitFor(() => {
      expect(screen.getByText('新建第一个短剧项目')).toBeDefined();
    });
  });

  it('should show the create button in empty state', async () => {
    apiMocks.projectsApi.list.mockResolvedValue({ projects: [] });
    render(<DashboardPage />);
    await waitFor(() => {
      expect(screen.getByText('新建项目')).toBeDefined();
    });
  });
});

/* ──────────────────────────────────────────────
 * Project list rendering
 * ────────────────────────────────────────────── */

describe('DashboardPage — project list rendering', () => {
  it('should render project cards from API response', async () => {
    apiMocks.projectsApi.list.mockResolvedValue({
      projects: [
        buildProject('p1', '都市情感短剧《时光邮局》'),
        buildProject('p2', '悬疑短剧《暗夜追踪》'),
      ],
    });
    render(<DashboardPage />);
    await waitFor(() => {
      expect(screen.getByText('都市情感短剧《时光邮局》')).toBeDefined();
      expect(screen.getByText('悬疑短剧《暗夜追踪》')).toBeDefined();
    });
  });

  it('should show project count in header', async () => {
    apiMocks.projectsApi.list.mockResolvedValue({
      projects: [buildProject('p1', 'Test'), buildProject('p2', 'Test2')],
    });
    render(<DashboardPage />);
    await waitFor(() => {
      expect(screen.getByText('2 个项目')).toBeDefined();
    });
  });
});

/* ──────────────────────────────────────────────
 * API error state
 * ────────────────────────────────────────────── */

describe('DashboardPage — API error state', () => {
  it('should display error message on API failure', async () => {
    apiMocks.projectsApi.list.mockRejectedValue(new Error('Network Error'));
    render(<DashboardPage />);
    await waitFor(() => {
      expect(screen.getByText(/加载失败/)).toBeDefined();
    });
  });

  it('should show retry button on error', async () => {
    apiMocks.projectsApi.list.mockRejectedValue(new Error('Server Error'));
    render(<DashboardPage />);
    await waitFor(() => {
      expect(screen.getByText('重试')).toBeDefined();
    });
  });

  it('should retry loading when retry button is clicked', async () => {
    apiMocks.projectsApi.list.mockRejectedValueOnce(new Error('First fail'));
    render(<DashboardPage />);
    await waitFor(() => {
      expect(screen.getByText('重试')).toBeDefined();
    });

    apiMocks.projectsApi.list.mockResolvedValueOnce({
      projects: [buildProject('p1', 'Retry Success')],
    });
    fireEvent.click(screen.getByText('重试'));

    await waitFor(() => {
      expect(screen.getByText('Retry Success')).toBeDefined();
    });
  });
});

/* ──────────────────────────────────────────────
 * openProject sets store
 * ────────────────────────────────────────────── */

describe('DashboardPage — openProject sets store', () => {
  it('should set activeProjectId in store when project card is clicked', async () => {
    apiMocks.projectsApi.list.mockResolvedValue({
      projects: [buildProject('proj-123', 'Clickable Project', 'draft')],
    });
    render(<DashboardPage />);
    await waitFor(() => {
      expect(screen.getByText('Clickable Project')).toBeDefined();
    });

    fireEvent.click(screen.getByText('Clickable Project'));
    expect(appStore.activeProjectId).toBe('proj-123');
  });

  it('should navigate to project detail on card click', async () => {
    apiMocks.projectsApi.list.mockResolvedValue({
      projects: [buildProject('nav-456', 'Navigate Project')],
    });
    render(<DashboardPage />);
    await waitFor(() => {
      expect(screen.getByText('Navigate Project')).toBeDefined();
    });

    fireEvent.click(screen.getByText('Navigate Project'));
    expect(routerMocks.push).toHaveBeenCalledWith('/projects/nav-456');
  });
});

/* ──────────────────────────────────────────────
 * createProject sets store
 * ────────────────────────────────────────────── */

describe('DashboardPage — createProject sets store', () => {
  it('should set store when project is created via modal', async () => {
    apiMocks.projectsApi.list.mockResolvedValue({ projects: [] });
    render(<DashboardPage />);
    await waitFor(() => {
      expect(screen.getByText('新建项目')).toBeDefined();
    });

    // Open create modal
    fireEvent.click(screen.getByText('新建项目'));
    await waitFor(() => {
      expect(screen.getByText('新建短剧项目')).toBeDefined();
    });

    // Fill in name
    const input = document.querySelector('input[placeholder*="时光邮局"]') as HTMLInputElement;
    expect(input).toBeDefined();
    fireEvent.change(input, { target: { value: 'My New Show' } });

    // Submit form
    const form = input.closest('form') as HTMLFormElement;
    fireEvent.submit(form);

    await waitFor(() => {
      expect(appStore.activeProjectId).toBe('new-p1');
    });
  });
});

/* ──────────────────────────────────────────────
 * Status filter
 * ────────────────────────────────────────────── */

describe('DashboardPage — status filter', () => {
  it('should show filter tabs', async () => {
    apiMocks.projectsApi.list.mockResolvedValue({ projects: [] });
    render(<DashboardPage />);
    await waitFor(() => {
      expect(screen.getByText('全部')).toBeDefined();
      expect(screen.getByText('草稿')).toBeDefined();
      expect(screen.getByText('进行中')).toBeDefined();
      expect(screen.getByText('已完成')).toBeDefined();
    });
  });

  it('should filter on click', async () => {
    apiMocks.projectsApi.list.mockResolvedValue({
      projects: [
        buildProject('p1', 'Draft Project', 'draft'),
        buildProject('p2', 'Active Project', 'active'),
      ],
    });
    render(<DashboardPage />);
    await waitFor(() => {
      expect(screen.getByText('Draft Project')).toBeDefined();
      expect(screen.getByText('Active Project')).toBeDefined();
    });

    // Click "进行中" (active) filter tab
    fireEvent.click(screen.getByText('进行中'));
    // Should now only show "Active Project"
    expect(screen.queryByText('Draft Project')).toBeNull();
    expect(screen.getByText('Active Project')).toBeDefined();
  });
});
