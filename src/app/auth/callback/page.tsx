'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth';
import { BASE_URL } from '@/lib/api';
import type { User } from '@/lib/types';

function AuthCallbackInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const [status, setStatus] = useState<'loading' | 'error'>('loading');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    async function handleCallback() {
      const token = searchParams.get('token');
      const error = searchParams.get('error');

      if (error) {
        setStatus('error');
        setErrorMsg('OAuth 登录失败，请重试');
        return;
      }

      if (!token) {
        setStatus('error');
        setErrorMsg('无效的回调链接');
        return;
      }

      try {
        const res = await fetch(`${BASE_URL}/api/v1/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error('Failed to fetch user');
        const user: User = await res.json();
        setAuth(user, token);
        router.push('/dashboard');
      } catch {
        setStatus('error');
        setErrorMsg('获取用户信息失败，请重试');
      }
    }

    handleCallback();
  }, [searchParams, setAuth, router]);

  if (status === 'error') {
    return (
      <div className="auth-page">
        <div className="auth-card" style={{ textAlign: 'center' }}>
          <p className="text-danger" style={{ marginBottom: 'var(--space-4)' }}>{errorMsg}</p>
          <button className="btn btn-brand" onClick={() => router.push('/login')}>
            返回登录
          </button>
        </div>
        <style jsx global>{`
          .auth-page { min-height: 100vh; display: flex; align-items: center; justify-content: center; background: var(--bg); padding: var(--space-4); }
          .auth-card { width: 100%; max-width: 400px; background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-lg); padding: var(--space-8); display: flex; flex-direction: column; gap: var(--space-6); align-items: center; }
        `}</style>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-card" style={{ textAlign: 'center' }}>
        <div className="loading-spinner" />
        <p className="body-muted">正在登录...</p>
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

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="auth-page">
        <div className="auth-card" style={{ textAlign: 'center' }}>
          <div className="loading-spinner" />
          <p className="body-muted">正在登录...</p>
        </div>
        <style jsx global>{`
          .auth-page { min-height: 100vh; display: flex; align-items: center; justify-content: center; background: var(--bg); padding: var(--space-4); }
          .auth-card { width: 100%; max-width: 400px; background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-lg); padding: var(--space-8); display: flex; flex-direction: column; gap: var(--space-6); align-items: center; }
          .loading-spinner { width: 32px; height: 32px; border: 2px solid var(--border); border-top-color: var(--accent); border-radius: 50%; animation: spin 0.8s linear infinite; }
          @keyframes spin { to { transform: rotate(360deg); } }
        `}</style>
      </div>
    }>
      <AuthCallbackInner />
    </Suspense>
  );
}