'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { versionsApi } from '@/lib/api';
import { useToast } from '@/components/global/Toast';
import type { StageLabel, Version, AuthorType } from '@/lib/types';
import { STAGE_NAMES } from '@/lib/types';

// ─── Constants ───

const STAGE_FILTER_KEYS = ['all', 'tagged', 'script_rewrite', 'character_management', 'storyboard', 'image_generation', 'video_generation', 'tts_dubbing'] as const;

const BRANCH_COLORS_POOL = ['#3ecf8e', '#6366f1', '#f59e0b', '#ec4899', '#14b8a6', '#f97316', '#8b5cf6', '#22c55e'];
function getBranchColor(branchName: string, index: number): string {
  // Stable color per branch name via simple hash
  let hash = 0;
  for (let i = 0; i < branchName.length; i++) {
    hash = branchName.charCodeAt(i) + ((hash << 5) - hash);
  }
  return BRANCH_COLORS_POOL[Math.abs(hash) % BRANCH_COLORS_POOL.length];
}

// ─── DAG Graph Sub-component ───

function DAGGraph({
  versions,
  branches,
  selectedId,
  onSelect,
  branchFilter,
}: {
  versions: Version[];
  branches: string[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  branchFilter: string | null;
}) {
  const gapX = 280;
  const nodeH = 32;

  // Build branch map
  const branchMap: Record<string, Version[]> = {};
  for (const br of branches) {
    branchMap[br] = versions.filter((v) => v.branch === br);
  }

  const branchColumns = Object.entries(branchMap).map(([name, vers]) => ({
    name,
    headId: vers.length > 0 ? vers[vers.length - 1].id : '',
    versions: vers,
    positions: vers.map((v, i) => {
      const branchIdx = branches.indexOf(v.branch || name);
      return {
        id: v.id,
        x: 140 + branchIdx * gapX,
        y: 50 + i * 58,
        isCheckpoint: v.is_checkpoint || false,
        isHead: i === vers.length - 1,
        branch: v.branch || name,
        shortId: v.short_id || v.id.slice(0, 7),
      };
    }),
  }));

  const filteredBranches = branchFilter
    ? branchColumns.filter((bl) => bl.name === branchFilter)
    : branchColumns;

  const allNodes = branchColumns.flatMap((bl) => bl.positions);
  const maxY = Math.max(...allNodes.map((n) => n.y), 200) + 60;

  // Edges: within branch (straight vertical), cross-branch (dashed from parent_ids)
  const edges: Array<{ x1: number; y1: number; x2: number; y2: number; dashed: boolean }> = [];
  for (const bi of branchColumns) {
    for (let i = 1; i < bi.positions.length; i++) {
      const prev = bi.positions[i - 1];
      const curr = bi.positions[i];
      edges.push({ x1: prev.x, y1: prev.y + nodeH, x2: curr.x, y2: curr.y, dashed: false });
    }
  }
  for (const v of versions) {
    const parentIds = v.parent_ids || [];
    for (const pid of parentIds) {
      const parentNode = allNodes.find((n) => n.id === pid);
      const childNode = allNodes.find((n) => n.id === v.id);
      if (parentNode && childNode && parentNode.x !== childNode.x) {
        edges.push({ x1: parentNode.x, y1: parentNode.y + nodeH, x2: childNode.x, y2: childNode.y, dashed: true });
      }
    }
  }

  const totalWidth = gapX * filteredBranches.length + 200;

  return (
    <div className="overflow-x-auto">
      <svg width={totalWidth || 400} height={maxY} className="block">
        {edges.map((e, i) => (
          <line key={i} x1={e.x1} y1={e.y1} x2={e.x2} y2={e.y2}
            stroke={e.dashed ? 'var(--border)' : 'var(--border-soft)'}
            strokeWidth={e.dashed ? 1 : 1.5}
            strokeDasharray={e.dashed ? '4 4' : 'none'}
          />
        ))}
        {filteredBranches.map((bl) => (
          <g key={bl.name}>
            <text x={bl.positions[0]?.x || 140} y={28} textAnchor="middle" fill="var(--muted)" fontSize="11" fontFamily="monospace">
              {bl.name}
            </text>
            {bl.positions.map((pos) => {
              const color = getBranchColor(pos.branch, branches.indexOf(pos.branch));
              return (
                <g key={pos.id} onClick={() => onSelect(pos.id)} style={{ cursor: 'pointer' }}>
                  {pos.isCheckpoint ? (
                    <polygon
                      points={`${pos.x},${pos.y + nodeH / 2 - 8} ${pos.x + 10},${pos.y + nodeH / 2} ${pos.x},${pos.y + nodeH / 2 + 8} ${pos.x - 10},${pos.y + nodeH / 2}`}
                      fill={selectedId === pos.id ? color : 'var(--bg)'}
                      stroke={color}
                      strokeWidth={selectedId === pos.id ? 2.5 : 1.5}
                    />
                  ) : (
                    <circle
                      cx={pos.x} cy={pos.y + nodeH / 2} r={7}
                      fill={selectedId === pos.id ? color : 'var(--bg)'}
                      stroke={color}
                      strokeWidth={selectedId === pos.id ? 2.5 : 1.5}
                    />
                  )}
                  {pos.isHead && (
                    <rect x={pos.x - 14} y={pos.y} width={28} height={14} rx={7} fill={color} />
                  )}
                  {pos.isHead && (
                    <text x={pos.x} y={pos.y + 10.5} textAnchor="middle" fill="var(--bg)" fontSize="9" fontWeight={500}>HEAD</text>
                  )}
                  <text x={pos.x + 16} y={pos.y + nodeH / 2 + 4} fill="var(--muted)" fontSize="10" fontFamily="monospace">
                    {pos.shortId.slice(0, 5)}
                  </text>
                </g>
              );
            })}
          </g>
        ))}
      </svg>
    </div>
  );
}

// ─── Helpers ───

function fmtDate(s: string): string {
  if (!s) return '';
  const d = new Date(s);
  return d.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

// ─── Main Page ───

export default function VersionControlPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;
  const { toast } = useToast();

  // Data state
  const [versions, setVersions] = useState<Version[]>([]);
  const [branches, setBranches] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // UI state
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState<string>('all');
  const [branchFilter, setBranchFilter] = useState<string | null>(null);
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [showBranchModal, setShowBranchModal] = useState(false);
  const [showTagModal, setShowTagModal] = useState(false);
  const [showRestoreConfirm, setShowRestoreConfirm] = useState(false);
  const [showDiff, setShowDiff] = useState(false);
  const [diffData, setDiffData] = useState<{ from: Version; to: Version } | null>(null);
  const [showMergeModal, setShowMergeModal] = useState(false);
  const [merging, setMerging] = useState(false);

  // Branch modal form
  const [newBranchName, setNewBranchName] = useState('');
  const [newBranchDesc, setNewBranchDesc] = useState('');
  const [newBranchBase, setNewBranchBase] = useState('');

  // Tag modal
  const [newTagInput, setNewTagInput] = useState('');

  // Load versions
  const loadVersions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await versionsApi.list(projectId, {});
      setVersions(data.versions || []);
      setBranches(data.branches || ['main']);
    } catch (err) {
      setError((err as Error).message || 'Failed to load versions');
      setVersions([]);
      setBranches(['main']);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    loadVersions();
  }, [loadVersions]);

  // Filter versions
  const filtered = versions.filter((v) => {
    if (stageFilter === 'all') return true;
    if (stageFilter === 'tagged') return (v.tags || []).length > 0;
    return v.pipeline_stage === stageFilter;
  }).filter((v) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      (v.short_id || '').toLowerCase().includes(q) ||
      (v.message || '').toLowerCase().includes(q) ||
      (v.author_type || '').toLowerCase().includes(q) ||
      (v.pipeline_stage || '').toLowerCase().includes(q) ||
      (v.tags || []).some((t: string) => t.toLowerCase().includes(q))
    );
  }).filter((v) => {
    if (!branchFilter) return true;
    return v.branch === branchFilter;
  });

  const selected = selectedId ? versions.find((v) => v.id === selectedId) : null;

  const handleCompareSelect = (id: string) => {
    setCompareIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 2) return [prev[1], id];
      return [...prev, id];
    });
  };

  // Load diff data
  const handleShowDiff = useCallback(async () => {
    if (compareIds.length !== 2) return;
    const from = versions.find((v) => v.id === compareIds[0]);
    const to = versions.find((v) => v.id === compareIds[1]);
    if (!from || !to) return;
    try {
      const data = await versionsApi.diff(projectId, from.short_id || from.id, to.short_id || to.id);
      setDiffData({ from: from, to: to });
    } catch {
      setDiffData({ from, to });
    }
    setShowDiff(true);
  }, [compareIds, versions, projectId]);

  // Handle restore
  const handleRestore = async () => {
    if (!selected) return;
    try {
      const result = await versionsApi.restore(projectId, selected.short_id || selected.id);
      setShowRestoreConfirm(false);
      toast(`已恢复到 ${result.restored_to}`);
      loadVersions();
    } catch (err) {
      toast(`恢复失败: ${(err as Error).message}`);
    }
  };

  // Handle create branch
  const handleCreateBranch = async () => {
    if (!newBranchName.trim()) return;
    try {
      await versionsApi.createBranch(projectId, {
        name: newBranchName.trim(),
        description: newBranchDesc,
        base_version_id: newBranchBase || undefined,
      });
      setShowBranchModal(false);
      setNewBranchName('');
      setNewBranchDesc('');
      toast(`分支「${newBranchName}」已创建`);
      loadVersions();
    } catch (err) {
      toast(`创建失败: ${(err as Error).message}`);
    }
  };

  // Handle add tag
  const handleAddTag = async () => {
    if (!selected || !newTagInput.trim()) return;
    try {
      const currentTags = selected.tags || [];
      await versionsApi.tags(projectId, selected.short_id || selected.id, {
        tags: [...currentTags, newTagInput.trim()],
      });
      setNewTagInput('');
      toast(`已添加标签「${newTagInput.trim()}」`);
      loadVersions();
    } catch (err) {
      toast(`添加失败: ${(err as Error).message}`);
    }
  };

  // Handle merge branch to main
  const handleMerge = async () => {
    if (!branchFilter || branchFilter === 'main') return;
    setMerging(true);
    try {
      const result = await versionsApi.merge(branchFilter, 'main');
      setShowMergeModal(false);
      if (result.conflicts && result.conflicts.length > 0) {
        toast(`合并完成但有 ${result.conflicts.length} 个冲突需手动解决`);
      } else {
        toast(`分支「${branchFilter}」已成功合并到 main`);
      }
      loadVersions();
    } catch (err) {
      toast(`合并失败: ${(err as Error).message}`);
    } finally {
      setMerging(false);
    }
  };

  // Downstream affected stages (simplified heuristic)
  const stageOrder = ['source_content', 'script_rewrite', 'character_management', 'scene_management', 'storyboard', 'image_generation', 'video_generation', 'tts_dubbing', 'shot_composition', 'episode_merge', 'export'];
  const downstreamAffected = selected ? stageOrder.slice(stageOrder.indexOf(selected.pipeline_stage || 'source_content') + 1) : [];

  if (loading) {
    return (
      <div className="flex flex-col h-full bg-bg">
        <div className="flex items-center gap-3 px-6 py-3 border-b border-border-soft">
          <div className="h-4 w-20 bg-surface rounded animate-pulse" />
          <div className="h-6 w-32 bg-surface rounded animate-pulse" />
        </div>
        <div className="flex-1 flex items-center justify-center">
          <p className="text-sm text-muted">加载中...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col h-full bg-bg">
        <div className="flex items-center gap-3 px-6 py-3 border-b border-border-soft">
          <button onClick={() => router.push(`/short-series/projects/${projectId}`)} className="text-sm text-muted hover:text-fg-2 flex items-center gap-1">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
            返回
          </button>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center gap-3">
          <p className="text-sm text-danger">加载失败: {error}</p>
          <button className="btn btn-brand btn-sm" onClick={loadVersions}>重试</button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-bg">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-border-soft">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push(`/short-series/projects/${projectId}`)}
            className="text-sm text-muted hover:text-fg-2 flex items-center gap-1"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            返回
          </button>
          <h2 className="text-lg font-normal text-fg">版本控制</h2>
          <span className="text-xs text-muted">{versions.length} 个版本 · {branches.length} 个分支</span>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn btn-ghost btn-sm text-xs" onClick={() => setShowBranchModal(true)}>
            新建分支
          </button>
          {branchFilter && branchFilter !== 'main' && (
            <button className="btn btn-brand btn-sm text-xs" onClick={() => setShowMergeModal(true)}>
              合并到 main
            </button>
          )}
          {compareIds.length === 2 && (
            <button className="btn btn-brand btn-sm text-xs" onClick={handleShowDiff}>
              查看差异
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Main content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* DAG Graph area */}
          <div className="h-[300px] border-b border-border-soft overflow-auto bg-surface p-4">
            <h3 className="text-sm font-medium text-fg mb-4">提交图谱</h3>
            {versions.length > 0 ? (
              <DAGGraph versions={versions} branches={branches} selectedId={selectedId} onSelect={setSelectedId} branchFilter={branchFilter} />
            ) : (
              <p className="text-sm text-muted text-center py-12">暂无版本记录。完成首个 Pipeline 阶段后将自动创建版本。</p>
            )}
          </div>

          {/* Filters */}
          <div className="flex items-center gap-3 px-6 py-3 border-b border-border-soft bg-bg">
            <input
              type="text"
              placeholder="搜索提交ID/消息/作者/阶段/标签..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="text-xs bg-bg border border-border rounded-sm px-3 py-1.5 text-fg-2 outline-none focus:border-accent w-[320px] placeholder:text-meta"
            />
            <div className="flex gap-1.5 overflow-x-auto">
              {STAGE_FILTER_KEYS.map((key) => (
                <button
                  key={key}
                  onClick={() => setStageFilter(key)}
                  className={`badge cursor-pointer whitespace-nowrap text-[10px] ${stageFilter === key ? 'badge-accent' : 'badge-muted'}`}
                >
                  {key === 'all' ? '全部' : key === 'tagged' ? '已标记' : STAGE_NAMES[key as StageLabel]}
                </button>
              ))}
            </div>
            <div className="flex gap-1.5 ml-auto">
              <button
                onClick={() => setBranchFilter(null)}
                className={`badge cursor-pointer text-[10px] ${!branchFilter ? 'badge-accent' : 'badge-muted'}`}
              >
                全部分支
              </button>
              {branches.map((br, i) => (
                <button
                  key={br}
                  onClick={() => setBranchFilter(br)}
                  className={`badge cursor-pointer text-[10px] ${branchFilter === br ? 'badge-accent' : 'badge-muted'}`}
                >
                  <span className="w-1.5 h-1.5 rounded-pill mr-1 inline-block" style={{ backgroundColor: getBranchColor(br, i) }} />
                  {br}
                </button>
              ))}
            </div>
          </div>

          {/* Version list */}
          <div className="flex-1 overflow-y-auto px-6 py-4">
            {filtered.length === 0 ? (
              <p className="text-sm text-muted text-center py-12">无匹配的版本记录</p>
            ) : (
              <div className="space-y-2">
                {filtered.map((v) => {
                  const branchIdx = branches.indexOf(v.branch || 'main');
                  const branchColor = getBranchColor(v.branch || 'main', branchIdx);
                  const isHead = versions.filter((x) => x.branch === v.branch).slice(-1)[0]?.id === v.id;
                  return (
                    <div
                      key={v.id}
                      className={`bg-surface border rounded-sm p-4 transition-all cursor-pointer
                        ${selectedId === v.id ? 'border-accent' : 'border-border hover:border-border'}
                      `}
                      onClick={() => setSelectedId(v.id)}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          onClick={(e) => { e.stopPropagation(); handleCompareSelect(v.id); }}
                          className={`w-4 h-4 rounded-sm border flex items-center justify-center flex-shrink-0 cursor-pointer
                            ${compareIds.includes(v.id) ? 'bg-accent border-accent' : 'border-border-soft hover:border-border'}
                          `}
                        >
                          {compareIds.includes(v.id) && (
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="var(--bg)" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                          )}
                        </div>
                        <div className="w-2.5 h-2.5 rounded-pill flex-shrink-0" style={{ backgroundColor: branchColor }} />
                        <span className="font-mono text-xs text-accent font-medium w-[60px]">{v.short_id || v.id.slice(0, 7)}</span>
                        <span className="text-sm text-fg flex-1 truncate">{v.message || '—'}</span>
                        {v.is_checkpoint && (
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="var(--warn)" stroke="var(--warn)" strokeWidth="1" className="flex-shrink-0"><polygon points="12 2 15 9 22 9 16 14 18 21 12 17 6 21 8 14 2 9 9 9"/></svg>
                        )}
                        {isHead && (
                          <span className="badge badge-accent text-[9px]">HEAD</span>
                        )}
                        <span className="badge badge-muted text-[10px]">{STAGE_NAMES[v.pipeline_stage as StageLabel] || v.pipeline_stage}</span>
                        {(v.tags || []).map((t: string) => (
                          <span key={t} className="text-[10px] bg-border-soft text-fg-2 rounded-sm px-1.5 py-0.5">{t}</span>
                        ))}
                        <span className="text-xs text-muted flex items-center gap-1">
                          {v.author_type === 'ai' ? (
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="3"/><line x1="8" y1="8" x2="16" y2="8"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="8" y1="16" x2="12" y2="16"/></svg>
                          ) : (
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                          )}
                          {v.author_type === 'ai' ? 'AI' : 'Human'}
                        </span>
                        <span className="text-xs text-muted w-[110px] text-right">{fmtDate(v.created_at || '')}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right: Detail panel */}
        <div className="w-[400px] flex-shrink-0 border-l border-border-soft overflow-y-auto bg-surface">
          {selected ? (() => {
            const branchIdx = branches.indexOf(selected.branch || 'main');
            const branchColor = getBranchColor(selected.branch || 'main', branchIdx);
            const changes = selected.changes as Record<string, number> || {};
            const metadata = selected.metadata as Record<string, unknown> || {};
            return (
              <div className="p-5 space-y-5">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-3 h-3 rounded-pill" style={{ backgroundColor: branchColor }} />
                    <span className="font-mono text-sm text-accent font-medium">{selected.short_id || selected.id.slice(0, 7)}</span>
                    <span className="badge badge-muted text-[10px]">{selected.branch || 'main'}</span>
                  </div>
                  <p className="text-lg font-normal text-fg">{selected.message || '—'}</p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-muted">
                    <span>{selected.author_type === 'ai' ? 'AI Agent' : 'Human'}</span>
                    <span>{fmtDate(selected.created_at || '')}</span>
                    <span className="badge badge-muted text-[10px]">{STAGE_NAMES[selected.pipeline_stage as StageLabel] || selected.pipeline_stage}</span>
                  </div>
                </div>

                <div>
                  <p className="text-xs text-meta uppercase mb-2">变更摘要</p>
                  <div className="flex gap-4 text-sm">
                    <span className="text-fg-2">文件 <span className="text-fg font-medium">{changes.files || 0}</span></span>
                    <span className="text-success">+{changes.additions || 0}</span>
                    <span className="text-danger">-{changes.deletions || 0}</span>
                  </div>
                </div>

                <div>
                  <p className="text-xs text-meta uppercase mb-2">元数据</p>
                  <div className="grid grid-cols-2 gap-2">
                    {(() => { const v = metadata.model; if (v) return (
                      <div className="bg-bg border border-border rounded-sm p-2">
                        <p className="text-[10px] text-meta">模型</p>
                        <p className="text-sm text-fg-2">{String(v)}</p>
                      </div>
                    ); return null; })()}
                    {(() => { const v = metadata.supplier; if (v) return (
                      <div className="bg-bg border border-border rounded-sm p-2">
                        <p className="text-[10px] text-meta">供应商</p>
                        <p className="text-sm text-fg-2">{String(v)}</p>
                      </div>
                    ); return null; })()}
                    {metadata.cost !== undefined && (
                      <div className="bg-bg border border-border rounded-sm p-2">
                        <p className="text-[10px] text-meta">费用</p>
                        <p className="text-sm text-fg-2">¥{Number(metadata.cost).toFixed(2)}</p>
                      </div>
                    )}
                    {metadata.qualityScore !== undefined && (
                      <div className="bg-bg border border-border rounded-sm p-2">
                        <p className="text-[10px] text-meta">质量评分</p>
                        <p className={`text-sm ${Number(metadata.qualityScore) >= 0.9 ? 'text-success' : Number(metadata.qualityScore) >= 0.8 ? 'text-warn' : 'text-danger'}`}>
                          {(Number(metadata.qualityScore) * 100).toFixed(0)}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <p className="text-xs text-meta uppercase mb-2">标签</p>
                  <div className="flex flex-wrap gap-1.5">
                    {(selected.tags || []).length > 0 ? (selected.tags || []).map((t: string) => (
                      <span key={t} className="badge badge-muted text-[10px]">{t}</span>
                    )) : <span className="text-xs text-muted">无</span>}
                    <button onClick={() => setShowTagModal(true)} className="badge badge-muted text-[10px] cursor-pointer hover:border-accent border border-transparent">
                      + 管理标签
                    </button>
                  </div>
                </div>

                {downstreamAffected.length > 0 && (
                  <div>
                    <p className="text-xs text-meta uppercase mb-2">下游影响分析</p>
                    <div className="bg-[color-mix(in_oklab,var(--warn)_8%,transparent)] border border-[color-mix(in_oklab,var(--warn)_20%,transparent)] rounded-sm p-3">
                      <p className="text-xs text-warn mb-2">恢复此版本将影响以下阶段:</p>
                      <div className="flex flex-wrap gap-1">
                        {downstreamAffected.map((s) => (
                          <span key={s} className="badge badge-warn text-[10px]">{STAGE_NAMES[s as StageLabel] || s}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex gap-2 pt-2 border-t border-border-soft">
                  <button className="btn btn-brand btn-sm flex-1" onClick={() => setShowRestoreConfirm(true)}>
                    恢复到此版本
                  </button>
                  <button className="btn btn-ghost btn-sm" onClick={() => setCompareIds([selected.id])}>
                    选择对比
                  </button>
                </div>

                {compareIds.length === 2 && (
                  <div className="bg-bg border border-accent rounded-sm p-3">
                    <p className="text-xs text-fg-2 mb-2">
                      已选择 2 个版本进行对比
                    </p>
                    <button className="btn btn-brand btn-sm w-full" onClick={handleShowDiff}>
                      查看差异
                    </button>
                  </div>
                )}
              </div>
            );
          })() : (
            <div className="flex items-center justify-center h-full text-muted text-sm p-5">
              点击左侧版本或图谱节点查看详情
            </div>
          )}
        </div>
      </div>

      {/* ── Restore Confirmation Modal ── */}
      {showRestoreConfirm && selected && (
        <div className="modal-overlay" onClick={() => setShowRestoreConfirm(false)}>
          <div className="modal-box !max-w-[440px]" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-normal text-fg mb-2">恢复到 {selected.short_id || selected.id.slice(0, 7)}?</h3>
            <p className="text-sm text-muted mb-4">
              此操作将创建一个新版本，恢复到「{selected.message || '—'}」的状态。以下阶段可能需要重新生成:
            </p>
            {downstreamAffected.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-4">
                {downstreamAffected.map((s) => (
                  <span key={s} className="badge badge-warn text-[10px]">{STAGE_NAMES[s as StageLabel] || s}</span>
                ))}
              </div>
            )}
            <div className="flex gap-2 justify-end">
              <button className="btn btn-ghost btn-sm" onClick={() => setShowRestoreConfirm(false)}>取消</button>
              <button className="btn btn-brand btn-sm" onClick={handleRestore}>确认恢复</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Merge Confirmation Modal ── */}
      {showMergeModal && branchFilter && (
        <div className="modal-overlay" onClick={() => setShowMergeModal(false)}>
          <div className="modal-box !max-w-[440px]" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-normal text-fg mb-2">合并分支到 main</h3>
            <p className="text-sm text-muted mb-4">
              将分支「<span className="text-fg font-medium">{branchFilter}</span>」合并到「<span className="text-fg font-medium">main</span>」分支。
              合并后将创建一个新的合并版本。
            </p>
            <div className="bg-[color-mix(in_oklab,var(--warn)_8%,transparent)] border border-[color-mix(in_oklab,var(--warn)_20%,transparent)] rounded-sm p-3 mb-4">
              <p className="text-xs text-warn">合并后，main 分支将包含 {branchFilter} 的所有变更。如有冲突将提示手动处理。</p>
            </div>
            <div className="flex gap-2 justify-end">
              <button className="btn btn-ghost btn-sm" onClick={() => setShowMergeModal(false)} disabled={merging}>取消</button>
              <button className="btn btn-brand btn-sm" onClick={handleMerge} disabled={merging}>
                {merging ? '合并中...' : '确认合并'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Branch Modal ── */}
      {showBranchModal && (
        <div className="modal-overlay" onClick={() => setShowBranchModal(false)}>
          <div className="modal-box !max-w-[440px]" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-normal text-fg mb-4">创建新分支</h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-meta uppercase block mb-1">分支名称</label>
                <input
                  type="text"
                  placeholder="feat/new-feature"
                  value={newBranchName}
                  onChange={(e) => setNewBranchName(e.target.value)}
                  className="w-full text-sm bg-bg border border-border rounded-sm px-4 py-2.5 text-fg-2 outline-none focus:border-accent placeholder:text-meta"
                />
              </div>
              <div>
                <label className="text-xs text-meta uppercase block mb-1">描述</label>
                <input
                  type="text"
                  placeholder="分支描述..."
                  value={newBranchDesc}
                  onChange={(e) => setNewBranchDesc(e.target.value)}
                  className="w-full text-sm bg-bg border border-border rounded-sm px-4 py-2.5 text-fg-2 outline-none focus:border-accent placeholder:text-meta"
                />
              </div>
              <div>
                <label className="text-xs text-meta uppercase block mb-1">基于版本</label>
                <select
                  value={newBranchBase}
                  onChange={(e) => setNewBranchBase(e.target.value)}
                  className="w-full text-sm bg-bg border border-border rounded-sm px-4 py-2.5 text-fg-2 outline-none focus:border-accent"
                >
                  <option value="">最新版本 (HEAD)</option>
                  {versions.map((v) => (
                    <option key={v.id} value={v.id}>{v.short_id} — {(v.message || '').slice(0, 40)}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex gap-2 justify-end mt-6">
              <button className="btn btn-ghost btn-sm" onClick={() => setShowBranchModal(false)}>取消</button>
              <button className="btn btn-brand btn-sm" onClick={handleCreateBranch}>创建分支</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Tag Modal ── */}
      {showTagModal && selected && (
        <div className="modal-overlay" onClick={() => setShowTagModal(false)}>
          <div className="modal-box !max-w-[400px]" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-normal text-fg mb-4">管理标签 · {selected.short_id || selected.id.slice(0, 7)}</h3>
            <div className="space-y-3 mb-4">
              {(selected.tags || []).length > 0 ? (selected.tags || []).map((t: string) => (
                <div key={t} className="flex items-center justify-between bg-bg border border-border rounded-sm px-3 py-2">
                  <span className="text-sm text-fg-2">{t}</span>
                  <button className="text-xs text-muted hover:text-danger"
                    onClick={async () => {
                      const newTags = (selected.tags || []).filter((x: string) => x !== t);
                      try {
                        await versionsApi.tags(projectId, selected.short_id || selected.id, { tags: newTags });
                        toast(`已移除标签「${t}」`);
                        loadVersions();
                      } catch { /* ignore */ }
                    }}
                  >移除</button>
                </div>
              )) : <p className="text-sm text-muted">暂无标签</p>}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="新标签名称..."
                value={newTagInput}
                onChange={(e) => setNewTagInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleAddTag(); }}
                className="flex-1 text-sm bg-bg border border-border rounded-sm px-4 py-2.5 text-fg-2 outline-none focus:border-accent placeholder:text-meta"
              />
              <button className="btn btn-brand btn-sm" onClick={handleAddTag}>添加</button>
            </div>
            <div className="flex justify-end mt-4">
              <button className="btn btn-ghost btn-sm" onClick={() => setShowTagModal(false)}>关闭</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Diff Overlay ── */}
      {showDiff && diffData && (
        <div className="modal-overlay" onClick={() => setShowDiff(false)}>
          <div className="fixed inset-4 bg-bg border border-border rounded-sm flex flex-col shadow-raised z-50" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-border-soft">
              <div className="flex items-center gap-4">
                <h3 className="text-lg font-normal text-fg">差异对比</h3>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-danger font-mono">{diffData.from.short_id || diffData.from.id.slice(0, 7)}</span>
                  <span className="text-muted">← →</span>
                  <span className="text-success font-mono">{diffData.to.short_id || diffData.to.id.slice(0, 7)}</span>
                </div>
              </div>
              <button onClick={() => setShowDiff(false)} className="btn btn-ghost btn-sm">✕</button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <div className="flex gap-6 mb-6">
                <div className="bg-bg border border-border rounded-sm px-4 py-3">
                  <p className="text-[10px] text-meta uppercase">文件变更</p>
                  <p className="text-lg font-medium text-fg">{0}</p>
                </div>
                <div className="bg-bg border border-border rounded-sm px-4 py-3">
                  <p className="text-[10px] text-meta uppercase">新增行</p>
                  <p className="text-lg font-medium text-success">+{0}</p>
                </div>
                <div className="bg-bg border border-border rounded-sm px-4 py-3">
                  <p className="text-[10px] text-meta uppercase">删除行</p>
                  <p className="text-lg font-medium text-danger">-{0}</p>
                </div>
              </div>
              <h4 className="text-sm font-medium text-fg mb-3">参数对比</h4>
              <table>
                <thead>
                  <tr>
                    <th>参数</th><th>旧值</th><th>新值</th><th>变化</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { label: '阶段', from: STAGE_NAMES[diffData.from.pipeline_stage as StageLabel] || diffData.from.pipeline_stage, to: STAGE_NAMES[diffData.to.pipeline_stage as StageLabel] || diffData.to.pipeline_stage },
                    { label: '分支', from: diffData.from.branch || 'main', to: diffData.to.branch || 'main' },
                    { label: '消息', from: diffData.from.message || '—', to: diffData.to.message || '—' },
                    { label: '检查点', from: diffData.from.is_checkpoint ? '是' : '否', to: diffData.to.is_checkpoint ? '是' : '否' },
                    { label: '标签', from: (diffData.from.tags || []).join(', ') || '—', to: (diffData.to.tags || []).join(', ') || '—' },
                  ].map((row) => {
                    const changed = row.from !== row.to;
                    return (
                      <tr key={row.label} className={changed ? '' : 'opacity-50'}>
                        <td className="text-sm text-fg font-medium">{row.label}</td>
                        <td className={`text-sm ${changed ? 'text-danger line-through' : 'text-muted'}`}>{row.from}</td>
                        <td className={`text-sm ${changed ? 'text-success' : 'text-muted'}`}>{row.to}</td>
                        <td>{changed ? <span className="badge badge-warn text-[10px]">已变更</span> : <span className="text-[10px] text-muted">—</span>}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
