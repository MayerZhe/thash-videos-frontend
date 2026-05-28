'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAppStore } from '@/stores/app';

export default function AppSidebar() {
  const pathname = usePathname();
  const activeProjectId = useAppStore((s) => s.activeProjectId);
  const sidebarOpen = useAppStore((s) => s.sidebarOpen);
  const closeSidebar = useAppStore((s) => s.closeSidebar);
  const p = (path: string) =>
    activeProjectId ? `/projects/${activeProjectId}${path}` : '#';

  const navItems = [
    {
      href: '/dashboard',
      label: '项目管理',
      svgPath: 'M3 3h18v18H3z M3 9h18 M9 21V9',
    },
    {
      href: p('/episodes/1'),
      label: '内容创作',
      svgPath: 'M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7 M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z',
      needsProject: true,
    },
    {
      href: p('/assets'),
      label: '素材管理',
      svgPath: 'M3 3h18v18H3z M8.5 8.5a1.5 1.5 0 110-3 1.5 1.5 0 010 3z M21 15l-5-5-11 11',
      needsProject: true,
    },
    {
      href: p('/analytics'),
      label: '数据分析',
      svgPath: 'M18 20V10 M12 20V4 M6 20v-6',
      needsProject: true,
    },
    {
      href: p('/publishing'),
      label: '发布管理',
      svgPath: 'M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4 M7 10l5 5 5-5 M12 15V3',
      needsProject: true,
    },
    {
      href: p('/versions'),
      label: '版本控制',
      svgPath: 'M6 3v12 M18 6a3 3 0 100-6 3 3 0 000 6z M6 21a3 3 0 100-6 3 3 0 000 6z M18 9a3 3 0 000 6',
      needsProject: true,
    },
    {
      href: p('/collab'),
      label: '团队协作',
      svgPath: 'M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4-4v2 M9 7a4 4 0 100-8 4 4 0 000 8z M23 21v-2a4 4 0 00-3-3.87 M16 3.13a4 4 0 010 7.75',
      needsProject: true,
    },
  ];

  return (
    <aside className="app-sidebar" data-sidebar-open={sidebarOpen}>
      <div className="sidebar-brand-row">
        <Link href="/landing" className="sidebar-brand">
          <img src="/logo.png" className="logo" alt="Thash.videos" />
          Thash.videos
        </Link>
        <button
          className="sidebar-close-btn"
          onClick={closeSidebar}
          aria-label="关闭菜单"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      <nav className="sidebar-nav" style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
        {navItems.map((item) => {
          const needsProject = 'needsProject' in item;
          const disabled = needsProject && !activeProjectId;
          const href = disabled ? '/dashboard' : item.href;
          const isActive = href !== '#' && href !== '/dashboard'
            ? (pathname === href || (href !== '/' && pathname.startsWith(href + '/')))
            : pathname === href;

          return (
            <Link
              key={item.label}
              href={href}
              className={isActive ? 'active' : ''}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                <path d={item.svgPath} />
              </svg>
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <Link href="/landing" className="body-sm" style={{ color: 'var(--muted)' }}>
          关于 Thash.video
        </Link>
      </div>

      <style jsx global>{`
        .nav-section {
          padding: var(--space-3) var(--space-3) var(--space-1);
          font-size: 10px;
          font-family: var(--font-mono);
          color: var(--meta);
          text-transform: uppercase;
          letter-spacing: 0.8px;
        }
        .sidebar-user {
          display: flex;
          align-items: center;
          gap: var(--space-2);
          padding: var(--space-3) var(--space-3);
          border-top: 1px solid var(--border-soft);
          margin-top: auto;
        }
        .sidebar-user-info {
          flex: 1;
          display: flex;
          align-items: center;
          gap: var(--space-2);
          min-width: 0;
        }
        .sidebar-user-details {
          display: flex;
          flex-direction: column;
          gap: 2px;
          min-width: 0;
        }
        .sidebar-user-name {
          font-size: var(--text-sm);
          color: var(--fg);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .sidebar-user-plan {
          font-size: 10px;
          padding: 1px 6px;
        }
        .sidebar-logout-btn {
          padding: var(--space-2);
          color: var(--muted);
        }
        .sidebar-logout-btn:hover {
          color: var(--danger);
        }
      `}</style>
    </aside>
  );
}