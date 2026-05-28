export const dynamic = 'force-dynamic';
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { videoExportsApi } from '@/lib/api';
import type { VideoExport } from '@/lib/types';

/* ═══════════════════════════════════════════════════════════════════════
 * /short-video/export — Visual Factory export management
 * 1:1 replica of Thash-video-design/video-export.html
 * Phase 3: Replaced seed data with videoExportsApi calls.
 * ═══════════════════════════════════════════════════════════════════════ */

type ExportFormat = 'mp4' | 'mov' | 'webm';
type Resolution = '720p' | '1080p' | '4k';

const FORMAT_LABELS: Record<ExportFormat, string> = { mp4: 'MP4（推荐）', mov: 'MOV', webm: 'WebM' };
const RES_LABELS: Record<Resolution, string> = { '720p': '720p HD', '1080p': '1080p Full HD', '4k': '4K Ultra HD' };

const STATUS_LABELS: Record<string, string> = {
  pending: '等待中',
  processing: '处理中',
  completed: '已完成',
  failed: '失败',
};

function IconDownload() {
  return <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 13h10M8 3v8M5 8l3 3 3-3"/></svg>;
}
function IconPlay() {
  return <svg width="20" height="20" viewBox="0 0 16 16" fill="currentColor"><path d="M5 4l8 4-8 4V4z"/></svg>;
}
function IconExport() {
  return <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>;
}
function IconVideo() {
  return <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="3" width="12" height="10" rx="2"/><polygon points="7,5 11,8 7,11" fill="currentColor"/></svg>;
}
function IconDelete() {
  return <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M2 4h12M5 4V2h6v2M6 7v5M10 7v5M3 4l1 10h8l1-10"/></svg>;
}

let toastIdCounter = 0;

export default function VideoExportPage() {
  const searchParams = useSearchParams();
  const projectId = searchParams.get('projectId') || '';

  const [format, setFormat] = useState<ExportFormat>('mp4');
  const [resolution, setResolution] = useState<Resolution>('1080p');
  const [exporting, setExporting] = useState(false);
  const [history, setHistory] = useState<VideoExport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [estimate, setEstimate] = useState<number | null>(null);
  const [estimateLoading, setEstimateLoading] = useState(false);
  const [toasts, setToasts] = useState<{ id: number; msg: string }[]>([]);

  const toast = (msg: string) => {
    const id = ++toastIdCounter;
    setToasts((prev) => [...prev, { id, msg }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3000);
  };

  /* ─── Load export history ─────────────────────────────────────────── */
  const loadHistory = useCallback(async () => {
    if (!projectId) { setLoading(false); setHistory([]); return; }
    setLoading(true);
    setError(null);
    try {
      const data = await videoExportsApi.list(projectId);
      setHistory(data || []);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => { loadHistory(); }, [loadHistory]);

  /* ─── Load cost estimate ──────────────────────────────────────────── */
  const loadEstimate = useCallback(async () => {
    if (!projectId) return;
    setEstimateLoading(true);
    try {
      const res = await videoExportsApi.estimate(projectId, { resolution, format });
      setEstimate(res?.estimated_cost_cents ?? null);
    } catch {
      setEstimate(null);
    } finally {
      setEstimateLoading(false);
    }
  }, [projectId, resolution, format]);

  useEffect(() => { loadEstimate(); }, [loadEstimate]);

  /* ─── Handle export ────────────────────────────────────────────────── */
  const handleExport = useCallback(async () => {
    if (!projectId) { toast('请先选择项目'); return; }
    setExporting(true);
    try {
      const created = await videoExportsApi.create(projectId, { format, resolution });
      setHistory((prev) => [created, ...prev]);
      toast('导出任务已创建');
    } catch (err) {
      toast(`导出失败: ${(err as Error).message}`);
    } finally {
      setExporting(false);
    }
  }, [projectId, format, resolution]);

  const handleDelete = useCallback(async (exportId: string) => {
    if (!projectId) return;
    try {
      await videoExportsApi.delete(projectId, exportId);
      setHistory((prev) => prev.filter((h) => h.id !== exportId));
      toast('导出记录已删除');
    } catch (err) {
      toast(`删除失败: ${(err as Error).message}`);
    }
  }, [projectId]);

  const estimatedCostYuan = estimate != null ? (estimate / 100).toFixed(2) : '--';

  return (
    <>
      <div className="vex-page">
        {/* Header */}
        <div className="vex-header">
          <div>
            <h1 className="vex-title">导出管理</h1>
            <p className="vex-sub">选择格式和分辨率，导出最终视频</p>
          </div>
          <a href="/short-video/studio" className="btn btn-secondary" style={{ textDecoration: 'none' }}>
            返回工坊
          </a>
        </div>

        {!projectId ? (
          <div style={{ padding: '60px 20px', textAlign: 'center' }}>
            <p className="vex-empty" style={{ color: 'var(--muted)' }}>请从短视频项目页面进入导出管理。</p>
          </div>
        ) : (
          <>
            <div className="vex-body">
              {/* Preview */}
              <div className="vex-preview-section">
                <div className="vex-preview-label">导出预览</div>
                <div
                  className="vex-preview-frame"
                  style={{ width: 180, height: 320 }}
                >
                  <div className="vex-preview-placeholder">
                    <button className="vex-preview-play">
                      <IconPlay />
                    </button>
                    <span className="vex-preview-dims">9:16 竖版</span>
                  </div>
                </div>
              </div>

              {/* Config */}
              <div className="vex-config-section">
                {/* Format */}
                <div className="vex-config-group">
                  <div className="vex-config-label">格式选择</div>
                  <div className="vex-radio-stack">
                    {(Object.keys(FORMAT_LABELS) as ExportFormat[]).map((f) => (
                      <label key={f} className={`vex-radio-card${format === f ? ' active' : ''}`}>
                        <input type="radio" name="format" checked={format === f} onChange={() => setFormat(f)} />
                        <span className="vex-radio-title">{f.toUpperCase()}</span>
                        <span className="vex-radio-desc">{f === 'mp4' ? '兼容性最好' : f === 'mov' ? '最高质量' : 'Web 优化'}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Resolution */}
                <div className="vex-config-group">
                  <div className="vex-config-label">分辨率</div>
                  <select className="vex-form-select" value={resolution} onChange={(e) => setResolution(e.target.value as Resolution)}>
                    {Object.entries(RES_LABELS).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                </div>

                {/* Cost estimate */}
                <div className="vex-cost-preview">
                  <div className="vex-cost-row">
                    <span>估算费用</span>
                    <span className="vex-cost-value">{estimateLoading ? '计算中...' : `¥${estimatedCostYuan}`}</span>
                  </div>
                </div>

                {/* Export button */}
                {exporting ? (
                  <div className="vex-progress-wrap">
                    <div className="vex-progress-bar">
                      <div className="vex-progress-fill" style={{ width: '100%' }} />
                    </div>
                    <div className="vex-progress-text">提交导出任务中...</div>
                  </div>
                ) : (
                  <button className="btn btn-brand vex-export-btn" onClick={handleExport}>
                    <IconExport /> 导出视频
                  </button>
                )}
              </div>
            </div>
          </>
        )}

        {/* Export history */}
        {projectId && (
          <div className="vex-section">
            <div className="vex-section-title">导出历史</div>
            {loading ? (
              <div className="vex-empty"><p>加载中...</p></div>
            ) : error ? (
              <div className="vex-empty">
                <p style={{ color: 'var(--danger)' }}>{error}</p>
                <button className="btn btn-brand btn-sm" onClick={loadHistory} style={{ marginTop: 8 }}>重试</button>
              </div>
            ) : history.length > 0 ? (
              <div className="vex-history-list">
                {history.map((j) => (
                  <div key={j.id} className="vex-history-item">
                    <div className="vex-history-icon">
                      <IconVideo />
                    </div>
                    <div className="vex-history-info">
                      <div className="vex-history-name">{j.resolution} · {j.format.toUpperCase()}</div>
                      <div className="vex-history-meta">
                        {STATUS_LABELS[j.status] || j.status} · {j.created_at ? new Date(j.created_at).toLocaleString('zh-CN') : ''}
                        {j.file_size_bytes != null ? ` · ${(j.file_size_bytes / 1048576).toFixed(1)}MB` : ''}
                      </div>
                    </div>
                    <div className="vex-history-cost">¥{((j.cost_cents ?? 0) / 100).toFixed(2)}</div>
                    {j.file_url && (
                      <a href={j.file_url} className="vex-icon-btn" title="下载" target="_blank" rel="noopener noreferrer">
                        <IconDownload />
                      </a>
                    )}
                    <button className="vex-icon-btn" title="删除" onClick={() => handleDelete(j.id)}>
                      <IconDelete />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="vex-empty">
                <p>暂无导出记录</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Toasts */}
      {toasts.length > 0 && (
        <div style={{ position: 'fixed', bottom: 20, right: 20, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {toasts.map((t) => (
            <div key={t.id} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '10px 14px', fontSize: 12, color: 'var(--fg)' }}>{t.msg}</div>
          ))}
        </div>
      )}

      <style jsx>{`
        .vex-page { color: var(--fg); padding-bottom: 40px; }

        .vex-header {
          display: flex; align-items: center; justify-content: space-between;
          padding: 20px 28px; border-bottom: 1px solid var(--border);
          background: var(--surface); position: sticky; top: 0; z-index: 9;
        }
        .vex-title { font-size: var(--text-xl); font-weight: 500; margin: 0; font-family: var(--font-display); }
        .vex-sub { font-size: 13px; color: var(--muted); margin: 2px 0 0 0; }

        /* Body */
        .vex-body { display: flex; gap: 28px; padding: 24px 28px; align-items: flex-start; }

        /* Preview */
        .vex-preview-section { flex-shrink: 0; }
        .vex-preview-label { font-size: 11px; font-family: var(--font-mono); color: var(--meta); text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 8px; }
        .vex-preview-frame {
          background: #0a0a0a; border: 1px solid var(--border); border-radius: 8px;
          display: flex; align-items: center; justify-content: center;
          position: relative; margin: 0 auto; transition: all 0.3s ease;
        }
        .vex-preview-placeholder {
          display: flex; flex-direction: column; align-items: center; gap: 8px;
        }
        .vex-preview-play {
          width: 40px; height: 40px; border-radius: 50%; border: none;
          background: rgba(62,207,142,0.85); color: #0a0a0a;
          display: flex; align-items: center; justify-content: center; cursor: pointer;
        }
        .vex-preview-dims { font-size: 11px; color: var(--muted); font-family: var(--font-mono); }

        /* Config */
        .vex-config-section { flex: 1; min-width: 0; }
        .vex-config-group { margin-bottom: 18px; }
        .vex-config-label {
          font-size: 12px; font-weight: 500; color: var(--fg-2); margin-bottom: 8px;
        }
        .vex-radio-stack { display: flex; gap: 8px; flex-wrap: wrap; }
        .vex-radio-card {
          flex: 1; min-width: 120px; padding: 10px 14px; border-radius: 8px;
          border: 1px solid var(--border); cursor: pointer; transition: all 0.15s;
          display: flex; flex-direction: column; gap: 2px;
        }
        .vex-radio-card input { display: none; }
        .vex-radio-card:hover { border-color: #363636; }
        .vex-radio-card.active { border-color: var(--accent); background: rgba(62,207,142,0.06); }
        .vex-radio-title { font-size: 13px; font-weight: 500; color: var(--fg); }
        .vex-radio-desc { font-size: 11px; color: var(--muted); }
        .vex-form-select {
          width: 100%; background: var(--border-soft); border: 1px solid var(--border);
          border-radius: 6px; padding: 8px 12px; color: var(--fg);
          font-size: 13px; font-family: var(--font-body); outline: none; cursor: pointer;
          box-sizing: border-box; transition: border-color 0.15s;
        }
        .vex-form-select:focus { border-color: var(--accent); }

        /* Cost preview */
        .vex-cost-preview {
          background: var(--border-soft); border: 1px solid var(--border);
          border-radius: 8px; padding: 12px 14px; margin-bottom: 16px;
        }
        .vex-cost-row { display: flex; justify-content: space-between; font-size: 13px; padding: 2px 0; }
        .vex-cost-row:first-child { color: var(--muted); }
        .vex-cost-value { font-weight: 500; color: var(--accent); }

        .vex-export-btn { width: 100%; justify-content: center; gap: 8px; }

        /* Progress */
        .vex-progress-wrap { display: flex; flex-direction: column; gap: 8px; }
        .vex-progress-bar { height: 6px; border-radius: 3px; background: var(--border-soft); overflow: hidden; }
        .vex-progress-fill { height: 100%; border-radius: 3px; background: var(--accent); transition: width 0.3s; }
        .vex-progress-text { font-size: 12px; color: var(--muted); }

        /* Sections */
        .vex-section { margin: 0 28px 24px; padding-top: 20px; border-top: 1px solid var(--border); }
        .vex-section-title {
          font-size: 11px; font-family: var(--font-mono); color: var(--meta);
          text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 12px;
        }

        /* History */
        .vex-history-list { display: flex; flex-direction: column; gap: 6px; }
        .vex-history-item {
          display: flex; align-items: center; gap: 12px; padding: 12px 14px;
          border-radius: 8px; border: 1px solid var(--border); transition: border-color 0.15s;
        }
        .vex-history-item:hover { border-color: #363636; }
        .vex-history-icon {
          width: 36px; height: 36px; border-radius: 8px; background: var(--border-soft);
          display: flex; align-items: center; justify-content: center; color: var(--muted);
        }
        .vex-history-info { flex: 1; min-width: 0; }
        .vex-history-name { font-size: 13px; font-weight: 500; color: var(--fg); }
        .vex-history-meta { font-size: 11px; color: var(--muted); }
        .vex-history-cost { font-size: 12px; color: var(--accent); font-family: var(--font-mono); }
        .vex-icon-btn {
          width: 28px; height: 28px; border-radius: 6px; border: 1px solid var(--border);
          background: transparent; color: var(--muted); cursor: pointer;
          display: flex; align-items: center; justify-content: center; transition: all 0.15s;
        }
        .vex-icon-btn:hover { background: var(--border-soft); color: var(--fg); }

        .vex-empty { text-align: center; padding: 24px; color: var(--muted); font-size: 13px; }

        /* Responsive */
        @media (max-width: 1023px) {
          .vex-body { flex-direction: column; align-items: center; padding: 20px; }
          .vex-header { padding: 16px 20px; }
          .vex-section { margin: 0 20px 20px; }
        }
        @media (max-width: 767px) {
          .vex-header { padding: 16px; }
          .vex-body { padding: 16px; }
          .vex-section { margin: 0 16px 16px; }
          .vex-preview-frame { max-width: 100%; }
          .vex-radio-stack { flex-direction: column; }
          .vex-radio-card { min-width: auto; }
        }
      `}</style>
    </>
  );
}
