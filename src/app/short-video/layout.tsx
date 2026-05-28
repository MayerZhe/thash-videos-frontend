'use client';

import { useAppStore } from '@/stores/app';
import AppTopbar from '@/components/global/AppTopbar';
import VisualFactorySidebar from '@/components/global/VisualFactorySidebar';

export default function ShortVideoLayout({ children }: { children: React.ReactNode }) {
  const sidebarOpen = useAppStore((s) => s.sidebarOpen);
  const closeSidebar = useAppStore((s) => s.closeSidebar);

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar overlay backdrop (tablet/mobile) */}
      <div
        className={`sidebar-overlay-backdrop${sidebarOpen ? ' visible' : ''}`}
        onClick={closeSidebar}
        aria-hidden="true"
      />
      <VisualFactorySidebar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <AppTopbar />
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {children}
        </div>
      </div>
    </div>
  );
}
