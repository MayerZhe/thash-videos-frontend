'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { projectsApi } from '@/lib/api';
import { useAppStore } from '@/stores/app';
import type { Project as ApiProject } from '@/lib/types';

/* ═══════════════════════════════════════════════════════════════════════
 * Dashboard Page — 1:1 replica of Thash-video-design/dashboard.html
 * App shell layout (sidebar + topbar). Project grid + create modal.
 * ═══════════════════════════════════════════════════════════════════════ */

// Local view model adapted from API Project
interface Project {
  id: string;
  title: string;
  style: string;
  episodes: number;
  updated: string;
  status: string;
}

function fmtDate(s: string): string {
  if (!s) return '';
  const d = new Date(s);
  const diff = Date.now() - d.getTime();
  if (diff < 60000) return '刚刚';
  if (diff < 3600000) return `${Math.floor(diff / 60000)} 分钟前`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)} 小时前`;
  if (diff < 604800000) return `${Math.floor(diff / 86400000)} 天前`;
  return d.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
}

const styleLabels: Record<string, string> = {
  realistic: '写实', anime: '动漫', ghibli: '吉卜力', cinematic: '电影级',
  comic: '漫画', watercolor: '水彩', chinese_ink: '水墨古风',
};

export default function DashboardPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formName, setFormName] = useState('');
  const [formEpisodes, setFormEpisodes] = useState(12);
  const [formStyle, setFormStyle] = useState('realistic');
  const [toasts, setToasts] = useState<{ id: number; text: string; exiting: boolean }[]>([]);

  const toastIdRef = useRef(1);
  const toast = useCallback((msg: string) => {
    const id = toastIdRef.current++;
    setToasts((prev) => [...prev, { id, text: msg, exiting: false }]);
    setTimeout(() => {
      setToasts((prev) => prev.map((t) => (t.id === id ? { ...t, exiting: true } : t)));
      setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 300);
    }, 2500);
  }, []);

  const loadProjects = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await projectsApi.list();
      const mapped: Project[] = (data.projects || []).map((p: ApiProject) => ({
        id: p.id,
        title: p.title,
        style: p.style || '',
        episodes: p.total_episodes || 0,
        updated: p.updated_at,
        status: p.status,
      }));
      setProjects(mapped);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadProjects(); }, [loadProjects]);

  const filteredProjects = statusFilter === 'all'
    ? projects
    : projects.filter((p) => p.status === statusFilter);

  function openProject(id: string) {
    useAppStore.getState().setActiveProject(id);
    router.push(`/short-series/projects/${id}`);
  }

  const delProject = useCallback(async (id: string) => {
    const p = projects.find((x) => x.id === id);
    if (!confirm(`确定删除「${p?.title}」？此操作不可恢复。`)) return;
    try {
      await projectsApi.delete(id);
      setProjects((prev) => prev.filter((x) => x.id !== id));
      toast('已删除');
    } catch (err) {
      toast(`删除失败: ${(err as Error).message}`);
    }
  }, [projects, toast]);

  const createProject = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    const name = formName.trim();
    if (!name) return;
    try {
      const p = await projectsApi.create({ title: name, style: formStyle });
      useAppStore.getState().setActiveProject(p.id);
      setProjects((prev) => [{ id: p.id, title: p.title, style: p.style || '', episodes: 0, updated: p.updated_at, status: 'draft' }, ...prev]);
      setShowCreateModal(false);
      setFormName('');
      toast(`项目「${name}」已创建`);
      setTimeout(() => router.push(`/short-series/projects/${p.id}`), 600);
    } catch (err) {
      toast(`创建失败: ${(err as Error).message}`);
    }
  }, [formName, formStyle, toast, router]);

  const statusTabs = [
    { key: 'all', label: '全部' },
    { key: 'draft', label: '草稿' },
    { key: 'active', label: '进行中' },
    { key: 'completed', label: '已完成' },
  ];

  return (
    <div className="page">
      {/* Page Head */}
      <div className="page-head">
        <div className="head-left">
          <h1 className="page-title">短剧项目</h1>
          <p className="page-desc">
            {filteredProjects.length} 个项目
          </p>
        </div>
        <button className="btn btn-brand" onClick={() => { setShowCreateModal(true); }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          新建项目
        </button>
      </div>

      {/* Status Filter Tabs */}
      <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-6)' }}>
        {statusTabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setStatusFilter(tab.key)}
            className={`badge cursor-pointer ${statusFilter === tab.key ? 'badge-accent' : 'badge-muted'}`}
            style={{ cursor: 'pointer', background: statusFilter === tab.key ? undefined : undefined }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Project Grid */}
      {loading ? (
        <p className="text-sm text-muted text-center py-12">加载中...</p>
      ) : error ? (
        <div className="flex flex-col items-center gap-3 py-12">
          <p className="text-sm text-danger">加载失败: {error}</p>
          <button className="btn btn-brand btn-sm" onClick={loadProjects}>重试</button>
        </div>
      ) : (
      <div className="grid">
        {filteredProjects.length === 0 && (
          <div className="card empty-card" onClick={() => setShowCreateModal(true)}>
            <div className="empty-icon">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round">
                <rect x="3" y="3" width="18" height="18" rx="3" />
                <line x1="12" y1="8" x2="12" y2="16" /><line x1="8" y1="12" x2="16" y2="12" />
              </svg>
            </div>
            <p className="empty-title">新建第一个短剧项目</p>
            <p className="empty-desc">从剧本到成片，AI 助力的短剧制作工作台</p>
          </div>
        )}

        {filteredProjects.map((p, i) => {
          const progress = p.status === 'completed' ? 100 : p.status === 'in_progress' ? 50 : 0;
          return (
            <div
              key={p.id}
              className="project-card"
              style={{ animationDelay: `${i * 0.06}s` }}
              onClick={() => openProject(p.id)}
            >
              {/* Film strip — holes 2 and 4 turn emerald on hover */}
              <div className="card-film-strip">
                {[1, 2, 3, 4, 5].map((n) => (
                  <span key={n} className="film-hole" />
                ))}
              </div>

              <div className="card-body">
                <div className="card-header">
                  <span className="episode-badge">
                    <svg viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="10" /></svg>
                    {p.episodes || 0} 集
                  </span>
                  <button
                    className="card-delete"
                    onClick={(e) => { e.stopPropagation(); delProject(p.id); }}
                    title="删除"
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6" /><path d="M14 11v6" /><path d="M9 6V4h6v2" />
                    </svg>
                  </button>
                </div>
                <h3 className="project-title">{p.title}</h3>
                <div className="project-meta">
                  {p.style && <span className="style-tag">{styleLabels[p.style] || p.style}</span>}
                </div>
              </div>

              <div className="card-footer">
                <div className="progress-mini">
                  <div className="progress-mini-track">
                    <div className="progress-mini-fill" style={{ width: `${progress}%` }} />
                  </div>
                </div>
                <span className="card-date">{fmtDate(p.updated)}</span>
              </div>
            </div>
          );
        })}
      </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowCreateModal(false); }}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                  <rect x="3" y="3" width="18" height="18" rx="3" /><line x1="12" y1="8" x2="12" y2="16" /><line x1="8" y1="12" x2="16" y2="12" />
                </svg>
              </div>
              <h2 className="modal-title">新建短剧项目</h2>
              <p className="modal-desc">输入项目基本信息，即可开始制作</p>
            </div>
            <form className="modal-form" onSubmit={createProject}>
              <label className="field">
                <span className="field-label">项目名称 <span className="required">*</span></span>
                <input
                  className="input"
                  placeholder="例如：都市情感短剧《时光邮局》"
                  required
                  autoFocus
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                />
              </label>
              <div className="field-row">
                <label className="field">
                  <span className="field-label">计划集数</span>
                  <input
                    className="input"
                    type="number"
                    min="1"
                    max="100"
                    value={formEpisodes}
                    onChange={(e) => setFormEpisodes(parseInt(e.target.value) || 12)}
                  />
                </label>
                <label className="field">
                  <span className="field-label">视觉风格</span>
                  <select value={formStyle} onChange={(e) => setFormStyle(e.target.value)}>
                    {Object.entries(styleLabels).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                </label>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-ghost" onClick={() => setShowCreateModal(false)}>取消</button>
                <button type="submit" className="btn btn-brand">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                    <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                  创建项目
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toasts */}
      {toasts.length > 0 && (
        <div className="toast-container">
          {toasts.map((t) => (
            <div key={t.id} className="toast" style={{ opacity: t.exiting ? 0 : 1, transition: 'opacity 0.3s' }}>
              {t.text}
            </div>
          ))}
        </div>
      )}

      {/* ══ Dashboard-specific CSS ══ */}
      <style jsx global>{`
        .page {
          padding: 28px 48px 40px;
          overflow-y: auto;
          flex: 1;
          animation: fadeUp 0.35s cubic-bezier(0.2, 0, 0, 1) both;
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .page-head {
          display: flex; justify-content: space-between; align-items: flex-end;
          margin-bottom: 28px;
        }
        .head-left { display: flex; flex-direction: column; gap: 4px; }
        .page-title {
          font-family: var(--font-display); font-size: 26px; font-weight: 500;
          letter-spacing: -0.02em; color: var(--fg); line-height: var(--leading-tight);
        }
        .page-desc { font-size: var(--text-sm); color: var(--muted); font-weight: 400; }
        .offline-badge {
          display: inline-block; margin-left: 10px;
          font-size: 10px; font-weight: 600; color: var(--warning, #f59e0b);
          background: color-mix(in oklab, var(--warning, #f59e0b) 12%, transparent);
          padding: 1px 8px; border-radius: var(--radius-pill);
          vertical-align: middle;
        }

        .grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 20px;
        }

        /* Project card */
        .project-card {
          background: var(--surface); border: 1px solid var(--border);
          border-radius: var(--radius-lg); padding: 0; cursor: pointer;
          display: flex; flex-direction: column; overflow: hidden;
          animation: fadeUp 0.4s cubic-bezier(0.2, 0, 0, 1) both;
          transition: transform 0.22s var(--ease-standard), box-shadow 0.22s var(--ease-standard), border-color 0.2s;
        }
        .project-card:hover {
          border-color: var(--accent);
          box-shadow: 0 0 0 1px var(--accent), 0 4px 12px rgba(0, 0, 0, 0.4);
          transform: translateY(-3px);
        }
        .card-film-strip {
          display: flex; justify-content: space-around; align-items: center;
          padding: 6px 16px;
          background: color-mix(in oklab, var(--bg) 60%, var(--surface));
          border-bottom: 1px solid var(--border-soft);
        }
        .film-hole {
          width: 10px; height: 8px; background: var(--bg);
          border-radius: 2px; transition: background 0.2s;
        }
        .project-card:hover .film-hole:nth-child(2) { background: var(--accent); }
        .project-card:hover .film-hole:nth-child(4) { background: var(--accent); opacity: 0.5; }

        .card-body { padding: 18px 18px 14px; flex: 1; display: flex; flex-direction: column; gap: 10px; }
        .card-header { display: flex; justify-content: space-between; align-items: center; }
        .episode-badge {
          display: flex; align-items: center; gap: 5px;
          font-size: 11px; font-weight: 600; color: var(--muted);
          letter-spacing: 0.04em; text-transform: uppercase; font-family: var(--font-mono);
        }
        .episode-badge svg { color: var(--accent); width: 10px; height: 10px; }
        .card-delete {
          opacity: 0; transition: opacity 0.15s;
          background: none; border: none; cursor: pointer; padding: 6px 8px;
          border-radius: var(--radius-sm); color: var(--fg-2);
        }
        .card-delete:hover { background: var(--surface); color: var(--fg); }
        .project-card:hover .card-delete { opacity: 1; }

        .project-title {
          font-family: var(--font-display); font-size: 16px; font-weight: 500;
          line-height: 1.35; color: var(--fg);
        }
        .project-meta { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
        .style-tag {
          font-size: 11px; font-weight: 500; padding: 2px 8px;
          background: color-mix(in oklab, var(--accent) 12%, transparent);
          color: var(--accent); border-radius: var(--radius-pill);
          border: 1px solid color-mix(in oklab, var(--accent) 20%, transparent);
          text-transform: capitalize;
        }
        .meta-item {
          display: flex; align-items: center; gap: 4px;
          font-size: 12px; color: var(--muted);
        }
        .meta-item svg { width: 11px; height: 11px; }

        .card-footer {
          padding: 10px 18px 14px; border-top: 1px solid var(--border-soft);
          display: flex; align-items: center; gap: 10px;
        }
        .progress-mini { flex: 1; }
        .progress-mini-track {
          height: 3px; background: var(--border-soft);
          border-radius: var(--radius-pill); overflow: hidden;
        }
        .progress-mini-fill {
          height: 100%; background: var(--accent);
          border-radius: var(--radius-pill);
          transition: width 0.6s var(--ease-standard);
        }
        .card-date { font-size: 11px; color: var(--meta); white-space: nowrap; font-family: var(--font-mono); }

        /* Empty card */
        .empty-card {
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          gap: 10px; padding: 56px 32px; cursor: pointer;
          border-style: dashed; border-width: 1.5px; text-align: center;
          transition: all 0.2s var(--ease-standard); background: transparent;
        }
        .empty-card:hover {
          border-color: var(--accent);
          background: color-mix(in oklab, var(--accent) 5%, transparent);
          transform: translateY(-2px);
        }
        .empty-icon {
          width: 56px; height: 56px; border-radius: var(--radius-lg);
          background: var(--surface); display: flex; align-items: center;
          justify-content: center; color: var(--muted); margin-bottom: 4px;
          transition: all 0.2s;
        }
        .empty-card:hover .empty-icon {
          background: color-mix(in oklab, var(--accent) 12%, transparent);
          color: var(--accent);
        }
        .empty-title { font-size: 14px; font-weight: 600; color: var(--fg-2); }
        .empty-desc { font-size: 12px; color: var(--muted); max-width: 220px; line-height: 1.6; }

        /* Create modal */
        .overlay {
          position: fixed; inset: 0; z-index: 100;
          background: rgba(0, 0, 0, 0.6); backdrop-filter: blur(8px);
          display: flex; align-items: center; justify-content: center;
          padding: 24px; animation: fadeIn 0.2s var(--ease-standard);
        }
        .overlay .modal {
          background: var(--surface); border: 1px solid var(--border);
          border-radius: var(--radius-lg); padding: 32px; width: 460px;
          box-shadow: 0 0 0 1px var(--border), 0 4px 12px rgba(0, 0, 0, 0.4);
          animation: scaleIn 0.2s var(--ease-standard);
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.96); }
          to { opacity: 1; transform: scale(1); }
        }
        .overlay .modal-header {
          margin-bottom: 24px; display: flex; flex-direction: column; gap: 6px;
        }
        .modal-icon {
          width: 44px; height: 44px; border-radius: var(--radius-sm);
          background: color-mix(in oklab, var(--accent) 12%, transparent);
          color: var(--accent); display: flex; align-items: center;
          justify-content: center; margin-bottom: 4px;
        }
        .modal-title {
          font-family: var(--font-display); font-size: 19px; font-weight: 500; color: var(--fg);
        }
        .modal-desc { font-size: var(--text-sm); color: var(--muted); }
        .modal-form { display: flex; flex-direction: column; gap: 16px; }
        .field-label { font-size: 12px; font-weight: 600; color: var(--fg-2); }
        .required { color: var(--danger); }
        .input {
          padding: 9px 12px; border-radius: var(--radius-sm); background: var(--bg);
          border: 1px solid var(--border); color: var(--fg);
          font-family: var(--font-body); font-size: var(--text-sm);
          transition: border-color var(--motion-fast) var(--ease-standard);
          outline: none;
        }
        .input:focus { border-color: var(--accent); box-shadow: var(--focus-ring); }
        .input::placeholder { color: var(--meta); }
        .field-row { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
        .modal-actions { display: flex; justify-content: flex-end; gap: 10px; padding-top: 6px; }

        @media (max-width: 1023px) {
          .page { padding: 20px 24px; }
        }
        @media (max-width: 639px) {
          .grid { grid-template-columns: 1fr; }
          .page { padding: 16px; }
          .field-row { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
}
