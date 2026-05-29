'use client';

import { Suspense, useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/stores/auth';
import { authApi, ApiError, BASE_URL } from '@/lib/api';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setAuth, isAuthenticated } = useAuthStore();
  const redirectTo = searchParams.get('redirect') || '/dashboard';
  const [mode, setMode] = useState<'credentials' | 'oauth'>('oauth');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expiredBanner, setExpiredBanner] = useState(false);

  // Redirect to dashboard if already logged in
  useEffect(() => {
    if (isAuthenticated()) {
      router.push(redirectTo);
    }
  }, []);

  // Check for session expired flag from 401 interceptor
  useEffect(() => {
    if (typeof window !== 'undefined' && sessionStorage.getItem('thash_session_expired') === '1') {
      sessionStorage.removeItem('thash_session_expired');
      setExpiredBanner(true);
    }
  }, []);

  async function handleCredentialsSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await authApi.login({ email, password });
      const expiresInMs = rememberMe ? 30 * 24 * 60 * 60 * 1000 : undefined;
      setAuth(res.user, res.token, expiresInMs);
      router.push(redirectTo);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('登录失败，请稍后重试');
      }
    } finally {
      setLoading(false);
    }
  }

  function handleOAuth(provider: 'google' | 'github') {
    window.location.href = `${BASE_URL}/api/v1/auth/oauth/${provider}`;
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        {expiredBanner && (
          <div className="session-expired-banner">
            登录已过期，请重新登录
          </div>
        )}
        <div className="auth-header">
          <h2>登录 Thash.videos</h2>
          <p className="body-muted">AI 短剧创作平台</p>
        </div>

        {mode === 'oauth' && (
          <div className="stack-3 oauth-section">
            <button
              className="btn btn-primary oauth-btn"
              onClick={() => handleOAuth('google')}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              使用 Google 账号登录
            </button>
            <button
              className="btn btn-primary oauth-btn"
              onClick={() => handleOAuth('github')}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
              使用 GitHub 账号登录
            </button>
            <div className="auth-divider">
              <span>或</span>
            </div>
            <button className="btn btn-ghost btn-sm" onClick={() => setMode('credentials')} style={{ alignSelf: 'center' }}>
              使用邮箱密码登录
            </button>
          </div>
        )}

        {mode === 'credentials' && (
          <form className="stack-4" onSubmit={handleCredentialsSubmit}>
            <div className="field">
              <label htmlFor="email">邮箱</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                autoComplete="email"
              />
            </div>
            <div className="field">
              <label htmlFor="password">密码</label>
              <div style={{ position: 'relative' }}>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', padding: 4, lineHeight: 1, fontSize: 16 }}>
                  {showPassword ? '🙈' : '👁'}
                </button>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div className="field" style={{ flexDirection: 'row', alignItems: 'center', gap: 'var(--space-3)' }}>
                <input id="remember" type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)}
                  style={{ width: 16, height: 16, accentColor: 'var(--accent)' }} />
                <label htmlFor="remember" style={{ fontWeight: 400, fontSize: 'var(--text-sm)', color: 'var(--fg-2)', margin: 0 }}>
                  保持登录状态
                </label>
              </div>
              <a href="#" style={{ fontSize: 'var(--text-sm)', color: 'var(--muted)', textDecoration: 'underline', textUnderlineOffset: 2, whiteSpace: 'nowrap' }}
                 onClick={(e) => { e.preventDefault(); setError('密码重置功能即将上线'); }}>
                忘记密码？
              </a>
            </div>
            {error && <p className="field-error">{error}</p>}
            <button type="submit" className="btn btn-brand" disabled={loading} style={{ justifyContent: 'center' }}>
              {loading ? '登录中...' : '登录'}
            </button>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setMode('oauth')} style={{ alignSelf: 'center' }}>
              返回 OAuth 登录
            </button>
          </form>
        )}

        <div className="auth-footer">
          <span className="body-muted">还没有账号？</span>
          <Link href="/register">立即注册</Link>
        </div>
      </div>

      <style jsx global>{`
        .auth-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--bg);
          padding: var(--space-4);
        }
        .auth-card {
          width: 100%;
          max-width: 400px;
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius-lg);
          padding: var(--space-8);
          display: flex;
          flex-direction: column;
          gap: var(--space-6);
        }
        .auth-header {
          text-align: center;
        }
        .auth-header h2 {
          margin-bottom: var(--space-2);
        }
        .oauth-section {
          display: flex;
          flex-direction: column;
          gap: var(--space-3);
        }
        .oauth-btn {
          width: 100%;
          justify-content: center;
          gap: var(--space-3);
          padding: var(--space-3) var(--space-4);
        }
        .auth-divider {
          display: flex;
          align-items: center;
          gap: var(--space-3);
        }
        .auth-divider::before,
        .auth-divider::after {
          content: '';
          flex: 1;
          height: 1px;
          background: var(--border);
        }
        .auth-divider span {
          font-size: var(--text-xs);
          color: var(--muted);
        }
        .session-expired-banner {
          width: 100%;
          padding: var(--space-3) var(--space-4);
          background: color-mix(in oklab, var(--warning, #f59e0b), var(--bg) 85%);
          border: 1px solid var(--warning, #f59e0b);
          border-radius: var(--radius-sm);
          color: var(--warning, #f59e0b);
          font-size: var(--text-sm);
          text-align: center;
        }
        .field-error {
          font-size: var(--text-xs);
          color: var(--danger);
        }
        .auth-footer {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: var(--space-2);
          font-size: var(--text-sm);
        }
      `}</style>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="auth-page">
          <div className="auth-card">
            <div className="auth-header">
              <h2>加载中...</h2>
            </div>
          </div>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}