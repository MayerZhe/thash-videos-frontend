// ─── AppSidebar Tests — sidebar navigation logic ───

import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

/* ── Controllable mocks for next/navigation (vi.hoisted to avoid TDZ) ── */
const navMocks = vi.hoisted(() => ({
  usePathname: vi.fn(() => '/'),
  useRouter: vi.fn(() => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
  })),
  useParams: vi.fn(() => ({})),
}));

vi.mock('next/navigation', () => ({
  usePathname: navMocks.usePathname,
  useRouter: navMocks.useRouter,
  useParams: navMocks.useParams,
  useSearchParams: () => new URLSearchParams(),
}));

/* ── Mutable store state ── */
const appStore = vi.hoisted(() => ({
  activeProjectId: null as string | null,
  sidebarOpen: false,
  closeSidebar: vi.fn(),
}));

vi.mock('@/stores/app', () => {
  const useAppStore: any = (selector: any) => {
    if (typeof selector === 'function') {
      return selector(appStore);
    }
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

import AppSidebar from '@/components/global/AppSidebar';

function renderSidebar() {
  return render(<AppSidebar />);
}

function getNavLinks(): HTMLAnchorElement[] {
  return screen.queryAllByRole('link');
}

beforeEach(() => {
  appStore.activeProjectId = null;
  appStore.sidebarOpen = false;
  navMocks.usePathname.mockReturnValue('/');
  vi.clearAllMocks();
});

/* ──────────────────────────────────────────────
 * Core navigation items
 * ────────────────────────────────────────────── */

describe('AppSidebar — navigation items', () => {
  it('should render the brand link', () => {
    renderSidebar();
    const brand = screen.getByText('videos.thash');
    expect(brand).toBeDefined();
    expect(brand.closest('a')?.getAttribute('href')).toBe('/landing');
  });

  it('should render the 项目管理 link to /dashboard', () => {
    navMocks.usePathname.mockReturnValue('/dashboard');
    renderSidebar();
    const links = getNavLinks();
    const dashboardLink = links.find((a) => a.textContent?.includes('项目管理'));
    expect(dashboardLink).toBeDefined();
    expect(dashboardLink?.getAttribute('href')).toBe('/dashboard');
  });
});

/* ──────────────────────────────────────────────
 * URL projectId fallback
 * ────────────────────────────────────────────── */

describe('AppSidebar — URL projectId fallback', () => {
  it('should extract projectId from /projects/{id}/... pathname', () => {
    navMocks.usePathname.mockReturnValue('/projects/abc-123/assets');
    appStore.activeProjectId = null;
    renderSidebar();
    const links = getNavLinks();
    const contentLink = links.find((a) => a.textContent?.includes('内容创作'));
    expect(contentLink).toBeDefined();
    expect(contentLink?.getAttribute('href')).toBe('/projects/abc-123/episodes/1');
  });

  it('should extract projectId from /projects/{id} (no trailing path)', () => {
    navMocks.usePathname.mockReturnValue('/projects/abc-123');
    appStore.activeProjectId = null;
    renderSidebar();
    const links = getNavLinks();
    const assetsLink = links.find((a) => a.textContent?.includes('素材管理'));
    expect(assetsLink).toBeDefined();
    expect(assetsLink?.getAttribute('href')).toBe('/projects/abc-123/assets');
  });

  it('should return null for urlProjectId on /dashboard', () => {
    navMocks.usePathname.mockReturnValue('/dashboard');
    appStore.activeProjectId = null;
    renderSidebar();
    const links = getNavLinks();
    const projectOnlyLabels = ['内容创作', '素材管理', '数据分析', '发布管理', '版本控制', '团队协作'];
    for (const label of projectOnlyLabels) {
      const found = links.find((a) => a.textContent?.includes(label));
      expect(found).toBeUndefined();
    }
  });

  it('should return null for urlProjectId on random pages', () => {
    navMocks.usePathname.mockReturnValue('/settings/api-keys');
    appStore.activeProjectId = null;
    renderSidebar();
    const links = getNavLinks();
    const projectOnlyLabels = ['内容创作', '素材管理', '数据分析', '发布管理', '版本控制', '团队协作'];
    for (const label of projectOnlyLabels) {
      const found = links.find((a) => a.textContent?.includes(label));
      expect(found).toBeUndefined();
    }
  });
});

/* ──────────────────────────────────────────────
 * Disabled state
 * ────────────────────────────────────────────── */

describe('AppSidebar — disabled state', () => {
  it('should render needsProject items as <span> when activeProjectId is null', () => {
    navMocks.usePathname.mockReturnValue('/dashboard');
    appStore.activeProjectId = null;
    renderSidebar();
    const disabledItems = document.querySelectorAll('.sidebar-nav-disabled');
    expect(disabledItems.length).toBeGreaterThanOrEqual(6);
    for (const el of disabledItems) {
      expect(el.tagName).toBe('SPAN');
      expect(el.getAttribute('title')).toBe('请先选择或创建一个项目');
    }
  });

  it('should render needsProject items as <Link> when activeProjectId is set', () => {
    navMocks.usePathname.mockReturnValue('/projects/test-1/episodes/1');
    appStore.activeProjectId = 'test-1';
    renderSidebar();
    const links = getNavLinks();
    const projectOnlyLabels = ['内容创作', '素材管理', '数据分析', '发布管理', '版本控制', '团队协作'];
    for (const label of projectOnlyLabels) {
      const link = links.find((a) => a.textContent?.includes(label));
      expect(link).toBeDefined();
      expect(link?.tagName).toBe('A');
    }
  });

  it('should show tooltip on disabled items', () => {
    navMocks.usePathname.mockReturnValue('/dashboard');
    appStore.activeProjectId = null;
    renderSidebar();
    const disabledSpan = screen.getByText('内容创作');
    expect(disabledSpan.tagName).toBe('SPAN');
    expect(disabledSpan.getAttribute('title')).toBe('请先选择或创建一个项目');
  });
});

/* ──────────────────────────────────────────────
 * Disabled items never show active
 * ────────────────────────────────────────────── */

describe('AppSidebar — disabled items never active', () => {
  it('should not highlight disabled items', () => {
    navMocks.usePathname.mockReturnValue('/dashboard');
    appStore.activeProjectId = null;
    renderSidebar();
    const disabledSpans = document.querySelectorAll('.sidebar-nav-disabled');
    for (const el of disabledSpans) {
      expect(el.classList.contains('active')).toBe(false);
    }
  });

  it('should highlight matching active item when project is set', () => {
    navMocks.usePathname.mockReturnValue('/projects/proj-x/assets');
    appStore.activeProjectId = 'proj-x';
    renderSidebar();
    const links = getNavLinks();
    const assetsLink = links.find((a) => a.textContent?.includes('素材管理') && a.classList.contains('active'));
    expect(assetsLink).toBeDefined();
  });
});

/* ──────────────────────────────────────────────
 * Store priority over URL
 * ────────────────────────────────────────────── */

describe('AppSidebar — store priority over URL', () => {
  it('should use store projectId when both store and URL have a project', () => {
    navMocks.usePathname.mockReturnValue('/projects/project-B/assets');
    appStore.activeProjectId = 'project-A';
    renderSidebar();
    const links = getNavLinks();
    const contentLink = links.find((a) => a.textContent?.includes('内容创作'));
    expect(contentLink).toBeDefined();
    expect(contentLink?.getAttribute('href')).toBe('/projects/project-A/episodes/1');
  });

  it('should use URL as fallback when store is cleared', () => {
    navMocks.usePathname.mockReturnValue('/projects/fallback-proj/analytics');
    appStore.activeProjectId = null;
    renderSidebar();
    const links = getNavLinks();
    const analyticsLink = links.find((a) => a.textContent?.includes('数据分析'));
    expect(analyticsLink).toBeDefined();
    expect(analyticsLink?.getAttribute('href')).toBe('/projects/fallback-proj/analytics');
  });
});

/* ──────────────────────────────────────────────
 * p() fallback returns '#' — renders disabled spans
 * ────────────────────────────────────────────── */

describe('AppSidebar — p() fallback', () => {
  it('should render disabled spans when no project is active on non-project pages', () => {
    navMocks.usePathname.mockReturnValue('/settings');
    appStore.activeProjectId = null;
    renderSidebar();
    const disabledItems = document.querySelectorAll('.sidebar-nav-disabled');
    expect(disabledItems.length).toBe(6);
  });
});
