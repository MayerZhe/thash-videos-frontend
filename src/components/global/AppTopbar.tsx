'use client';

import Link from 'next/link';
import { useAppStore } from '@/stores/app';
import { useAuthStore } from '@/stores/auth';
import UserDropdown from './UserDropdown';

export default function AppTopbar() {
  const showSearch = true;
  const toggleSidebar = useAppStore((s) => s.toggleSidebar);
  const activeProjectId = useAppStore((s) => s.activeProjectId);
  const user = useAuthStore((s) => s.user);

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
          href={activeProjectId ? `/short-series/projects/${activeProjectId}/collab` : '#'}
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
        {user ? (
          <UserDropdown user={user} />
        ) : (
          <div className="avatar" style={{ width: 32, height: 32, fontSize: 12 }}>
            CS
          </div>
        )}
      </div>

      <style jsx global>{`
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
