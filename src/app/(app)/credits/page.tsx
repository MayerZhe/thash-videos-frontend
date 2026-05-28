'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/stores/auth';
import { creditsApi, ApiError } from '@/lib/api';
import type { CreditBalance, CreditTransaction, CreditPackage } from '@/lib/types';

function formatCents(cents: number): string {
  return `¥${(cents / 100).toFixed(2)}`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' });
}

const TX_TYPE_LABELS: Record<CreditTransaction['type'], string> = {
  charge: '消费',
  purchase: '充值',
  refund: '退款',
  bonus: '赠送',
  monthly_allowance: '月度额度',
};

const TX_TYPE_BADGE: Record<CreditTransaction['type'], string> = {
  charge: 'badge-danger',
  purchase: 'badge-success',
  refund: 'badge-accent',
  bonus: 'badge-accent',
  monthly_allowance: 'badge-muted',
};

export default function CreditsPage() {
  const { user } = useAuthStore();
  const [balance, setBalance] = useState<CreditBalance | null>(null);
  const [transactions, setTransactions] = useState<CreditTransaction[]>([]);
  const [packages, setPackages] = useState<CreditPackage[]>([]);
  const [totalTx, setTotalTx] = useState(0);
  const [loadingBalance, setLoadingBalance] = useState(true);
  const [loadingTx, setLoadingTx] = useState(true);
  const [loadingPkgs, setLoadingPkgs] = useState(true);
  const [selectedPkg, setSelectedPkg] = useState<CreditPackage | null>(null);
  const [txPage, setTxPage] = useState(0);
  const PAGE_SIZE = 10;

  useEffect(() => {
    creditsApi.getBalance()
      .then(setBalance)
      .catch(() => {})
      .finally(() => setLoadingBalance(false));

    creditsApi.getPackages()
      .then(setPackages)
      .catch(() => {})
      .finally(() => setLoadingPkgs(false));

    creditsApi.getTransactions({ limit: PAGE_SIZE })
      .then((res) => {
        setTransactions(res.transactions);
        setTotalTx(res.total);
      })
      .catch(() => {})
      .finally(() => setLoadingTx(false));
  }, []);

  async function loadMoreTx() {
    const nextPage = txPage + 1;
    const res = await creditsApi.getTransactions({ limit: PAGE_SIZE, offset: nextPage * PAGE_SIZE });
    setTransactions((prev) => [...prev, ...res.transactions]);
    setTxPage(nextPage);
  }

  if (loadingBalance) {
    return (
      <div className="st-content">
        <p className="eyebrow">// Credits · 账户余额</p>
        <div className="balance-skeleton">
          <div className="skeleton" style={{ width: 200, height: 60, borderRadius: 'var(--radius-lg)' }} />
          <div className="skeleton" style={{ width: 120, height: 24, borderRadius: 'var(--radius-pill)' }} />
        </div>
        <style jsx global>{`.balance-skeleton { display: flex; flex-direction: column; gap: var(--space-4); margin: var(--space-6) 0; }`}</style>
      </div>
    );
  }

  return (
    <div className="st-content">
      <p className="eyebrow">// Credits · 账户余额</p>
      <h2>Credits 管理</h2>

      {/* Balance Card */}
      <div className="balance-section">
        <div className="card balance-card">
          <div className="balance-main">
            <div>
              <p className="body-muted body-sm">账户余额</p>
              <div className="balance-amount">
                {balance ? formatCents(balance.total_cents) : '—'}
              </div>
              <div className="balance-detail">
                <span className="badge badge-muted">
                  赠送 {formatCents(balance?.bonus_cents ?? 0)}
                </span>
                <span className="badge badge-muted">
                  付费 {formatCents(balance?.paid_cents ?? 0)}
                </span>
              </div>
            </div>
            <div className="balance-plan">
              <span className="eyebrow">当前计划</span>
              <span className="badge badge-accent">{balance?.plan ?? '—'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Package Selection */}
      <div className="credits-section">
        <h3>选择充值档位</h3>
        {loadingPkgs ? (
          <div className="pkgs-grid">
            {[1, 2, 3].map((i) => (
              <div key={i} className="skeleton" style={{ height: 120, borderRadius: 'var(--radius-lg)' }} />
            ))}
          </div>
        ) : packages.length === 0 ? (
          <div className="card empty-state">
            <p className="body-muted">暂无可用充值档位</p>
          </div>
        ) : (
          <div className="pkgs-grid">
            {packages.map((pkg) => (
              <div
                key={pkg.id}
                className={`pkg-card card${selectedPkg?.id === pkg.id ? ' selected' : ''}`}
                onClick={() => setSelectedPkg(pkg)}
              >
                {pkg.recommended && <div className="pkg-recommended">推荐</div>}
                {pkg.badge && <div className="pkg-badge-label">{pkg.badge}</div>}
                <div className="pkg-name">{pkg.name}</div>
                <div className="pkg-credits">{formatCents(pkg.amount_cents)} Credits</div>
                <div className="pkg-price">¥{pkg.price_yuan}</div>
              </div>
            ))}
          </div>
        )}
        {selectedPkg && (
          <div className="pkgs-action">
            <button className="btn btn-brand">
              立即充值 ¥{selectedPkg.price_yuan}
            </button>
          </div>
        )}
      </div>

      {/* Transaction History */}
      <div className="credits-section">
        <h3>交易流水</h3>
        {loadingTx ? (
          <div className="card">
            <div className="skeleton" style={{ height: 40, borderRadius: 'var(--radius-sm)', marginBottom: 'var(--space-3)' }} />
            {[1, 2, 3].map((i) => (
              <div key={i} className="skeleton" style={{ height: 48, borderRadius: 'var(--radius-sm)', marginTop: 'var(--space-2)' }} />
            ))}
          </div>
        ) : transactions.length === 0 ? (
          <div className="card empty-state">
            <p className="body-muted">暂无交易记录</p>
          </div>
        ) : (
          <div className="card">
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>时间</th>
                    <th>类型</th>
                    <th>描述</th>
                    <th className="text-right">金额</th>
                    <th className="text-right">余额</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((tx) => (
                    <tr key={tx.id}>
                      <td className="text-mono">{formatDate(tx.created_at)}</td>
                      <td>
                        <span className={`badge ${TX_TYPE_BADGE[tx.type]}`}>
                          {TX_TYPE_LABELS[tx.type]}
                        </span>
                      </td>
                      <td>{tx.description}</td>
                      <td className="text-right text-mono">
                        <span className={tx.amount_cents > 0 ? 'text-success' : 'text-danger'}>
                          {tx.amount_cents > 0 ? '+' : ''}{formatCents(tx.amount_cents)}
                        </span>
                      </td>
                      <td className="text-right text-mono">{formatCents(tx.balance_after_cents)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {totalTx > transactions.length && (
              <div style={{ marginTop: 'var(--space-4)', textAlign: 'center' }}>
                <button className="btn btn-secondary btn-sm" onClick={loadMoreTx}>
                  加载更多 ({totalTx - transactions.length} 条)
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <style jsx global>{`
        .st-content { padding: var(--space-8); max-width: 900px; }
        .balance-section { margin: var(--space-6) 0; }
        .balance-card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-lg); padding: var(--space-6); }
        .balance-main { display: flex; align-items: flex-start; justify-content: space-between; gap: var(--space-4); }
        .balance-amount { font-size: var(--text-3xl); font-weight: 500; color: var(--fg); font-family: var(--font-display); margin: var(--space-2) 0; }
        .balance-detail { display: flex; gap: var(--space-2); }
        .balance-plan { display: flex; flex-direction: column; align-items: flex-end; gap: var(--space-2); }
        .credits-section { margin-bottom: var(--space-8); }
        .credits-section h3 { margin-bottom: var(--space-4); font-weight: 500; }
        .pkgs-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: var(--space-4); }
        .pkg-card { position: relative; cursor: pointer; transition: all var(--motion-fast); }
        .pkg-card.selected { border-color: var(--accent); }
        .pkg-recommended { position: absolute; top: -10px; right: 12px; background: var(--accent); color: var(--accent-on); font-size: 10px; font-weight: 500; padding: 2px 8px; border-radius: var(--radius-pill); }
        .pkg-badge-label { font-size: var(--text-xs); color: var(--muted); margin-bottom: var(--space-2); }
        .pkg-name { font-weight: 500; color: var(--fg); margin-bottom: var(--space-2); }
        .pkg-credits { font-size: var(--text-sm); color: var(--fg-2); margin-bottom: var(--space-2); }
        .pkg-price { font-size: var(--text-xl); font-weight: 500; color: var(--fg); }
        .pkgs-action { margin-top: var(--space-4); display: flex; justify-content: flex-end; }
        .empty-state { display: flex; align-items: center; justify-content: center; padding: var(--space-8); }
        .text-success { color: var(--success); }
        .text-danger { color: var(--danger); }
        .text-mono { font-family: var(--font-mono); }
        .text-right { text-align: right; }
      `}</style>
    </div>
  );
}