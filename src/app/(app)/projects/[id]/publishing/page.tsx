'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { publishingApi } from '@/lib/api';
import type { PublishingChannel, PublishingQueueItem } from '@/lib/types';

/* ═══════════════════════════════════════════════════════════════════════
 * Publishing Page — real API calls with stub degradation fallback
 * Route: /projects/[id]/publishing
 * Channel grid, export formats, publish queue, schedule, modals/drawers
 * ═══════════════════════════════════════════════════════════════════════ */

const CHANNEL_ICONS: Record<string, { bg: string; label: string }> = {
  douyin: { bg: '#000', label: '抖' },
  youtube: { bg: '#ff0000', label: 'YT' },
  tiktok: { bg: '#ff0050', label: 'TT' },
  hongguo: { bg: '#e4393c', label: '红果' },
};

function channelIcon(platform: string): { bg: string; label: string } {
  return CHANNEL_ICONS[platform.toLowerCase()] || { bg: '#6366f1', label: platform.slice(0, 2).toUpperCase() };
}

function statusBadge(status: string): { cls: string; text: string } {
  switch (status) {
    case 'connected': return { cls: 'badge-success', text: '已连接' };
    case 'error': return { cls: 'badge-danger', text: '错误' };
    case 'publishing': return { cls: 'badge-warn', text: '发布中' };
    case 'completed': return { cls: 'badge-success', text: '已完成' };
    case 'failed': return { cls: 'badge-danger', text: '失败' };
    case 'queued': return { cls: 'badge-muted', text: '排队中' };
    default: return { cls: 'badge-muted', text: '未连接' };
  }
}

export default function PublishingPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  // API data
  const [channels, setChannels] = useState<PublishingChannel[] | null>(null);
  const [queue, setQueue] = useState<PublishingQueueItem[] | null>(null);
  const [loading, setLoading] = useState(true);

  // UI state
  const [showPublish, setShowPublish] = useState(false);
  const [showSchedule, setShowSchedule] = useState(false);
  const [toasts, setToasts] = useState<{ id: number; msg: string }[]>([]);
  const toastId = useState({ n: 0 })[0];

  const toast = (msg: string) => {
    const id = ++toastId.n;
    setToasts((prev) => [...prev, { id, msg }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3000);
  };

  // Load data — graceful stub degradation
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [ch, q] = await Promise.all([
        publishingApi.listChannels(),
        publishingApi.getQueue(),
      ]);
      setChannels(ch);
      setQueue(q);
    } catch {
      // Stub backend — show friendly placeholder
      setChannels(null);
      setQueue(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading) {
    return (
      <div className="pb-content">
        <div className="flex items-center justify-center py-16">
          <p className="text-sm text-muted">加载发布数据...</p>
        </div>
      </div>
    );
  }

  // Stub degradation: no data available
  const channelsUnavailable = !channels || channels.length === 0;
  const queueUnavailable = !queue || queue.length === 0;

  return (
    <div className="pb-content">
      <p className="eyebrow">// 发布管理 · 渠道分发</p>
      <h2>发布与分发</h2>

      {/* Connected Channels */}
      <p className="eyebrow" style={{ marginTop: 'var(--space-6)' }}>// 分发渠道</p>
      {channelsUnavailable ? (
        <div className="chart-placeholder" style={{ textAlign: 'center', padding: 'var(--space-8)', marginTop: 'var(--space-6)' }}>
          <p className="text-sm text-muted mb-1">渠道功能即将上线</p>
          <p className="text-xs text-meta">分发渠道集成正在开发中</p>
        </div>
      ) : (
        <div className="channel-grid">
          {channels!.map((ch) => {
            const icon = channelIcon(ch.platform);
            const s = statusBadge(ch.status);
            return (
              <div key={ch.id} className={`channel-card ${ch.status === 'connected' ? 'connected' : ''}`}>
                <div className="row-between">
                  <div className="channel-icon" style={{ background: icon.bg }}>{icon.label}</div>
                  <span className={`badge ${s.cls}`}>{s.text}</span>
                </div>
                <h4>{ch.name}</h4>
                <p className="body-muted body-sm">
                  {ch.platform} 平台{ch.status === 'connected' ? ' · 已授权连接' : ch.status === 'error' ? ' · 连接异常' : ' · 点击连接账号'}
                </p>
                {ch.status === 'connected' ? (
                  <button className="btn btn-ghost btn-sm" style={{ marginTop: 'var(--space-2)' }}>配置</button>
                ) : ch.status === 'error' ? (
                  <button className="btn btn-secondary btn-sm" style={{ marginTop: 'var(--space-2)' }} onClick={() => toast('正在重新连接...')}>重连</button>
                ) : (
                  <button className="btn btn-secondary btn-sm" style={{ marginTop: 'var(--space-2)' }} onClick={() => toast('功能即将上线')}>连接</button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Export Formats */}
      <div className="chart-placeholder export-section">
        <div className="row-between">
          <h4>导出格式</h4>
          <span className="badge badge-accent">3 种格式</span>
        </div>
        <div className="grid-2" style={{ marginTop: 'var(--space-4)' }}>
          <div className="card">
            <h4>MP4 · 标准视频</h4>
            <p className="body-muted body-sm">H.264 编码 · 1920×1080 · 适合直接分发</p>
            <button className="btn btn-brand btn-sm" style={{ marginTop: 'auto' }} onClick={() => toast('已加入导出队列')}>导出 MP4</button>
          </div>
          <div className="card">
            <h4>剪映草稿 · JSON</h4>
            <p className="body-muted body-sm">包含所有轨道、转场、字幕样式 · 可继续精编</p>
            <button className="btn btn-secondary btn-sm" style={{ marginTop: 'auto' }} onClick={() => toast('已加入导出队列')}>导出剪映草稿</button>
          </div>
        </div>
      </div>

      {/* Publish Queue */}
      <div className="chart-placeholder export-section">
        <div className="row-between">
          <h4>发布队列</h4>
          <span className="badge badge-muted">{queue?.length ?? 0} 项待处理</span>
        </div>
        <div style={{ marginTop: 'var(--space-4)' }}>
          {queueUnavailable ? (
            <p className="text-sm text-muted py-4 text-center">暂无发布任务</p>
          ) : (
            queue!.map((item) => {
              const s = statusBadge(item.status);
              const ch = channels?.find((c) => c.id === item.channel_id);
              return (
                <div key={item.id} className="queue-item">
                  <span className={`badge ${s.cls}`} style={{ flexShrink: 0 }}>{s.text}</span>
                  <div style={{ flex: 1 }}>
                    <span style={{ color: 'var(--fg)' }}>项目发布任务</span>
                    <p className="body-meta">
                      {ch ? `${ch.name} (${ch.platform})` : `渠道 ${item.channel_id}`}
                      {item.progress_percent > 0 && item.progress_percent < 100 && ` · ${item.progress_percent}%`}
                    </p>
                  </div>
                  <button className="btn btn-ghost btn-sm" onClick={() => { publishingApi.cancelPublish(item.id).catch(() => {}); toast('已取消发布任务'); loadData(); }}>取消</button>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Schedule */}
      <div className="chart-placeholder export-section">
        <div className="row-between">
          <h4>定时发布</h4>
          <button className="btn btn-secondary btn-sm" onClick={() => setShowSchedule(true)}>+ 添加定时</button>
        </div>
        <div className="stack-3" style={{ marginTop: 'var(--space-4)' }}>
          <p className="text-sm text-muted py-4 text-center">暂无定时发布任务</p>
        </div>
      </div>

      {/* Publish Modal */}
      {showPublish && (
        <div className="modal-overlay" style={{ display: 'flex' }} onClick={() => setShowPublish(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>新建发布</h3>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowPublish(false)}>✕</button>
            </div>
            <div className="stack-4">
              <div className="field">
                <label>项目剧集</label>
                <select>
                  <option>选择剧集...</option>
                </select>
              </div>
              <div className="field">
                <label>目标渠道</label>
                <div style={{ display: 'flex', gap: 'var(--space-2)', marginTop: 'var(--space-2)' }}>
                  {channels?.filter((c) => c.status === 'connected').map((ch) => (
                    <label key={ch.id} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: 'var(--text-sm)', color: 'var(--fg-2)' }}>
                      <input type="checkbox" defaultChecked />{ch.name}
                    </label>
                  )) ?? (
                    <span className="text-xs text-muted">暂无可用的已连接渠道</span>
                  )}
                </div>
              </div>
              <div className="field">
                <label>发布方式</label>
                <select><option>立即发布</option><option>定时发布</option></select>
              </div>
              <div className="field">
                <label>定时时间</label>
                <input type="datetime-local" />
              </div>
              <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'flex-end' }}>
                <button className="btn btn-ghost" onClick={() => setShowPublish(false)}>取消</button>
                <button className="btn btn-brand" onClick={() => { setShowPublish(false); toast('发布任务已创建！'); }}>确认发布</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Schedule Drawer */}
      {showSchedule && (
        <>
          <div className="drawer-overlay" style={{ display: 'block' }} onClick={() => setShowSchedule(false)} />
          <div className="drawer" style={{ display: 'block' }}>
            <div className="drawer-header">
              <h3 className="modal-title">添加定时发布</h3>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowSchedule(false)}>✕</button>
            </div>
            <div className="stack-4">
              <div className="field"><label>剧集</label><select><option>选择剧集...</option></select></div>
              <div className="field"><label>时间</label><input type="datetime-local" /></div>
              <div className="field">
                <label>渠道</label>
                <select>
                  {channels?.filter((c) => c.status === 'connected').map((ch) => (
                    <option key={ch.id}>{ch.name}</option>
                  )) ?? <option>暂无可用渠道</option>}
                  <option>全部</option>
                </select>
              </div>
              <button className="btn btn-brand" onClick={() => { setShowSchedule(false); toast('定时发布已添加'); }}>添加</button>
            </div>
          </div>
        </>
      )}

      {/* Toasts */}
      <div style={{ position: 'fixed', bottom: 'var(--space-6)', right: 'var(--space-6)', zIndex: 200, display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
        {toasts.map((t) => (
          <div key={t.id} className="toast">{t.msg}</div>
        ))}
      </div>

      <style jsx global>{`
        .pb-content { padding: var(--space-8); max-width: 1200px; }
        .channel-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: var(--space-4); margin-top: var(--space-6); }
        .channel-card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-lg); padding: var(--space-5); }
        .channel-card.connected { border-color: color-mix(in oklab, var(--success), transparent 60%); }
        .channel-icon { width: 40px; height: 40px; border-radius: var(--radius-md); display: flex; align-items: center; justify-content: center; color: white; font-weight: 500; font-size: var(--text-sm); margin-bottom: var(--space-3); }
        .export-section { margin-top: var(--space-6); }
        .chart-placeholder { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-lg); padding: var(--space-6); margin-top: var(--space-4); }
        .chart-placeholder h4 { margin-bottom: var(--space-4); }
        .queue-item { display: flex; gap: var(--space-3); padding: var(--space-3); border-bottom: 1px solid var(--border-soft); align-items: center; }
        .queue-item:last-child { border-bottom: none; }
        .modal { width: min(560px, 100%); max-height: min(640px, calc(100vh - 48px)); overflow-y: auto; background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-lg); padding: var(--space-6); box-shadow: var(--elev-raised); animation: fadeIn 0.2s var(--ease-standard); }
        .modal .field select, .modal .field input { padding: 9px var(--space-3); border-radius: var(--radius-sm); background: var(--bg); border: 1px solid var(--border); color: var(--fg); font-family: var(--font-body); font-size: var(--text-sm); outline: none; transition: border-color 0.15s; width: 100%; }
        .modal .field select:focus, .modal .field input:focus { border-color: var(--accent); }
        .toast { padding: 12px 20px; border-radius: var(--radius-sm); background: var(--surface); border: 1px solid var(--border); color: var(--fg); font-size: var(--text-sm); box-shadow: var(--elev-raised); animation: slideUp 0.25s var(--ease-standard); }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        @media (max-width: 1023px) { .channel-grid { grid-template-columns: 1fr 1fr; } }
        @media (max-width: 639px) { .channel-grid { grid-template-columns: 1fr; } .pb-content { padding: var(--space-4); } }
      `}</style>
    </div>
  );
}
