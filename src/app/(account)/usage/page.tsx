'use client';

import { useEffect, useState, useCallback } from 'react';
import { usageApi } from '@/lib/api';
import type { UsageSummary, UsageRecord } from '@/lib/types';

function formatCents(cents: number): string {
  return `¥${(cents / 100).toFixed(2)}`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('zh-CN', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit',
  });
}

const STAGE_LABELS: Record<string, string> = {
  script_rewrite: 'AI改写',
  character_management: '角色管理',
  scene_management: '场景管理',
  storyboard: '分镜表',
  image_generation: '图片生成',
  video_generation: '视频生成',
  tts_dubbing: 'TTS配音',
  shot_composition: '镜头合成',
  episode_merge: '整集拼接',
  export: '导出',
};

export default function UsagePage() {
  const [summary, setSummary] = useState<UsageSummary | null>(null);
  const [records, setRecords] = useState<UsageRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [loadingSummary, setLoadingSummary] = useState(true);
  const [loadingRecords, setLoadingRecords] = useState(true);
  const [page, setPage] = useState(0);
  const [filterSupplier, setFilterSupplier] = useState('');
  const [error, setError] = useState<string | null>(null);
  const PAGE_SIZE = 20;

  const loadSummary = useCallback(() => {
    setError(null);
    setLoadingSummary(true);
    usageApi.getSummary()
      .then(setSummary)
      .catch((err) => setError(err instanceof Error ? err.message : '加载失败，请稍后重试'))
      .finally(() => setLoadingSummary(false));
  }, []);

  const loadRecords = useCallback((supplier: string = filterSupplier) => {
    setLoadingRecords(true);
    setError(null);
    const params: Record<string, string | number> = { limit: PAGE_SIZE };
    if (supplier) params.supplier = supplier;
    usageApi.getRecords(params)
      .then((res) => {
        setRecords(res.records);
        setTotal(res.total);
        setPage(0);
      })
      .catch((err) => setError(err instanceof Error ? err.message : '加载失败，请稍后重试'))
      .finally(() => setLoadingRecords(false));
  }, []);

  const loadData = useCallback(() => {
    loadSummary();
    loadRecords();
  }, [loadSummary, loadRecords]);

  useEffect(() => {
    loadSummary();
  }, [loadSummary]);

  useEffect(() => {
    loadRecords();
  }, [filterSupplier, loadRecords]);

  async function loadMore() {
    const nextPage = page + 1;
    const params: Record<string, string | number> = { limit: PAGE_SIZE, offset: nextPage * PAGE_SIZE };
    if (filterSupplier) params.supplier = filterSupplier;
    const res = await usageApi.getRecords(params);
    setRecords((prev) => [...prev, ...res.records]);
    setPage(nextPage);
  }

  const supplierOptions = summary
    ? Object.keys(summary.by_supplier)
    : [];

  return (
    <div className="st-content">
      <p className="eyebrow">// 用量统计</p>
      <h2>用量仪表盘</h2>

      {error && (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--danger)', borderRadius: 'var(--radius-md)', padding: 'var(--space-3) var(--space-4)', marginBottom: 'var(--space-4)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ color: 'var(--danger)', fontSize: 'var(--text-sm)' }}>{error}</span>
          <button className="btn btn-ghost btn-sm" onClick={loadData} style={{ color: 'var(--danger)' }}>重试</button>
        </div>
      )}

      {/* Summary Cards */}
      <div className="usage-cards">
        {loadingSummary ? (
          <>
            <div className="skeleton" style={{ height: 120, borderRadius: 'var(--radius-lg)' }} />
            <div className="skeleton" style={{ height: 120, borderRadius: 'var(--radius-lg)' }} />
            <div className="skeleton" style={{ height: 120, borderRadius: 'var(--radius-lg)' }} />
          </>
        ) : summary ? (
          <>
            <div className="card usage-card">
              <p className="body-muted body-sm">当前周期</p>
              <p className="usage-value">{summary.period}</p>
            </div>
            <div className="card usage-card">
              <p className="body-muted body-sm">总调用次数</p>
              <p className="usage-value">{summary.total_calls.toLocaleString()}</p>
            </div>
            <div className="card usage-card">
              <p className="body-muted body-sm">总费用</p>
              <p className="usage-value">{formatCents(summary.total_cost_cents)}</p>
            </div>
          </>
        ) : (
          <div className="card empty-state" style={{ gridColumn: '1 / -1' }}>
            <p className="body-muted">暂无用量数据</p>
          </div>
        )}
      </div>

      {/* Supplier Breakdown */}
      {summary && Object.keys(summary.by_supplier).length > 0 && (
        <div className="usage-section">
          <h3>按供应商</h3>
          <div className="card">
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>供应商</th>
                    <th className="text-right">费用</th>
                    <th className="text-right">占比</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(summary.by_supplier).map(([supplier, cost]) => (
                    <tr key={supplier}>
                      <td style={{ color: 'var(--fg)' }}>{supplier}</td>
                      <td className="text-right text-mono">{formatCents(cost)}</td>
                      <td className="text-right text-mono">
                        {summary.total_cost_cents > 0
                          ? `${((cost / summary.total_cost_cents) * 100).toFixed(1)}%`
                          : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Stage Breakdown */}
      {summary && Object.keys(summary.by_stage).length > 0 && (
        <div className="usage-section">
          <h3>按管线阶段</h3>
          <div className="card">
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>阶段</th>
                    <th className="text-right">费用</th>
                    <th className="text-right">占比</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(summary.by_stage).map(([stage, cost]) => (
                    <tr key={stage}>
                      <td style={{ color: 'var(--fg)' }}>{STAGE_LABELS[stage] ?? stage}</td>
                      <td className="text-right text-mono">{formatCents(cost)}</td>
                      <td className="text-right text-mono">
                        {summary.total_cost_cents > 0
                          ? `${((cost / summary.total_cost_cents) * 100).toFixed(1)}%`
                          : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Call Detail Records */}
      <div className="usage-section">
        <div className="row-between" style={{ marginBottom: 'var(--space-4)' }}>
          <h3>调用明细</h3>
          {supplierOptions.length > 0 && (
            <div className="field" style={{ flexDirection: 'row', alignItems: 'center', gap: 'var(--space-3)' }}>
              <label style={{ margin: 0, fontSize: 'var(--text-sm)', color: 'var(--fg-2)' }}>供应商筛选</label>
              <select
                value={filterSupplier}
                onChange={(e) => setFilterSupplier(e.target.value)}
                style={{ width: 160 }}
              >
                <option value="">全部</option>
                {supplierOptions.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {loadingRecords ? (
          <div className="card">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="skeleton" style={{ height: 40, borderRadius: 'var(--radius-sm)', marginTop: 'var(--space-2)' }} />
            ))}
          </div>
        ) : records.length === 0 ? (
          <div className="card empty-state">
            <p className="body-muted">暂无调用记录</p>
          </div>
        ) : (
          <div className="card">
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>时间</th>
                    <th>供应商</th>
                    <th>阶段</th>
                    <th className="text-right">费用</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((r) => (
                    <tr key={r.id}>
                      <td className="text-mono" style={{ fontSize: 'var(--text-xs)' }}>{formatDate(r.created_at)}</td>
                      <td>{r.supplier}</td>
                      <td>{STAGE_LABELS[r.stage] ?? r.stage}</td>
                      <td className="text-right text-mono">{formatCents(r.cost_cents)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {total > records.length && (
              <div style={{ marginTop: 'var(--space-4)', textAlign: 'center' }}>
                <button className="btn btn-secondary btn-sm" onClick={loadMore}>
                  加载更多 ({total - records.length} 条)
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <style jsx global>{`
        .st-content { padding: var(--space-8); max-width: 1100px; }
        .usage-cards { display: grid; grid-template-columns: repeat(3, 1fr); gap: var(--space-4); margin: var(--space-6) 0; }
        .usage-card { display: flex; flex-direction: column; gap: var(--space-2); }
        .usage-value { font-size: var(--text-xl); font-weight: 500; color: var(--fg); font-family: var(--font-display); }
        .usage-section { margin-bottom: var(--space-8); }
        .usage-section h3 { margin-bottom: var(--space-4); font-weight: 500; }
        .empty-state { display: flex; align-items: center; justify-content: center; padding: var(--space-8); }
        .text-mono { font-family: var(--font-mono); }
        .text-right { text-align: right; }
        @media (max-width: 639px) { .usage-cards { grid-template-columns: 1fr; } }
      `}</style>
    </div>
  );
}