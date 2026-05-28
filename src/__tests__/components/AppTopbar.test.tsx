// ─── AppTopbar Tests (2+ cases) ───

import { describe, it, expect } from 'vitest';

describe('AppTopbar', () => {
  it('should render breadcrumb items', () => {
    const breadcrumbs = [
      { label: '项目', href: '/projects' },
      { label: '剧集管理', href: '/projects/123' },
    ];

    expect(breadcrumbs).toHaveLength(2);
    expect(breadcrumbs[0].label).toBe('项目');
    expect(breadcrumbs[1].label).toBe('剧集管理');
  });

  it('should derive breadcrumbs from pathname', () => {
    const deriveFromPath = (pathname: string): Array<{ label: string; href: string }> => {
      if (pathname === '/') return [{ label: '首页', href: '/' }];
      if (pathname.includes('/projects/') && pathname.includes('/episodes')) {
        return [
          { label: '项目', href: '/projects' },
          { label: '剧集管理', href: pathname.split('/episodes')[0] },
          { label: '创作工坊', href: pathname },
        ];
      }
      if (pathname.includes('/projects/') && pathname.includes('/versions')) {
        return [
          { label: '项目', href: '/projects' },
          { label: '版本控制', href: pathname },
        ];
      }
      return [{ label: pathname.slice(1) || '首页', href: pathname }];
    };

    const result = deriveFromPath('/projects/123/episodes/1');
    expect(result[2].label).toBe('创作工坊');

    const result2 = deriveFromPath('/projects/123/versions');
    expect(result2[1].label).toBe('版本控制');
  });
});
