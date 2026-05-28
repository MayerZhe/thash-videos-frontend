'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { videoScenesApi } from '@/lib/api';
import type { VideoScene } from '@/lib/types';

/* ═══════════════════════════════════════════════════════════════════════
 * /short-video/storyboard — Visual Factory storyboard editor
 * 1:1 replica of Thash-video-design/video-storyboard.html
 * Phase 3: Replaced seed data with videoScenesApi calls.
 * ═══════════════════════════════════════════════════════════════════════ */

type ShotType = '全景' | '中景' | '近景' | '特写';
type SceneType = '口播' | '产品展示' | '剧情' | '结尾';

const SHOT_TYPE_OPTIONS: ShotType[] = ['全景', '中景', '近景', '特写'];
const TYPE_OPTIONS: SceneType[] = ['口播', '产品展示', '剧情', '结尾'];

let toastIdCounter = 0;

function statusLabel(status: string): string {
  const map: Record<string, string> = { pending: '待生成', generating: '生成中', done: '已完成', draft: '草稿' };
  return map[status] || status;
}
function statusColor(status: string): string {
  if (status === 'done' || status === 'completed') return 'var(--accent)';
  if (status === 'generating') return 'var(--warn)';
  return 'var(--muted)';
}

/* ─── Icons ─────────────────────────────────────────────────────────── */

function IconPlus() {
  return <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M8 3v10M3 8h10" strokeLinecap="round"/></svg>;
}
function IconClose() {
  return <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M4 4l8 8M12 4l-8 8"/></svg>;
}
function IconDelete() {
  return <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M2 4h12M5 4V2h6v2M6 7v5M10 7v5M3 4l1 10h8l1-10"/></svg>;
}
function IconSave() {
  return <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M13 2H4a1 1 0 00-1 1v11l5-3 5 3V3a1 1 0 00-1-1z"/></svg>;
}
function IconSearch() {
  return <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="7" cy="7" r="4.5"/><path d="M10.5 10.5l3 3" strokeLinecap="round"/></svg>;
}
function IconGrid() {
  return <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>;
}

/* ─── Local view ────────────────────────────────────────────────────── */

interface SceneView {
  id: string;
  project_id: string;
  scene_number: number;
  title: string;
  description: string;
  shot_type: string;
  estimated_duration_seconds: number;
  created_at: string;
  // Extended fields (from description parsing or manual)
  _type: SceneType;
  _status: string;
}

function toView(s: VideoScene): SceneView {
  // Infer type from shot_type or default
  let _type: SceneType = '口播';
  if (s.shot_type) {
    const lower = s.shot_type.toLowerCase();
    if (lower.includes('产品') || lower.includes('展示')) _type = '产品展示';
    else if (lower.includes('剧情') || lower.includes('drama')) _type = '剧情';
    else if (lower.includes('结尾') || lower.includes('end')) _type = '结尾';
    else if (lower.includes('口播') || lower.includes('host')) _type = '口播';
    else _type = '口播';
  }

  return {
    id: s.id,
    project_id: s.project_id,
    scene_number: s.scene_number,
    title: s.title,
    description: s.description || '',
    shot_type: s.shot_type || '中景',
    estimated_duration_seconds: s.estimated_duration_seconds ?? 10,
    created_at: s.created_at || '',
    _type,
    _status: 'draft',
  };
}

/* ─── Page Component ────────────────────────────────────────────────── */

export default function VideoStoryboardPage() {
  const searchParams = useSearchParams();
  const projectId = searchParams.get('projectId') || '';

  const [scenes, setScenes] = useState<SceneView[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeShotId, setActiveShotId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeType, setActiveType] = useState<SceneType | 'all'>('all');
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toasts, setToasts] = useState<{ id: number; msg: string }[]>([]);

  const toast = (msg: string) => {
    const id = ++toastIdCounter;
    setToasts((prev) => [...prev, { id, msg }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3000);
  };

  /* ─── Load scenes ────────────────────────────────────────────────── */
  const loadScenes = useCallback(async () => {
    if (!projectId) { setLoading(false); setScenes([]); return; }
    setLoading(true);
    setError(null);
    try {
      const data = await videoScenesApi.list(projectId);
      setScenes((data || []).map(toView));
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => { loadScenes(); }, [loadScenes]);

  const filteredScenes = useMemo(() => {
    return scenes.filter((s) => {
      const matchesType = activeType === 'all' || s._type === activeType;
      const matchesSearch = !searchQuery || s.title.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesType && matchesSearch;
    });
  }, [scenes, activeType, searchQuery]);

  const activeShot = useMemo(() => scenes.find((s) => s.id === activeShotId), [scenes, activeShotId]);

  const openDrawer = useCallback((id: string) => {
    setActiveShotId(id);
    setDrawerOpen(true);
  }, []);

  const closeDrawer = useCallback(() => {
    setDrawerOpen(false);
    setActiveShotId(null);
  }, []);

  const showSaved = useCallback(() => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }, []);

  /* ─── Inline update field ─────────────────────────────────────────── */
  const updateScene = useCallback((field: string, value: unknown) => {
    if (!activeShotId) return;
    setScenes((prev) => prev.map((s) =>
      s.id === activeShotId ? { ...s, [field]: value } : s
    ));
    showSaved();
  }, [activeShotId, showSaved]);

  /* ─── Save to API ─────────────────────────────────────────────────── */
  const handleSave = useCallback(async () => {
    if (!projectId || !activeShot) return;
    setSaving(true);
    try {
      await videoScenesApi.update(projectId, activeShot.id, {
        title: activeShot.title,
        description: activeShot.description,
        shot_type: activeShot.shot_type,
        estimated_duration_seconds: activeShot.estimated_duration_seconds,
      });
      toast('分镜已保存');
      setSaved(true);
    } catch (err) {
      toast(`保存失败: ${(err as Error).message}`);
    } finally {
      setSaving(false);
    }
  }, [projectId, activeShot]);

  /* ─── Add scene ───────────────────────────────────────────────────── */
  const handleAddScene = useCallback(async () => {
    if (!projectId) { toast('请先选择项目'); return; }
    try {
      const newNum = scenes.length + 1;
      const created = await videoScenesApi.create(projectId, {
        title: `分镜 ${newNum}`,
        shot_type: '中景',
        estimated_duration_seconds: 10,
      });
      const view = toView(created);
      setScenes((prev) => [...prev, view]);
      openDrawer(view.id);
      toast('分镜已创建');
    } catch (err) {
      toast(`创建失败: ${(err as Error).message}`);
    }
  }, [projectId, scenes.length, openDrawer]);

  /* ─── Delete scene ────────────────────────────────────────────────── */
  const handleDelete = useCallback(async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!projectId) return;
    try {
      await videoScenesApi.delete(projectId, id);
      setScenes((prev) => {
        const next = prev.filter((s) => s.id !== id);
        return next.map((s, i) => ({ ...s, scene_number: i + 1 }));
      });
      if (activeShotId === id) closeDrawer();
      toast('分镜已删除');
    } catch (err) {
      toast(`删除失败: ${(err as Error).message}`);
    }
  }, [projectId, activeShotId, closeDrawer]);

  /* ─── Reorder (simplified: update scene_number) ──────────────────── */
  const handleMoveUp = useCallback(async (id: string) => {
    const idx = scenes.findIndex((s) => s.id === id);
    if (idx <= 0 || !projectId) return;
    const orderedIds = [...scenes];
    [orderedIds[idx - 1], orderedIds[idx]] = [orderedIds[idx], orderedIds[idx - 1]];
    const reordered = orderedIds.map((s, i) => ({ ...s, scene_number: i + 1 }));
    setScenes(reordered);
    try {
      await videoScenesApi.reorder(projectId, reordered.map((s) => s.id));
    } catch {
      toast('排序失败');
    }
  }, [scenes, projectId]);

  const handleMoveDown = useCallback(async (id: string) => {
    const idx = scenes.findIndex((s) => s.id === id);
    if (idx < 0 || idx >= scenes.length - 1 || !projectId) return;
    const orderedIds = [...scenes];
    [orderedIds[idx], orderedIds[idx + 1]] = [orderedIds[idx + 1], orderedIds[idx]];
    const reordered = orderedIds.map((s, i) => ({ ...s, scene_number: i + 1 }));
    setScenes(reordered);
    try {
      await videoScenesApi.reorder(projectId, reordered.map((s) => s.id));
    } catch {
      toast('排序失败');
    }
  }, [scenes, projectId]);

  return (
    <>
      <div className="vsb-page">
        {/* Header */}
        <div className="vsb-header">
          <div>
            <h1 className="vsb-title">分镜编辑器</h1>
            <p className="vsb-sub">管理和编辑视频分镜，定义每帧的视觉构成</p>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {saved && <span className="vsb-saved-badge"><IconSave /> 已保存</span>}
            <a href="/short-video/studio" className="btn btn-secondary" style={{ textDecoration: 'none' }}>
              返回工坊
            </a>
          </div>
        </div>

        {/* No projectId */}
        {!projectId && !loading ? (
          <div className="vsb-empty">
            <div className="vsb-empty-icon"><IconGrid /></div>
            <p className="vsb-empty-title">未选择项目</p>
            <p className="vsb-empty-desc">请从短视频项目页面进入分镜编辑器。</p>
          </div>
        ) : (
          <>
            {/* Filter */}
            <div className="vsb-filter-bar">
              <div className="vsb-search-wrap">
                <IconSearch />
                <input placeholder="搜索分镜..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
              </div>
              <div className="vsb-filter-pills">
                {(['all', ...TYPE_OPTIONS] as const).map((t) => (
                  <button key={t} className={`vsb-pill${activeType === t ? ' active' : ''}`}
                    onClick={() => setActiveType(t)}>
                    {t === 'all' ? '全部' : t}
                  </button>
                ))}
              </div>
            </div>

            {/* Content: loading / error / empty / grid */}
            {loading ? (
              <div className="vsb-empty">
                <p className="vsb-empty-title" style={{ color: 'var(--muted)' }}>加载分镜列表...</p>
              </div>
            ) : error ? (
              <div className="vsb-empty">
                <p className="vsb-empty-title" style={{ color: 'var(--danger)' }}>加载失败</p>
                <p className="vsb-empty-desc">{error}</p>
                <button className="btn btn-brand" onClick={loadScenes}>重试</button>
              </div>
            ) : filteredScenes.length > 0 ? (
              <div className="vsb-grid">
                {filteredScenes.map((s) => (
                  <div key={s.id} className="vsb-card" onClick={() => openDrawer(s.id)}>
                    <div className="vsb-card-thumb">
                      <div className="vsb-card-index">S{s.scene_number.toString().padStart(2, '0')}</div>
                      <span className="vsb-card-status-dot" style={{ background: statusColor(s._status) }} />
                    </div>
                    <div className="vsb-card-body">
                      <div className="vsb-card-title">{s.title}</div>
                      <div className="vsb-card-meta">
                        <span className="vsb-card-tag">{s._type}</span>
                        <span className="vsb-card-tag">{s.estimated_duration_seconds}s</span>
                        {s.shot_type && <span className="vsb-card-tag">{s.shot_type}</span>}
                      </div>
                      <div className="vsb-card-footer">
                        <span style={{ color: statusColor(s._status), fontSize: 11 }}>{statusLabel(s._status)}</span>
                      </div>
                    </div>
                    <div className="vsb-card-actions-row">
                      <button className="vsb-icon-btn-sm" title="上移" onClick={(e) => { e.stopPropagation(); handleMoveUp(s.id); }}>↑</button>
                      <button className="vsb-icon-btn-sm" title="下移" onClick={(e) => { e.stopPropagation(); handleMoveDown(s.id); }}>↓</button>
                    </div>
                    <button className="vsb-card-delete" onClick={(e) => handleDelete(s.id, e)}>
                      <IconDelete />
                    </button>
                  </div>
                ))}

                {/* Add card */}
                <button className="vsb-add-card" onClick={handleAddScene}>
                  <IconPlus />
                  <span>添加分镜</span>
                </button>
              </div>
            ) : (
              <div className="vsb-empty">
                <div className="vsb-empty-icon"><IconGrid /></div>
                <p className="vsb-empty-title">{searchQuery || activeType !== 'all' ? '没有匹配的分镜' : '还没有分镜'}</p>
                <p className="vsb-empty-desc">
                  {searchQuery || activeType !== 'all'
                    ? '尝试调整搜索条件或清除筛选器。'
                    : '添加第一个分镜开始编辑。'}
                </p>
                {!searchQuery && activeType === 'all' && (
                  <button className="btn btn-brand" onClick={handleAddScene}>
                    <IconPlus /> 添加分镜
                  </button>
                )}
              </div>
            )}
          </>
        )}

        {/* Toasts */}
        {toasts.length > 0 && (
          <div style={{ position: 'fixed', bottom: 20, right: 20, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {toasts.map((t) => (
              <div key={t.id} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '10px 14px', fontSize: 12, color: 'var(--fg)' }}>{t.msg}</div>
            ))}
          </div>
        )}
      </div>

      {/* Drawer overlay */}
      {drawerOpen && activeShot && (
        <div className="vsb-drawer-overlay" onClick={closeDrawer}>
          <div className="vsb-drawer" onClick={(e) => e.stopPropagation()}>
            {/* Drawer header */}
            <div className="vsb-drawer-header">
              <div>
                <span className="vsb-drawer-title">分镜详情</span>
                <span className="vsb-drawer-subtitle">S{activeShot.scene_number.toString().padStart(2, '0')} · {activeShot.title}</span>
              </div>
              <button className="vsb-icon-btn" onClick={closeDrawer}><IconClose /></button>
            </div>

            <div className="vsb-drawer-body">
              {/* Basic info */}
              <div className="vsb-drawer-section">
                <div className="vsb-drawer-section-label">基础信息</div>
                <div className="vsb-drawer-row">
                  <div className="vsb-drawer-field">
                    <label>分镜编号</label>
                    <span>S{activeShot.scene_number.toString().padStart(2, '0')}</span>
                  </div>
                  <div className="vsb-drawer-field">
                    <label>场景标题</label>
                    <input value={activeShot.title} onChange={(e) => updateScene('title', e.target.value)} />
                  </div>
                </div>
                <div className="vsb-drawer-row">
                  <div className="vsb-drawer-field">
                    <label>类型</label>
                    <select value={activeShot._type} onChange={(e) => updateScene('_type', e.target.value)}>
                      {TYPE_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div className="vsb-drawer-field">
                    <label>时长（秒）</label>
                    <input type="number" value={activeShot.estimated_duration_seconds} min={3} max={300}
                      onChange={(e) => updateScene('estimated_duration_seconds', parseInt(e.target.value) || 10)} />
                  </div>
                </div>
              </div>

              {/* Shot type */}
              <div className="vsb-drawer-section">
                <div className="vsb-drawer-section-label">镜头设置</div>
                <div className="vsb-drawer-field">
                  <label>景别</label>
                  <select value={activeShot.shot_type} onChange={(e) => updateScene('shot_type', e.target.value)}>
                    {SHOT_TYPE_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>

              {/* Description */}
              <div className="vsb-drawer-section">
                <div className="vsb-drawer-section-label">描述说明</div>
                <textarea className="vsb-drawer-textarea" rows={5} value={activeShot.description}
                  onChange={(e) => updateScene('description', e.target.value)}
                  placeholder="详细描述此分镜的视觉内容、对话、音效等..." />
              </div>

              {/* Actions */}
              <div className="vsb-drawer-footer">
                <span style={{ fontSize: 12, color: 'var(--muted)' }}>分镜 #{activeShot.scene_number}</span>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn btn-secondary" onClick={closeDrawer}>关闭</button>
                  <button className="btn btn-brand" onClick={handleSave} disabled={saving}>
                    <IconSave /> {saving ? '保存中...' : '保存'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .vsb-page { color: var(--fg); }

        .vsb-header {
          display: flex; align-items: center; justify-content: space-between;
          padding: 16px 28px; border-bottom: 1px solid var(--border);
          background: var(--surface); position: sticky; top: 0; z-index: 9;
        }
        .vsb-title { font-size: var(--text-xl); font-weight: 500; margin: 0; font-family: var(--font-display); }
        .vsb-sub { font-size: 13px; color: var(--muted); margin: 2px 0 0 0; }
        .vsb-saved-badge {
          display: flex; align-items: center; gap: 4px; font-size: 12px;
          color: var(--accent); padding: 4px 10px; border-radius: 4px;
          background: rgba(62,207,142,0.08); border: 1px solid rgba(62,207,142,0.2);
        }

        /* Filter */
        .vsb-filter-bar { display: flex; gap: 12px; padding: 14px 28px; align-items: center; border-bottom: 1px solid var(--border); }
        .vsb-search-wrap {
          display: flex; align-items: center; gap: 8px;
          background: var(--border-soft); border: 1px solid var(--border);
          border-radius: var(--radius-md); padding: 0 12px; flex: 1; max-width: 300px;
        }
        .vsb-search-wrap input { flex: 1; background: transparent; border: none; color: var(--fg); font-size: 13px; font-family: var(--font-body); padding: 8px 0; outline: none; }
        .vsb-search-wrap input::placeholder { color: var(--muted); }
        .vsb-filter-pills { display: flex; gap: 6px; }
        .vsb-pill {
          padding: 5px 14px; border-radius: var(--radius-pill); border: 1px solid var(--border);
          background: transparent; color: var(--muted); font-size: 12px; cursor: pointer;
          font-family: var(--font-body); transition: all 0.15s;
        }
        .vsb-pill:hover { border-color: #363636; color: var(--fg); }
        .vsb-pill.active { border-color: var(--accent); color: var(--accent); background: rgba(62,207,142,0.08); }

        /* Grid */
        .vsb-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 14px; padding: 20px 28px; }

        /* Card */
        .vsb-card {
          background: var(--surface); border: 1px solid var(--border); border-radius: 10px;
          overflow: hidden; cursor: pointer; transition: border-color 0.15s; position: relative;
        }
        .vsb-card:hover { border-color: #363636; }
        .vsb-card-thumb {
          aspect-ratio: 16/9; background: linear-gradient(135deg, var(--border-soft), #1a2a1e);
          display: flex; align-items: center; justify-content: center; position: relative;
        }
        .vsb-card-index {
          font-size: 28px; font-weight: 500; color: rgba(250,250,250,0.15);
          font-family: var(--font-mono); letter-spacing: 2px;
        }
        .vsb-card-status-dot {
          position: absolute; top: 10px; right: 10px;
          width: 8px; height: 8px; border-radius: 50%;
        }
        .vsb-card-body { padding: 12px 14px; }
        .vsb-card-title { font-size: 13px; font-weight: 500; color: var(--fg); margin-bottom: 4px; }
        .vsb-card-meta { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 4px; }
        .vsb-card-tag { font-size: 10px; padding: 2px 6px; border-radius: 3px; background: var(--border-soft); color: var(--muted); }
        .vsb-card-footer { display: flex; justify-content: space-between; }
        .vsb-card-delete {
          position: absolute; top: 4px; right: 4px; width: 22px; height: 22px;
          border-radius: 4px; border: none; background: rgba(0,0,0,0.5); color: var(--fg);
          cursor: pointer; display: none; align-items: center; justify-content: center; padding: 0;
        }
        .vsb-card:hover .vsb-card-delete { display: flex; }
        .vsb-card-actions-row {
          position: absolute; top: 4px; right: 32px; display: none; gap: 2px;
        }
        .vsb-card:hover .vsb-card-actions-row { display: flex; }
        .vsb-icon-btn-sm {
          width: 22px; height: 22px; border-radius: 4px; border: none;
          background: rgba(0,0,0,0.5); color: var(--fg); cursor: pointer;
          display: flex; align-items: center; justify-content: center; padding: 0;
          font-size: 10px; font-family: var(--font-mono);
        }

        /* Add card */
        .vsb-add-card {
          background: transparent; border: 1px dashed var(--border); border-radius: 10px;
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          gap: 8px; min-height: 180px; cursor: pointer; color: var(--muted);
          font-size: 13px; font-family: var(--font-body); transition: all 0.15s;
        }
        .vsb-add-card:hover { border-color: var(--accent); color: var(--accent); background: rgba(62,207,142,0.04); }

        /* Empty */
        .vsb-empty {
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          padding: 80px 20px; text-align: center;
        }
        .vsb-empty-icon {
          width: 64px; height: 64px; background: var(--border-soft); border-radius: 16px;
          display: flex; align-items: center; justify-content: center; margin-bottom: 16px; color: var(--muted);
        }
        .vsb-empty-title { font-size: 16px; font-weight: 500; color: var(--fg); margin: 0 0 8px; }
        .vsb-empty-desc { font-size: 13px; color: var(--muted); line-height: 1.6; max-width: 300px; margin-bottom: 20px; }

        /* Drawer overlay */
        .vsb-drawer-overlay {
          position: fixed; inset: 0; background: rgba(0,0,0,0.5);
          display: flex; justify-content: flex-end; z-index: 2000;
        }
        .vsb-drawer {
          width: 460px; max-width: 100vw; height: 100vh;
          background: var(--surface); border-left: 1px solid var(--border);
          display: flex; flex-direction: column; overflow: hidden;
          animation: vsbSlideIn 0.2s cubic-bezier(0.2,0,0,1);
        }
        @keyframes vsbSlideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }
        .vsb-drawer-header {
          padding: 14px 20px; border-bottom: 1px solid var(--border);
          display: flex; align-items: center; justify-content: space-between; flex-shrink: 0;
        }
        .vsb-drawer-title { font-size: 15px; font-weight: 500; color: var(--fg); display: block; }
        .vsb-drawer-subtitle { font-size: 11px; color: var(--muted); }
        .vsb-icon-btn {
          width: 28px; height: 28px; border-radius: 6px; border: 1px solid var(--border);
          background: transparent; color: var(--muted); cursor: pointer;
          display: flex; align-items: center; justify-content: center; transition: all 0.15s;
        }
        .vsb-icon-btn:hover { background: var(--border-soft); color: var(--fg); }

        /* Drawer body */
        .vsb-drawer-body { flex: 1; overflow-y: auto; padding: 20px; }
        .vsb-drawer-section { margin-bottom: 20px; }
        .vsb-drawer-section-label {
          font-size: 10px; font-family: var(--font-mono); color: var(--meta);
          text-transform: uppercase; letter-spacing: 0.6px; margin-bottom: 8px;
        }
        .vsb-drawer-row { display: flex; gap: 10px; }
        .vsb-drawer-field { flex: 1; display: flex; flex-direction: column; gap: 4px; }
        .vsb-drawer-field label { font-size: 11px; color: var(--muted); }
        .vsb-drawer-field span, .vsb-drawer-field input, .vsb-drawer-field select {
          font-size: 13px; color: var(--fg); padding: 6px 10px;
          background: var(--border-soft); border: 1px solid var(--border); border-radius: 6px;
          font-family: var(--font-body); outline: none; box-sizing: border-box;
        }
        .vsb-drawer-field input:focus, .vsb-drawer-field select:focus { border-color: var(--accent); }
        .vsb-drawer-field span { border: none; background: none; }
        .vsb-drawer-field select { cursor: pointer; }
        .vsb-drawer-textarea {
          width: 100%; background: var(--border-soft); border: 1px solid var(--border);
          border-radius: 8px; padding: 12px; font-size: 13px; line-height: 1.7;
          color: var(--fg); font-family: var(--font-body); outline: none; resize: vertical; box-sizing: border-box;
        }
        .vsb-drawer-textarea:focus { border-color: var(--accent); }

        /* Drawer footer */
        .vsb-drawer-footer {
          padding: 14px 20px; border-top: 1px solid var(--border);
          display: flex; align-items: center; justify-content: space-between; flex-shrink: 0;
        }

        /* Responsive */
        @media (max-width: 1023px) {
          .vsb-header { padding: 14px 20px; }
          .vsb-filter-bar { padding: 12px 20px; }
          .vsb-grid { padding: 16px 20px; }
        }
        @media (max-width: 767px) {
          .vsb-header { flex-direction: column; align-items: flex-start; gap: 10px; padding: 14px 16px; }
          .vsb-header .btn { width: 100%; justify-content: center; }
          .vsb-filter-bar { padding: 10px 16px; flex-direction: column; gap: 8px; }
          .vsb-search-wrap { max-width: 100%; width: 100%; }
          .vsb-grid { padding: 12px 16px; grid-template-columns: 1fr; }
          .vsb-drawer { width: 100vw; }
          .vsb-filter-pills { overflow-x: auto; -webkit-overflow-scrolling: touch; padding-bottom: 4px; }
        }
      `}</style>
    </>
  );
}
