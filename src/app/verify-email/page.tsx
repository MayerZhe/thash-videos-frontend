'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { authApi, ApiError } from '@/lib/api';

export default function VerifyEmailPage() {
  const router = useRouter();
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resendLoading, setResendLoading] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Get user_id from session storage (set by register flow)
  const userId = typeof window !== 'undefined' ? sessionStorage.getItem('thash_pending_user_id') : null;

  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  function handleChange(index: number, value: string) {
    if (!/^[0-9]?$/.test(value)) return;
    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
    const full = newCode.join('');
    if (full.length === 6) {
      handleVerify(full);
    }
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    const newCode = [...code];
    for (let i = 0; i < pasted.length; i++) {
      newCode[i] = pasted[i];
    }
    setCode(newCode);
    if (pasted.length === 6) {
      handleVerify(pasted);
    } else {
      inputRefs.current[Math.min(pasted.length, 5)]?.focus();
    }
  }

  async function handleVerify(fullCode: string) {
    if (!userId) {
      setError('会话已过期，请重新注册');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const res = await authApi.verifyEmail({ user_id: userId, code: fullCode });
      if (res.verified) {
        sessionStorage.removeItem('thash_pending_user_id');
        router.push('/login');
      } else {
        setError('验证码错误，请重新输入');
        setCode(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      }
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('验证失败，请稍后重试');
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    if (!userId || resendCooldown > 0) return;
    setResendLoading(true);
    try {
      await authApi.resendVerification({ user_id: userId });
      setResendCooldown(60);
    } catch {
      setError('重发失败，请稍后重试');
    } finally {
      setResendLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <h2>验证邮箱</h2>
          <p className="body-muted">请输入发送到您邮箱的 6 位验证码</p>
        </div>

        <div className="verify-form stack-4">
          <div className="code-inputs" onPaste={handlePaste}>
            {code.map((digit, i) => (
              <input
                key={i}
                ref={(el) => { inputRefs.current[i] = el; }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                className="code-digit"
                disabled={loading}
                autoFocus={i === 0}
              />
            ))}
          </div>

          {error && <p className="field-error">{error}</p>}

          <button
            className="btn btn-brand"
            onClick={() => handleVerify(code.join(''))}
            disabled={loading || code.join('').length < 6}
            style={{ justifyContent: 'center' }}
          >
            {loading ? '验证中...' : '验证'}
          </button>

          <div className="resend-row">
            {resendCooldown > 0 ? (
              <span className="body-meta">
                {resendCooldown}s 后可重发
              </span>
            ) : (
              <button
                className="btn btn-ghost btn-sm"
                onClick={handleResend}
                disabled={resendLoading}
              >
                {resendLoading ? '发送中...' : '重新发送验证码'}
              </button>
            )}
          </div>
        </div>

        <div className="auth-footer">
          <Link href="/login">← 前往登录</Link>
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
        .verify-form {
          display: flex;
          flex-direction: column;
          gap: var(--space-4);
        }
        .code-inputs {
          display: flex;
          gap: var(--space-3);
          justify-content: center;
        }
        .code-digit {
          width: 48px;
          height: 56px;
          text-align: center;
          font-size: var(--text-xl);
          font-family: var(--font-mono);
          background: var(--bg);
          border: 1px solid var(--border);
          border-radius: var(--radius-sm);
          color: var(--fg);
          outline: none;
          transition: border-color var(--motion-fast);
        }
        .code-digit:focus {
          border-color: var(--accent);
          box-shadow: var(--focus-ring);
        }
        .field-error {
          font-size: var(--text-xs);
          color: var(--danger);
          text-align: center;
        }
        .resend-row {
          text-align: center;
        }
        .auth-footer {
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: var(--text-sm);
        }
      `}</style>
    </div>
  );
}