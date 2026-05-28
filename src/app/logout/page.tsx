'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth';
import { authApi } from '@/lib/api';

export default function LogoutPage() {
  const router = useRouter();
  const { clearAuth } = useAuthStore();

  useEffect(() => {
    async function logout() {
      try {
        await authApi.logout();
      } catch {
        // Ignore errors, always clear local auth
      }
      clearAuth();
      router.push('/landing');
    }
    logout();
  }, [clearAuth, router]);

  return (
    <div className="auth-page">
      <div className="auth-card" style={{ textAlign: 'center' }}>
        <div className="loading-spinner" />
        <p className="body-muted">正在退出...</p>
      </div>
      <style jsx global>{`
        .auth-page { min-height: 100vh; display: flex; align-items: center; justify-content: center; background: var(--bg); padding: var(--space-4); }
        .auth-card { width: 100%; max-width: 400px; background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-lg); padding: var(--space-8); display: flex; flex-direction: column; gap: var(--space-6); align-items: center; }
        .loading-spinner { width: 32px; height: 32px; border: 2px solid var(--border); border-top-color: var(--accent); border-radius: 50%; animation: spin 0.8s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}