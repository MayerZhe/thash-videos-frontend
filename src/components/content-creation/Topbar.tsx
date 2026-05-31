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

  const isRunning = stageProgress != null;

  return (
    <header className="topbar">
      {/* Brand */}
      <a className="topbar-brand" href="/short-series/projects">
        <div style={{ width: 28, height: 28, borderRadius: 6, background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-on)', fontSize: 13, fontWeight: 700 }}>
          Th
        </div>
        <span>视觉工厂</span>
      </a>

      <div className="topbar-divider" />

      {/* Project title */}
      <div className="topbar-title">{projectTitle || '未命名项目'}</div>

      {/* Status indicator */}
      <div className="topbar-status">
        <div className={`status-dot ${isRunning ? 'running' : 'idle'}`} />
        <span>{stageProgress ? `${stageLabel} ${stageProgress}` : '就绪'}</span>
      </div>

      {/* Episode chip */}
      {episodeNum != null && (
        <span className="studio-episode-chip">第 {episodeNum} 集</span>
      )}

      {/* Tool mode buttons */}
      <div className="tool-modes" style={{ marginLeft: 12 }}>
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

      <div style={{ flex: 1 }} />

      {/* Actions — prototype pattern */}
      <div style={{ display: 'flex', gap: 6 }}>
        <button className="topbar-btn" onClick={() => setAgentDialogOpen(!agentDialogOpen)}>
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M8 2l1.5 3 3.3.5-2.4 2.3.6 3.2L8 9.5 4.5 11l.6-3.2L3.2 5.5 6.5 5z"/></svg>
          技能库
        </button>
        <button className="topbar-btn" onClick={() => router.push('/short-series/projects')}>
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="8" cy="8" r="2.5"/><path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.3 3.3l1.4 1.4M11.3 11.3l1.4 1.4M3.3 12.7l1.4-1.4M11.3 4.7l1.4-1.4"/></svg>
          设置
        </button>
        <button className="topbar-btn primary" onClick={() => setAgentDialogOpen(true)}>
          <svg viewBox="0 0 16 16" fill="currentColor"><path d="M4 2l10 6-10 6V2z"/></svg>
          一键生成
        </button>
      </div>
    </header>
  );
}
