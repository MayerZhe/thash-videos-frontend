'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { analyticsApi } from '@/lib/api';
import type { AnalyticsSummary, AnalyticsSupplier, AnalyticsApiCall } from '@/lib/types';

/* ═══════════════════════════════════════════════════════════════════════
 * Analytics Page — real API calls with stub degradation fallback
 * Route: /projects/[id]/analytics
 * KPI cards, bar chart, cost distribution, supplier table, config drawer
 * ═══════════════════════════════════════════════════════════════════════ */

const PERIODS = ['最近 7 天', '最近 30 天', '本月', '本季度', '全部'];

// Fallback color palette for suppliers
const SUPPLIER_COLORS = ['var(--accent)', '#6366f1', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6'];

function supplierColor(idx: number): string {
  return SUPPLIER_COLORS[idx % SUPPLIER_COLORS.length];
}

function fmtYuan(cents: number): string {
  return '¥' + (cents / 100).toFixed(2);
}

function fmtYuanShort(cents: number): string {
  const yuan = cents / 100;
  if (yuan >= 1) return '¥' + yuan.toFixed(0);
  return '¥' + yuan.toFixed(1);
}

export default function AnalyticsPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  const [period, setPeriod] = useState('本月');

  // API data state
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [suppliers, setSuppliers] = useState<AnalyticsSupplier[] | null>(null);
  const [apiCalls, setApiCalls] = useState<AnalyticsApiCall[] | null>(null);
  const [loading, setLoading] = useState(true);

  // UI state
  const [showDrawer, setShowDrawer] = useState(false);
  const [toasts, setToasts] = useState<{ id: number; msg: string }[]>([]);
  const toastId = useState({ n: 0 })[0];

  const toast = (msg: string) => {
    const id = ++toastId.n;
    setToasts((prev) => [...prev, { id, msg }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3000);
  };

  // Load all analytics data — graceful stub degradation
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [s, sup, ac] = await Promise.all([
        analyticsApi.getSummary(projectId),
        analyticsApi.getSuppliers(projectId),
        analyticsApi.getApiCalls(projectId),
      ]);
      setSummary(s);
      setSuppliers(sup);
      setApiCalls(ac);
    } catch {
      // Stub backend — show friendly empty state
      setSummary(null);
      setSuppliers(null);
      setApiCalls(null);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ─── Derived data ───
  const totalCost = summary?.total_cost_cents ?? 0;
  const totalCalls = summary?.total_calls ?? 0;
  const avgCostPerCall = totalCalls > 0 ? totalCost / totalCalls : 0;

  // Supplier bars (sorted by cost descending)
  const supplierBars = (suppliers ?? [])
    .slice()
    .sort((a, b) => b.cost_cents - a.cost_cents)
    .map((s, i) => ({
      name: s.supplier,
      cost_cents: s.cost_cents,
      calls: s.calls,
      height: Math.max(20, (s.cost_cents / Math.max(1, totalCost)) * 140),
      color: supplierColor(i),
    }));

  // Cost by type (from summary.by_stage)
  const costByStage = summary?.by_stage
    ? Object.entries(summary.by_stage)
        .filter(([, v]) => v > 0)
        .sort(([, a], [, b]) => b - a)
        .map(([stage, cents], i) => ({
          label: `${stage} · ${fmtYuan(cents)} · ${totalCost > 0 ? Math.round((cents / totalCost) * 100) : 0}%`,
          color: supplierColor(i),
          pct: totalCost > 0 ? (cents / totalCost) * 100 : 0,
        }))
    : [];

  // Api calls table
  const callsTable = (apiCalls ?? []).slice(0, 20);

  // Supplier table
  const supplierTable = (suppliers ?? []).map((s) => ({
    name: s.supplier,
    calls: s.calls,
    cost: fmtYuan(s.cost_cents),
    avg: s.calls > 0 ? fmtYuanShort(s.cost_cents / s.calls) : '¥0',
  }));

  if (loading) {
    return (
      <div className="an-content">
        <div className="flex items-center justify-center py-16">
          <p className="text-sm text-muted">加载分析数据...</p>
        </div>
      </div>
    );
  }

  // Stub degradation: data unavailable
  const dataUnavailable = !summary && !suppliers && !apiCalls;

  return (
    <div className="an-content">
      {/* Period selector */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-4)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          <span className="badge badge-muted">数据范围</span>
          <div className="field">
            <select
              value={period}
              onChange={(e) => { setPeriod(e.target.value); toast('切换数据范围：' + e.target.value); }}
              style={{ padding: 'var(--space-1) var(--space-3)', fontSize: 'var(--text-xs)' }}
            >
              {PERIODS.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          <button className="btn btn-ghost btn-sm" onClick={() => toast('报告已导出为 CSV')}>导出报告</button>
        </div>
      </div>

      <p className="eyebrow">// 数据分析 · 看板</p>
      <h2>费用与用量概览</h2>

      {dataUnavailable ? (
        <div className="chart-placeholder" style={{ textAlign: 'center', padding: 'var(--space-10)' }}>
          <p className="text-sm text-muted mb-2">数据暂不可用</p>
          <p className="text-xs text-meta">分析服务正在部署中，请稍后重试</p>
          <button className="btn btn-ghost btn-sm mt-4" onClick={loadData}>重试</button>
        </div>
      ) : (
        <>
          {/* KPI Row */}
          <div className="kpi-row">
            <div className="kpi">
              <div className="kpi-value">{fmtYuan(totalCost)}</div>
              <div className="kpi-label">本月总费用</div>
              <div className="kpi-change" style={{ color: 'var(--muted)' }}>实时数据</div>
            </div>
            <div className="kpi">
              <div className="kpi-value">{totalCalls}</div>
              <div className="kpi-label">API 调用次数</div>
              <div className="kpi-change" style={{ color: 'var(--muted)' }}>实时数据</div>
            </div>
            <div className="kpi">
              <div className="kpi-value">{fmtYuanShort(avgCostPerCall)}</div>
              <div className="kpi-label">平均每次调用成本</div>
              <div className="kpi-change" style={{ color: 'var(--muted)' }}>实时数据</div>
            </div>
            <div className="kpi">
              <div className="kpi-value">{supplierBars.length}</div>
              <div className="kpi-label">活跃供应商</div>
              <div className="kpi-change" style={{ color: 'var(--muted)' }}>当前周期</div>
            </div>
          </div>

          {/* Cost by Supplier Bar Chart */}
          <div className="chart-placeholder">
            <div className="row-between">
              <h4>按供应商 · 费用分布</h4>
              <span className="badge badge-muted">{period}</span>
            </div>
            {supplierBars.length > 0 ? (
              <div className="chart-bar">
                {supplierBars.map((s) => (
                  <div key={s.name} className="bar" style={{ height: Math.max(20, s.height), background: s.color }}>
                    <span className="bar-val">{fmtYuanShort(s.cost_cents)}</span>
                    <span className="bar-label">{s.name}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted py-8 text-center">暂无供应商数据</p>
            )}
          </div>

          {/* Cost by Type + Supplier Details */}
          <div className="grid-2" style={{ marginTop: 'var(--space-4)' }}>
            <div className="chart-placeholder">
              <h4>按阶段 · 费用分布</h4>
              {costByStage.length > 0 ? (
                <div className="pie-legend">
                  {costByStage.map((c) => (
                    <div key={c.label} className="pie-item">
                      <span className="pie-dot" style={{ background: c.color, width: Math.max(6, c.pct / 3) }} />
                      {c.label}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted py-4">暂无阶段数据</p>
              )}
            </div>
            <div className="chart-placeholder">
              <h4>按供应商 · 详细用量</h4>
              {supplierTable.length > 0 ? (
                <table className="supplier-table">
                  <tbody>
                    {supplierTable.map((s, i) => (
                      <tr key={s.name}>
                        <td style={{ color: 'var(--fg)' }}>{s.name}</td>
                        <td className="text-right text-mono">{s.cost}</td>
                        <td className="text-right body-meta">{s.calls} 次</td>
                        <td className="text-right body-meta">{s.avg}/次</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="text-sm text-muted py-4">暂无供应商数据</p>
              )}
            </div>
          </div>

          {/* API Calls Detail Table */}
          <div className="chart-placeholder">
            <div className="row-between">
              <h4>API 调用记录</h4>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowDrawer(true)}>供应商管理</button>
            </div>
            <div className="table-wrap" style={{ marginTop: 'var(--space-4)' }}>
              {callsTable.length > 0 ? (
                <table>
                  <thead>
                    <tr>
                      <th>端点</th><th>供应商</th><th>阶段</th><th>耗时</th><th>状态</th><th>费用</th>
                    </tr>
                  </thead>
                  <tbody>
                    {callsTable.map((c) => (
                      <tr key={c.id}>
                        <td style={{ color: 'var(--fg)', fontSize: 'var(--text-xs)', fontFamily: 'monospace', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.endpoint}</td>
                        <td className="text-xs">{c.supplier}</td>
                        <td className="text-xs">{c.stage}</td>
                        <td className="text-mono text-xs">{c.duration_ms}ms</td>
                        <td className={`text-xs ${c.status === 'success' ? 'text-success' : c.status === 'error' ? 'text-danger' : 'text-muted'}`}>{c.status}</td>
                        <td className="text-mono text-xs">{fmtYuanShort(c.cost_cents)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="text-sm text-muted py-8 text-center">暂无调用记录</p>
              )}
            </div>
          </div>
        </>
      )}

      {/* Supplier Config Drawer */}
      {showDrawer && (
        <>
          <div className="drawer-overlay" style={{ display: 'block' }} onClick={() => setShowDrawer(false)} />
          <div className="drawer" style={{ display: 'block' }}>
            <div className="drawer-header">
              <h3 className="modal-title">供应商配置</h3>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowDrawer(false)}>✕</button>
            </div>
            <div className="stack-4">
              {supplierBars.length > 0 ? (
                supplierBars.map((s) => (
                  <div key={s.name} className="card">
                    <div className="row-between">
                      <span style={{ color: 'var(--fg)' }}>{s.name}</span>
                      <span className="badge badge-success">启用</span>
                    </div>
                    <p className="body-muted body-sm">费用: {fmtYuan(s.cost_cents)} · 调用: {s.calls} 次</p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted">暂无供应商配置</p>
              )}
              <button className="btn btn-brand" onClick={() => toast('功能即将上线')}>添加供应商</button>
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
        .an-content {
          padding: var(--space-8);
          max-width: 1200px;
        }
        .kpi-row {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: var(--space-4);
          margin-top: var(--space-6);
        }
        .kpi {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius-lg);
          padding: var(--space-5);
        }
        .kpi .kpi-value {
          font-family: var(--font-mono);
          font-size: var(--text-2xl);
          color: var(--fg);
          line-height: 1;
        }
        .kpi .kpi-label {
          margin-top: var(--space-1);
          color: var(--muted);
          font-size: var(--text-xs);
        }
        .kpi .kpi-change {
          font-size: var(--text-xs);
          margin-top: var(--space-1);
        }
        .chart-placeholder {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius-lg);
          padding: var(--space-6);
          margin-top: var(--space-4);
        }
        .chart-placeholder h4 {
          margin-bottom: var(--space-4);
        }
        .chart-bar {
          display: flex;
          align-items: flex-end;
          gap: var(--space-3);
          height: 160px;
          padding-top: var(--space-4);
        }
        .chart-bar .bar {
          flex: 1;
          background: var(--accent);
          border-radius: var(--radius-sm) var(--radius-sm) 0 0;
          min-width: 20px;
          opacity: 0.8;
          position: relative;
        }
        .chart-bar .bar:hover {
          opacity: 1;
        }
        .chart-bar .bar .bar-label {
          position: absolute;
          bottom: -20px;
          left: 50%;
          transform: translateX(-50%);
          font-size: 10px;
          color: var(--meta);
          white-space: nowrap;
        }
        .chart-bar .bar .bar-val {
          position: absolute;
          top: -18px;
          left: 50%;
          transform: translateX(-50%);
          font-size: var(--text-xs);
          color: var(--fg);
          font-family: var(--font-mono);
        }
        .supplier-table {
          margin-top: var(--space-4);
        }
        .pie-legend {
          display: flex;
          flex-wrap: wrap;
          gap: var(--space-4);
          margin-top: var(--space-4);
        }
        .pie-item {
          display: flex;
          align-items: center;
          gap: var(--space-2);
          font-size: var(--text-sm);
        }
        .pie-dot {
          width: 10px;
          height: 10px;
          border-radius: var(--radius-pill);
          flex-shrink: 0;
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
        @keyframes slideUp { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        @media (max-width: 1023px) { .kpi-row { grid-template-columns: 1fr 1fr; } }
        @media (max-width: 639px) { .kpi-row { grid-template-columns: 1fr; } .an-content { padding: var(--space-4); } }
      `}</style>
    </div>
  );
}
