'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/stores/auth';
import type { User } from '@/lib/types';

const PLAN_LABELS: Record<string, string> = {
  free: 'Free',
  starter: 'Starter',
  pro: 'Pro',
  enterprise: 'Enterprise',
};

export default function UserDropdown({ user }: { user: User }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div style={{ position: 'relative' }} ref={ref}>
      <button
        className="topbar-avatar-btn avatar"
        onClick={() => setOpen(!open)}
        aria-label="用户菜单"
      >
        {user.display_name?.charAt(0)?.toUpperCase() || user.name?.charAt(0)?.toUpperCase() || '?'}
      </button>
      {open && (
        <div className="user-dropdown">
          <div className="user-dropdown-header">
            <div className="avatar" style={{ width: 32, height: 32, fontSize: 12 }}>
              {user.display_name?.charAt(0)?.toUpperCase() || user.name?.charAt(0)?.toUpperCase() || '?'}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="user-dropdown-name">{user.display_name || user.name}</div>
              <div style={{ fontSize: 11, color: 'var(--muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user.email}
              </div>
              <span className="badge badge-accent" style={{ fontSize: 10, padding: '1px 6px' }}>
                {PLAN_LABELS[user.plan] || user.plan}
              </span>
            </div>
          </div>
          <Link href="/short-series/projects" className="user-dropdown-item" onClick={() => setOpen(false)}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 3h18v18H3z M3 9h18 M9 21V9" />
            </svg>
            短剧工厂
          </Link>
          <Link href="/credits" className="user-dropdown-item" onClick={() => setOpen(false)}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 1v22 M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
            </svg>
            Credits
          </Link>
          <Link href="/usage" className="user-dropdown-item" onClick={() => setOpen(false)}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 20V10 M12 20V4 M6 20v-6" />
            </svg>
            用量统计
          </Link>
          <Link href="/settings" className="user-dropdown-item" onClick={() => setOpen(false)}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 15a3 3 0 100-6 3 3 0 000 6z M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l-.06-.06a2 2 0 012.83 2.83l.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
            </svg>
            账号设置
          </Link>
          <div className="user-dropdown-divider" />
          <button
            className="user-dropdown-item"
            onClick={() => {
              useAuthStore.getState().clearAuth();
              window.location.href = '/landing';
            }}
            style={{ width: '100%', textAlign: 'left' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4 M16 17l5-5-5-5 M21 12H9" />
            </svg>
            退出登录
          </button>
        </div>
      )}

      <style jsx global>{`
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
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
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
        .topbar-avatar-btn {
          cursor: pointer;
          color: #fff;
        }
      `}</style>
    </div>
  );
}
