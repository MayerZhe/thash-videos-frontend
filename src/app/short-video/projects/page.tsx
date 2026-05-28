'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { videoProjectsApi } from '@/lib/api';
import type { VideoProject } from '@/lib/types';

/* ═══════════════════════════════════════════════════════════════════════
 * /short-video/projects — Visual Factory project list
 * 1:1 replica of Thash-video-design/video-index.html
 * Manages and creates one-click short-video AI agent projects.
 * Phase 3: Replaced localStorage seed data with videoProjectsApi calls.
 * ═══════════════════════════════════════════════════════════════════════ */

/* ─── Local view model ─────────────────────────────────────────────── */

type ProjectStatus = 'completed' | 'producing' | 'draft';
type FilterType = 'all' | ProjectStatus;

interface ProjectView {
  id: string;
  title: string;
  platform: string;
  status: ProjectStatus;
  created_at: string;
}

const STATUS_LABELS: Record<ProjectStatus, string> = {
  completed: '已完成',
  producing: '生成中',
  draft: '草稿',
};

function formatTime(iso: string): string {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${Math.max(mins, 1)}分钟前`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}小时前`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}天前`;
  if (days < 30) return `${Math.floor(days / 7)}周前`;
  return `${Math.floor(days / 30)}个月前`;
}

/* ─── Toast ──────────────────────────────────────────────────────────── */

interface ToastItem {
  id: number;
  text: string;
  type: 'success' | 'info';
}

let toastIdCounter = 0;

/* ─── SVG Icon Components ────────────────────────────────────────────── */

function IconPlay() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
      <path d="M5 4l8 4-8 4V4z" />
    </svg>
  );
}

function IconSearch() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="7" cy="7" r="4.5" />
      <path d="M10.5 10.5l3 3" strokeLinecap="round" />
    </svg>
  );
}

function IconPlus() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M8 3v10M3 8h10" strokeLinecap="round" />
    </svg>
  );
}

function IconEdit() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M11 2l3 3-8 8H3v-3l8-8z" />
    </svg>
  );
}

function IconCopy() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="5" y="5" width="8" height="8" rx="1.5" />
      <path d="M3 11V4a1 1 0 0 1 1-1h7" />
    </svg>
  );
}

function IconDelete() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M2 4h12M5 4V2h6v2M6 7v5M10 7v5M3 4l1 10h8l1-10" />
    </svg>
  );
}

function IconClose() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M4 4l8 8M12 4l-8 8" />
    </svg>
  );
}

function IconFolder() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" />
    </svg>
  );
}

/* ─── Page Component ─────────────────────────────────────────────────── */

export default function ShortVideoProjectsPage() {
  const [projects, setProjects] = useState<ProjectView[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  /* Modal form state */
  const [formName, setFormName] = useState('');
  const [formPlatform, setFormPlatform] = useState('9:16');
  const [formDesc, setFormDesc] = useState('');

  /* ─── Load projects ───────────────────────────────────────────────── */
  const loadProjects = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await videoProjectsApi.list();
      const list = (res?.projects || []).map((p: VideoProject): ProjectView => ({
        id: p.id,
        title: p.title,
        platform: p.platform || '9:16',
        status: (p.status as ProjectStatus) || 'draft',
        created_at: p.created_at || '',
      }));
      setProjects(list);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadProjects(); }, [loadProjects]);

  /* ─── Derived stats ──────────────────────────────────────────────── */
  const stats = useMemo(() => {
    const total = projects.length;
    const done = projects.filter((p) => p.status === 'completed').length;
    const producing = projects.filter((p) => p.status === 'producing').length;
    const draft = projects.filter((p) => p.status === 'draft').length;
    return { total, done, producing, draft };
  }, [projects]);

  /* ─── Filtered & searched projects ────────────────────────────────── */
  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesFilter = activeFilter === 'all' || p.status === activeFilter;
      return matchesSearch && matchesFilter;
    });
  }, [projects, searchQuery, activeFilter]);

  /* ─── Toast helpers ───────────────────────────────────────────────── */
  const addToast = useCallback((text: string, type: 'success' | 'info' = 'success') => {
    const id = ++toastIdCounter;
    setToasts((prev) => [...prev, { id, text, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  /* ─── Actions ─────────────────────────────────────────────────────── */
  const handleDelete = useCallback(
    async (id: string, e: React.MouseEvent) => {
      e.stopPropagation();
      try {
        await videoProjectsApi.delete(id);
        setProjects((prev) => prev.filter((p) => p.id !== id));
        addToast('项目已删除', 'success');
      } catch (err) {
        addToast(`删除失败: ${(err as Error).message}`, 'info');
      }
    },
    [addToast],
  );

  const handleCreateProject = useCallback(async () => {
    const title = formName.trim() || '未命名项目';
    setCreating(true);
    try {
      const newProject = await videoProjectsApi.create({ title, description: formDesc, platform: formPlatform });
      const view: ProjectView = {
        id: newProject.id,
        title: newProject.title,
        platform: newProject.platform || formPlatform,
        status: (newProject.status as ProjectStatus) || 'draft',
        created_at: newProject.created_at || new Date().toISOString(),
      };
      setProjects((prev) => [view, ...prev]);
      setModalOpen(false);
      resetForm();
      addToast(`项目 "${title}" 已创建，正在进入工坊...`, 'success');
      setTimeout(() => {
        window.location.href = `/short-video/studio?id=${view.id}&name=${encodeURIComponent(title)}`;
      }, 1200);
    } catch (err) {
      addToast(`创建失败: ${(err as Error).message}`, 'info');
    } finally {
      setCreating(false);
    }
  }, [formName, formDesc, formPlatform, addToast]);

  const resetForm = () => {
    setFormName('');
    setFormPlatform('9:16');
    setFormDesc('');
  };

  const handleOpenModal = useCallback(() => {
    resetForm();
    setModalOpen(true);
  }, []);

  const handleCardClick = useCallback((p: ProjectView) => {
    window.location.href = `/short-video/studio?id=${p.id}&name=${encodeURIComponent(p.title)}`;
  }, []);

  /* ─── Filter pills ────────────────────────────────────────────────── */
  const filterPills: { key: FilterType; label: string; count: number }[] = [
    { key: 'all', label: '全部', count: stats.total },
    { key: 'completed', label: '已完成', count: stats.done },
    { key: 'producing', label: '生成中', count: stats.producing },
    { key: 'draft', label: '草稿', count: stats.draft },
  ];

  return (
    <>
      <div className="svp-page">
        {/* Header */}
        <div className="svp-header">
          <div>
            <h1 className="svp-header-title">短视频项目</h1>
            <p className="svp-header-subtitle">
              管理和创建一键短视频 Agent 项目
            </p>
          </div>
          <button className="btn btn-brand" onClick={handleOpenModal}>
            <IconPlus />
            新建项目
          </button>
        </div>

        {/* Stats Row */}
        <div className="svp-stats-row">
          <div className="svp-stat-card">
            <div className="svp-stat-label">总项目数</div>
            <div className="svp-stat-value">{loading ? '-' : stats.total}</div>
            <div className="svp-stat-sub">短视频</div>
          </div>
          <div className="svp-stat-card">
            <div className="svp-stat-label">已完成</div>
            <div className="svp-stat-value">{loading ? '-' : stats.done}</div>
            <div className="svp-stat-sub">视频</div>
          </div>
          <div className="svp-stat-card">
            <div className="svp-stat-label">生成中</div>
            <div className="svp-stat-value">{loading ? '-' : stats.producing}</div>
            <div className="svp-stat-sub">项目</div>
          </div>
          <div className="svp-stat-card">
            <div className="svp-stat-label">草稿</div>
            <div className="svp-stat-value">{loading ? '-' : stats.draft}</div>
            <div className="svp-stat-sub">待开始</div>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="svp-filter-bar">
          <div className="svp-search-wrap">
            <IconSearch />
            <input
              placeholder="搜索项目名称..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="svp-filter-row">
            {filterPills.map((pill) => (
              <button
                key={pill.key}
                className={`svp-filter-pill${activeFilter === pill.key ? ' active' : ''}`}
                onClick={() => setActiveFilter(pill.key)}
              >
                {pill.label} {pill.count}
              </button>
            ))}
          </div>
        </div>

        {/* Content: loading / error / empty / projects grid */}
        {loading ? (
          <div className="svp-empty-state">
            <p className="svp-empty-title" style={{ color: 'var(--muted)' }}>加载项目列表...</p>
          </div>
        ) : error ? (
          <div className="svp-empty-state">
            <p className="svp-empty-title" style={{ color: 'var(--danger)' }}>加载失败</p>
            <p className="svp-empty-desc">{error}</p>
            <button className="btn btn-brand" onClick={loadProjects}>重试</button>
          </div>
        ) : filteredProjects.length > 0 ? (
          <div className="svp-projects-grid">
            {filteredProjects.map((p) => {
              const statusClass = p.status === 'completed' ? 'done' : p.status === 'producing' ? 'progress' : 'pending';
              return (
                <div key={p.id} className="svp-project-card" onClick={() => handleCardClick(p)}>
                  <div className="svp-card-thumb">
                    <div className="svp-card-thumb-play">
                      <IconPlay />
                    </div>
                    <span className="svp-card-thumb-duration">{p.platform}</span>
                  </div>
                  <div className="svp-card-body">
                    <div className="svp-card-title">{p.title}</div>
                    <div className="svp-card-meta">
                      <span className={`svp-card-tag ${statusClass}`}>{STATUS_LABELS[p.status]}</span>
                      <span>{formatTime(p.created_at)}</span>
                    </div>
                  </div>
                  <div className="svp-card-actions">
                    <button className="svp-icon-btn" title="编辑" onClick={(e) => e.stopPropagation()}>
                      <IconEdit />
                    </button>
                    <button className="svp-icon-btn" title="复制" onClick={(e) => e.stopPropagation()}>
                      <IconCopy />
                    </button>
                    <button className="svp-icon-btn" title="删除" onClick={(e) => handleDelete(p.id, e)}>
                      <IconDelete />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="svp-empty-state">
            <div className="svp-empty-icon">
              <IconFolder />
            </div>
            <p className="svp-empty-title">
              {searchQuery || activeFilter !== 'all' ? '没有匹配的项目' : '还没有项目'}
            </p>
            <p className="svp-empty-desc">
              {searchQuery || activeFilter !== 'all'
                ? '尝试调整搜索条件或清除筛选器。'
                : '创建你的第一个短视频项目，AI Agent 将为你自动生成高质量短视频。'}
            </p>
            {!searchQuery && activeFilter === 'all' && (
              <button className="btn btn-brand" onClick={handleOpenModal}>
                <IconPlus />
                新建项目
              </button>
            )}
          </div>
        )}

        {/* No match after filter with search/status active: show clear */}
        {!loading && !error && filteredProjects.length === 0 && (searchQuery || activeFilter !== 'all') && (
          <div style={{ textAlign: 'center', paddingBottom: 24 }}>
            <button
              className="btn btn-secondary"
              onClick={() => {
                setSearchQuery('');
                setActiveFilter('all');
              }}
            >
              清除筛选
            </button>
          </div>
        )}
      </div>

      {/* New Project Modal */}
      {modalOpen && (
        <div
          className="svp-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) setModalOpen(false);
          }}
        >
          <div className="svp-modal" onClick={(e) => e.stopPropagation()}>
            <div className="svp-modal-header">
              <span className="svp-modal-title">新建短视频项目</span>
              <button className="svp-icon-btn" onClick={() => setModalOpen(false)}>
                <IconClose />
              </button>
            </div>
            <div className="svp-modal-body">
              <div className="svp-form-group">
                <label className="svp-form-label">项目名称</label>
                <input
                  className="svp-form-input"
                  placeholder="例如：夏季护肤精华液种草视频"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                />
              </div>
              <div className="svp-form-group">
                <label className="svp-form-label">目标平台</label>
                <select className="svp-form-select" value={formPlatform} onChange={(e) => setFormPlatform(e.target.value)}>
                  <option value="9:16">抖音/快手（竖版 9:16）</option>
                  <option value="16:9">YouTube（横版 16:9）</option>
                  <option value="1:1">Instagram（正方 1:1）</option>
                </select>
              </div>
              <div className="svp-form-group">
                <label className="svp-form-label">视频描述（可选）</label>
                <textarea
                  className="svp-form-textarea"
                  placeholder="简单描述视频的核心内容和目标受众..."
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                />
              </div>
            </div>
            <div className="svp-modal-footer">
              <button className="btn btn-secondary" onClick={() => setModalOpen(false)} disabled={creating}>
                取消
              </button>
              <button className="btn btn-brand" onClick={handleCreateProject} disabled={creating}>
                {creating ? '创建中...' : '创建并进入工坊'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Container */}
      {toasts.length > 0 && (
        <div className="svp-toast-container">
          {toasts.map((t) => (
            <div key={t.id} className={`svp-toast${t.type === 'success' ? ' success' : ''}`}>
              <div className="svp-toast-dot" />
              {t.text}
            </div>
          ))}
        </div>
      )}

      {/* Page-specific CSS */}
      <style jsx>{`
        .svp-page {
          color: var(--fg);
        }

        /* ── Header ── */
        .svp-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 20px 28px;
          border-bottom: 1px solid var(--border);
          background: var(--surface);
          position: sticky;
          top: 0;
          z-index: 9;
        }
        .svp-header-title {
          font-size: var(--text-xl);
          font-weight: 500;
          color: var(--fg);
          margin: 0;
          font-family: var(--font-display);
          line-height: 1.25;
        }
        .svp-header-subtitle {
          font-size: 13px;
          color: var(--muted);
          margin: 2px 0 0 0;
        }
        /* ── Stats Row ── */
        .svp-stats-row {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 12px;
          padding: 20px 28px;
          border-bottom: 1px solid var(--border);
        }
        .svp-stat-card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          padding: 16px;
        }
        .svp-stat-label {
          font-size: 11px;
          font-family: var(--font-mono);
          color: var(--muted);
          text-transform: uppercase;
          letter-spacing: 0.8px;
          margin-bottom: 6px;
        }
        .svp-stat-value {
          font-size: 24px;
          font-weight: 500;
          color: var(--fg);
          font-family: var(--font-display);
          line-height: 1.1;
        }
        .svp-stat-sub {
          font-size: 11px;
          color: var(--muted);
          margin-top: 4px;
        }
        .svp-stat-change {
          font-size: 11px;
          color: var(--accent);
        }
        .svp-stat-change.neg {
          color: var(--danger);
        }

        /* ── Filter Bar ── */
        .svp-filter-bar {
          display: flex;
          gap: 8px;
          padding: 16px 28px;
          align-items: center;
          flex-wrap: wrap;
        }
        .svp-search-wrap {
          display: flex;
          align-items: center;
          gap: 8px;
          background: var(--border-soft);
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          padding: 0 12px;
          margin: 0 28px 0 0;
          flex: 1;
          max-width: 360px;
        }
        .svp-search-wrap input {
          flex: 1;
          background: transparent;
          border: none;
          color: var(--fg);
          font-size: 13px;
          font-family: var(--font-body);
          padding: 8px 0;
          outline: none;
        }
        .svp-search-wrap input::placeholder {
          color: var(--muted);
        }
        .svp-filter-row {
          display: flex;
          align-items: center;
          gap: 8px;
          flex: 1;
          justify-content: flex-end;
        }
        .svp-filter-pill {
          padding: 5px 14px;
          border-radius: var(--radius-pill);
          border: 1px solid var(--border);
          background: transparent;
          color: var(--muted);
          font-size: 12px;
          font-family: var(--font-body);
          cursor: pointer;
          transition: all 0.15s;
        }
        .svp-filter-pill:hover {
          border-color: #363636;
          color: var(--fg);
        }
        .svp-filter-pill.active {
          border-color: var(--accent);
          color: var(--accent);
          background: rgba(62, 207, 142, 0.08);
        }

        /* ── Projects Grid ── */
        .svp-projects-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 14px;
          padding: 0 28px 28px;
        }
        .svp-project-card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 10px;
          overflow: hidden;
          transition: border-color 0.15s;
          cursor: pointer;
        }
        .svp-project-card:hover {
          border-color: #363636;
        }

        /* ── Card Thumb ── */
        .svp-card-thumb {
          aspect-ratio: 16/9;
          background: linear-gradient(135deg, var(--border-soft), #1a2a1e);
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          overflow: hidden;
        }
        .svp-card-thumb-play {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: rgba(62, 207, 142, 0.9);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--accent-on);
        }
        .svp-card-thumb-duration {
          position: absolute;
          bottom: 8px;
          right: 8px;
          background: rgba(0, 0, 0, 0.7);
          color: var(--fg);
          font-size: 10px;
          font-family: var(--font-mono);
          padding: 2px 6px;
          border-radius: 4px;
        }

        /* ── Card Body ── */
        .svp-card-body {
          padding: 12px 14px;
        }
        .svp-card-title {
          font-size: 13px;
          font-weight: 500;
          color: var(--fg);
          margin-bottom: 4px;
        }
        .svp-card-meta {
          display: flex;
          gap: 10px;
          font-size: 11px;
          color: var(--muted);
          flex-wrap: wrap;
        }
        .svp-card-tag {
          background: var(--border-soft);
          padding: 2px 8px;
          border-radius: 4px;
        }
        .svp-card-tag.done {
          background: rgba(62, 207, 142, 0.1);
          color: var(--accent);
        }
        .svp-card-tag.progress {
          background: rgba(234, 179, 8, 0.1);
          color: var(--warn);
        }
        .svp-card-tag.pending {
          background: var(--border-soft);
          color: var(--muted);
        }

        /* ── Card Actions ── */
        .svp-card-actions {
          display: flex;
          gap: 6px;
          padding: 8px 14px 12px;
        }
        .svp-icon-btn {
          width: 28px;
          height: 28px;
          border-radius: 6px;
          border: 1px solid var(--border);
          background: transparent;
          color: var(--muted);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.15s;
          flex-shrink: 0;
          padding: 0;
        }
        .svp-icon-btn:hover {
          background: var(--border-soft);
          color: var(--fg);
        }

        /* ── Modal ── */
        .svp-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.6);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          backdrop-filter: blur(4px);
        }
        .svp-modal {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 12px;
          width: 480px;
          max-width: calc(100vw - 32px);
          max-height: calc(100vh - 64px);
          overflow-y: auto;
          animation: svpScaleIn 0.15s ease;
        }
        @keyframes svpScaleIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .svp-modal-header {
          padding: 16px 20px;
          border-bottom: 1px solid var(--border);
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .svp-modal-title {
          font-size: 15px;
          font-weight: 500;
          color: var(--fg);
          flex: 1;
        }
        .svp-modal-body {
          padding: 20px;
        }
        .svp-modal-footer {
          padding: 12px 20px;
          border-top: 1px solid var(--border);
          display: flex;
          justify-content: flex-end;
          gap: 8px;
        }

        /* ── Form ── */
        .svp-form-group {
          margin-bottom: 14px;
        }
        .svp-form-label {
          display: block;
          font-size: 12px;
          color: var(--fg-2);
          margin-bottom: 6px;
          font-weight: 500;
        }
        .svp-form-input,
        .svp-form-textarea,
        .svp-form-select {
          width: 100%;
          background: var(--border-soft);
          border: 1px solid var(--border);
          border-radius: 6px;
          padding: 8px 12px;
          color: var(--fg);
          font-size: 13px;
          font-family: var(--font-body);
          transition: border-color 0.15s;
          box-sizing: border-box;
        }
        .svp-form-input:focus,
        .svp-form-textarea:focus,
        .svp-form-select:focus {
          outline: none;
          border-color: var(--accent);
        }
        .svp-form-textarea {
          resize: vertical;
          min-height: 80px;
          line-height: 1.5;
        }
        .svp-form-select {
          appearance: none;
          cursor: pointer;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23898989' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 10px center;
          padding-right: 32px;
        }

        /* ── Toast ── */
        .svp-toast-container {
          position: fixed;
          bottom: 20px;
          right: 20px;
          z-index: 9999;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .svp-toast {
          background: var(--border-soft);
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          padding: 10px 14px;
          font-size: 12px;
          color: var(--fg);
          animation: svpSlideUp 0.2s ease;
          display: flex;
          align-items: center;
          gap: 8px;
          font-family: var(--font-body);
        }
        @keyframes svpSlideUp {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .svp-toast.success {
          border-color: rgba(62, 207, 142, 0.3);
        }
        .svp-toast-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          flex-shrink: 0;
          background: var(--accent);
        }

        /* ── Empty State ── */
        .svp-empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 60px 20px;
          text-align: center;
        }
        .svp-empty-icon {
          width: 64px;
          height: 64px;
          background: var(--border-soft);
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 16px;
          color: var(--muted);
        }
        .svp-empty-title {
          font-size: 16px;
          font-weight: 500;
          color: var(--fg);
          margin: 0 0 8px 0;
        }
        .svp-empty-desc {
          font-size: 13px;
          color: var(--muted);
          line-height: 1.6;
          max-width: 320px;
          margin-bottom: 20px;
        }

        /* ── Responsive ── */
        @media (max-width: 1023px) {
          .svp-stats-row {
            grid-template-columns: repeat(2, 1fr);
          }
          .svp-header {
            padding: 16px 20px;
          }
          .svp-filter-bar {
            padding: 12px 20px;
          }
          .svp-projects-grid {
            padding: 0 20px 20px;
          }
          .svp-stats-row {
            padding: 16px 20px;
          }
        }

        @media (max-width: 767px) {
          .svp-stats-row {
            grid-template-columns: 1fr;
          }
          .svp-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 12px;
            padding: 16px;
          }
          .svp-header .btn {
            width: 100%;
            justify-content: center;
          }
          .svp-filter-bar {
            flex-direction: column;
            padding: 12px 16px;
          }
          .svp-search-wrap {
            max-width: 100%;
            margin-right: 0;
            width: 100%;
          }
          .svp-filter-row {
            overflow-x: auto;
            flex-wrap: nowrap;
            justify-content: flex-start;
            -webkit-overflow-scrolling: touch;
            width: 100%;
          }
          .svp-projects-grid {
            padding: 0 16px 16px;
            grid-template-columns: 1fr;
          }
          .svp-stats-row {
            padding: 12px 16px;
          }
          .svp-modal {
            width: 100vw;
            max-width: 100vw;
            height: 100vh;
            max-height: 100vh;
            border-radius: 0;
          }
          .svp-overlay {
            align-items: stretch;
          }
          .svp-toast-container {
            bottom: auto;
            top: 16px;
            right: 16px;
            left: 16px;
          }
        }
      `}</style>
    </>
  );
}
