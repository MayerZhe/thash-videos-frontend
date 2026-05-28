'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { videoAssetsApi } from '@/lib/api';
import type { VideoAsset } from '@/lib/types';

/* ═══════════════════════════════════════════════════════════════════════
 * /short-video/assets — Visual Factory asset library
 * 1:1 replica of Thash-video-design/video-assets.html
 * Phase 3: Replaced seed data with videoAssetsApi calls.
 * ═══════════════════════════════════════════════════════════════════════ */

type FilterType = 'all' | 'video' | 'image' | 'audio';

const TYPE_ICONS: Record<string, string> = {
  video: 'V',
  image: 'I',
  audio: 'A',
  other: 'O',
};

function formatSize(bytes: number): string {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / 1048576).toFixed(1)}MB`;
}

function formatDuration(sec: number): string {
  if (!sec || sec <= 0) return '';
  if (sec < 60) return `${sec}s`;
  return `${Math.floor(sec / 60)}:${(sec % 60).toString().padStart(2, '0')}`;
}

/* ─── Icons ─────────────────────────────────────────────────────────────── */

let toastIdCounter = 0;

function IconSearch() {
  return <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="7" cy="7" r="4.5"/><path d="M10.5 10.5l3 3" strokeLinecap="round"/></svg>;
}
function IconUpload() {
  return <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M8 11V3M4 7l4-4 4 4M2 13h12"/></svg>;
}
function IconDelete() {
  return <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M2 4h12M5 4V2h6v2M6 7v5M10 7v5M3 4l1 10h8l1-10"/></svg>;
}
function IconClose() {
  return <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M4 4l8 8M12 4l-8 8"/></svg>;
}
function IconCheck() {
  return <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3,8 7,12 13,4"/></svg>;
}
function IconFolder() {
  return <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/></svg>;
}
function IconLink() {
  return <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M10 13a5 5 0 100-10M6 3a5 5 0 100 10"/></svg>;
}

/* ─── Page Component ────────────────────────────────────────────────────── */

export default function VideoAssetsPage() {
  const searchParams = useSearchParams();
  const projectId = searchParams.get('projectId') || '';

  const [assets, setAssets] = useState<VideoAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeType, setActiveType] = useState<FilterType>('all');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [urlInputOpen, setUrlInputOpen] = useState(false);
  const [importUrl, setImportUrl] = useState('');
  const [importing, setImporting] = useState(false);
  const [toasts, setToasts] = useState<{ id: number; msg: string }[]>([]);

  const toast = (msg: string) => {
    const id = ++toastIdCounter;
    setToasts((prev) => [...prev, { id, msg }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3000);
  };

  /* ─── Load assets ──────────────────────────────────────────────────── */
  const loadAssets = useCallback(async () => {
    if (!projectId) {
      setLoading(false);
      setAssets([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await videoAssetsApi.list(projectId, { type: activeType !== 'all' ? activeType : undefined, search: searchQuery || undefined });
      setAssets(data || []);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [projectId, activeType, searchQuery]);

  useEffect(() => { loadAssets(); }, [loadAssets]);

  const filtered = useMemo(() => {
    let result = assets;
    if (activeType !== 'all') result = result.filter((a) => a.type === activeType);
    if (searchQuery) result = result.filter((a) => a.name.toLowerCase().includes(searchQuery.toLowerCase()));
    return result;
  }, [assets, activeType, searchQuery]);

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  const handleDelete = useCallback(async (id: string) => {
    if (!projectId) return;
    try {
      await videoAssetsApi.delete(projectId, id);
      setAssets((prev) => prev.filter((a) => a.id !== id));
      setSelectedIds((prev) => { const n = new Set(prev); n.delete(id); return n; });
      toast('素材已删除');
    } catch (err) {
      toast(`删除失败: ${(err as Error).message}`);
    }
  }, [projectId]);

  const handleBatchDelete = useCallback(async () => {
    if (!projectId || selectedIds.size === 0) return;
    try {
      await videoAssetsApi.batchDelete(projectId, Array.from(selectedIds));
      setAssets((prev) => prev.filter((a) => !selectedIds.has(a.id)));
      setSelectedIds(new Set());
      toast('批量删除完成');
    } catch (err) {
      toast(`批量删除失败: ${(err as Error).message}`);
    }
  }, [projectId, selectedIds]);

  const handleImportUrl = useCallback(async () => {
    const url = importUrl.trim();
    if (!url || !projectId) return;
    setImporting(true);
    try {
      const name = url.split('/').pop() || 'imported-file';
      const created = await videoAssetsApi.create(projectId, { url, name, type: 'image' });
      setAssets((prev) => [created, ...prev]);
      setImportUrl('');
      setUrlInputOpen(false);
      toast('URL 导入成功');
    } catch (err) {
      toast(`导入失败: ${(err as Error).message}`);
    } finally {
      setImporting(false);
    }
  }, [importUrl, projectId]);

  const filterPills: { key: FilterType; label: string }[] = [
    { key: 'all', label: '全部' },
    { key: 'image', label: '图片' },
    { key: 'video', label: '视频' },
    { key: 'audio', label: '音频' },
  ];

  return (
    <>
      <div className="vas-page">
        {/* Header */}
        <div className="vas-header">
          <div>
            <h1 className="vas-title">素材库</h1>
            <p className="vas-sub">管理短视频项目的媒体素材</p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-secondary" onClick={() => setUrlInputOpen(true)}>
              <IconLink /> 导入 URL
            </button>
            <label className="btn btn-brand" style={{ cursor: 'pointer' }}>
              <IconUpload /> 上传文件
              <input type="file" style={{ display: 'none' }} onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) toast(`文件上传功能开发中: ${f.name}`);
              }} />
            </label>
          </div>
        </div>

        {/* Filter bar */}
        <div className="vas-filter-bar">
          <div className="vas-search-wrap">
            <IconSearch />
            <input placeholder="搜索素材名称..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          </div>
          <div className="vas-filter-pills">
            {filterPills.map((p) => (
              <button key={p.key} className={`vas-pill${activeType === p.key ? ' active' : ''}`}
                onClick={() => setActiveType(p.key)}>
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* No projectId warning */}
        {!projectId && !loading && (
          <div className="vas-empty">
            <div className="vas-empty-icon"><IconFolder /></div>
            <p className="vas-empty-title">未选择项目</p>
            <p className="vas-empty-desc">请从短视频项目页面进入素材库。</p>
          </div>
        )}

        {/* Content: loading / error / empty / grid */}
        {projectId && (
          <>
            {loading ? (
              <div className="vas-empty">
                <p className="vas-empty-title" style={{ color: 'var(--muted)' }}>加载素材列表...</p>
              </div>
            ) : error ? (
              <div className="vas-empty">
                <p className="vas-empty-title" style={{ color: 'var(--danger)' }}>加载失败</p>
                <p className="vas-empty-desc">{error}</p>
                <button className="btn btn-brand" onClick={loadAssets}>重试</button>
              </div>
            ) : filtered.length > 0 ? (
              <div className="vas-grid">
                {filtered.map((a) => {
                  const isSelected = selectedIds.has(a.id);
                  return (
                    <div key={a.id} className={`vas-card${isSelected ? ' selected' : ''}`}
                      onClick={() => toggleSelect(a.id)}>
                      <div className="vas-card-preview">
                        <div className="vas-card-thumb">
                          {a.thumbnail_url ? (
                            /* eslint-disable-next-line @next/next/no-img-element */
                            <img src={a.thumbnail_url} alt={a.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : (
                            <span className="vas-card-type-badge">{TYPE_ICONS[a.type] || '?'}</span>
                          )}
                          {a.duration_seconds != null && a.duration_seconds > 0 && (
                            <span className="vas-card-duration">{formatDuration(a.duration_seconds)}</span>
                          )}
                        </div>
                        {isSelected && <div className="vas-card-check"><IconCheck /></div>}
                      </div>
                      <div className="vas-card-body">
                        <div className="vas-card-name" title={a.name}>{a.name}</div>
                        <div className="vas-card-meta">
                          {a.file_size_bytes != null && <span>{formatSize(a.file_size_bytes)}</span>}
                          <span>{a.type}</span>
                        </div>
                      </div>
                      <button className="vas-card-delete" onClick={(e) => { e.stopPropagation(); handleDelete(a.id); }}>
                        <IconDelete />
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="vas-empty">
                <div className="vas-empty-icon"><IconFolder /></div>
                <p className="vas-empty-title">{searchQuery || activeType !== 'all' ? '没有匹配的素材' : '还没有素材'}</p>
                <p className="vas-empty-desc">
                  {searchQuery || activeType !== 'all'
                    ? '尝试调整搜索条件或清除筛选器。'
                    : '上传你的第一个素材文件，或从 URL 导入。'}
                </p>
              </div>
            )}
          </>
        )}

        {/* Batch action bar */}
        {selectedIds.size > 0 && (
          <div className="vas-batch-bar">
            <span>已选中 {selectedIds.size} 个素材</span>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-danger btn-sm" onClick={handleBatchDelete}>
                <IconDelete /> 批量删除
              </button>
              <button className="btn btn-secondary btn-sm" onClick={() => setSelectedIds(new Set())}>
                取消选择
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Import URL modal */}
      {urlInputOpen && (
        <div className="vas-overlay" onClick={(e) => { if (e.target === e.currentTarget) setUrlInputOpen(false); }}>
          <div className="vas-modal" onClick={(e) => e.stopPropagation()}>
            <div className="vas-modal-header">
              <span className="vas-modal-title">导入 URL</span>
              <button className="vas-icon-btn" onClick={() => setUrlInputOpen(false)}><IconClose /></button>
            </div>
            <div className="vas-modal-body">
              <div className="vas-form-group">
                <label className="vas-form-label">素材 URL</label>
                <input className="vas-form-input" placeholder="https://example.com/image.jpg"
                  value={importUrl} onChange={(e) => setImportUrl(e.target.value)} />
              </div>
            </div>
            <div className="vas-modal-footer">
              <button className="btn btn-secondary" onClick={() => setUrlInputOpen(false)} disabled={importing}>取消</button>
              <button className="btn btn-brand" onClick={handleImportUrl} disabled={importing}>{importing ? '导入中...' : '导入'}</button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .vas-page { color: var(--fg); }

        .vas-header {
          display: flex; align-items: center; justify-content: space-between;
          padding: 20px 28px; border-bottom: 1px solid var(--border);
          background: var(--surface); position: sticky; top: 0; z-index: 9;
        }
        .vas-title { font-size: var(--text-xl); font-weight: 500; margin: 0; font-family: var(--font-display); }
        .vas-sub { font-size: 13px; color: var(--muted); margin: 2px 0 0 0; }

        /* Filter */
        .vas-filter-bar {
          display: flex; gap: 12px; padding: 14px 28px; align-items: center;
          border-bottom: 1px solid var(--border); flex-wrap: wrap;
        }
        .vas-search-wrap {
          display: flex; align-items: center; gap: 8px;
          background: var(--border-soft); border: 1px solid var(--border);
          border-radius: var(--radius-md); padding: 0 12px; flex: 1; max-width: 320px;
        }
        .vas-search-wrap input {
          flex: 1; background: transparent; border: none; color: var(--fg);
          font-size: 13px; font-family: var(--font-body); padding: 8px 0; outline: none;
        }
        .vas-search-wrap input::placeholder { color: var(--muted); }
        .vas-filter-pills { display: flex; gap: 6px; flex-wrap: wrap; }
        .vas-pill {
          padding: 5px 14px; border-radius: var(--radius-pill); border: 1px solid var(--border);
          background: transparent; color: var(--muted); font-size: 12px; cursor: pointer;
          font-family: var(--font-body); transition: all 0.15s;
        }
        .vas-pill:hover { border-color: #363636; color: var(--fg); }
        .vas-pill.active { border-color: var(--accent); color: var(--accent); background: rgba(62,207,142,0.08); }

        /* Grid */
        .vas-grid {
          display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
          gap: 12px; padding: 16px 28px 80px;
        }

        /* Card */
        .vas-card {
          background: var(--surface); border: 1px solid var(--border); border-radius: 10px;
          overflow: hidden; transition: all 0.15s; cursor: pointer; position: relative;
        }
        .vas-card:hover { border-color: #363636; }
        .vas-card.selected { border-color: var(--accent); }
        .vas-card-preview { position: relative; }
        .vas-card-thumb {
          aspect-ratio: 16/9; background: var(--border-soft);
          display: flex; align-items: center; justify-content: center;
          position: relative; overflow: hidden;
        }
        .vas-card-type-badge {
          width: 32px; height: 32px; border-radius: 6px; background: rgba(0,0,0,0.45);
          display: flex; align-items: center; justify-content: center;
          font-size: 12px; color: var(--fg); font-family: var(--font-mono); font-weight: 500;
        }
        .vas-card-duration {
          position: absolute; bottom: 6px; right: 6px;
          background: rgba(0,0,0,0.7); color: var(--fg);
          font-size: 10px; font-family: var(--font-mono); padding: 2px 5px; border-radius: 3px;
        }
        .vas-card-check {
          position: absolute; top: 8px; right: 8px;
          width: 22px; height: 22px; border-radius: 50%; background: var(--accent);
          color: var(--accent-on); display: flex; align-items: center; justify-content: center;
        }
        .vas-card-body { padding: 10px 12px; }
        .vas-card-name { font-size: 12px; font-weight: 500; color: var(--fg); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; margin-bottom: 2px; }
        .vas-card-meta { font-size: 10px; color: var(--muted); display: flex; gap: 8px; }
        .vas-card-delete {
          position: absolute; top: 4px; right: 4px; width: 24px; height: 24px;
          border-radius: 4px; border: none; background: rgba(0,0,0,0.6); color: var(--fg);
          cursor: pointer; display: none; align-items: center; justify-content: center; padding: 0;
        }
        .vas-card:hover .vas-card-delete { display: flex; }

        /* Batch bar */
        .vas-batch-bar {
          position: fixed; bottom: 0; left: 0; right: 0;
          background: var(--surface); border-top: 1px solid var(--accent);
          padding: 12px 28px; display: flex; align-items: center;
          justify-content: space-between; font-size: 13px; color: var(--fg); z-index: 50;
        }

        /* Empty */
        .vas-empty {
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          padding: 80px 20px; text-align: center;
        }
        .vas-empty-icon {
          width: 64px; height: 64px; background: var(--border-soft); border-radius: 16px;
          display: flex; align-items: center; justify-content: center; margin-bottom: 16px; color: var(--muted);
        }
        .vas-empty-title { font-size: 16px; font-weight: 500; color: var(--fg); margin: 0 0 8px; }
        .vas-empty-desc { font-size: 13px; color: var(--muted); line-height: 1.6; max-width: 340px; margin-bottom: 20px; }

        /* Modal */
        .vas-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.6); display: flex; align-items: center; justify-content: center; z-index: 1000; backdrop-filter: blur(4px); }
        .vas-modal { background: var(--surface); border: 1px solid var(--border); border-radius: 12px; width: 420px; max-width: calc(100vw - 32px); animation: vasScaleIn 0.15s ease; }
        @keyframes vasScaleIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
        .vas-modal-header { padding: 14px 20px; border-bottom: 1px solid var(--border); display: flex; align-items: center; gap: 10px; }
        .vas-modal-title { font-size: 15px; font-weight: 500; color: var(--fg); flex: 1; }
        .vas-modal-body { padding: 20px; }
        .vas-modal-footer { padding: 12px 20px; border-top: 1px solid var(--border); display: flex; justify-content: flex-end; gap: 8px; }
        .vas-form-group { margin-bottom: 12px; }
        .vas-form-label { display: block; font-size: 12px; color: var(--fg-2); margin-bottom: 6px; font-weight: 500; }
        .vas-form-input {
          width: 100%; background: var(--border-soft); border: 1px solid var(--border);
          border-radius: 6px; padding: 8px 12px; color: var(--fg);
          font-size: 13px; font-family: var(--font-body); transition: border-color 0.15s; box-sizing: border-box;
        }
        .vas-form-input:focus { outline: none; border-color: var(--accent); }
        .vas-icon-btn {
          width: 28px; height: 28px; border-radius: 6px; border: 1px solid var(--border);
          background: transparent; color: var(--muted); cursor: pointer;
          display: flex; align-items: center; justify-content: center; transition: all 0.15s;
        }
        .vas-icon-btn:hover { background: var(--border-soft); color: var(--fg); }

        /* Responsive */
        @media (max-width: 1023px) {
          .vas-header { padding: 16px 20px; }
          .vas-filter-bar { padding: 12px 20px; }
          .vas-grid { padding: 16px 20px 80px; }
        }
        @media (max-width: 767px) {
          .vas-header { flex-direction: column; align-items: flex-start; gap: 12px; padding: 16px; }
          .vas-header .btn { width: 100%; justify-content: center; }
          .vas-filter-bar { padding: 10px 16px; flex-direction: column; }
          .vas-search-wrap { max-width: 100%; width: 100%; }
          .vas-grid { padding: 12px 16px 80px; grid-template-columns: repeat(2, 1fr); }
          .vas-batch-bar { padding: 10px 16px; }
          .vas-modal { width: 100vw; max-width: 100vw; border-radius: 0; }
        }
      `}</style>
    </>
  );
}
