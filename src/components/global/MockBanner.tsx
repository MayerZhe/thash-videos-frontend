'use client';

import { useEffect, useState } from 'react';

const BACKEND_UNREACHABLE = '__backend_unreachable__';

export default function MockBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Check immediately (flag may already be set by a prior API call)
    if (typeof window !== 'undefined' && (window as any)[BACKEND_UNREACHABLE]) {
      setVisible(true);
      return;
    }

    // Poll intermittently in case mock fallback is triggered later
    const id = setInterval(() => {
      if (typeof window !== 'undefined' && (window as any)[BACKEND_UNREACHABLE]) {
        setVisible(true);
        clearInterval(id);
      }
    }, 500);

    return () => clearInterval(id);
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] bg-amber-500/90 text-center py-1.5 text-xs font-medium text-white">
      开发模式 · 后端服务不可达 · 显示模拟数据
    </div>
  );
}
