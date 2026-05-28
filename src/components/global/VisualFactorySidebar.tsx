'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAppStore } from '@/stores/app';
import { useAuthStore } from '@/stores/auth';

export default function VisualFactorySidebar() {
  const pathname = usePathname();
  const sidebarOpen = useAppStore((s) => s.sidebarOpen);
  const closeSidebar = useAppStore((s) => s.closeSidebar);
  const { user } = useAuthStore();

  const vfNavItems = [
    {
      href: '/short-video/projects',
      label: '项目列表',
      svgPath: 'M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z M9 14h6 M9 17h3',
      disabled: false,
    },
    {
      href: '/short-video/studio',
      label: '创作工坊',
      svgPath: 'M12 2L2 7l10 5 10-5-10-5z M2 17l10 5 10-5 M2 12l10 5 10-5',
      disabled: false,
    },
    {
      href: '/short-video/script',
      label: '脚本编辑',
      svgPath: 'M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z M14 2v6h6 M16 13H8 M16 17H8 M10 9H8',
      disabled: false,
    },
    {
      href: '/short-video/storyboard',
      label: '分镜编辑',
      svgPath: 'M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z',
      disabled: false,
    },
    {
      href: '/short-video/characters',
      label: '角色管理',
      svgPath: 'M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4-4v2 M9 3a4 4 0 100 8 4 4 0 000-8z M23 21v-2a4 4 0 00-3-3.87 M16 3.13a4 4 0 010 7.75',
      disabled: false,
    },
    {
      href: '/short-video/assets',
      label: '素材库',
      svgPath: 'M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z M14 2v6h6 M10 12a2 2 0 110-4 2 2 0 010 4z M18 18l-4-4-7 7',
      disabled: false,
    },
    {
      href: '/short-video/export',
      label: '导出管理',
      svgPath: 'M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4 M7 10l5 5 5-5 M12 15V3',
      disabled: false,
    },
  ];

  const sdNavItems = [
    {
      href: '/dashboard',
      label: '工作台',
      svgPath: 'M3 3h18v18H3z M3 9h18 M9 21V9',
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
        <div className="nav-section">视觉工厂</div>
        {vfNavItems.map((item) => {
          const isActive =
            !item.disabled &&
            (pathname === item.href || pathname.startsWith(item.href + '/'));

          if (item.disabled) {
            return (
              <span
                key={item.label}
                title="即将上线"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-3)',
                  padding: 'var(--space-2) var(--space-3)',
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--meta)',
                  fontSize: 'var(--text-sm)',
                  cursor: 'not-allowed',
                  opacity: 0.5,
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                  <path d={item.svgPath} />
                </svg>
                {item.label}
              </span>
            );
          }

          return (
            <Link
              key={item.label}
              href={item.href}
              className={isActive ? 'active' : ''}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                <path d={item.svgPath} />
              </svg>
              {item.label}
            </Link>
          );
        })}

        <div className="nav-section" style={{ marginTop: 'auto' }}>短剧 Agent</div>
        {sdNavItems.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.label}
              href={item.href}
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

      {user && (
        <div className="sidebar-user">
          <div className="sidebar-user-info">
            <div className="avatar" style={{ width: 32, height: 32, fontSize: 12 }}>
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="sidebar-user-details">
              <span className="sidebar-user-name">{user.name}</span>
              <span className="sidebar-user-plan badge badge-accent">{user.plan}</span>
            </div>
          </div>
          <Link href="/logout" className="btn btn-ghost btn-sm sidebar-logout-btn" title="退出登录">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4 M16 17l5-5-5-5 M21 12H9" />
            </svg>
          </Link>
        </div>
      )}

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
      `}</style>
    </aside>
  );
}
