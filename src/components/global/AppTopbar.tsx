'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useAppStore } from '@/stores/app';
import { useAuthStore } from '@/stores/auth';

const PLAN_LABELS: Record<string, string> = {
  free: 'Free',
  starter: 'Starter',
  pro: 'Pro',
  enterprise: 'Enterprise',
};

export default function AppTopbar() {
  const showSearch = true;
  const toggleSidebar = useAppStore((s) => s.toggleSidebar);
  const activeProjectId = useAppStore((s) => s.activeProjectId);
  const user = useAuthStore((s) => s.user);

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Click outside closes dropdown
  useEffect(() => {
    if (!dropdownOpen) return;
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [dropdownOpen]);

  const closeDropdown = () => setDropdownOpen(false);
  const toggleDropdown = () => setDropdownOpen((prev) => !prev);

  return (
    <header className="app-topbar topbar-glass">
      {/* Left side — hamburger + search */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
        {/* Hamburger menu button (tablet/mobile only) */}
        <button
          className="hamburger-btn"
          onClick={toggleSidebar}
          aria-label="打开菜单"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>

        {showSearch && (
          <div className="topbar-search">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="var(--meta)"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="search"
              placeholder="搜索项目、素材、剧本..."
              className="topbar-search-input"
              onFocus={(e) => { e.target.style.setProperty('placeholder-color', 'var(--meta)'); }}
            />
          </div>
        )}
      </div>

      {/* Right side — actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
        {/* Notification bell */}
        <Link
          href={activeProjectId ? `/projects/${activeProjectId}/collab` : '#'}
          className="topbar-notification"
          title="通知"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 01-3.46 0" />
          </svg>
          <span className="topbar-notification-badge">
            3
          </span>
        </Link>

        {/* User avatar with dropdown */}
        <div style={{ position: 'relative' }} ref={dropdownRef}>
          <button
            className="topbar-avatar-btn avatar"
            onClick={toggleDropdown}
            aria-label="用户菜单"
          >
            {user ? user.name.charAt(0).toUpperCase() : 'CS'}
          </button>

          {dropdownOpen && (
            <div className="user-dropdown">
              <div className="user-dropdown-header">
                <div className="avatar" style={{ width: 32, height: 32, fontSize: 12 }}>
                  {user ? user.name.charAt(0).toUpperCase() : 'CS'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="user-dropdown-name">
                    {user?.name ?? 'Creator Studio'}
                  </div>
                  {user && (
                    <span className="badge badge-accent" style={{ fontSize: 10, padding: '1px 6px' }}>
                      {PLAN_LABELS[user.plan] ?? user.plan}
                    </span>
                  )}
                </div>
              </div>

              <Link href="/credits" className="user-dropdown-item" onClick={closeDropdown}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 1v22 M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
                </svg>
                Credits
              </Link>
              <Link href="/usage" className="user-dropdown-item" onClick={closeDropdown}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 20V10 M12 20V4 M6 20v-6" />
                </svg>
                用量统计
              </Link>
              <Link href="/settings" className="user-dropdown-item" onClick={closeDropdown}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 15a3 3 0 100-6 3 3 0 000 6z M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l-.06-.06a2 2 0 012.83 2.83l.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
                </svg>
                账号设置
              </Link>

              <div className="user-dropdown-divider" />

              <Link href="/logout" className="user-dropdown-item" onClick={closeDropdown}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4 M16 17l5-5-5-5 M21 12H9" />
                </svg>
                退出登录
              </Link>
            </div>
          )}
        </div>
      </div>

      <style jsx global>{`
        .topbar-avatar-btn {
          cursor: pointer;
          color: #fff;
        }
        .topbar-search {
          display: flex;
          align-items: center;
          gap: var(--space-2);
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius-sm);
          padding: var(--space-2) var(--space-4);
          min-width: 280px;
        }
        .topbar-search-input {
          border: none;
          background: transparent;
          color: var(--fg);
          font-size: var(--text-sm);
          outline: none;
          flex: 1;
        }
        .topbar-notification {
          position: relative;
          color: var(--fg-2);
          display: flex;
          align-items: center;
        }
        .topbar-notification-badge {
          position: absolute;
          top: -1px;
          right: -1px;
          width: 16px;
          height: 16px;
          border-radius: var(--radius-pill);
          background: var(--danger);
          font-size: 10px;
          font-weight: 500;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
        }

        /* User dropdown */
        .user-dropdown {
          position: absolute;
          top: calc(100% + 8px);
          right: 0;
          min-width: 200px;
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          box-shadow: 0 8px 24px rgba(0,0,0,0.4);
          z-index: 100;
          overflow: hidden;
          animation: dropdown-in 0.15s ease-out;
        }
        @keyframes dropdown-in {
          from {
            opacity: 0;
            transform: translateY(-4px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .user-dropdown-header {
          display: flex;
          align-items: center;
          gap: var(--space-3);
          padding: var(--space-4);
          border-bottom: 1px solid var(--border-soft);
        }
        .user-dropdown-name {
          font-size: var(--text-sm);
          color: var(--fg);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .user-dropdown-item {
          display: flex;
          align-items: center;
          gap: var(--space-3);
          padding: var(--space-2) var(--space-4);
          font-size: var(--text-sm);
          color: var(--fg-2);
          text-decoration: none;
          cursor: pointer;
          border: none;
          background: none;
          width: 100%;
          text-align: left;
        }
        .user-dropdown-item:hover {
          background: var(--bg);
          color: var(--fg);
        }
        .user-dropdown-divider {
          height: 1px;
          background: var(--border-soft);
          margin: var(--space-1) 0;
        }

        @media (max-width: 1023px) {
          .topbar-search {
            min-width: 160px;
          }
        }
        @media (max-width: 767px) {
          .topbar-search {
            min-width: 0;
            flex: 1;
            max-width: 200px;
          }
        }
      `}</style>
    </header>
  );
}
