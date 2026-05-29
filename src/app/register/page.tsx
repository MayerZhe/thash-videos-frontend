'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth';
import { authApi, ApiError } from '@/lib/api';

export default function RegisterPage() {
  const router = useRouter();
  const { isAuthenticated, setAuth } = useAuthStore();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Redirect to dashboard if already logged in
  useEffect(() => {
    if (isAuthenticated()) {
      router.push('/dashboard');
    }
  }, []);

  function validatePassword(): string | null {
    if (password.length < 8) return '密码至少 8 位';
    if (!/[A-Z]/.test(password)) return '密码需包含至少一个大写字母';
    if (!/[0-9]/.test(password)) return '密码需包含至少一个数字';
    if (password !== confirmPassword) return '两次密码不一致';
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const validationError = validatePassword();
    if (validationError) {
      setError(validationError);
      return;
    }
    if (!agreed) {
      setError('请同意服务条款和隐私政策');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const registerRes = await authApi.register({ email, password, name });
      // Auto-login: use token from register response if available, otherwise call login
      if (registerRes.token) {
        setAuth(registerRes.user, registerRes.token);
      } else {
        const loginRes = await authApi.login({ email, password });
        setAuth(loginRes.user, loginRes.token);
      }
      router.push('/dashboard');
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('注册失败，请稍后重试');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <h2>注册 Thash.videos</h2>
          <p className="body-muted">开启 AI 短剧创作之旅</p>
        </div>

        <form className="stack-4" onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="name">显示名称</label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="你的创作别名"
              required
              minLength={2}
              maxLength={50}
            />
          </div>
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
                placeholder="至少 8 位，含大小写字母和数字"
                required
                minLength={8}
                autoComplete="new-password"
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)}
                style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', padding: 4, lineHeight: 1, fontSize: 16 }}>
                {showPassword ? '🙈' : '👁'}
              </button>
            </div>
            {password.length > 0 && (
              <div style={{ marginTop: 4 }}>
                <div style={{ display: 'flex', gap: 4, marginBottom: 2 }}>
                  {[1, 2, 3].map(i => {
                    const level = password.length >= 8 && /[A-Z]/.test(password) && /[0-9]/.test(password) ? 3
                      : password.length >= 6 && (/[A-Z]/.test(password) || /[0-9]/.test(password)) ? 2 : 1;
                    const filled = i <= level;
                    return (
                      <div key={i} style={{
                        flex: 1, height: 4, borderRadius: 2,
                        background: filled ? (level === 3 ? 'var(--success)' : level === 2 ? '#f59e0b' : 'var(--danger)') : 'var(--border)',
                      }} />
                    );
                  })}
                </div>
                <span style={{ fontSize: 10, color: 'var(--muted)' }}>
                  {password.length >= 8 && /[A-Z]/.test(password) && /[0-9]/.test(password)
                    ? '强' : password.length >= 6 ? '中' : '弱'}{' '}
                  · 至少 8 位，含大写字母和数字
                </span>
              </div>
            )}
          </div>
          <div className="field">
            <label htmlFor="confirmPassword">确认密码</label>
            <div style={{ position: 'relative' }}>
              <input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="再次输入密码"
                required
                autoComplete="new-password"
              />
              <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', padding: 4, lineHeight: 1, fontSize: 16 }}>
                {showConfirmPassword ? '🙈' : '👁'}
              </button>
            </div>
          </div>
          <div className="field" style={{ flexDirection: 'row', alignItems: 'center', gap: 'var(--space-3)' }}>
            <input
              id="agree"
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              style={{ width: 16, height: 16, accentColor: 'var(--accent)' }}
            />
            <label htmlFor="agree" style={{ fontWeight: 400, fontSize: 'var(--text-sm)', color: 'var(--fg-2)', margin: 0 }}>
              我已阅读并同意 <span>服务条款</span> 和 <span>隐私政策</span>
            </label>
          </div>
          {error && <p className="field-error">{error}</p>}
          <button type="submit" className="btn btn-brand" disabled={loading} style={{ justifyContent: 'center' }}>
            {loading ? '注册中...' : '创建账号'}
          </button>
        </form>

        <div className="auth-footer">
          <span className="body-muted">已有账号？</span>
          <Link href="/login">立即登录</Link>
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