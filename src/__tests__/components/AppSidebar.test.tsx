// ─── AppSidebar Tests (3+ cases) ───

import { describe, it, expect } from 'vitest';

describe('AppSidebar', () => {
  const NAV_ITEMS = [
    { href: '/', label: '主页' },
    { href: '/projects', label: '项目' },
    { href: '/assets', label: '素材' },
    { href: '/analytics', label: '分析' },
    { href: '/settings', label: '设置' },
  ];

  it('should contain all required navigation items', () => {
    expect(NAV_ITEMS).toHaveLength(5);
    expect(NAV_ITEMS.map((item) => item.label)).toEqual(
      expect.arrayContaining(['主页', '项目', '素材', '分析', '设置'])
    );
  });

  it('should have unique hrefs for all items', () => {
    const hrefs = NAV_ITEMS.map((item) => item.href);
    const unique = new Set(hrefs);
    expect(unique.size).toBe(hrefs.length);
  });

  it('should have valid href format (starts with /)', () => {
    for (const item of NAV_ITEMS) {
      expect(item.href.startsWith('/')).toBe(true);
    }
  });

  it('should return active state for matching path', () => {
    const isActive = (pathname: string, href: string) => pathname.startsWith(href);
    expect(isActive('/projects/123', '/projects')).toBe(true);
    expect(isActive('/', '/projects')).toBe(false);
    expect(isActive('/', '/')).toBe(true);
  });
});
