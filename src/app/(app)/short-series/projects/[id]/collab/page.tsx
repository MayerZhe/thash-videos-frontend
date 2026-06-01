'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

/* ═══════════════════════════════════════════════════════════════════════
 * Team Collab Page — 1:1 replica of Thash-video-design/team-collab.html
 * Route: /projects/[id]/collab
 * Three tabs: approvals, comments, version history
 * ═══════════════════════════════════════════════════════════════════════ */

export default function TeamCollabPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  const [activeTab, setActiveTab] = useState('approvals');
  const [commentInput, setCommentInput] = useState('');
  const [toasts, setToasts] = useState<{ id: number; msg: string }[]>([]);
  const toastId = useState({ n: 0 })[0];

  const toast = (msg: string) => {
    const id = ++toastId.n;
    setToasts((prev) => [...prev, { id, msg }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3000);
  };

  return (
    <div className="tc-content">
      <p className="eyebrow">// 团队协作 · 审批流</p>
      <h2>协作与审批</h2>

      <div className="collab-tabs">
        <button className={activeTab === 'approvals' ? 'active' : ''} onClick={() => setActiveTab('approvals')}>待审批</button>
        <button className={activeTab === 'comments' ? 'active' : ''} onClick={() => setActiveTab('comments')}>评论</button>
        <button className={activeTab === 'versions' ? 'active' : ''} onClick={() => setActiveTab('versions')}>版本历史</button>
      </div>

      {/* Approvals Tab */}
      {activeTab === 'approvals' && (
        <div className="approval-list">
          <div className="approval-item">
            <div className="ai-avatar" style={{ background: 'var(--accent)', color: 'var(--accent-on)' }}>EW</div>
            <div className="ai-meta">
              <strong style={{ color: 'var(--fg)' }}>Editor Wang</strong> 提交了审核请求
              <p className="body-muted body-sm">斗破苍穹 · 第 2 集「药老现身」剧本标准化完成，请审核 18 段对话。</p>
            </div>
            <span className="badge badge-warn">待审核</span>
            <button className="btn btn-brand btn-sm" onClick={() => toast('第 2 集剧本 · 审核通过')}>通过</button>
            <button className="btn btn-danger btn-sm" onClick={() => toast('已退回，附退回原因')}>退回</button>
          </div>
          <div className="approval-item">
            <div className="ai-avatar" style={{ background: '#6366f1', color: 'white' }}>RL</div>
            <div className="ai-meta">
              <strong style={{ color: 'var(--fg)' }}>Reviewer Li</strong> 提交了审核请求
              <p className="body-muted body-sm">霸道总裁的小娇妻 · 第 6 集「大结局」分镜拆解完成，共 22 个镜头。</p>
            </div>
            <span className="badge badge-warn">待审核</span>
            <button className="btn btn-brand btn-sm" onClick={() => toast('第 6 集分镜 · 审核通过')}>通过</button>
            <button className="btn btn-danger btn-sm" onClick={() => toast('已退回，附退回原因')}>退回</button>
          </div>
          <div className="approval-item">
            <div className="ai-avatar" style={{ background: 'var(--accent)', color: 'var(--accent-on)' }}>EW</div>
            <div className="ai-meta">
              <strong style={{ color: 'var(--fg)' }}>Editor Wang</strong> 提交了审核请求
              <p className="body-muted body-sm">重生之都市修仙 · 角色「林轩」设计图更新，请确认新形象锚定。</p>
            </div>
            <span className="badge badge-warn">待审核</span>
            <button className="btn btn-brand btn-sm" onClick={() => toast('林轩角色设计 · 审核通过')}>通过</button>
            <button className="btn btn-danger btn-sm" onClick={() => toast('已退回，附退回原因')}>退回</button>
          </div>
        </div>
      )}

      {/* Comments Tab */}
      {activeTab === 'comments' && (
        <div className="chart-placeholder" style={{ marginTop: 'var(--space-4)' }}>
          <h4>斗破苍穹 · 第 2 集讨论</h4>
          <div className="comment-thread">
            <div className="comment">
              <div className="c-avatar" style={{ background: 'var(--accent)', color: 'var(--accent-on)' }}>EW</div>
              <div>
                <strong style={{ color: 'var(--fg)' }}>Editor Wang</strong> <span className="body-meta">2 小时前</span>
                <p className="body-sm" style={{ marginTop: 4 }}>药老现身的对话段落，第 7 段语气过于正式，建议调整得更神秘一些——药老此时应该还带着一丝试探。</p>
              </div>
            </div>
            <div className="comment">
              <div className="c-avatar" style={{ background: 'var(--border)', color: 'var(--fg)' }}>CS</div>
              <div>
                <strong style={{ color: 'var(--fg)' }}>Creator Studio</strong> <span className="body-meta">1 小时前</span>
                <p className="body-sm" style={{ marginTop: 4 }}>同意，已标记在剧本上。另外第 12 段的动作描述「药老漂浮在空中」可以更具体——建议改成「药老的灵魂体缓缓漂浮至与萧炎视线齐平」。</p>
              </div>
            </div>
            <div className="comment">
              <div className="c-avatar" style={{ background: '#6366f1', color: 'white' }}>RL</div>
              <div>
                <strong style={{ color: 'var(--fg)' }}>Reviewer Li</strong> <span className="body-meta">30 分钟前</span>
                <p className="body-sm" style={{ marginTop: 4 }}>整体剧情走向没问题。注意第 15 段过渡到第 3 集的节奏，结尾不要太仓促。</p>
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 'var(--space-2)', marginTop: 'var(--space-4)' }}>
            <input
              type="text"
              placeholder="添加评论..."
              value={commentInput}
              onChange={(e) => setCommentInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && commentInput.trim()) { toast('评论已发送'); setCommentInput(''); } }}
              style={{ flex: 1, padding: 'var(--space-2) var(--space-3)', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--fg)', fontFamily: 'inherit', fontSize: 'var(--text-sm)' }}
            />
            <button className="btn btn-brand btn-sm" onClick={() => { if (commentInput.trim()) { toast('评论已发送'); setCommentInput(''); } }}>发送</button>
          </div>
        </div>
      )}

      {/* Version History Tab */}
      {activeTab === 'versions' && (
        <div style={{ marginTop: 'var(--space-4)', display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h4>版本控制系统</h4>
              <p className="body-muted body-sm" style={{ marginTop: 4 }}>基于 git-worktree 模型的完整版本管理 — 分支、对比、恢复、标签</p>
            </div>
            <a
              href={`/short-series/projects/${projectId}/versions`}
              onClick={(e) => { e.preventDefault(); router.push(`/short-series/projects/${projectId}/versions`); }}
              className="btn btn-brand"
              style={{ whiteSpace: 'nowrap' }}
            >
              打开版本控制 →
            </a>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 'var(--space-4)' }}>
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: 'var(--space-4)' }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>分支</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><span style={{ width: 8, height: 8, borderRadius: '50%', background: '#3ecf8e' }} /><span style={{ fontSize: 'var(--text-sm)', color: 'var(--fg)' }}>main</span><span style={{ fontSize: 10, color: 'var(--muted)' }}>33 commits</span></div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><span style={{ width: 8, height: 8, borderRadius: '50%', background: '#6366f1' }} /><span style={{ fontSize: 'var(--text-sm)', color: 'var(--fg)' }}>feat/chars-v2</span><span style={{ fontSize: 10, color: 'var(--muted)' }}>6 commits</span></div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><span style={{ width: 8, height: 8, borderRadius: '50%', background: '#f59e0b' }} /><span style={{ fontSize: 'var(--text-sm)', color: 'var(--fg)' }}>exp/alt-style</span><span style={{ fontSize: 10, color: 'var(--muted)' }}>5 commits</span></div>
              </div>
            </div>

            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: 'var(--space-4)' }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>最近活动</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div><span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--accent)' }}>a33</span> <span style={{ fontSize: 12, color: 'var(--fg)' }}>导出 v2.0 最终版</span><div style={{ fontSize: 10, color: 'var(--muted)' }}>Creator Studio · 4 小时前</div></div>
                <div><span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--accent)' }}>a32</span> <span style={{ fontSize: 12, color: 'var(--fg)' }}>最终合成 v2.0</span><div style={{ fontSize: 10, color: 'var(--muted)' }}>AI Agent · 5 小时前</div></div>
                <div><span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--accent)' }}>a31</span> <span style={{ fontSize: 12, color: 'var(--fg)' }}>合并后视频片段重修</span><div style={{ fontSize: 10, color: 'var(--muted)' }}>AI Agent · 6 小时前</div></div>
              </div>
            </div>

            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: 'var(--space-4)' }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>功能</div>
              <ul style={{ fontSize: 12, color: 'var(--fg-2)', paddingLeft: 16, display: 'flex', flexDirection: 'column', gap: 4, margin: 0 }}>
                <li>DAG 分支可视化图谱</li>
                <li>任意两版本文本/参数/帧对比</li>
                <li>一键恢复 + 下游影响分析</li>
                <li>创建分支、合并、标签管理</li>
                <li>按阶段/标签/关键词搜索过滤</li>
                <li>60+ 版本模拟真实生产历史</li>
              </ul>
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
        .tc-content { padding: var(--space-8); max-width: 1100px; }
        .collab-tabs { display: flex; gap: 0; border: 1px solid var(--border); border-radius: var(--radius-pill); overflow: hidden; margin-top: var(--space-6); }
        .collab-tabs button { padding: var(--space-2) var(--space-6); border: none; background: transparent; color: var(--fg-2); font-family: var(--font-display); font-size: var(--text-sm); cursor: pointer; transition: all var(--motion-fast); }
        .collab-tabs button.active { background: var(--fg); color: var(--bg); }
        .approval-list { display: flex; flex-direction: column; gap: var(--space-3); margin-top: var(--space-4); }
        .approval-item { display: flex; gap: var(--space-4); padding: var(--space-4); background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-md); align-items: center; }
        .approval-item .ai-avatar { width: 32px; height: 32px; border-radius: var(--radius-pill); flex-shrink: 0; display: flex; align-items: center; justify-content: center; font-size: var(--text-xs); font-weight: 500; }
        .approval-item .ai-meta { flex: 1; min-width: 0; }
        .chart-placeholder { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-lg); padding: var(--space-6); margin-top: var(--space-4); }
        .chart-placeholder h4 { margin-bottom: var(--space-4); }
        .comment-thread { margin-top: var(--space-4); }
        .comment { display: flex; gap: var(--space-3); padding: var(--space-3); border-bottom: 1px solid var(--border-soft); }
        .comment:last-child { border-bottom: none; }
        .comment .c-avatar { width: 28px; height: 28px; border-radius: var(--radius-pill); flex-shrink: 0; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 500; }
        .toast { padding: 12px 20px; border-radius: var(--radius-sm); background: var(--surface); border: 1px solid var(--border); color: var(--fg); font-size: var(--text-sm); box-shadow: var(--elev-raised); animation: slideUp 0.25s var(--ease-standard); }
        @keyframes slideUp { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        @media (max-width: 639px) { .tc-content { padding: var(--space-4); } .approval-item { flex-direction: column; align-items: flex-start; } }
      `}</style>
    </div>
  );
}
