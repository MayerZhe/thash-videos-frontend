import type { Metadata } from 'next';
import './globals.css';
import MockBanner from '@/components/global/MockBanner';

export const metadata: Metadata = {
  title: 'Thash.videos · AI 短剧创作平台',
  description: '输入一句创意，AI 自动生成带配音、字幕、BGM 的完整短剧',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body>
        <MockBanner />
        {children}
      </body>
    </html>
  );
}
