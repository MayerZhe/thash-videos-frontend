'use client';

import { useEffect } from 'react';

export default function SubPageError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to console for debugging
    console.error('[SubPageError] Caught by error boundary:', error);
  }, [error]);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '60vh',
      padding: 'var(--space-8)',
      gap: 'var(--space-4)',
    }}>
      <div style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        padding: 'var(--space-8)',
        maxWidth: 600,
        width: '100%',
        textAlign: 'center',
      }}>
        <h2 style={{ color: 'var(--danger)', marginBottom: 'var(--space-3)', fontSize: 'var(--text-lg)' }}>
          页面加载出错
        </h2>
        <pre style={{
          background: 'var(--bg)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-md)',
          padding: 'var(--space-4)',
          fontSize: 'var(--text-xs)',
          fontFamily: 'var(--font-mono)',
          textAlign: 'left',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-all',
          maxHeight: 300,
          overflow: 'auto',
          color: 'var(--fg-2)',
        }}>
          {error.message || String(error)}
        </pre>
        {error.digest && (
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--meta)', marginTop: 'var(--space-2)' }}>
            Digest: {error.digest}
          </p>
        )}
        <button
          onClick={reset}
          style={{
            marginTop: 'var(--space-6)',
            padding: 'var(--space-2) var(--space-6)',
            background: 'var(--accent)',
            color: 'white',
            border: 'none',
            borderRadius: 'var(--radius-md)',
            cursor: 'pointer',
            fontSize: 'var(--text-sm)',
          }}
        >
          重试
        </button>
        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--meta)', marginTop: 'var(--space-3)' }}>
          请将上述错误信息截图发送给开发团队
        </p>
      </div>
    </div>
  );
}
