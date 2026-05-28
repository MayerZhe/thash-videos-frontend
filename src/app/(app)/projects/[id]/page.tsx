'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { projectsApi, episodesApi } from '@/lib/api';
import type { Episode as ApiEpisode, Project as ApiProject } from '@/lib/types';

/* ═══════════════════════════════════════════════════════════════════════
 * Project Detail Page — 1:1 replica of Thash-video-design/project-detail.html
 * Route: /projects/[id]
 * Shows episode list, add-episode dialog (with locked AI config), and
 * generation task history with filter pills, sort, and detail drawer.
 * ═══════════════════════════════════════════════════════════════════════ */

const STATUS_LABELS: Record<string, string> = {
  completed: '已完成', failed: '失败', running: '进行中', pending: '待开始',
};

const STYLE_LABELS: Record<string, string> = {
  realistic: '写实', anime: '动漫', comic: '搞笑', custom: '自定义',
  ghibli: '吉卜力', cinematic: '电影级', watercolor: '水彩', chinese_ink: '水墨古风',
};

interface Episode {
  episodeNumber: number;
  title: string;
  hasScript: boolean;
  duration: number;
  imageConfig: string;
  videoConfig: string;
  audioConfig: string;
}

interface ProjectView {
  title: string;
  style: string;
  characters: number;
  scenes: number;
}

interface Task {
  task_id: string;
  title: string;
  status: string;
  created_at: string;
  completed_at: string | null;
  duration: number;
  n_frames: number;
  video_path: string;
  input_text: string;
  pipeline: string;
  supplier: { image: string; video: string; tts: string };
}

const IMAGE_OPTIONS = [
  { value: 'seedream', label: 'Seedream 5.0 · 即梦' },
  { value: 'nano', label: 'Nano Banana 2 · 火山引擎' },
  { value: 'gpt', label: 'GPT Image 2 · OpenAI' },
];

const VIDEO_OPTIONS = [
  { value: 'seedance', label: 'Seedance 2.0 · 即梦' },
  { value: 'vidu', label: 'Vidu Q3' },
  { value: 'veo', label: 'Veo 3.1 · Google' },
];

const AUDIO_OPTIONS = [
  { value: 'minimax', label: 'MiniMax TTS' },
  { value: 'volcano', label: '火山引擎 TTS' },
];

function esc(s: unknown): string {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function fmtTs(iso: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function fmtDuration(s: number): string {
  if (!s) return '—';
  if (s < 60) return `${s}s`;
  return `${Math.floor(s / 60)}m ${s % 60}s`;
}

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [project, setProject] = useState<ProjectView | null>(null);
  const [projectLoading, setProjectLoading] = useState(true);
  const [projectError, setProjectError] = useState<string | null>(null);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [episodesLoading, setEpisodesLoading] = useState(true);
  const [tasks, setTasks] = useState<Task[]>([]);

  /* Dialog & drawer state */
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [epTitle, setEpTitle] = useState('');
  const [imgCfg, setImgCfg] = useState('seedream');
  const [vidCfg, setVidCfg] = useState('seedance');
  const [audCfg, setAudCfg] = useState('minimax');

  const [histFilter, setHistFilter] = useState('all');
  const [histSort, setHistSort] = useState('created_at');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  /* Toast */
  const [toasts, setToasts] = useState<{ id: number; msg: string }[]>([]);
  let toastId = useRef(0);
  const toast = useCallback((msg: string) => {
    const id = ++toastId.current;
    setToasts((prev) => [...prev, { id, msg }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 2500);
  }, []);

  /* ── Load from API ── */
  const loadData = useCallback(async () => {
    setProjectLoading(true);
    setProjectError(null);
    try {
      const proj = await projectsApi.get(projectId);
      setProject({ title: proj.title, style: proj.style || '', characters: 0, scenes: 0 });
    } catch (err) {
      setProjectError((err as Error).message);
    } finally {
      setProjectLoading(false);
    }

    setEpisodesLoading(true);
    try {
      const eps = await episodesApi.list(projectId);
      const mapped: Episode[] = (eps || []).map((ep: ApiEpisode) => ({
        episodeNumber: ep.episode_number,
        title: ep.title || `第 ${ep.episode_number} 集`,
        hasScript: ep.script_status === 'completed',
        duration: ep.duration_seconds || 0,
        imageConfig: 'seedream',
        videoConfig: 'seedance',
        audioConfig: 'minimax',
      }));
      setEpisodes(mapped);
    } catch {
      setEpisodes([]);
    } finally {
      setEpisodesLoading(false);
    }

    /* Tasks: keep localStorage fallback (no task API) */
    const tasksKey = `thash_task_history_${projectId}`;
    try {
      const raw = localStorage.getItem(tasksKey);
      if (raw) setTasks(JSON.parse(raw));
    } catch { /* ignore */ }
  }, [projectId]);

  useEffect(() => { loadData(); }, [loadData]);

  /* ── Derived ── */
  const counts = {
    all: tasks.length,
    completed: tasks.filter((t) => t.status === 'completed').length,
    failed: tasks.filter((t) => t.status === 'failed').length,
    running: tasks.filter((t) => t.status === 'running').length,
    pending: tasks.filter((t) => t.status === 'pending').length,
  };

  const filteredTasks = (() => {
    let list = histFilter === 'all' ? [...tasks] : tasks.filter((t) => t.status === histFilter);
    if (histSort === 'completed_at') list.sort((a, b) => (b.completed_at || '').localeCompare(a.completed_at || ''));
    else if (histSort === 'title') list.sort((a, b) => a.title.localeCompare(b.title));
    else if (histSort === 'duration') list.sort((a, b) => b.duration - a.duration);
    else list.sort((a, b) => b.created_at.localeCompare(a.created_at));
    return list;
  })();

  /* ── Actions ── */
  const handleAddEpisode = async () => {
    const n = episodes.length + 1;
    const title = epTitle.trim() || `第 ${n} 集`;
    try {
      const ep = await episodesApi.create(projectId, { episode_number: n, title });
      setEpisodes((prev) => [...prev, {
        episodeNumber: ep.episode_number,
        title: ep.title || title,
        hasScript: false,
        duration: 0,
        imageConfig: imgCfg,
        videoConfig: vidCfg,
        audioConfig: audCfg,
      }]);
      setShowAddDialog(false);
      setEpTitle('');
      toast(`已添加第 ${n} 集`);
      setTimeout(() => router.push(`/projects/${projectId}/episodes/${n}`), 500);
    } catch (err) {
      toast(`创建失败: ${(err as Error).message}`);
    }
  };

  const handleDeleteTask = (tid: string) => {
    if (!confirm('确认删除此任务？此操作不可撤销。')) return;
    const updated = tasks.filter((t) => t.task_id !== tid);
    setTasks(updated);
    try { localStorage.setItem(`thash_task_history_${projectId}`, JSON.stringify(updated)); } catch { /* ignore */ }
    toast('任务已删除');
  };

  const scClass = (status: string) =>
    ({ completed: 'hsb-ok', failed: 'hsb-err', running: 'hsb-run', pending: 'hsb-wait' } as Record<string, string>)[status] || '';

  const scSymbol = (status: string) =>
    ({ completed: '✓', failed: '✗', running: '→', pending: '—' } as Record<string, string>)[status] || '';

  if (projectLoading) {
    return <div className="pd-content"><p className="text-sm text-muted text-center py-12">加载中...</p></div>;
  }
  if (projectError) {
    return (
      <div className="pd-content">
        <div className="flex flex-col items-center gap-3 py-12">
          <p className="text-sm text-danger">加载失败: {projectError}</p>
          <button className="btn btn-brand btn-sm" onClick={loadData}>重试</button>
        </div>
      </div>
    );
  }
  if (!project) return null;

  return (
    <>
      {/* ── Page Top Info ── */}
      <div className="pd-topinfo">
        <span className="badge badge-accent" style={{ fontSize: 'var(--text-xs)', padding: '1px 10px', height: 22 }}>
          project-detail
        </span>
        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)' }}>剧集列表 · 生成历史</span>
        <span style={{ flex: 1 }} />
        <button className="back-link" onClick={() => router.push('/dashboard')}>
          &larr; 返回工作台
        </button>
      </div>

      <div className="pd-content">
        {/* ── Head Row ── */}
        <div className="head-row">
          <div className="head-left">
            <h1 className="title">{project.title}</h1>
            <div className="meta-row">
              {project.style && <span className="style-tag">{STYLE_LABELS[project.style] || project.style}</span>}
            </div>
          </div>
          <button className="btn btn-brand" onClick={() => { setShowAddDialog(true); setEpTitle(''); }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            添加集
          </button>
        </div>

        {/* ── Episode List ── */}
        <div className="sec-label">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <rect x="2" y="2" width="20" height="20" rx="2.5" />
            <line x1="7" y1="8" x2="7" y2="16" />
            <line x1="10" y1="8" x2="10" y2="16" />
            <line x1="13" y1="8" x2="13" y2="16" />
            <line x1="16" y1="8" x2="16" y2="16" />
          </svg>
          剧集列表
        </div>

        <div className="ep-list">
          {episodesLoading ? (
            <div className="empty-box"><p>加载剧集中...</p></div>
          ) : episodes.length === 0 ? (
            <div className="empty-box"><p>点击上方「添加集」创建第一集</p></div>
          ) : (
            episodes.map((ep) => (
              <div
                key={ep.episodeNumber}
                className="ep-row"
                onClick={() => router.push(`/projects/${projectId}/episodes/${ep.episodeNumber}`)}
              >
                <div className="ep-num">E{String(ep.episodeNumber).padStart(2, '0')}</div>
                <div className="ep-body">
                  <span className="ep-name">{esc(ep.title)}</span>
                  <div className="ep-meta">
                    {ep.hasScript ? (
                      <>
                        <span className="dot-green" />
                        <span className="ep-status-txt">已完成剧本</span>
                      </>
                    ) : (
                      <>
                        <span className="dot-gray" />
                        <span className="ep-status-txt">待编写</span>
                      </>
                    )}
                    {ep.duration ? <span className="ep-dur">{ep.duration}s</span> : null}
                  </div>
                </div>
                <div className="ep-arr">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </div>
              </div>
            ))
          )}
        </div>

        {/* ── History ── */}
        <div className="hist-section">
          <div className="sec-label">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <polygon points="23 7 16 12 23 17 23 7" />
              <rect x="1" y="5" width="15" height="14" rx="2" />
            </svg>
            生成历史
          </div>

          <div className="hist-bar">
            <div className="hist-pills">
              {(['all', 'completed', 'failed', 'running', 'pending'] as const).map((f) => (
                <button
                  key={f}
                  className={`hp${histFilter === f ? ' on' : ''}`}
                  onClick={() => setHistFilter(f)}
                >
                  {{ all: '全部', completed: '已完成', failed: '失败', running: '进行中', pending: '待开始' }[f]}（{counts[f]}）
                </button>
              ))}
            </div>
            <div className="hist-sort">
              <select value={histSort} onChange={(e) => setHistSort(e.target.value)}>
                <option value="created_at">按创建时间</option>
                <option value="completed_at">按完成时间</option>
                <option value="title">按标题</option>
                <option value="duration">按时长</option>
              </select>
            </div>
          </div>

          <div className="hist-grid">
            {filteredTasks.length === 0 ? (
              <div className="empty-box" style={{ gridColumn: '1 / -1' }}>暂无记录</div>
            ) : (
              filteredTasks.map((t) => (
                <div
                  key={t.task_id}
                  className="hcard"
                  onClick={() => setSelectedTask(t)}
                >
                  <div className="hthumb">
                    {t.status === 'completed'
                      ? `${t.n_frames} 镜头 · ${fmtDuration(t.duration)}`
                      : `${scSymbol(t.status)} ${STATUS_LABELS[t.status] || t.status}`}
                    <span className={`hsb ${scClass(t.status)}`}>{STATUS_LABELS[t.status] || t.status}</span>
                  </div>
                  <div className="hinfo">
                    <span className="ht">{esc(t.title)}</span>
                    <div className="hm">
                      <span className="htime">{fmtTs(t.created_at)}</span>
                      <span>{fmtDuration(t.duration)}</span>
                    </div>
                  </div>
                  <div className="hacts">
                    <button className="hbtn" onClick={(e) => { e.stopPropagation(); setSelectedTask(t); }}>详情</button>
                    <button
                      className="hbtn"
                      style={t.status !== 'completed' ? { opacity: 0.4 } : undefined}
                      disabled={t.status !== 'completed'}
                      onClick={(e) => { e.stopPropagation(); toast(`下载任务: ${t.task_id}`); }}
                    >
                      下载
                    </button>
                    <button
                      className="hbtn del"
                      onClick={(e) => { e.stopPropagation(); handleDeleteTask(t.task_id); }}
                    >
                      删除
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* ── Add Episode Dialog ── */}
      {showAddDialog && (
        <div
          className="overlay open"
          onClick={(e) => { if (e.target === e.currentTarget) { setShowAddDialog(false); setEpTitle(''); } }}
        >
          <div className="dlg" onClick={(e) => e.stopPropagation()}>
            <div className="dlg-head">
              <div>
                <div className="dlg-kicker">Episode Setup</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                  <h2>创建新集</h2>
                  <span className="badge">配置将锁定</span>
                </div>
                <p className="dlg-sub" style={{ marginTop: 6 }}>
                  为这一集预先锁定图片、视频和音频生成服务。创建后，这些生成链路将始终跟随当前集配置。
                </p>
              </div>
              <button className="dlg-close" onClick={() => { setShowAddDialog(false); setEpTitle(''); }}>
                取消
              </button>
            </div>

            <div className="chip-row">
              <span className="chip">图片 · 3 可选</span>
              <span className="chip">视频 · 3 可选</span>
              <span className="chip">音频 · 2 可选</span>
            </div>

            <div className="dlg-sec">
              <h3>基础信息</h3>
              <div className="fld">
                <span className="fld-lbl">标题</span>
                <input
                  id="epTitle"
                  placeholder="留空时自动按集数命名，例如「第 3 集」"
                  value={epTitle}
                  onChange={(e) => setEpTitle(e.target.value)}
                  autoFocus
                />
                <span className="fld-hint">留空时自动按集数命名。</span>
              </div>
            </div>

            <div className="dlg-sec">
              <h3>生成配置 · 创建后不可更改</h3>
              <div className="cfg-grid">
                <div className="cfg-card">
                  <span className="kk">IMAGE</span>
                  <label>图片配置</label>
                  <select value={imgCfg} onChange={(e) => setImgCfg(e.target.value)}>
                    {IMAGE_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>
                <div className="cfg-card">
                  <span className="kk">VIDEO</span>
                  <label>视频配置</label>
                  <select value={vidCfg} onChange={(e) => setVidCfg(e.target.value)}>
                    {VIDEO_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>
                <div className="cfg-card">
                  <span className="kk">AUDIO</span>
                  <label>音频配置</label>
                  <select value={audCfg} onChange={(e) => setAudCfg(e.target.value)}>
                    {AUDIO_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="dlg-foot">
              <p>创建后，工作台中的图片、视频、音频生成入口都会锁定到当前集。</p>
              <button className="btn btn-brand" onClick={handleAddEpisode}>创建并锁定配置</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Task Detail Drawer ── */}
      {selectedTask && (
        <>
          <div className="tdrawer-bg open" onClick={(e) => { if (e.target === e.currentTarget) setSelectedTask(null); }} />
          <div className="tdrawer">
            <div className="tdhead">
              <h3>{selectedTask.title}</h3>
              <button className="dlg-close" onClick={() => setSelectedTask(null)}>关闭</button>
            </div>
            <div className="tdbody">
              <div className="tdsec">
                <h4>基本信息</h4>
                <div className="tdrow"><span>任务 ID</span><span style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent)' }}>{esc(selectedTask.task_id)}</span></div>
                <div className="tdrow"><span>状态</span><span>{STATUS_LABELS[selectedTask.status] || selectedTask.status}</span></div>
                <div className="tdrow"><span>管线</span><span style={{ fontFamily: 'var(--font-mono)' }}>{esc(selectedTask.pipeline)}</span></div>
                <div className="tdrow"><span>镜头数</span><span style={{ fontFamily: 'var(--font-mono)' }}>{selectedTask.n_frames}</span></div>
                <div className="tdrow"><span>创建时间</span><span>{new Date(selectedTask.created_at).toLocaleString()}</span></div>
                {selectedTask.completed_at && (
                  <div className="tdrow"><span>完成时间</span><span>{new Date(selectedTask.completed_at).toLocaleString()}</span></div>
                )}
              </div>
              <div className="tdsec">
                <h4>输入参数</h4>
                <div className="tdrow"><span>输入文本</span><span>{esc(selectedTask.input_text)}</span></div>
                <div className="tdrow"><span>管线模式</span><span style={{ fontFamily: 'var(--font-mono)' }}>{esc(selectedTask.pipeline)}</span></div>
              </div>
              <div className="tdsec">
                <h4>供应商配置</h4>
                <div className="tdrow"><span>图片引擎</span><span>{esc(selectedTask.supplier.image)}</span></div>
                <div className="tdrow"><span>视频引擎</span><span>{esc(selectedTask.supplier.video)}</span></div>
                <div className="tdrow"><span>TTS 引擎</span><span>{esc(selectedTask.supplier.tts)}</span></div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── Toasts ── */}
      <div className="toasts" style={{ position: 'fixed', bottom: 'var(--space-6)', right: 'var(--space-6)', zIndex: 200, display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
        {toasts.map((t) => (
          <div key={t.id} className="toast">{t.msg}</div>
        ))}
      </div>

      {/* ══ Page-specific CSS ══ */}
      <style jsx global>{`
        /* ── Top info bar (below AppTopbar) ── */
        .pd-topinfo {
          display: flex;
          align-items: center;
          gap: var(--space-3);
          padding: var(--space-3) var(--space-8);
          background: var(--surface);
          border-bottom: 1px solid var(--border-soft);
        }
        .pd-content {
          padding: var(--space-8);
          max-width: 1000px;
        }

        /* ── Head row ── */
        .head-row {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          gap: var(--space-5);
          margin-bottom: var(--space-8);
        }
        .head-left {
          display: flex;
          flex-direction: column;
          gap: var(--space-3);
        }
        .back-link {
          display: inline-flex;
          align-items: center;
          gap: var(--space-1);
          padding: var(--space-1) var(--space-3);
          font-size: var(--text-xs);
          font-weight: 500;
          font-family: var(--font-body);
          border: 1px solid var(--border);
          border-radius: var(--radius-sm);
          background: var(--bg);
          color: var(--fg-2);
          cursor: pointer;
          text-decoration: none;
          transition: background var(--motion-fast), color var(--motion-fast);
        }
        .back-link:hover {
          background: var(--surface);
          color: var(--fg);
        }
        .title {
          font-size: var(--text-3xl);
          font-weight: 400;
          line-height: 1.2;
          color: var(--fg);
          letter-spacing: -0.02em;
          font-family: var(--font-display);
        }
        .meta-row {
          display: flex;
          align-items: center;
          gap: var(--space-2);
          flex-wrap: wrap;
        }
        .style-tag {
          font-size: var(--text-xs);
          font-weight: 500;
          padding: 2px 10px;
          border-radius: var(--radius-pill);
          color: var(--accent);
          background: rgba(62, 207, 142, 0.12);
          border: 1px solid rgba(62, 207, 142, 0.25);
        }
        .meta-dot {
          width: 3px;
          height: 3px;
          border-radius: 50%;
          background: var(--meta);
        }
        .meta-stat {
          font-size: var(--text-xs);
          color: var(--fg-2);
          display: flex;
          align-items: center;
          gap: 5px;
        }

        /* ── Section label ── */
        .sec-label {
          display: flex;
          align-items: center;
          gap: var(--space-2);
          font-family: var(--font-mono);
          font-size: var(--text-xs);
          font-weight: 500;
          color: var(--meta);
          letter-spacing: 0.08em;
          text-transform: uppercase;
          margin-bottom: var(--space-3);
        }

        /* ── Episode list ── */
        .ep-list {
          display: flex;
          flex-direction: column;
          gap: var(--space-2);
          margin-bottom: var(--space-12);
        }
        .ep-row {
          display: flex;
          align-items: center;
          gap: var(--space-4);
          padding: 14px var(--space-4);
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          cursor: pointer;
          transition: border-color 0.18s, transform 0.18s, box-shadow 0.18s;
        }
        .ep-row:hover {
          border-color: var(--accent);
          box-shadow: 0 0 0 1px var(--border), 0 4px 12px rgba(0, 0, 0, 0.4);
          transform: translateX(4px);
        }
        .ep-num {
          width: 44px;
          height: 44px;
          flex-shrink: 0;
          border-radius: var(--radius-sm);
          background: var(--bg);
          border: 1px solid var(--border-soft);
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: var(--font-mono);
          font-size: var(--text-xs);
          font-weight: 500;
          color: var(--fg-2);
          transition: background 0.18s, border-color 0.18s, color 0.18s;
        }
        .ep-row:hover .ep-num {
          background: rgba(62, 207, 142, 0.12);
          border-color: rgba(62, 207, 142, 0.25);
          color: var(--accent);
        }
        .ep-body {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 5px;
        }
        .ep-name {
          font-size: var(--text-sm);
          font-weight: 500;
          color: var(--fg);
        }
        .ep-meta {
          display: flex;
          align-items: center;
          gap: var(--space-1);
        }
        .dot-green {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--accent);
          flex-shrink: 0;
        }
        .dot-gray {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--meta);
          flex-shrink: 0;
        }
        .ep-status-txt {
          font-size: var(--text-xs);
          color: var(--muted);
        }
        .ep-dur {
          font-size: var(--text-xs);
          color: var(--muted);
          font-family: var(--font-mono);
          margin-left: 4px;
        }
        .ep-arr {
          color: var(--meta);
          flex-shrink: 0;
          transition: transform 0.18s, color 0.18s;
        }
        .ep-row:hover .ep-arr {
          transform: translateX(3px);
          color: var(--accent);
        }

        /* ── Empty state ── */
        .empty-box {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: var(--space-2);
          padding: var(--space-12);
          text-align: center;
          color: var(--muted);
          font-size: var(--text-sm);
          background: var(--surface);
          border: 1px dashed var(--border);
          border-radius: var(--radius-md);
        }

        /* ── Add Episode Dialog ── */
        .overlay {
          position: fixed;
          inset: 0;
          z-index: 100;
          background: rgba(0, 0, 0, 0.6);
          backdrop-filter: blur(8px);
          display: none;
          align-items: center;
          justify-content: center;
          padding: var(--space-6);
        }
        .overlay.open {
          display: flex;
        }
        .dlg {
          width: min(760px, 100%);
          max-height: min(860px, calc(100vh - 48px));
          display: flex;
          flex-direction: column;
          gap: 18px;
          padding: 26px;
          border-radius: var(--radius-lg);
          background: var(--surface);
          border: 1px solid var(--border);
          box-shadow: var(--elev-raised);
          overflow-y: auto;
          animation: fadeIn 0.2s var(--ease-standard);
        }
        .dlg-head {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: var(--space-4);
        }
        .dlg-head h2 {
          font-size: 28px;
          font-weight: 600;
          color: var(--fg);
          letter-spacing: -0.03em;
        }
        .dlg-sub {
          font-size: var(--text-sm);
          line-height: 1.7;
          color: var(--fg-2);
        }
        .dlg-kicker {
          font-size: var(--text-xs);
          font-weight: 500;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: var(--meta);
          font-family: var(--font-mono);
          margin-bottom: 6px;
        }
        .badge {
          display: inline-flex;
          align-items: center;
          height: 28px;
          padding: 0 var(--space-3);
          border-radius: var(--radius-pill);
          font-size: var(--text-xs);
          font-weight: 500;
          background: rgba(62, 207, 142, 0.12);
          color: var(--accent);
        }
        .chip-row {
          display: flex;
          gap: var(--space-2);
          flex-wrap: wrap;
        }
        .chip {
          display: inline-flex;
          align-items: center;
          height: 30px;
          padding: 0 14px;
          border-radius: var(--radius-pill);
          background: var(--bg);
          border: 1px solid var(--border-soft);
          font-size: var(--text-xs);
          color: var(--fg-2);
        }
        .dlg-sec {
          padding: var(--space-4) 18px;
          border-radius: var(--radius-md);
          background: var(--bg);
          border: 1px solid var(--border-soft);
          display: flex;
          flex-direction: column;
          gap: var(--space-3);
        }
        .dlg-sec h3 {
          font-size: var(--text-sm);
          font-weight: 500;
          color: var(--fg);
          margin: 0;
        }
        .cfg-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: var(--space-3);
        }
        .cfg-card {
          display: flex;
          flex-direction: column;
          gap: var(--space-2);
          padding: 14px;
          border-radius: var(--radius-md);
          background: var(--surface);
          border: 1px solid var(--border);
        }
        .cfg-card .kk {
          font-size: var(--text-xs);
          font-weight: 500;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--meta);
          font-family: var(--font-mono);
        }
        .cfg-card label {
          font-size: var(--text-xs);
          font-weight: 500;
          color: var(--fg-2);
        }
        .dlg-foot {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: var(--space-4);
          padding-top: 2px;
        }
        .dlg-foot p {
          font-size: var(--text-xs);
          line-height: 1.6;
          color: var(--muted);
          flex: 1;
        }
        .dlg-close {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 7px 12px;
          font-size: var(--text-sm);
          font-weight: 500;
          font-family: var(--font-body);
          border: 1px solid var(--border);
          border-radius: var(--radius-sm);
          background: var(--bg);
          color: var(--fg-2);
          cursor: pointer;
          transition: background var(--motion-fast), color var(--motion-fast);
        }
        .dlg-close:hover {
          background: var(--surface);
          color: var(--fg);
        }

        /* ── Form fields in dialog ── */
        .fld {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .fld-lbl {
          font-size: var(--text-xs);
          font-weight: 500;
          color: var(--fg-2);
        }
        .fld-hint {
          font-size: var(--text-xs);
          color: var(--muted);
        }
        .dlg-sec input,
        .dlg-sec select {
          padding: 9px var(--space-3);
          border-radius: var(--radius-sm);
          background: var(--bg);
          border: 1px solid var(--border);
          color: var(--fg);
          font-family: var(--font-body);
          font-size: var(--text-sm);
          outline: none;
          transition: border-color 0.15s;
        }
        .dlg-sec input:focus,
        .dlg-sec select:focus {
          border-color: var(--accent);
        }
        .dlg-sec input::placeholder {
          color: var(--meta);
        }
        .dlg-sec select {
          appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23898989' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 10px center;
          padding-right: 32px;
        }

        /* ── History ── */
        .hist-section {
          margin-top: var(--space-2);
        }
        .hist-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: var(--space-3);
          margin-bottom: var(--space-4);
          flex-wrap: wrap;
        }
        .hist-pills {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
        }
        .hp {
          padding: 6px 14px;
          border-radius: var(--radius-pill);
          cursor: pointer;
          font-size: var(--text-xs);
          font-weight: 500;
          font-family: var(--font-body);
          border: 1px solid var(--border);
          background: var(--bg);
          color: var(--fg-2);
          transition: all var(--motion-fast);
        }
        .hp:hover {
          background: var(--surface);
          color: var(--fg);
        }
        .hp.on {
          background: rgba(62, 207, 142, 0.12);
          border-color: rgba(62, 207, 142, 0.30);
          color: var(--accent);
        }
        .hist-sort select {
          padding: 6px 12px;
          border-radius: var(--radius-sm);
          background: var(--bg);
          border: 1px solid var(--border);
          color: var(--fg-2);
          font-size: var(--text-xs);
          font-family: var(--font-body);
          outline: none;
          cursor: pointer;
        }

        /* ── History cards ── */
        .hist-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: var(--space-3);
        }
        .hcard {
          display: flex;
          flex-direction: column;
          gap: var(--space-2);
          padding: var(--space-4);
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          cursor: pointer;
          transition: border-color var(--motion-fast);
        }
        .hcard:hover {
          border-color: var(--accent);
        }
        .hthumb {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: var(--space-3) var(--space-4);
          border-radius: var(--radius-sm);
          background: var(--bg);
          border: 1px solid var(--border-soft);
          font-size: var(--text-xs);
          color: var(--fg-2);
          font-family: var(--font-mono);
        }
        .hsb {
          padding: 1px 8px;
          border-radius: var(--radius-pill);
          font-size: 10px;
          font-weight: 500;
          font-family: var(--font-body);
        }
        .hsb-ok {
          background: rgba(22, 163, 74, 0.15);
          color: #16a34a;
        }
        .hsb-err {
          background: rgba(220, 38, 38, 0.15);
          color: #dc2626;
        }
        .hsb-run {
          background: rgba(234, 179, 8, 0.15);
          color: #eab308;
        }
        .hsb-wait {
          background: rgba(137, 137, 137, 0.10);
          color: var(--muted);
        }
        .hinfo {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .ht {
          font-weight: 500;
          color: var(--fg);
          font-size: var(--text-sm);
        }
        .hm {
          display: flex;
          gap: var(--space-3);
          font-size: var(--text-xs);
          color: var(--muted);
          flex-wrap: wrap;
        }
        .hacts {
          display: flex;
          gap: 6px;
          margin-top: 2px;
        }
        .hbtn {
          padding: 4px 10px;
          border-radius: var(--radius-sm);
          border: 1px solid var(--border);
          background: var(--bg);
          color: var(--fg-2);
          font-size: var(--text-xs);
          font-family: var(--font-body);
          cursor: pointer;
          transition: border-color var(--motion-fast), color var(--motion-fast);
        }
        .hbtn:hover {
          border-color: var(--accent);
          color: var(--fg);
        }
        .hbtn.del:hover {
          border-color: var(--danger);
          color: var(--danger);
        }
        .hbtn:disabled {
          cursor: not-allowed;
        }

        /* ── Task detail drawer ── */
        .tdrawer-bg {
          position: fixed;
          inset: 0;
          z-index: 110;
          background: rgba(0, 0, 0, 0.5);
          display: none;
        }
        .tdrawer-bg.open {
          display: block;
        }
        .tdrawer {
          position: fixed;
          top: 0;
          right: 0;
          width: min(480px, 100vw);
          height: 100vh;
          z-index: 111;
          background: var(--bg);
          border-left: 1px solid var(--border);
          padding: var(--space-6);
          overflow-y: auto;
          animation: slideIn 0.2s var(--ease-standard);
        }
        .tdhead {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: var(--space-4);
        }
        .tdhead h3 {
          font-size: var(--text-lg);
          font-weight: 400;
          color: var(--fg);
        }
        .tdbody {
          display: flex;
          flex-direction: column;
          gap: var(--space-4);
        }
        .tdsec {
          display: flex;
          flex-direction: column;
          gap: var(--space-2);
          padding: var(--space-3);
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
        }
        .tdsec h4 {
          font-size: var(--text-xs);
          font-weight: 500;
          color: var(--fg);
          margin-bottom: 4px;
        }
        .tdrow {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: var(--text-xs);
          color: var(--fg-2);
          padding: 4px 0;
        }
        .tdrow span:first-child {
          color: var(--muted);
        }
        .tdrow span:last-child {
          text-align: right;
        }

        /* ── Toast ── */
        .toast {
          padding: 12px 20px;
          border-radius: var(--radius-sm);
          background: var(--surface);
          border: 1px solid var(--border);
          color: var(--fg);
          font-size: var(--text-sm);
          box-shadow: var(--elev-raised);
          animation: slideUp 0.25s var(--ease-standard);
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideIn {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }

        /* ── Responsive ── */
        @media (max-width: 1023px) {
          .cfg-grid {
            grid-template-columns: 1fr;
          }
          .pd-content {
            padding: var(--space-4);
          }
        }
        @media (max-width: 639px) {
          .pd-content {
            padding: var(--space-4);
          }
          .dlg {
            padding: 18px;
            border-radius: var(--radius-md);
          }
          .head-row {
            flex-direction: column;
            align-items: flex-start;
          }
          .hist-grid {
            grid-template-columns: 1fr;
          }
          .dlg-foot {
            flex-direction: column;
            align-items: flex-start;
          }
        }
      `}</style>
    </>
  );
}
