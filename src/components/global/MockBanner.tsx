'use client';

import { useEffect, useState } from 'react';

const BACKEND_UNREACHABLE = '__backend_unreachable__';

// Build-time constant — Next.js inlines process.env.NEXT_PUBLIC_* at build time
const IS_MOCK_MODE = process.env.NEXT_PUBLIC_MOCK_API === 'true';

export default function MockBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!IS_MOCK_MODE) return;

    if (typeof window !== 'undefined' && (window as any)[BACKEND_UNREACHABLE]) {
      setVisible(true);
      return;
    }

    const id = setInterval(() => {
      if ((window as any)[BACKEND_UNREACHABLE]) {
        setVisible(true);
        clearInterval(id);
      }
    }, 5000);

    return () => clearInterval(id);
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] bg-amber-500/90 text-center py-1.5 text-xs font-medium text-white">
      开发模式 · 后端服务不可达 · 显示模拟数据
    </div>
  );
}
