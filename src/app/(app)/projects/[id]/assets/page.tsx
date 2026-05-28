'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { assetsApi } from '@/lib/api';
import type { VideoAsset } from '@/lib/types';

/* ═══════════════════════════════════════════════════════════════════════
 * Asset Library Page — 1:1 replica of Thash-video-design/asset-library.html
 * Route: /projects/[id]/assets
 * Category tabs, filter/sort, asset grid with multi-select, upload modal
 * ═══════════════════════════════════════════════════════════════════════ */

type Category = 'all' | 'character' | 'scene' | 'storyboard' | 'cover';

const TAB_LABELS: Record<Category, string> = {
  all: '全部', character: '角色形象', scene: '场景背景', storyboard: '分镜图', cover: '封面海报',
};

export default function AssetLibraryPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  const [assets, setAssets] = useState<VideoAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Category>('all');
  const [search, setSearch] = useState('');
  const [projectFilter, setProjectFilter] = useState('all');
  const [sort, setSort] = useState('recent');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showUpload, setShowUpload] = useState(false);
  const [toasts, setToasts] = useState<{ id: number; msg: string }[]>([]);
  const toastId = useState({ n: 0 })[0];

  const toast = (msg: string) => {
    const id = ++toastId.n;
    setToasts((prev) => [...prev, { id, msg }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3000);
  };

  const loadAssets = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await assetsApi.list(projectId);
      setAssets(data || []);
    } catch (err) {
      setError((err as Error).message);
      setAssets([]);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => { loadAssets(); }, [loadAssets]);

  const filtered = assets.filter((a) => {
    const type = a.type as Category;
    if (activeTab !== 'all' && type !== activeTab) return false;
    if (search && !a.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const clearSelection = () => setSelectedIds(new Set());

  return (
    <div className="al-content">
      <p className="eyebrow">// 素材管理 · 资源库</p>
      <h2>斗破苍穹 · 素材</h2>

      {/* Category tabs */}
      <div className="asset-tabs">
        {(Object.keys(TAB_LABELS) as Category[]).map((key) => (
          <button
            key={key}
            className={activeTab === key ? 'active' : ''}
            onClick={() => setActiveTab(key)}
          >
            {TAB_LABELS[key]}
          </button>
        ))}
      </div>

      {/* Filter bar */}
      <div className="filter-bar">
        <div className="field" style={{ minWidth: 160 }}>
          <select value={projectFilter} onChange={(e) => setProjectFilter(e.target.value)}>
            <option value="all">全部项目</option>
            <option value="dpcq">斗破苍穹</option>
            <option value="csdx">重生之都市修仙</option>
          </select>
        </div>
        <div className="field" style={{ minWidth: 200 }}>
          <input
            type="text"
            placeholder="搜索素材名称..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="field" style={{ minWidth: 140 }}>
          <select value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="recent">最近添加</option>
            <option value="az">名称 A-Z</option>
            <option value="size">尺寸最大</option>
          </select>
        </div>
        <span className="badge badge-muted">显示 {filtered.length} 项</span>
      </div>

      {/* Batch bar */}
      {selectedIds.size > 0 && (
        <div className="batch-bar show">
          <span style={{ color: 'var(--fg)' }}>已选择 <strong>{selectedIds.size}</strong> 项</span>
          <button className="btn btn-brand btn-sm" onClick={() => toast('批量导出（模拟）')}>批量导出</button>
          <button className="btn btn-danger btn-sm" onClick={() => { clearSelection(); toast('已删除（模拟）'); }}>批量删除</button>
          <button className="btn btn-ghost btn-sm" onClick={clearSelection}>取消选择</button>
        </div>
      )}

      {/* Asset grid */}
      {loading ? (
        <div className="card" style={{ marginTop: 'var(--space-4)', padding: 'var(--space-8)', textAlign: 'center' }}>
          <p className="text-muted">加载素材中...</p>
        </div>
      ) : error ? (
        <div className="card" style={{ marginTop: 'var(--space-4)', padding: 'var(--space-6)', textAlign: 'center' }}>
          <p className="text-danger" style={{ marginBottom: 'var(--space-3)' }}>{error}</p>
          <button className="btn btn-brand btn-sm" onClick={loadAssets}>重试</button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="card" style={{ marginTop: 'var(--space-4)', padding: 'var(--space-8)', textAlign: 'center' }}>
          <p className="text-muted">暂无素材，点击右上角上传</p>
        </div>
      ) : (
        <div className="asset-grid">
        {filtered.map((a) => (
          <div
            key={a.id}
            className={`asset-card${selectedIds.has(a.id) ? ' selected' : ''}`}
            style={selectedIds.has(a.id) ? { borderColor: 'var(--accent)' } : undefined}
            onClick={() => toggleSelect(a.id)}
          >
            <div className="asset-preview">
              {a.thumbnail_url ? (
                <img src={a.thumbnail_url} alt={a.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <span className="text-muted">{a.type}</span>
              )}
              <div className="overlay">
                <button className="btn btn-brand btn-sm" onClick={(e) => { e.stopPropagation(); toast('预览（模拟）'); }}>预览</button>
                <button className="btn btn-secondary btn-sm" onClick={(e) => { e.stopPropagation(); toast('导出（模拟）'); }}>导出</button>
              </div>
            </div>
            <div className="asset-info">
              <h4>{a.name}</h4>
              <p className="meta">{a.type}{a.file_size_bytes ? ` · ${(a.file_size_bytes / 1024).toFixed(0)} KB` : ''}</p>
            </div>
          </div>
        ))}
        </div>
      )}

      {/* Upload modal */}
      {showUpload && (
        <div className="modal-overlay" style={{ display: 'flex' }} onClick={() => setShowUpload(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>上传素材</h3>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowUpload(false)}>✕</button>
            </div>
            <div className="stack-4">
              <div className="field"><label>素材类型</label><select><option>角色形象</option><option>场景背景</option><option>分镜图</option><option>封面海报</option></select></div>
              <div className="field"><label>关联项目</label><select><option>斗破苍穹 · 短剧改编</option><option>重生之都市修仙</option></select></div>
              <div className="field"><label>文件</label><input type="file" accept="image/*" multiple /></div>
              <div className="field"><label>标签（可选）</label><input type="text" placeholder="添加标签便于搜索" /></div>
              <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'flex-end' }}>
                <button className="btn btn-ghost" onClick={() => setShowUpload(false)}>取消</button>
                <button className="btn btn-brand" onClick={() => { setShowUpload(false); toast('素材上传成功！（模拟）'); }}>上传</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toasts */}
      <div style={{ position: 'fixed', bottom: 'var(--space-6)', right: 'var(--space-6)', zIndex: 200, display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
        {toasts.map((t) => (
          <div key={t.id} className="toast">{t.msg}</div>
        ))}
      </div>

      <style jsx global>{`
        .al-content {
          padding: var(--space-8);
          max-width: 1200px;
        }
        .asset-tabs {
          display: flex;
          gap: 0;
          border: 1px solid var(--border);
          border-radius: var(--radius-pill);
          overflow: hidden;
          margin-top: var(--space-6);
        }
        .asset-tabs button {
          padding: var(--space-2) var(--space-6);
          border: none;
          background: transparent;
          color: var(--fg-2);
          font-family: var(--font-display);
          font-size: var(--text-sm);
          cursor: pointer;
          transition: all var(--motion-fast) var(--ease-standard);
        }
        .asset-tabs button.active {
          background: var(--fg);
          color: var(--bg);
        }
        .filter-bar {
          display: flex;
          gap: var(--space-3);
          margin-top: var(--space-4);
          flex-wrap: wrap;
          align-items: center;
        }
        .filter-bar .field {
          min-width: 160px;
        }
        .asset-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
          gap: var(--space-4);
          margin-top: var(--space-4);
        }
        .asset-card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          overflow: hidden;
          cursor: pointer;
          transition: all var(--motion-fast) var(--ease-standard);
        }
        .asset-card:hover {
          border-color: var(--accent);
        }
        .asset-preview {
          height: 140px;
          background: var(--bg);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--meta);
          font-size: var(--text-xs);
          position: relative;
        }
        .asset-preview .overlay {
          position: absolute;
          inset: 0;
          background: rgba(0, 0, 0, 0.4);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: var(--space-2);
          opacity: 0;
          transition: opacity var(--motion-fast);
        }
        .asset-card:hover .overlay {
          opacity: 1;
        }
        .asset-info {
          padding: var(--space-3);
        }
        .asset-info h4 {
          font-size: var(--text-sm);
          font-weight: 500;
          color: var(--fg);
        }
        .asset-info .meta {
          color: var(--meta);
          font-size: var(--text-xs);
          margin-top: 2px;
        }
        .batch-bar {
          display: none;
          background: var(--surface);
          border: 1px solid var(--accent);
          border-radius: var(--radius-md);
          padding: var(--space-3) var(--space-4);
          margin-top: var(--space-4);
          align-items: center;
          gap: var(--space-3);
        }
        .batch-bar.show {
          display: flex;
        }
        .modal {
          width: min(520px, 100%);
          max-height: min(600px, calc(100vh - 48px));
          overflow-y: auto;
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius-lg);
          padding: var(--space-6);
          box-shadow: var(--elev-raised);
          animation: fadeIn 0.2s var(--ease-standard);
        }
        .modal .field select,
        .modal .field input {
          padding: 9px var(--space-3);
          border-radius: var(--radius-sm);
          background: var(--bg);
          border: 1px solid var(--border);
          color: var(--fg);
          font-family: var(--font-body);
          font-size: var(--text-sm);
          outline: none;
          transition: border-color 0.15s;
          width: 100%;
        }
        .modal .field select:focus,
        .modal .field input:focus {
          border-color: var(--accent);
        }
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
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        @media (max-width: 639px) {
          .al-content { padding: var(--space-4); }
        }
      `}</style>
    </div>
  );
}
