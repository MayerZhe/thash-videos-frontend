'use client';

import { useRouter } from 'next/navigation';
import { useAppStore } from '@/stores/app';

const TOOL_MODES = [
  { key: 'edit', icon: 'E', label: '编辑' },
  { key: 'themes', icon: 'T', label: '主题' },
  { key: 'draw', icon: 'D', label: '绘图' },
  { key: 'comment', icon: 'C', label: '评论' },
  { key: 'inspect', icon: 'I', label: '检查' },
] as const;

interface TopbarProps {
  projectTitle?: string;
  episodeNum?: number;
  stageLabel?: string;
  stageProgress?: string;
}

export default function Topbar({ projectTitle, episodeNum, stageLabel, stageProgress }: TopbarProps) {
  const router = useRouter();
  const {
    agentDialogOpen, setAgentDialogOpen,
    rightPanelOpen, rightPanelTab, setRightPanelOpen, setRightPanelTab,
    drawMode, setDrawMode,
  } = useAppStore();

  const handleToolMode = (key: string) => {
    switch (key) {
      case 'edit':
        setAgentDialogOpen(!agentDialogOpen);
        break;
      case 'themes':
        if (rightPanelOpen && rightPanelTab === 'theme') {
          setRightPanelOpen(false);
        } else {
          setRightPanelOpen(true);
          setRightPanelTab('theme');
        }
        break;
      case 'draw':
        setDrawMode(!drawMode);
        break;
      case 'comment':
        if (rightPanelOpen && rightPanelTab === 'comments') {
          setRightPanelOpen(false);
        } else {
          setRightPanelOpen(true);
          setRightPanelTab('comments');
        }
        break;
      case 'inspect':
        if (rightPanelOpen && rightPanelTab === 'inspect') {
          setRightPanelOpen(false);
        } else {
          setRightPanelOpen(true);
          setRightPanelTab('inspect');
        }
        break;
    }
  };

  const isToolActive = (key: string) => {
    switch (key) {
      case 'edit': return agentDialogOpen;
      case 'themes': return rightPanelOpen && rightPanelTab === 'theme';
      case 'draw': return drawMode;
      case 'comment': return rightPanelOpen && rightPanelTab === 'comments';
      case 'inspect': return rightPanelOpen && rightPanelTab === 'inspect';
      default: return false;
    }
  };

  return (
    <header className="studio-topbar">
      <div className="studio-topbar-main">
        <button className="topbar-back" onClick={() => router.back()}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          返回
        </button>

        {/* Tool mode buttons */}
        <div className="tool-modes">
          {TOOL_MODES.map((t) => (
            <button
              key={t.key}
              className={`tool-mode-btn ${isToolActive(t.key) ? 'active' : ''}`}
              onClick={() => handleToolMode(t.key)}
              title={t.label}
            >
              {t.icon}
              <span className={`tool-badge ${isToolActive(t.key) ? 'show' : ''}`} />
            </button>
          ))}
        </div>

        {/* Studio identity */}
        <div className="studio-identity">
          <span className="studio-title">{projectTitle || '未命名项目'}</span>
          {episodeNum != null && (
            <span className="studio-episode-chip">第 {episodeNum} 集</span>
          )}
          <div className="studio-meta-row">
            {stageLabel && (
              <span className="studio-meta-pill is-progress">{stageLabel}</span>
            )}
            {stageProgress && (
              <span className="studio-meta-inline">{stageProgress}</span>
            )}
          </div>
        </div>
      </div>

      <div className="studio-actions">
        <button className="btn btn-ghost btn-sm" onClick={() => router.refresh()}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="23 4 23 10 17 10" />
            <path d="M20.49 15a9 9 0 11-2.12-9.36L23 10" />
          </svg>
        </button>
        <button className="btn btn-primary btn-sm">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
          </svg>
          开始制作
        </button>
      </div>
    </header>
  );
}
