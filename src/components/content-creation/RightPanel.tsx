'use client';

import { useState } from 'react';
import { useAppStore } from '@/stores/app';
import type { ThemeId } from '@/lib/types';
import VisualDirectionSelector from './VisualDirectionSelector';
import ReviewPanel from './ReviewPanel';
import QACritiquePanel from './QACritiquePanel';

const THEMES: { key: ThemeId; label: string; colors: string[] }[] = [
  { key: 'cinematic', label: '电影写实', colors: ['#1a1a2e', '#16213e', '#0f3460', '#e94560'] },
  { key: 'anime', label: '动漫渲染', colors: ['#2d1b69', '#6b3fa0', '#ff6b6b', '#ffd93d'] },
  { key: 'watercolor', label: '水墨国风', colors: ['#1a1a1a', '#2d2d2d', '#8b9d83', '#c4a882'] },
  { key: 'dark', label: '暗黑美学', colors: ['#0a0a0a', '#1a1a1a', '#3d0000', '#8b0000'] },
  { key: 'warm', label: '田园暖调', colors: ['#2c1810', '#5c3a2e', '#d4a574', '#f5deb3'] },
];

export default function RightPanel() {
  const {
    rightPanelOpen, rightPanelTab, setRightPanelTab, setRightPanelOpen,
    activeTheme, setActiveTheme,
    reviewPointActive,
  } = useAppStore();

  const [comments, setComments] = useState<Array<{ id: number; text: string; stage: string; resolved: boolean }>>([]);
  const [newComment, setNewComment] = useState('');
  const [commentStage, setCommentStage] = useState('all');

  if (!rightPanelOpen) return null;

  return (
    <>
      {/* Backdrop for mobile bottom sheet */}
      <div className="right-panel-backdrop" onClick={() => setRightPanelOpen(false)} />

      <div className="right-panel w-[360px] flex-shrink-0 bg-surface border-l border-border flex flex-col overflow-hidden">
        {/* Drag handle for mobile bottom sheet */}
        <div className="right-panel-handle">
          <div className="right-panel-handle-bar" />
        </div>

        {/* Mobile close button */}
        <button className="right-panel-close-btn" onClick={() => setRightPanelOpen(false)} aria-label="关闭面板">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        {/* Tabs — Phase 2: added review + qa tabs */}
        <div className="flex border-b border-border-soft">
          {(['theme', 'inspect', 'comments', 'review', 'qa'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setRightPanelTab(tab as never)}
              className={`py-3 text-[11px] font-medium transition-all border-b-2 flex-1
                ${rightPanelTab === tab
                  ? 'text-accent border-accent'
                  : 'text-muted border-transparent hover:text-fg-2'
                }`}
            >
              {tab === 'theme' ? '主题'
                : tab === 'inspect' ? '检查'
                : tab === 'comments' ? '评论'
                : tab === 'review' ? (
                  <span className="flex items-center justify-center gap-1">
                    审查
                    {reviewPointActive && (
                      <span className="w-1.5 h-1.5 rounded-full bg-error animate-pulse" />
                    )}
                  </span>
                )
                : 'QA'}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {/* ── Theme Tab (Phase 2: VisualDirectionSelector) ── */}
          {rightPanelTab === 'theme' && (
            <VisualDirectionSelector />
          )}

          {/* ── Inspect Tab ── */}
          {rightPanelTab === 'inspect' && (
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-fg mb-4">检查面板</h4>
              <p className="text-sm text-muted">
                点击主画布中的任意角色、场景或分镜卡片，此处将显示详情。
              </p>
              <div className="bg-bg border border-border rounded-sm p-4">
                <p className="text-xs text-muted">选中项详情将在此显示</p>
              </div>
            </div>
          )}

          {/* ── Comments Tab ── */}
          {rightPanelTab === 'comments' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-medium text-fg">评论</h4>
                <select
                  value={commentStage}
                  onChange={(e) => setCommentStage(e.target.value)}
                  className="text-xs bg-bg border border-border rounded-sm px-2 py-1 text-fg-2 outline-none"
                >
                  <option value="all">全部阶段</option>
                  <option value="script">剧本</option>
                  <option value="characters">角色</option>
                  <option value="storyboard">分镜</option>
                </select>
              </div>

              {/* Comment list */}
              {comments.length === 0 ? (
                <p className="text-sm text-muted py-8 text-center">暂无评论</p>
              ) : (
                <div className="space-y-3">
                  {comments.map((c) => (
                    <div key={c.id} className={`bg-bg border border-border-soft rounded-sm p-3 ${c.resolved ? 'opacity-50' : ''}`}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="badge badge-muted text-[10px]">{c.stage}</span>
                        <label className="flex items-center gap-1 text-[10px] text-muted cursor-pointer">
                          <input
                            type="checkbox"
                            checked={c.resolved}
                            onChange={() => {
                              setComments((prev) =>
                                prev.map((x) => x.id === c.id ? { ...x, resolved: !x.resolved } : x)
                              );
                            }}
                            className="w-3 h-3"
                          />
                          已解决
                        </label>
                      </div>
                      <p className="text-xs text-fg-2">{c.text}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* New comment input */}
              <div className="flex gap-2 pt-4 border-t border-border-soft">
                <input
                  type="text"
                  placeholder="添加评论..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="flex-1 text-xs bg-bg border border-border rounded-sm px-3 py-2 text-fg-2 outline-none focus:border-accent placeholder:text-meta"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && newComment.trim()) {
                      setComments((prev) => [...prev, {
                        id: Date.now(),
                        text: newComment.trim(),
                        stage: commentStage === 'all' ? 'source_content' : commentStage,
                        resolved: false,
                      }]);
                      setNewComment('');
                    }
                  }}
                />
                <button
                  className="btn btn-brand btn-sm"
                  onClick={() => {
                    if (newComment.trim()) {
                      setComments((prev) => [...prev, {
                        id: Date.now(),
                        text: newComment.trim(),
                        stage: commentStage === 'all' ? 'source_content' : commentStage,
                        resolved: false,
                      }]);
                      setNewComment('');
                    }
                  }}
                >
                  发送
                </button>
              </div>
            </div>
          )}

          {/* ── Review Tab (Phase 2: ReviewPanel) ── */}
          {rightPanelTab === 'review' && (
            <ReviewPanel />
          )}

          {/* ── QA Tab (Phase 2: QACritiquePanel) ── */}
          {rightPanelTab === 'qa' && (
            <QACritiquePanel />
          )}
        </div>
      </div>

      <style jsx global>{`
        /* Mobile right panel: bottom sheet */
        .right-panel-handle {
          display: none;
        }
        .right-panel-close-btn {
          display: none;
        }
        .right-panel-backdrop {
          display: none;
        }

        @media (max-width: 767px) {
          .right-panel-backdrop {
            display: block;
            position: fixed;
            inset: 0;
            z-index: 95;
            background: rgba(0, 0, 0, 0.5);
            animation: fadeIn var(--motion-fast) var(--ease-standard);
          }
          .right-panel {
            position: fixed;
            top: auto;
            bottom: 0;
            left: 0;
            right: 0;
            z-index: 100;
            width: 100vw;
            max-width: 100vw;
            height: 65vh;
            border-left: none;
            border-top: 1px solid var(--border);
            border-radius: var(--radius-lg) var(--radius-lg) 0 0;
            animation: slideUpDrawer var(--motion-base) var(--ease-standard);
          }
          .right-panel-handle {
            display: flex;
            justify-content: center;
            padding: var(--space-2) 0;
          }
          .right-panel-handle-bar {
            width: 32px;
            height: 4px;
            border-radius: 2px;
            background: var(--border);
          }
          .right-panel-close-btn {
            display: flex;
            align-items: center;
            justify-content: center;
            position: absolute;
            top: var(--space-2);
            right: var(--space-3);
            width: 36px;
            height: 36px;
            padding: 0;
            border: none;
            background: transparent;
            color: var(--muted);
            cursor: pointer;
            border-radius: var(--radius-sm);
            z-index: 1;
          }
        }
      `}</style>
    </>
  );
}
