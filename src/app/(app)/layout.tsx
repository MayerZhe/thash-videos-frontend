'use client';

import { useEffect } from 'react';
import AppSidebar from '@/components/global/AppSidebar';
import AppTopbar from '@/components/global/AppTopbar';
import { ToastProvider } from '@/components/global/Toast';
import { useAuthStore } from '@/stores/auth';
import { useAppStore } from '@/stores/app';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { initialized } = useAuthStore();
  const sidebarOpen = useAppStore((s) => s.sidebarOpen);
  const closeSidebar = useAppStore((s) => s.closeSidebar);

  useEffect(() => {
    useAuthStore.getState().initialize();
  }, []);

  // Lock body scroll when sidebar overlay is open on mobile/tablet
  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [sidebarOpen]);

  if (!initialized) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
        <div className="loading-spinner" />
        <style jsx global>{`
          .loading-spinner { width: 32px; height: 32px; border: 2px solid var(--border); border-top-color: var(--accent); border-radius: 50%; animation: spin 0.8s linear infinite; }
          @keyframes spin { to { transform: rotate(360deg); } }
        `}</style>
      </div>
    );
  }

  return (
    <ToastProvider>
      <div style={{ display: 'flex', minHeight: '100vh' }}>
        {/* Sidebar overlay backdrop (tablet/mobile) */}
        <div
          className={`sidebar-overlay-backdrop${sidebarOpen ? ' visible' : ''}`}
          onClick={closeSidebar}
          aria-hidden="true"
        />
        <AppSidebar />
        <div className="app-main">
          <AppTopbar />
          <div className="app-content">
            {children}
          </div>
        </div>
      </div>
    </ToastProvider>
  );
}