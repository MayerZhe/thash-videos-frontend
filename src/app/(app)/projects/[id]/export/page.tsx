'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { exportApi } from '@/lib/api';
import type { ExportJob } from '@/lib/types';

function formatBytes(bytes: number | null): string {
  if (!bytes) return '—';
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('zh-CN', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit',
  });
}

const STATUS_LABELS: Record<ExportJob['status'], string> = {
  pending: '排队中',
  processing: '处理中',
  completed: '已完成',
  failed: '失败',
};
const STATUS_BADGE: Record<ExportJob['status'], string> = {
  pending: 'badge-muted',
  processing: 'badge-warn',
  completed: 'badge-success',
  failed: 'badge-danger',
};
const STATUS_POLLING: Record<ExportJob['status'], boolean> = {
  pending: true,
  processing: true,
  completed: false,
  failed: false,
};

export default function ExportPage() {
  const params = useParams();
  const projectId = typeof params?.id === 'string' ? params.id : '';
  const [exports, setExports] = useState<ExportJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [format, setFormat] = useState<'mp4' | 'jianying_draft'>('mp4');
  const [resolution, setResolution] = useState<'720p' | '1080p' | '4k'>('1080p');
  const [toasts, setToasts] = useState<{ id: number; msg: string }[]>([]);

  const toast = (msg: string) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, msg }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3000);
  };

  async function loadExports() {
    if (!projectId) return;
    const data = await exportApi.list(projectId);
    setExports(data);
    // Poll for in-progress jobs
    const hasActive = data.some((e) => STATUS_POLLING[e.status]);
    if (hasActive) {
      setTimeout(loadExports, 3000);
    }
  }

  useEffect(() => {
    loadExports()
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [projectId]);

  async function handleCreate() {
    if (!projectId) return;
    setCreating(true);
    try {
      const job = await exportApi.create({
        project_id: projectId,
        format,
        resolution,
      });
      setExports((prev) => [job, ...prev]);
      toast('导出任务已创建');
      setTimeout(loadExports, 3000);
    } catch {
      toast('创建导出任务失败');
    } finally {
      setCreating(false);
    }
  }

  function handleDownload(exp: ExportJob) {
    if (!exp.file_url) return;
    window.open(exp.file_url, '_blank');
    toast('开始下载...');
  }

  return (
    <div className="st-content">
      <p className="eyebrow">// 导出管理</p>
      <h2>导出管理</h2>

      {/* Create Export */}
      <div className="export-create card">
        <h3>创建导出任务</h3>
        <div className="export-create-form stack-4">
          <div className="row-between">
            <div className="field">
              <label>格式</label>
              <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                {(['mp4', 'jianying_draft'] as const).map((f) => (
                  <button
                    key={f}
                    className={`btn btn-sm ${format === f ? 'btn-brand' : 'btn-secondary'}`}
                    onClick={() => setFormat(f)}
                  >
                    {f === 'mp4' ? 'MP4 视频' : '剪映草稿'}
                  </button>
                ))}
              </div>
            </div>
            <div className="field">
              <label>分辨率</label>
              <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                {(['720p', '1080p', '4k'] as const).map((r) => (
                  <button
                    key={r}
                    className={`btn btn-sm ${resolution === r ? 'btn-brand' : 'btn-secondary'}`}
                    onClick={() => setResolution(r)}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <button
            className="btn btn-brand"
            onClick={handleCreate}
            disabled={creating}
            style={{ alignSelf: 'flex-end' }}
          >
            {creating ? '创建中...' : '开始导出'}
          </button>
        </div>
      </div>

      {/* Export List */}
      <div className="export-list">
        <h3>导出历史</h3>
        {loading ? (
          <div className="card">
            {[1, 2, 3].map((i) => (
              <div key={i} className="skeleton" style={{ height: 56, borderRadius: 'var(--radius-sm)', marginTop: 'var(--space-2)' }} />
            ))}
          </div>
        ) : exports.length === 0 ? (
          <div className="card empty-state">
            <p className="body-muted">暂无导出记录</p>
          </div>
        ) : (
          <div className="card">
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>创建时间</th>
                    <th>格式</th>
                    <th>分辨率</th>
                    <th>状态</th>
                    <th className="text-right">文件大小</th>
                    <th className="text-right">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {exports.map((exp) => (
                    <tr key={exp.id}>
                      <td className="text-mono" style={{ fontSize: 'var(--text-xs)' }}>
                        {formatDate(exp.created_at)}
                      </td>
                      <td>{exp.format === 'mp4' ? 'MP4' : '剪映草稿'}</td>
                      <td>{exp.resolution}</td>
                      <td>
                        <span className={`badge ${STATUS_BADGE[exp.status]}`}>
                          {STATUS_LABELS[exp.status]}
                        </span>
                      </td>
                      <td className="text-right text-mono">
                        {exp.status === 'processing' || exp.status === 'pending'
                          ? '—'
                          : formatBytes(exp.file_size_bytes)}
                      </td>
                      <td className="text-right">
                        {exp.status === 'completed' && exp.file_url ? (
                          <button
                            className="btn btn-ghost btn-sm"
                            onClick={() => handleDownload(exp)}
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4 M7 10l5 5 5-5 M12 15V3" />
                            </svg>
                            下载
                          </button>
                        ) : (
                          <span className="body-meta">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Toasts */}
      <div style={{ position: 'fixed', bottom: 'var(--space-6)', right: 'var(--space-6)', zIndex: 200, display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
        {toasts.map((t) => (
          <div key={t.id} className="toast">{t.msg}</div>
        ))}
      </div>

      <style jsx global>{`
        .st-content { padding: var(--space-8); max-width: 1000px; }
        .export-create { margin: var(--space-6) 0; }
        .export-create h3 { margin-bottom: var(--space-4); font-weight: 500; }
        .export-create-form { display: flex; flex-direction: column; gap: var(--space-4); }
        .export-list { margin-top: var(--space-6); }
        .export-list h3 { margin-bottom: var(--space-4); font-weight: 500; }
        .empty-state { display: flex; align-items: center; justify-content: center; padding: var(--space-8); }
        .text-mono { font-family: var(--font-mono); }
        .text-right { text-align: right; }
      `}</style>
    </div>
  );
}