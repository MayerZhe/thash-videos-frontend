'use client';

import { useEffect } from 'react';
import AppTopbar from '@/components/global/AppTopbar';
import { ToastProvider } from '@/components/global/Toast';
import { useAuthStore } from '@/stores/auth';

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  const { initialized } = useAuthStore();

  useEffect(() => {
    useAuthStore.getState().initialize();
  }, []);

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
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <AppTopbar />
        <div className="app-content" style={{ flex: 1 }}>
          {children}
        </div>
      </div>
    </ToastProvider>
  );
}
