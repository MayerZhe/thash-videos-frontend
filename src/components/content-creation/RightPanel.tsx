'use client';

import { useState } from 'react';
import { useAppStore } from '@/stores/app';
import type { ThemeId } from '@/lib/types';
import VisualDirectionSelector from './VisualDirectionSelector';
import ReviewPanel from './ReviewPanel';
import QACritiquePanel from './QACritiquePanel';

const THEMES: { key: ThemeId; label: string; desc: string; colors: string[] }[] = [
  { key: 'cinematic', label: '电影写实', desc: '高对比度、电影调色', colors: ['#1a1a2e', '#16213e', '#0f3460', '#e94560'] },
  { key: 'anime', label: '动漫渲染', desc: '赛璐珞风格、高饱和', colors: ['#2d1b69', '#6b3fa0', '#ff6b6b', '#ffd93d'] },
  { key: 'watercolor', label: '水墨国风', desc: '留白意境、淡雅色调', colors: ['#1a1a1a', '#2d2d2d', '#8b9d83', '#c4a882'] },
  { key: 'dark', label: '暗黑美学', desc: '暗色调、戏剧化光影', colors: ['#0a0a0a', '#1a1a1a', '#3d0000', '#8b0000'] },
  { key: 'warm', label: '田园暖调', desc: '温暖自然光、柔和', colors: ['#2c1810', '#5c3a2e', '#d4a574', '#f5deb3'] },
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

  const TABS = [
    { key: 'theme' as const, label: '主题' },
    { key: 'inspect' as const, label: '检查' },
    { key: 'comments' as const, label: '评论' },
    { key: 'review' as const, label: '审查', dot: reviewPointActive },
    { key: 'qa' as const, label: 'QA' },
  ];

  return (
    <>
      {/* Mobile backdrop */}
      <div
        className={`right-panel-backdrop ${rightPanelOpen ? 'visible' : ''}`}
        onClick={() => setRightPanelOpen(false)}
      />

      <div className={`right-panel-rail ${rightPanelOpen ? 'open' : ''}`}>
        <div className="right-panel-inner">
          {/* Toggle tab */}
          <button className="rp-toggle" onClick={() => setRightPanelOpen(!rightPanelOpen)}>
            <span className="toggle-dot" />
            工具
          </button>

          {/* Tab bar */}
          <div className="rp-tabs">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                className={`rp-tab ${rightPanelTab === tab.key ? 'active' : ''}`}
                onClick={() => {
                  if (rightPanelTab === tab.key && rightPanelOpen) {
                    setRightPanelOpen(false);
                  } else {
                    setRightPanelOpen(true);
                    setRightPanelTab(tab.key);
                  }
                }}
              >
                {tab.label}
                {tab.dot && <span className="tab-dot show" />}
              </button>
            ))}
          </div>

          {/* Body */}
          <div className="rp-body">
            {/* Theme pane */}
            <div className={`rp-pane ${rightPanelTab === 'theme' ? 'active' : ''}`}>
              <VisualDirectionSelector />
            </div>

            {/* Inspect pane */}
            <div className={`rp-pane ${rightPanelTab === 'inspect' ? 'active' : ''}`}>
              <div style={{ padding: '12px' }}>
                <div className="inspector-panel">
                  <div className="inspector-empty">
                    点击主画布中的任意角色、场景或分镜卡片，此处将显示详情。
                  </div>
                </div>
              </div>
            </div>

            {/* Comments pane */}
            <div className={`rp-pane ${rightPanelTab === 'comments' ? 'active' : ''}`}>
              <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', height: '100%' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <h4 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--fg)' }}>评论</h4>
                  <select
                    value={commentStage}
                    onChange={(e) => setCommentStage(e.target.value)}
                    style={{
                      fontSize: '11px', background: 'var(--bg)', border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-sm)', padding: '4px 8px', color: 'var(--fg-2)', outline: 'none',
                    }}
                  >
                    <option value="all">全部阶段</option>
                    <option value="script">剧本</option>
                    <option value="characters">角色</option>
                    <option value="storyboard">分镜</option>
                  </select>
                </div>

                {comments.length === 0 ? (
                  <p style={{ fontSize: '12px', color: 'var(--muted)', textAlign: 'center', padding: '32px 0' }}>暂无评论</p>
                ) : (
                  <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {comments.map((c) => (
                      <div key={c.id} style={{
                        padding: '10px', background: 'var(--bg)', border: '1px solid var(--border-soft)',
                        borderRadius: 'var(--radius-sm)', opacity: c.resolved ? 0.5 : 1,
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                          <span className="badge badge-muted" style={{ fontSize: '10px' }}>{c.stage}</span>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', color: 'var(--muted)', cursor: 'pointer' }}>
                            <input
                              type="checkbox"
                              checked={c.resolved}
                              onChange={() => {
                                setComments((prev) =>
                                  prev.map((x) => x.id === c.id ? { ...x, resolved: !x.resolved } : x)
                                );
                              }}
                              style={{ width: '12px', height: '12px' }}
                            />
                            已解决
                          </label>
                        </div>
                        <p style={{ fontSize: '12px', color: 'var(--fg-2)' }}>{c.text}</p>
                      </div>
                    ))}
                  </div>
                )}

                <div style={{ display: 'flex', gap: '6px', paddingTop: '10px', borderTop: '1px solid var(--border-soft)', marginTop: 'auto' }}>
                  <input
                    type="text"
                    placeholder="添加评论..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    style={{
                      flex: 1, padding: '8px 12px', borderRadius: 'var(--radius-pill)',
                      background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--fg)',
                      fontFamily: 'var(--font-body)', fontSize: '12px', outline: 'none',
                    }}
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
                    style={{
                      padding: '8px 14px', borderRadius: 'var(--radius-pill)', border: 'none', cursor: 'pointer',
                      background: 'var(--accent)', color: 'var(--accent-on)', fontWeight: 600, fontSize: '11px',
                      fontFamily: 'var(--font-display)',
                    }}
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
            </div>

            {/* Review pane */}
            <div className={`rp-pane ${rightPanelTab === 'review' ? 'active' : ''}`}>
              <div style={{ padding: '12px' }}>
                <ReviewPanel />
              </div>
            </div>

            {/* QA pane */}
            <div className={`rp-pane ${rightPanelTab === 'qa' ? 'active' : ''}`}>
              <div style={{ padding: '12px' }}>
                <QACritiquePanel />
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        .right-panel-backdrop {
          display: none;
          position: fixed;
          inset: 0;
          z-index: 95;
          background: rgba(0, 0, 0, 0.5);
          opacity: 0;
          visibility: hidden;
          pointer-events: none;
          transition: opacity var(--motion-base) var(--ease-standard), visibility var(--motion-base);
        }
        .right-panel-backdrop.visible {
          opacity: 1;
          visibility: visible;
          pointer-events: auto;
        }
        @media (max-width: 767px) {
          .right-panel-backdrop { display: block; }
          .right-panel-rail {
            position: fixed;
            top: auto;
            bottom: 0;
            left: 0;
            right: 0;
            z-index: 100;
            width: 100vw !important;
            max-width: 100vw;
            height: 65vh;
            border-left: none !important;
            border-top: 1px solid var(--border);
            border-radius: var(--radius-lg) var(--radius-lg) 0 0;
            transition: transform var(--motion-base) var(--ease-standard) !important;
            transform: translateY(100%);
          }
          .right-panel-rail.open { transform: translateY(0); }
          .right-panel-rail .rp-toggle { display: none; }
          .right-panel-inner { width: 100% !important; }
        }
      `}</style>
    </>
  );
}
