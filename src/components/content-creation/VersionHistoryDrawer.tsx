'use client';

import { useState } from 'react';
import type { Version } from '@/lib/types';
import { STAGE_NAMES } from '@/lib/types';

const BRANCH_COLORS_POOL = ['bg-success', 'bg-[#6366f1]', 'bg-[#f59e0b]', 'bg-[#ec4899]', 'bg-[#14b8a6]'];
function getBranchColor(branch: string): string {
  let hash = 0;
  for (let i = 0; i < branch.length; i++) {
    hash = branch.charCodeAt(i) + ((hash << 5) - hash);
  }
  return BRANCH_COLORS_POOL[Math.abs(hash) % BRANCH_COLORS_POOL.length];
}

interface VersionHistoryDrawerProps {
  open: boolean;
  onClose: () => void;
  versions: Version[];
  versionsLoading: boolean;
  onRestore?: (versionId: string) => void;
  onCompare?: (fromId: string, toId: string) => void;
}

export default function VersionHistoryDrawer({ open, onClose, versions, versionsLoading, onRestore, onCompare }: VersionHistoryDrawerProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [filter, setFilter] = useState<string>('all');

  const filteredVersions = filter === 'all'
    ? versions
    : filter === 'tagged'
    ? versions.filter((v) => (v.tags || []).length > 0)
    : versions.filter((v) => v.pipeline_stage === filter);

  const branches = [...new Set(versions.map((v) => v.branch).filter(Boolean))];

  const handleSelect = (id: string) => {
    setSelectedIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 2) return [prev[1], id];
      return [...prev, id];
    });
  };

  if (!open) return null;

  return (
    <>
      <div className="modal-overlay" onClick={onClose} />
      <div className="version-drawer-panel fixed bg-surface shadow-raised z-50 flex flex-col">
        {/* Drag handle for mobile */}
        <div className="version-drawer-handle">
          <div className="version-drawer-handle-bar" />
        </div>
        <div className="flex items-center justify-between px-6 py-4 border-b border-border-soft">
          <div>
            <h3 className="text-lg font-normal text-fg">版本历史</h3>
            <p className="text-xs text-muted mt-0.5">
              {versionsLoading ? '加载中...' : `${versions.length} 个版本 · ${branches.length} 个分支`}
            </p>
          </div>
          <button onClick={onClose} className="btn btn-ghost btn-sm">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="px-6 py-3 border-b border-border-soft flex gap-1.5 overflow-x-auto">
          {[
            { key: 'all', label: '全部' },
            { key: 'tagged', label: '已标记' },
            { key: 'script_rewrite', label: '剧本' },
            { key: 'character_management', label: '角色' },
            { key: 'storyboard', label: '分镜' },
            { key: 'image_generation', label: '图片' },
          ].map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`badge cursor-pointer whitespace-nowrap text-[10px] ${filter === f.key ? 'badge-accent' : 'badge-muted'}`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {versionsLoading ? (
            <p className="text-sm text-muted text-center py-12">加载版本历史...</p>
          ) : filteredVersions.length === 0 ? (
            <p className="text-sm text-muted text-center py-12">暂无版本记录</p>
          ) : (
            <div className="space-y-3">
              {filteredVersions.map((v) => {
                const meta = v.metadata as Record<string, unknown> || {};
                return (
                  <div
                    key={v.id}
                    className={`bg-bg border rounded-sm p-4 transition-all cursor-pointer
                      ${selectedIds.includes(v.id)
                        ? 'border-accent'
                        : 'border-border hover:border-border'
                      }`}
                    onClick={() => handleSelect(v.id)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-pill flex-shrink-0 ${getBranchColor(v.branch || 'main')}`} />
                        <span className="font-mono text-xs text-accent">{v.short_id || v.id.slice(0, 7)}</span>
                        {v.is_checkpoint && (
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="var(--warn)" stroke="var(--warn)" strokeWidth="1"><polygon points="12 2 15 9 22 9 16 14 18 21 12 17 6 21 8 14 2 9 9 9"/></svg>
                        )}
                        <div className={`w-3.5 h-3.5 rounded-sm border flex items-center justify-center ml-auto ${
                          selectedIds.includes(v.id) ? 'bg-accent border-accent' : 'border-border-soft'
                        }`}>
                          {selectedIds.includes(v.id) && (
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="var(--bg)" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                          )}
                        </div>
                      </div>
                    </div>

                    <p className="text-sm text-fg mb-2">{v.message || '—'}</p>

                    <div className="flex items-center gap-3 text-[10px] text-muted mb-2">
                      <span className="flex items-center gap-1">
                        {v.author_type === 'ai' ? (
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="3"/><line x1="8" y1="8" x2="16" y2="8"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="8" y1="16" x2="12" y2="16"/></svg>
                        ) : (
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                        )}
                        {v.author_type === 'ai' ? 'AI' : 'Human'}
                      </span>
                      <span>{v.created_at ? new Date(v.created_at).toLocaleDateString('zh-CN') : ''}</span>
                      <span className="badge badge-muted text-[9px]">{STAGE_NAMES[v.pipeline_stage as keyof typeof STAGE_NAMES] || v.pipeline_stage}</span>
                    </div>

                    {(v.tags || []).length > 0 && (
                      <div className="flex gap-1 mb-2">
                        {(v.tags || []).map((t: string) => (
                          <span key={t} className="text-[9px] bg-border-soft text-fg-2 rounded-sm px-1.5 py-0.5">{t}</span>
                        ))}
                      </div>
                    )}

                    {(meta.model || meta.cost !== undefined || meta.qualityScore !== undefined) && (
                      <div className="flex gap-3 text-[10px] text-muted mt-2 pt-2 border-t border-border-soft">
                        {(() => { const m = meta.model as string | undefined; if (m) return <span key="model">模型: {m}</span>; return null; })()}
                        {meta.cost !== undefined && <span>费用: ¥{Number(meta.cost).toFixed(2)}</span>}
                        {meta.qualityScore !== undefined && (
                          <span className={Number(meta.qualityScore) >= 0.9 ? 'text-success' : Number(meta.qualityScore) >= 0.8 ? 'text-warn' : 'text-danger'}>
                            评分: {(Number(meta.qualityScore) * 100).toFixed(0)}
                          </span>
                        )}
                      </div>
                    )}

                    <div className="flex gap-2 mt-3 pt-3 border-t border-border-soft">
                      <button
                        className="btn btn-ghost btn-sm text-[11px]"
                        onClick={(e) => { e.stopPropagation(); onRestore?.(v.id); }}
                      >
                        设为当前
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {selectedIds.length === 2 && (
          <div className="px-6 py-4 border-t border-border-soft bg-bg">
            <button
              className="btn btn-brand w-full"
              onClick={() => onCompare?.(selectedIds[0], selectedIds[1])}
            >
              对比所选版本 ({selectedIds.length})
            </button>
          </div>
        )}
      </div>

      <style jsx global>{`
        @keyframes slideLeft {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        @keyframes slideUpVersion {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }

        /* Desktop/Tablet: right-side panel */
        .version-drawer-panel {
          inset-y: 0;
          right: 0;
          width: 520px;
          max-width: 90vw;
          border-left: 1px solid var(--border);
          animation: slideLeft 0.25s ease;
        }
        .version-drawer-handle {
          display: none;
        }

        /* Mobile: bottom sheet */
        @media (max-width: 767px) {
          .version-drawer-panel {
            inset: auto 0 0 0;
            width: 100vw;
            max-width: 100vw;
            height: 80vh;
            border-left: none;
            border-top: 1px solid var(--border);
            border-radius: var(--radius-lg) var(--radius-lg) 0 0;
            animation: slideUpVersion var(--motion-base) var(--ease-standard);
          }
          .version-drawer-handle {
            display: flex;
            justify-content: center;
            padding: var(--space-2) 0;
          }
          .version-drawer-handle-bar {
            width: 32px;
            height: 4px;
            border-radius: 2px;
            background: var(--border);
          }
        }
      `}</style>
    </>
  );
}
