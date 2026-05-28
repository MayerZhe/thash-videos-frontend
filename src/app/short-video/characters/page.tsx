'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { videoCharactersApi } from '@/lib/api';
import type { VideoCharacter } from '@/lib/types';

/* ═══════════════════════════════════════════════════════════════════════
 * /short-video/characters — Visual Factory character management
 * 1:1 replica of Thash-video-design/video-characters.html
 * Phase 3: Replaced seed data with videoCharactersApi calls.
 * ═══════════════════════════════════════════════════════════════════════ */

/* ─── Local view model ─────────────────────────────────────────────── */

interface CharView {
  id: string;
  name: string;
  role: string;
  gender: string;
  age: number | null;
  personality: string;
  reference_image_url: string;
  created_at: string;
}

function toView(c: VideoCharacter): CharView {
  return {
    id: c.id,
    name: c.name,
    role: c.role || '其他',
    gender: c.gender || '',
    age: typeof c.age === 'number' ? c.age : null,
    personality: c.personality || '',
    reference_image_url: c.reference_image_url || '',
    created_at: c.created_at || '',
  };
}

/* ─── SVG Icons ─────────────────────────────────────────────────────── */

function IconPlus() {
  return <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M8 3v10M3 8h10" strokeLinecap="round"/></svg>;
}
function IconClose() {
  return <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M4 4l8 8M12 4l-8 8"/></svg>;
}
function IconEdit() {
  return <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M11 2l3 3-8 8H3v-3l8-8z"/></svg>;
}
function IconDelete() {
  return <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M2 4h12M5 4V2h6v2M6 7v5M10 7v5M3 4l1 10h8l1-10"/></svg>;
}
function IconUsers() {
  return <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4-4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>;
}
function IconImport() {
  return <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M8 3v8M5 8l3 3 3-3M2 13h12"/></svg>;
}

/* ─── Toast helpers ─────────────────────────────────────────────────── */

let toastIdCounter = 0;

/* ─── Page Component ─────────────────────────────────────────────────── */

export default function VideoCharactersPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const projectId = searchParams.get('projectId') || '';

  const [characters, setCharacters] = useState<CharView[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [importing, setImporting] = useState(false);

  /* Form state (simplified to match API fields) */
  const [formName, setFormName] = useState('');
  const [formRole, setFormRole] = useState('口播');
  const [formGender, setFormGender] = useState('女');
  const [formAge, setFormAge] = useState('');
  const [formPersonality, setFormPersonality] = useState('');

  /* Toast */
  const [toasts, setToasts] = useState<{ id: number; msg: string }[]>([]);
  const toast = (msg: string) => {
    const id = ++toastIdCounter;
    setToasts((prev) => [...prev, { id, msg }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3000);
  };

  /* ─── Load characters ────────────────────────────────────────────── */
  const loadCharacters = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await videoCharactersApi.list();
      setCharacters((data || []).map(toView));
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadCharacters(); }, [loadCharacters]);

  /* ─── Open modal for create ──────────────────────────────────────── */
  const handleOpenCreate = useCallback(() => {
    setEditingId(null);
    setFormName('');
    setFormRole('口播');
    setFormGender('女');
    setFormAge('');
    setFormPersonality('');
    setModalOpen(true);
  }, []);

  /* ─── Open modal for edit ────────────────────────────────────────── */
  const handleOpenEdit = useCallback((c: CharView) => {
    setEditingId(c.id);
    setFormName(c.name);
    setFormRole(c.role || '口播');
    setFormGender(c.gender || '女');
    setFormAge(c.age != null ? String(c.age) : '');
    setFormPersonality(c.personality || '');
    setModalOpen(true);
  }, []);

  /* ─── Save ────────────────────────────────────────────────────────── */
  const handleSave = useCallback(async () => {
    const name = formName.trim();
    if (!name) return;
    setSaving(true);
    try {
      const payload = {
        name,
        role: formRole,
        gender: formGender,
        age: formAge ? parseInt(formAge, 10) : undefined,
        personality: formPersonality,
      };
      if (editingId) {
        const updated = await videoCharactersApi.update(editingId, payload);
        setCharacters((prev) => prev.map((c) => (c.id === editingId ? toView(updated) : c)));
        toast('角色已更新');
      } else {
        const created = await videoCharactersApi.create(payload);
        setCharacters((prev) => [toView(created), ...prev]);
        toast('角色已创建');
      }
      setModalOpen(false);
    } catch (err) {
      toast(`保存失败: ${(err as Error).message}`);
    } finally {
      setSaving(false);
    }
  }, [editingId, formName, formRole, formGender, formAge, formPersonality]);

  /* ─── Delete ──────────────────────────────────────────────────────── */
  const handleDelete = useCallback(async (id: string) => {
    try {
      await videoCharactersApi.delete(id);
      setCharacters((prev) => prev.filter((c) => c.id !== id));
      toast('角色已删除');
    } catch (err) {
      toast(`删除失败: ${(err as Error).message}`);
    }
  }, []);

  /* ─── Import from drama ───────────────────────────────────────────── */
  const handleImport = useCallback(async () => {
    if (!projectId) { toast('请先选择项目'); return; }
    setImporting(true);
    try {
      const imported = await videoCharactersApi.importFromDrama(projectId);
      const newChars = (imported || []).map(toView);
      setCharacters((prev) => {
        const existing = new Set(prev.map((c) => c.id));
        return [...prev, ...newChars.filter((c) => !existing.has(c.id))];
      });
      toast(`成功导入 ${newChars.length} 个角色`);
    } catch (err) {
      toast(`导入失败: ${(err as Error).message}`);
    } finally {
      setImporting(false);
    }
  }, [projectId]);

  const GENDER_OPTIONS = ['男', '女', '中性'];

  return (
    <>
      <div className="vch-page">
        {/* Header */}
        <div className="vch-header">
          <div>
            <h1 className="vch-title">角色管理</h1>
            <p className="vch-sub">管理短视频角色库，保持角色外观一致性</p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-secondary" onClick={handleImport} disabled={importing}>
              <IconImport /> {importing ? '导入中...' : '从短剧导入'}
            </button>
            <button className="btn btn-brand" onClick={handleOpenCreate}>
              <IconPlus /> 创建角色
            </button>
          </div>
        </div>

        {/* Info banner */}
        <div className="vch-banner">
          此处定义的默认角色将自动应用于所有短视频项目。详细 Prompt 和参考图越多，生成的角色一致性越高。
        </div>

        {/* Content: loading / error / empty / grid */}
        {loading ? (
          <div className="vch-empty">
            <p className="vch-empty-title" style={{ color: 'var(--muted)' }}>加载角色列表...</p>
          </div>
        ) : error ? (
          <div className="vch-empty">
            <p className="vch-empty-title" style={{ color: 'var(--danger)' }}>加载失败</p>
            <p className="vch-empty-desc">{error}</p>
            <button className="btn btn-brand" onClick={loadCharacters}>重试</button>
          </div>
        ) : characters.length > 0 ? (
          <div className="vch-grid">
            {characters.map((c) => (
              <div key={c.id} className="vch-card">
                <div className="vch-card-avatar">
                  {c.reference_image_url ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={c.reference_image_url} alt={c.name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '12px' }} />
                  ) : (
                    <span className="vch-card-initial">{c.name.charAt(0)}</span>
                  )}
                </div>
                <div className="vch-card-body">
                  <div className="vch-card-name">{c.name}</div>
                  <div className="vch-card-meta">
                    {c.role && <span className="vch-card-tag">{c.role}</span>}
                    {c.gender && <span className="vch-card-tag">{c.gender}{c.age != null ? ` · ${c.age}岁` : ''}</span>}
                  </div>
                  {c.personality && (
                    <div className="vch-card-meta" style={{ marginTop: 4 }}>
                      <span className="vch-card-tag">{c.personality.length > 30 ? c.personality.slice(0, 30) + '...' : c.personality}</span>
                    </div>
                  )}
                </div>
                <div className="vch-card-actions">
                  <button className="vch-icon-btn" title="编辑" onClick={() => handleOpenEdit(c)}>
                    <IconEdit />
                  </button>
                  <button className="vch-icon-btn" title="删除" onClick={() => handleDelete(c.id)}>
                    <IconDelete />
                  </button>
                </div>
              </div>
            ))}

            {/* Add card */}
            <button className="vch-add-card" onClick={handleOpenCreate}>
              <IconPlus />
              <span>创建角色</span>
            </button>
          </div>
        ) : (
          <div className="vch-empty">
            <div className="vch-empty-icon"><IconUsers /></div>
            <p className="vch-empty-title">还没有角色</p>
            <p className="vch-empty-desc">创建你的第一个角色，AI 将根据角色信息生成一致的人物外观。</p>
            <button className="btn btn-brand" onClick={handleOpenCreate}>
              <IconPlus /> 创建角色
            </button>
          </div>
        )}
      </div>

      {/* Character Modal */}
      {modalOpen && (
        <div className="vch-overlay" onClick={(e) => { if (e.target === e.currentTarget) setModalOpen(false); }}>
          <div className="vch-modal" onClick={(e) => e.stopPropagation()}>
            <div className="vch-modal-header">
              <span className="vch-modal-title">{editingId ? '编辑角色' : '创建角色'}</span>
              <button className="vch-icon-btn" onClick={() => setModalOpen(false)}><IconClose /></button>
            </div>
            <div className="vch-modal-body">
              {/* Basic info */}
              <div className="vch-section-label">基础信息</div>
              <div className="vch-form-row">
                <div className="vch-form-group" style={{ flex: 2 }}>
                  <label className="vch-form-label">角色名称</label>
                  <input className="vch-form-input" placeholder="例如：默认主播" value={formName} onChange={(e) => setFormName(e.target.value)} />
                </div>
                <div className="vch-form-group" style={{ flex: 1 }}>
                  <label className="vch-form-label">角色身份</label>
                  <select className="vch-form-select" value={formRole} onChange={(e) => setFormRole(e.target.value)}>
                    <option value="口播">口播</option>
                    <option value="展示">展示</option>
                    <option value="剧情">剧情</option>
                    <option value="旁白">旁白</option>
                  </select>
                </div>
              </div>
              <div className="vch-form-row">
                <div className="vch-form-group" style={{ flex: 1 }}>
                  <label className="vch-form-label">年龄</label>
                  <input className="vch-form-input" type="number" placeholder="例如：28" value={formAge} onChange={(e) => setFormAge(e.target.value)} />
                </div>
                <div className="vch-form-group" style={{ flex: 1 }}>
                  <label className="vch-form-label">性别</label>
                  <div className="vch-radio-group">
                    {GENDER_OPTIONS.map((g) => (
                      <label key={g} className={`vch-radio${formGender === g ? ' active' : ''}`}>
                        <input type="radio" name="gender" value={g} checked={formGender === g} onChange={() => setFormGender(g)} />
                        {g}
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              {/* Personality */}
              <div className="vch-section-label">性格描述</div>
              <div className="vch-form-group">
                <textarea
                  className="vch-form-textarea"
                  rows={4}
                  placeholder="描述角色的性格特点、说话风格、行为习惯..."
                  value={formPersonality}
                  onChange={(e) => setFormPersonality(e.target.value)}
                />
                <div className="vch-char-count">字数：{formPersonality.length}</div>
              </div>
            </div>
            <div className="vch-modal-footer">
              <button className="btn btn-secondary" onClick={() => setModalOpen(false)} disabled={saving}>取消</button>
              <button className="btn btn-brand" onClick={handleSave} disabled={saving}>{saving ? '保存中...' : editingId ? '保存修改' : '保存'}</button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .vch-page { color: var(--fg); }

        /* Header */
        .vch-header {
          display: flex; align-items: center; justify-content: space-between;
          padding: 20px 28px; border-bottom: 1px solid var(--border);
          background: var(--surface); position: sticky; top: 0; z-index: 9;
        }
        .vch-title { font-size: var(--text-xl); font-weight: 500; margin: 0; font-family: var(--font-display); }
        .vch-sub { font-size: 13px; color: var(--muted); margin: 2px 0 0 0; }

        /* Banner */
        .vch-banner {
          margin: 16px 28px; padding: 10px 16px; border-radius: var(--radius-md);
          background: var(--border-soft); border: 1px solid var(--border);
          font-size: 12px; color: var(--muted);
        }

        /* Grid */
        .vch-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 14px; padding: 0 28px 28px; }

        /* Card */
        .vch-card {
          background: var(--surface); border: 1px solid var(--border); border-radius: 10px;
          padding: 16px; display: flex; gap: 14px; transition: border-color 0.15s;
        }
        .vch-card:hover { border-color: #363636; }
        .vch-card-avatar {
          width: 56px; height: 56px; border-radius: 12px;
          background: var(--border-soft); display: flex; align-items: center;
          justify-content: center; flex-shrink: 0; overflow: hidden;
        }
        .vch-card-initial { font-size: 22px; font-weight: 500; color: var(--muted); font-family: var(--font-display); }
        .vch-card-body { flex: 1; min-width: 0; }
        .vch-card-name { font-size: 14px; font-weight: 500; color: var(--fg); margin-bottom: 4px; }
        .vch-card-meta { display: flex; gap: 6px; flex-wrap: wrap; }
        .vch-card-tag { font-size: 10px; padding: 2px 6px; border-radius: 4px; background: var(--border-soft); color: var(--muted); }
        .vch-card-actions { display: flex; flex-direction: column; gap: 4px; }
        .vch-icon-btn {
          width: 28px; height: 28px; border-radius: 6px; border: 1px solid var(--border);
          background: transparent; color: var(--muted); cursor: pointer;
          display: flex; align-items: center; justify-content: center; transition: all 0.15s;
        }
        .vch-icon-btn:hover { background: var(--border-soft); color: var(--fg); }

        /* Add card */
        .vch-add-card {
          background: transparent; border: 1px dashed var(--border); border-radius: 10px;
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          gap: 8px; min-height: 140px; cursor: pointer; color: var(--muted);
          font-size: 13px; font-family: var(--font-body); transition: all 0.15s;
        }
        .vch-add-card:hover { border-color: var(--accent); color: var(--accent); background: rgba(62,207,142,0.04); }

        /* Empty */
        .vch-empty {
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          padding: 80px 20px; text-align: center;
        }
        .vch-empty-icon {
          width: 64px; height: 64px; background: var(--border-soft); border-radius: 16px;
          display: flex; align-items: center; justify-content: center; margin-bottom: 16px; color: var(--muted);
        }
        .vch-empty-title { font-size: 16px; font-weight: 500; color: var(--fg); margin: 0 0 8px; }
        .vch-empty-desc { font-size: 13px; color: var(--muted); line-height: 1.6; max-width: 340px; margin-bottom: 20px; }

        /* Modal */
        .vch-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.6); display: flex; align-items: center; justify-content: center; z-index: 1000; backdrop-filter: blur(4px); }
        .vch-modal { background: var(--surface); border: 1px solid var(--border); border-radius: 12px; width: 560px; max-width: calc(100vw - 32px); max-height: calc(100vh - 64px); overflow-y: auto; animation: vchScaleIn 0.15s ease; }
        @keyframes vchScaleIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
        .vch-modal-header { padding: 14px 20px; border-bottom: 1px solid var(--border); display: flex; align-items: center; gap: 10px; }
        .vch-modal-title { font-size: 15px; font-weight: 500; color: var(--fg); flex: 1; }
        .vch-modal-body { padding: 20px; }
        .vch-modal-footer { padding: 12px 20px; border-top: 1px solid var(--border); display: flex; justify-content: flex-end; gap: 8px; }

        /* Form */
        .vch-section-label { font-size: 11px; font-family: var(--font-mono); color: var(--meta); text-transform: uppercase; letter-spacing: 0.8px; margin: 16px 0 8px; padding-top: 12px; border-top: 1px solid var(--border); }
        .vch-section-label:first-child { border-top: none; margin-top: 0; padding-top: 0; }
        .vch-form-row { display: flex; gap: 12px; margin-bottom: 10px; }
        .vch-form-group { display: flex; flex-direction: column; gap: 4px; }
        .vch-form-label { font-size: 12px; color: var(--fg-2); font-weight: 500; }
        .vch-form-input, .vch-form-textarea, .vch-form-select {
          width: 100%; background: var(--border-soft); border: 1px solid var(--border);
          border-radius: 6px; padding: 8px 12px; color: var(--fg);
          font-size: 13px; font-family: var(--font-body); transition: border-color 0.15s; box-sizing: border-box;
        }
        .vch-form-input:focus, .vch-form-textarea:focus, .vch-form-select:focus { outline: none; border-color: var(--accent); }
        .vch-form-textarea { resize: vertical; min-height: 100px; line-height: 1.6; }
        .vch-form-select {
          appearance: none; cursor: pointer; padding-right: 32px;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23898989' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E");
          background-repeat: no-repeat; background-position: right 10px center;
        }
        .vch-char-count { font-size: 11px; color: var(--muted); margin-top: 4px; }
        .vch-radio-group { display: flex; gap: 4px; }
        .vch-radio {
          padding: 6px 14px; border-radius: 6px; border: 1px solid var(--border);
          font-size: 12px; cursor: pointer; color: var(--muted); transition: all 0.15s;
        }
        .vch-radio input { display: none; }
        .vch-radio.active { border-color: var(--accent); color: var(--accent); background: rgba(62,207,142,0.08); }

        /* Responsive */
        @media (max-width: 1023px) {
          .vch-header { padding: 16px 20px; }
          .vch-grid { padding: 0 20px 20px; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); }
          .vch-banner { margin: 12px 20px; }
        }
        @media (max-width: 767px) {
          .vch-header { flex-direction: column; align-items: flex-start; gap: 12px; padding: 16px; }
          .vch-header .btn { width: 100%; justify-content: center; }
          .vch-grid { padding: 0 16px 16px; grid-template-columns: 1fr; }
          .vch-banner { margin: 8px 16px; }
          .vch-modal { width: 100vw; max-width: 100vw; height: 100vh; max-height: 100vh; border-radius: 0; }
          .vch-overlay { align-items: stretch; }
          .vch-form-row { flex-direction: column; gap: 6px; }
        }
      `}</style>
    </>
  );
}
