'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { authApi, ApiError } from '@/lib/api';

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      const res = await authApi.register({ email, password, name });
      sessionStorage.setItem('thash_pending_email', email);
      sessionStorage.setItem('thash_pending_user_id', res.user.id);
      router.push('/verify-email');
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
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="至少 8 位，含大小写字母和数字"
              required
              minLength={8}
              autoComplete="new-password"
            />
          </div>
          <div className="field">
            <label htmlFor="confirmPassword">确认密码</label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="再次输入密码"
              required
              autoComplete="new-password"
            />
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