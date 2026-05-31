'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { versionsApi } from '@/lib/api';
import { useToast } from '@/components/global/Toast';
import type { StageLabel, Version } from '@/lib/types';
import { STAGE_NAMES } from '@/lib/types';

// ─── Constants ───

const STAGE_FILTER_KEYS: Array<{ key: string; label: string }> = [
  { key: 'all', label: '全部' },
  { key: 'tagged', label: '已标记' },
  { key: 'script_rewrite', label: 'AI改写' },
  { key: 'character_management', label: '角色管理' },
  { key: 'scene_management', label: '场景管理' },
  { key: 'storyboard', label: '分镜表' },
  { key: 'image_generation', label: '图片生成' },
  { key: 'video_generation', label: '视频生成' },
  { key: 'tts_dubbing', label: 'TTS配音' },
];

const BRANCH_COLORS_POOL = ['#3ecf8e', '#6366f1', '#f59e0b', '#ec4899', '#14b8a6', '#f97316', '#8b5cf6', '#22c55e'];

function getBranchColor(branchName: string): string {
  let hash = 0;
  for (let i = 0; i < branchName.length; i++) {
    hash = branchName.charCodeAt(i) + ((hash << 5) - hash);
  }
  return BRANCH_COLORS_POOL[Math.abs(hash) % BRANCH_COLORS_POOL.length];
}

function fmtDate(s: string): string {
  if (!s) return '';
  const d = new Date(s);
  const now = Date.now();
  const diff = now - d.getTime();
  const H = 3600000;
  const D = 86400000;
  if (diff < H) return Math.floor(diff / 60000) + ' 分钟前';
  if (diff < D) return Math.floor(diff / H) + ' 小时前';
  if (diff < 7 * D) return Math.floor(diff / D) + ' 天前';
  return d.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function fullTime(s: string): string {
  if (!s) return '';
  const d = new Date(s);
  return d.toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
}

// ─── DAG Graph Sub-component ───

function DAGGraph({
  versions,
  branches,
  selectedId,
  onSelect,
}: {
  versions: Version[];
  branches: string[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const colW = 140;
  const rowH = 28;
  const padX = 16;
  const padY = 40;

  // Build positions using topological levels
  const positions = useMemo(() => {
    const posMap: Record<string, { x: number; y: number; branchIdx: number }> = {};
    const branchCols: Record<string, number> = {};
    branches.forEach((b, i) => { branchCols[b] = i; });

    const levels: Record<string, number> = {};
    const allIds = new Set(versions.map((v) => v.id));

    // Topological sort by levels
    let settled = false;
    let pass = 0;
    do {
      settled = true;
      pass++;
      for (const ver of versions) {
        if (levels[ver.id] !== undefined) continue;
        const parentIds = ver.parent_ids || [];
        let maxParentLevel = -1;
        let allResolved = true;
        for (const pid of parentIds) {
          if (!pid || !allIds.has(pid)) continue;
          if (levels[pid] === undefined) {
            allResolved = false;
          } else {
            maxParentLevel = Math.max(maxParentLevel, levels[pid]);
          }
        }
        if (allResolved) {
          levels[ver.id] = maxParentLevel + 1;
          settled = false;
        }
      }
    } while (!settled && pass < 100);

    // Fallback
    let fallback = 0;
    for (const v of versions) {
      if (levels[v.id] === undefined) levels[v.id] = fallback++;
    }

    for (const v of versions) {
      const brIdx = branchCols[v.branch || 'main'] ?? 0;
      posMap[v.id] = {
        x: padX + brIdx * colW + colW / 2,
        y: padY + (levels[v.id] || 0) * rowH,
        branchIdx: brIdx,
      };
    }

    return posMap;
  }, [versions, branches]);

  const maxY = useMemo(() => {
    const vals = Object.values(positions);
    return vals.length > 0 ? Math.max(...vals.map((p) => p.y)) + 60 : 200;
  }, [positions]);

  const w = Math.max(branches.length * colW + padX * 2 + 60, 460);

  const edges = useMemo(() => {
    const out: Array<{ x1: number; y1: number; x2: number; y2: number; dashed: boolean; color: string }> = [];
    for (const v of versions) {
      const child = positions[v.id];
      if (!child) continue;
      const parentIds = v.parent_ids || [];
      for (const pid of parentIds) {
        if (!pid) continue;
        const parent = positions[pid];
        if (!parent) continue;
        const sameBranch = parent.branchIdx === child.branchIdx;
        const color = BRANCH_COLORS_POOL[parent.branchIdx % BRANCH_COLORS_POOL.length];
        out.push({
          x1: parent.x,
          y1: parent.y + 5,
          x2: child.x,
          y2: child.y - 5,
          dashed: !sameBranch,
          color,
        });
      }
    }
    return out;
  }, [versions, positions]);

  function getBranchHead(branchName: string): string | null {
    const branchVersions = versions.filter((v) => v.branch === branchName);
    return branchVersions.length > 0 ? branchVersions[branchVersions.length - 1].id : null;
  }

  return (
    <div className="dag-graph-wrap">
      <svg width={w} height={maxY} viewBox={`0 0 ${w} ${maxY}`} style={{ display: 'block' }}>
        {/* Branch column headers */}
        {branches.map((b, i) => {
          const hx = padX + i * colW + colW / 2;
          const color = getBranchColor(b);
          return (
            <g key={b}>
              <circle cx={hx} cy={14} r={5} fill={color} />
              <text
                x={hx + 10}
                y={18}
                fontSize={11}
                fontFamily={"'Circular','Helvetica Neue',Helvetica,Arial,sans-serif"}
                fill="#fafafa"
                fontWeight={500}
              >
                {b}
              </text>
              {i < branches.length - 1 && (
                <line
                  x1={padX + (i + 1) * colW}
                  y1={0}
                  x2={padX + (i + 1) * colW}
                  y2={maxY}
                  stroke="#242424"
                  strokeWidth={0.5}
                  opacity={0.3}
                />
              )}
            </g>
          );
        })}

        {/* Edges */}
        {edges.map((e, i) => {
          if (e.dashed) {
            const midY = (e.y1 + e.y2) / 2;
            return (
              <path
                key={i}
                d={`M${e.x1},${e.y1} C${e.x1},${midY} ${e.x2},${midY} ${e.x2},${e.y2}`}
                fill="none"
                stroke={e.color}
                strokeWidth={1.2}
                opacity={0.35}
                strokeDasharray="4,3"
              />
            );
          }
          return (
            <line
              key={i}
              x1={e.x1}
              y1={e.y1}
              x2={e.x2}
              y2={e.y2}
              stroke={e.color}
              strokeWidth={2}
              opacity={0.55}
            />
          );
        })}

        {/* Nodes */}
        {versions.map((ver) => {
          const pos = positions[ver.id];
          if (!pos) return null;
          const brColor = getBranchColor(ver.branch || 'main');
          const isSelected = ver.id === selectedId;
          const isMerge = (ver.parent_ids || []).filter(Boolean).length > 1;
          const isHead = ver.id === getBranchHead(ver.branch || 'main');
          const isCheckpoint = ver.is_checkpoint || false;
          const r = isCheckpoint ? 4 : 5.5;
          const fill = isSelected ? '#fafafa' : brColor;
          const shortId = (ver.short_id || ver.id.slice(0, 7)).slice(0, 5);

          return (
            <g key={ver.id} style={{ cursor: 'pointer' }} onClick={() => onSelect(ver.id)}>
              {/* Selection halo */}
              {isSelected && (
                <circle cx={pos.x} cy={pos.y} r={r + 5} fill="none" stroke="#3ecf8e" strokeWidth={2} opacity={0.5} />
              )}
              {/* Merge outer ring */}
              {isMerge && (
                <circle cx={pos.x} cy={pos.y} r={r + 3.5} fill="none" stroke="#fafafa" strokeWidth={1.2} opacity={0.4} />
              )}
              {/* HEAD indicator */}
              {isHead && (
                <circle cx={pos.x} cy={pos.y} r={r + 3} fill="none" stroke={brColor} strokeWidth={2} opacity={0.7} />
              )}
              {/* Node body */}
              {isCheckpoint ? (
                <rect
                  x={pos.x - r}
                  y={pos.y - r}
                  width={r * 2}
                  height={r * 2}
                  rx={r * 0.5}
                  fill={fill}
                  stroke={isSelected ? '#171717' : brColor}
                  strokeWidth={1.5}
                  opacity={0.9}
                />
              ) : (
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r={r}
                  fill={fill}
                  stroke={isSelected ? '#171717' : brColor}
                  strokeWidth={1.5}
                  opacity={0.9}
                />
              )}
              {/* Commit ID label */}
              <text
                x={pos.x + r + 7}
                y={pos.y + 4}
                fontSize={9}
                fontFamily={"'Source Code Pro',Menlo,Monaco,Consolas,monospace"}
                fill={isSelected ? '#171717' : '#fafafa'}
                fontWeight={600}
              >
                {shortId}
              </text>
              {/* HEAD badge */}
              {isHead && (
                <>
                  <rect
                    x={pos.x + r + 7 + shortId.length * 5.8 + 6}
                    y={pos.y - 6}
                    width={32}
                    height={14}
                    rx={3}
                    fill={brColor}
                    opacity={0.9}
                  />
                  <text
                    x={pos.x + r + 7 + shortId.length * 5.8 + 6 + 16}
                    y={pos.y + 4}
                    fontSize={9}
                    fontFamily={"'Source Code Pro',Menlo,Monaco,Consolas,monospace"}
                    fill="#0f0f0f"
                    fontWeight={700}
                    textAnchor="middle"
                  >
                    HEAD
                  </text>
                </>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// ─── Downstream impact ───

const STAGE_ORDER = ['source_content', 'script_rewrite', 'character_management', 'scene_management', 'storyboard', 'image_generation', 'video_generation', 'tts_dubbing', 'shot_composition', 'episode_merge', 'export'];

function getDownstreamStages(stageKey: string | undefined) {
  const stages = [
    { key: 'script_rewrite', label: '剧本改写 — 需重新生成', affected: false },
    { key: 'character_management', label: '角色拆解 — 需重新生成', affected: false },
    { key: 'scene_management', label: '场景拆解 — 需重新生成', affected: false },
    { key: 'storyboard', label: '分镜拆解 — 需重新生成', affected: false },
    { key: 'image_generation', label: '图片生成 — 需重新生成', affected: false },
    { key: 'tts_dubbing', label: 'TTS 配音 — 需重新生成', affected: false },
    { key: 'video_generation', label: '视频生成 — 需重新生成', affected: false },
    { key: 'shot_composition', label: '镜头合成 — 需重新生成', affected: false },
    { key: 'episode_merge', label: '剧集合并 — 需重新生成', affected: false },
    { key: 'export', label: '最终导出 — 需重新执行', affected: false },
  ];
  const startIdx = STAGE_ORDER.indexOf(stageKey || 'source_content');
  if (startIdx < 0) return stages;
  for (let i = startIdx; i < stages.length; i++) {
    stages[i].affected = true;
  }
  return stages;
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
  const [diffMode, setDiffMode] = useState<'text' | 'params' | 'frames'>('text');
  const [diffData, setDiffData] = useState<{ from: Version; to: Version } | null>(null);
  const [showMergeModal, setShowMergeModal] = useState(false);
  const [merging, setMerging] = useState(false);

  // Branch modal form
  const [newBranchName, setNewBranchName] = useState('');
  const [newBranchDesc, setNewBranchDesc] = useState('');
  const [newBranchBase, setNewBranchBase] = useState('');

  // Tag modal
  const [newTagInput, setNewTagInput] = useState('');

  // Active branch (derived from branchFilter or default to first branch)
  const activeBranch = branchFilter || branches[0] || 'main';

  // Load versions
  const loadVersions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await versionsApi.list(projectId, {});
      const vers = data.versions || [];
      const brs = data.branches || ['main'];
      setVersions(vers);
      setBranches(brs);
      // Auto-select HEAD of active branch
      const branchVers = vers.filter((v: Version) => v.branch === (branchFilter || brs[0] || 'main'));
      if (branchVers.length > 0 && !selectedId) {
        setSelectedId(branchVers[branchVers.length - 1].id);
      }
    } catch (err) {
      setError((err as Error).message || 'Failed to load versions');
      setVersions([]);
      setBranches(['main']);
    } finally {
      setLoading(false);
    }
  }, [projectId, branchFilter]);

  useEffect(() => {
    loadVersions();
  }, [loadVersions]);

  // Filter versions
  const filtered = useMemo(() => {
    return versions.filter((v) => {
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
  }, [versions, stageFilter, search, branchFilter]);

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
      await versionsApi.diff(projectId, from.short_id || from.id, to.short_id || to.id);
      setDiffData({ from, to });
    } catch {
      setDiffData({ from, to });
    }
    setShowDiff(true);
    setDiffMode('text');
  }, [compareIds, versions, projectId]);

  // Compare with selected
  const compareWithSelected = (id: string) => {
    if (!selectedId) {
      toast('请先选择一个版本');
      return;
    }
    if (selectedId === id) {
      toast('请选择两个不同的版本进行对比');
      return;
    }
    const from = versions.find((v) => v.id === selectedId);
    const to = versions.find((v) => v.id === id);
    if (!from || !to) return;
    setDiffData({ from, to });
    setShowDiff(true);
    setDiffMode('text');
  };

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

  // Handle remove tag
  const handleRemoveTag = async (tag: string) => {
    if (!selected) return;
    try {
      const newTags = (selected.tags || []).filter((t: string) => t !== tag);
      await versionsApi.tags(projectId, selected.short_id || selected.id, { tags: newTags });
      toast(`已移除标签「${tag}」`);
      loadVersions();
    } catch { /* ignore */ }
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

  // Diff rendering
  const renderDiffContent = () => {
    if (!diffData) return null;
    const { from, to } = diffData;

    if (diffMode === 'params') {
      const rows = [
        { field: '阶段', a: STAGE_NAMES[from.pipeline_stage as StageLabel] || from.pipeline_stage, b: STAGE_NAMES[to.pipeline_stage as StageLabel] || to.pipeline_stage },
        { field: '分支', a: from.branch || 'main', b: to.branch || 'main' },
        { field: '消息', a: from.message || '—', b: to.message || '—' },
        { field: '检查点', a: from.is_checkpoint ? '是' : '否', b: to.is_checkpoint ? '是' : '否' },
        { field: '标签', a: (from.tags || []).join(', ') || '—', b: (to.tags || []).join(', ') || '—' },
      ];
      return (
        <div className="diff-pane" style={{ flex: 1, borderRight: 'none' }}>
          <div className="diff-pane-label"><span>参数对比</span></div>
          <table className="diff-param-table">
            <thead>
              <tr><th>参数</th><th>{from.short_id || from.id.slice(0, 7)}</th><th>{to.short_id || to.id.slice(0, 7)}</th></tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const changed = r.a !== r.b;
                return (
                  <tr key={r.field}>
                    <td>{r.field}</td>
                    <td className={changed ? 'old' : 'same'}>{r.a}</td>
                    <td className={changed ? 'new' : 'same'}>{r.b}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      );
    }

    if (diffMode === 'frames') {
      const shots = ['S01 · 特写 · 戒指', 'S03 · 中景 · 悬崖', 'S07 · 近景 · 药老现身', 'S12 · 全景 · 离别'];
      return (
        <>
          <div className="diff-pane">
            <div className="diff-pane-label"><span>{from.short_id || from.id.slice(0, 7)} · {from.branch || 'main'}</span><span style={{ color: 'var(--fg-2)' }}>{from.author_type === 'ai' ? 'AI' : 'Human'} · {fmtDate(from.created_at || '')}</span></div>
            {shots.map((s) => (
              <div key={s} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: 12, display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                <div style={{ width: 60, height: 34, background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, color: 'var(--fg-2)' }}>预览</div>
                <span style={{ fontSize: 12 }}>{s}</span>
              </div>
            ))}
          </div>
          <div className="diff-pane">
            <div className="diff-pane-label"><span>{to.short_id || to.id.slice(0, 7)} · {to.branch || 'main'}</span><span style={{ color: 'var(--fg-2)' }}>{to.author_type === 'ai' ? 'AI' : 'Human'} · {fmtDate(to.created_at || '')}</span></div>
            {shots.map((s) => (
              <div key={s} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: 12, display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                <div style={{ width: 60, height: 34, background: 'var(--bg)', border: '1px solid var(--accent)', borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, color: 'var(--accent)' }}>预览</div>
                <span style={{ fontSize: 12 }}>{s}</span>
              </div>
            ))}
          </div>
        </>
      );
    }

    // Text diff (default)
    const lines = [
      { t: 'ctx', text: '@@ 斗破苍穹 · 第2集「药老现身」· 剧本对话 @@' },
      { t: 'ctx', text: ' ' },
      { t: 'ctx', text: '  第1段 [萧炎·内心独白]' },
      { t: 'ctx', text: '  这戒指...到底是什么来头？三年了，我的斗之气旋一日不如一日...' },
      { t: 'ctx', text: ' ' },
      { t: 'ctx', text: '  第3段 [场景·萧家后山]' },
      { t: 'ctx', text: '  萧炎盘坐在悬崖边，落日余晖洒在他略显稚嫩却坚毅的脸上。' },
      { t: 'ctx', text: ' ' },
      { t: 'ctx', text: '  第7段 [药老·首次现身]' },
      { t: 'rem', text: '- 药老（灵魂体）：「小子，你可知道这戒指里住着谁？」（语气：戏谑）' },
      { t: 'add', text: '+ 药老（灵魂体）：「小娃娃...你可知道，老夫在这戒指里，等了多久？」（语气：苍老、试探、略带感慨）' },
      { t: 'ctx', text: ' ' },
      { t: 'ctx', text: '  第12段 [药老·解释来历]' },
      { t: 'rem', text: '- 药老：「老夫生前乃是八品炼药师，你这小娃娃的资质...勉强算个中上。」' },
      { t: 'add', text: '+ 药老（灵魂体缓缓漂浮至与萧炎视线齐平）：「生前，老夫乃是八品炼药师。你的资质...中上，但也够了。」（动作描述：药老的灵魂体微微波动，像是在回忆遥远的往事）' },
    ];
    const leftHtml = lines.map((l, i) => (
      <div key={i} className={`diff-line ${l.t}`}>{l.text}</div>
    ));

    return (
      <>
        <div className="diff-pane">
          <div className="diff-pane-label">
            <span>{from.short_id || from.id.slice(0, 7)} · {from.branch || 'main'}</span>
            <span style={{ color: 'var(--fg-2)' }}>{from.author_type === 'ai' ? 'AI' : 'Human'} · {fmtDate(from.created_at || '')}</span>
          </div>
          {leftHtml}
        </div>
        <div className="diff-pane">
          <div className="diff-pane-label">
            <span>{to.short_id || to.id.slice(0, 7)} · {to.branch || 'main'}</span>
            <span style={{ color: 'var(--fg-2)' }}>{to.author_type === 'ai' ? 'AI' : 'Human'} · {fmtDate(to.created_at || '')}</span>
          </div>
          {leftHtml}
        </div>
      </>
    );
  };

  if (loading) {
    return (
      <div className="flex flex-col h-full bg-bg">
        <div className="vc-topbar">
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
        <div className="vc-topbar">
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

  const selectedBranchColor = selected ? getBranchColor(selected.branch || 'main') : '#3ecf8e';
  const downstreamAffected = selected ? getDownstreamStages(selected.pipeline_stage) : [];

  return (
    <div className="flex flex-col h-full bg-bg">
      {/* ── Topbar ── */}
      <div className="vc-topbar">
        <div className="vc-topbar-left">
          {/* Branch selector */}
          <div
            className="branch-select"
            onClick={() => { /* Could open branch dropdown */ }}
          >
            <span className="branch-dot" style={{ background: getBranchColor(activeBranch) }} />
            <span>{activeBranch}</span>
            <svg className="branch-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9"/></svg>
          </div>
          {/* Search */}
          <input
            type="text"
            className="vc-search-input"
            placeholder="搜索提交ID/消息/作者/阶段/标签..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="vc-topbar-right">
          {/* Filter chips */}
          <div className="filter-bar">
            {STAGE_FILTER_KEYS.map((f) => (
              <button
                key={f.key}
                className={`filter-chip ${stageFilter === f.key ? 'on' : ''}`}
                onClick={() => setStageFilter(f.key)}
              >
                {f.label}
              </button>
            ))}
          </div>
          {/* Branch filter toggle */}
          <button
            className="btn btn-ghost btn-sm text-xs"
            onClick={() => setBranchFilter(branchFilter ? null : activeBranch)}
            style={{ color: 'var(--fg-2)', whiteSpace: 'nowrap' }}
            title="仅显示当前分支"
          >
            {branchFilter ? `☰ ${activeBranch}` : '☰ 所有分支'}
          </button>
          {/* New branch button */}
          <button className="btn btn-brand btn-sm text-xs" onClick={() => setShowBranchModal(true)} style={{ whiteSpace: 'nowrap' }}>
            + 分支
          </button>
          {/* Compare button */}
          {compareIds.length === 2 && (
            <button className="btn btn-brand btn-sm text-xs" onClick={handleShowDiff}>
              查看差异
            </button>
          )}
        </div>
      </div>

      {/* ── Content ── */}
      <div className="vc-content">
        {/* DAG + Version List */}
        <div className="dag-panel">
          {/* DAG Graph */}
          {versions.length > 0 ? (
            <DAGGraph
              versions={versions}
              branches={branches}
              selectedId={selectedId}
              onSelect={setSelectedId}
            />
          ) : (
            <div className="dag-graph-wrap">
              <p className="text-sm text-muted text-center py-12">暂无版本记录。完成首个 Pipeline 阶段后将自动创建版本。</p>
            </div>
          )}

          {/* Version List */}
          <div className="version-list-wrap">
            <div className="version-list-header">
              <span className="version-count">共 <strong>{filtered.length}</strong> 个版本</span>
              <span style={{ fontSize: 11, color: 'var(--fg-2)' }}>
                {compareIds.length === 2 ? (
                  <span>已选择 2 个版本，<button className="text-accent underline" onClick={handleShowDiff}>点击对比</button></span>
                ) : compareIds.length === 1 ? (
                  <span>选中 1 个版本，再选 1 个进行对比</span>
                ) : (
                  <span>勾选复选框选择 2 个版本进行对比</span>
                )}
              </span>
            </div>

            {filtered.length === 0 ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200, color: 'var(--fg-2)', fontSize: 'var(--text-sm)' }}>
                无匹配的版本记录
              </div>
            ) : (
              filtered.map((v) => {
                const branchColor = getBranchColor(v.branch || 'main');
                const isHead = versions.filter((x) => x.branch === v.branch).slice(-1)[0]?.id === v.id;
                const isMerge = (v.parent_ids || []).filter(Boolean).length > 1;
                const authorInitial = v.author_type === 'ai' ? 'AI' : v.author_id ? v.author_id.slice(0, 2).toUpperCase() : 'HU';
                const avatarBg = v.author_type === 'ai' ? '#6366f1' : 'var(--accent)';
                const tags = v.tags || [];

                return (
                  <div
                    key={v.id}
                    className={`vc-row ${selectedId === v.id ? 'selected' : ''}`}
                    onClick={() => setSelectedId(v.id)}
                  >
                    {/* Checkbox */}
                    <div className="vc-check">
                      <input
                        type="checkbox"
                        checked={compareIds.includes(v.id)}
                        onClick={(e) => e.stopPropagation()}
                        onChange={() => handleCompareSelect(v.id)}
                        title="选择用于对比"
                      />
                    </div>
                    {/* Graph dot */}
                    <div className="vc-graph-col">
                      {isMerge ? (
                        <svg width="14" height="14">
                          <circle cx="7" cy="7" r="5" fill={branchColor} stroke="#fafafa" strokeWidth="1.5" />
                        </svg>
                      ) : (
                        <div className={`vc-dot ${v.is_checkpoint ? 'checkpoint' : ''}`} style={{ background: branchColor }} />
                      )}
                    </div>
                    {/* Main content */}
                    <div className="vc-main">
                      <div className="vc-header">
                        <span className="vc-id">{v.short_id || v.id.slice(0, 7)}</span>
                        <span style={{ fontSize: 10, color: branchColor, fontWeight: 600 }}>{v.branch || 'main'}</span>
                        {v.is_checkpoint && <span className="vc-stage-badge">CHECKPOINT</span>}
                        <span className="vc-stage-badge">{STAGE_NAMES[v.pipeline_stage as StageLabel] || v.pipeline_stage}</span>
                        {isMerge && <span style={{ fontSize: 10, color: 'var(--warn)', fontWeight: 600 }}>MERGE</span>}
                      </div>
                      <div className="vc-message">{v.message || '—'}</div>
                      <div className="vc-meta-row">
                        <span className="vc-author">
                          <span className="vc-author-avatar" style={{ background: avatarBg }}>{authorInitial}</span>
                          {v.author_type === 'ai' ? 'AI Agent' : v.author_id || 'Human'}
                        </span>
                        <span className="vc-time">{fmtDate(v.created_at || '')}</span>
                        {v.metadata && (v.metadata as Record<string, unknown>).model ? (
                          <span style={{ fontSize: 10, color: 'var(--fg-2)' }}>{String((v.metadata as Record<string, unknown>).model)}</span>
                        ) : null}
                        {v.metadata && (v.metadata as Record<string, unknown>).cost !== undefined && Number((v.metadata as Record<string, unknown>).cost) > 0 ? (
                          <span style={{ fontSize: 10, color: 'var(--fg-2)' }}>${Number((v.metadata as Record<string, unknown>).cost).toFixed(2)}</span>
                        ) : null}
                      </div>
                      {tags.length > 0 && (
                        <div className="vc-tags">
                          {tags.map((t: string) => {
                            const cls = t === 'approved' || t === 'release' ? 'approved' : t === 'reviewed' ? 'reviewed' : 'experiment';
                            return <span key={t} className={`vc-tag ${cls}`}>{t}</span>;
                          })}
                        </div>
                      )}
                    </div>
                    {/* Actions */}
                    <div className="vc-actions">
                      <button onClick={(e) => { e.stopPropagation(); compareWithSelected(v.id); }}>对比</button>
                      <button onClick={(e) => { e.stopPropagation(); setSelectedId(v.id); setShowRestoreConfirm(true); }}>恢复</button>
                      <button onClick={(e) => { e.stopPropagation(); setSelectedId(v.id); setShowTagModal(true); }}>标签</button>
                      {(v.branch === activeBranch) && (
                        <button className="danger" onClick={(e) => { e.stopPropagation(); setSelectedId(v.id); setShowBranchModal(true); }}>分支</button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* ── Detail Panel ── */}
        <div className="detail-panel">
          {selected ? (
            <>
              {/* Header */}
              <div className="detail-section">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--fg-2)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>版本详情</span>
                  <button onClick={() => setSelectedId(null)} style={{ background: 'none', border: 'none', color: 'var(--fg-2)', cursor: 'pointer', fontSize: 16, lineHeight: 1, padding: 0 }}>&times;</button>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span className="vc-id" style={{ fontSize: 16 }}>{selected.short_id || selected.id.slice(0, 7)}</span>
                  <span style={{ fontSize: 11, color: selectedBranchColor, fontWeight: 600, background: `color-mix(in oklab, ${selectedBranchColor}, transparent 88%)`, padding: '2px 8px', borderRadius: 'var(--radius-pill)' }}>
                    {selected.branch || 'main'}
                  </span>
                </div>
                <div className="detail-message">{selected.message || '—'}</div>
              </div>

              {/* Commit Info */}
              <div className="detail-section">
                <span className="detail-section-title">提交信息</span>
                <div className="detail-row">
                  <span className="detail-label">作者</span>
                  <span className="detail-value">{selected.author_type === 'ai' ? 'AI · ' : ''}{selected.author_id || 'Unknown'}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">时间</span>
                  <span className="detail-value mono">{fullTime(selected.created_at || '')}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">类型</span>
                  <span className="detail-value">{selected.is_checkpoint ? '自动快照' : '手动提交'} {((selected.parent_ids || []).filter(Boolean).length > 1) ? ' · 合并提交' : ''}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">父提交</span>
                  <span className="detail-value mono">{(selected.parent_ids || []).filter(Boolean).join(', ') || '—'}</span>
                </div>
              </div>

              {/* Changes */}
              <div className="detail-section">
                <span className="detail-section-title">变更内容</span>
                <div className="detail-row">
                  <span className="detail-label">阶段</span>
                  <span className="detail-value">{STAGE_NAMES[selected.pipeline_stage as StageLabel] || selected.pipeline_stage}</span>
                </div>
                {selected.changes && Object.keys(selected.changes).length > 0 && (
                  <>
                    <div className="detail-row">
                      <span className="detail-label">文件变更</span>
                      <span className="detail-value mono">
                        +{selected.changes.additions || 0} / -{selected.changes.deletions || 0}
                        {' '}({selected.changes.files || 0} files)
                      </span>
                    </div>
                  </>
                )}
              </div>

              {/* Metadata */}
              {selected.metadata && Object.keys(selected.metadata).length > 0 ? (
                <div className="detail-section">
                  <span className="detail-section-title">生成元数据</span>
                  {(selected.metadata as Record<string, unknown>).model ? (
                    <div className="detail-row">
                      <span className="detail-label">模型</span>
                      <span className="detail-value mono">{String((selected.metadata as Record<string, unknown>).model)}</span>
                    </div>
                  ) : null}
                  {(selected.metadata as Record<string, unknown>).supplier ? (
                    <div className="detail-row">
                      <span className="detail-label">供应商</span>
                      <span className="detail-value">{String((selected.metadata as Record<string, unknown>).supplier)}</span>
                    </div>
                  ) : null}
                  {(selected.metadata as Record<string, unknown>).cost !== undefined && Number((selected.metadata as Record<string, unknown>).cost) > 0 ? (
                    <div className="detail-row">
                      <span className="detail-label">费用</span>
                      <span className="detail-value mono">${Number((selected.metadata as Record<string, unknown>).cost).toFixed(2)}</span>
                    </div>
                  ) : null}
                  {(selected.metadata as Record<string, unknown>).qualityScore !== undefined ? (
                    <div className="detail-row">
                      <span className="detail-label">质量评分</span>
                      <span className="detail-value">{Number((selected.metadata as Record<string, unknown>).qualityScore)}/100</span>
                    </div>
                  ) : null}
                  {(selected.metadata as Record<string, unknown>).duration !== undefined ? (
                    <div className="detail-row">
                      <span className="detail-label">时长</span>
                      <span className="detail-value mono">{String((selected.metadata as Record<string, unknown>).duration)}s</span>
                    </div>
                  ) : null}
                </div>
              ) : null}

              {/* Tags */}
              <div className="detail-section">
                <span className="detail-section-title">标签</span>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {(selected.tags || []).length > 0 ? (selected.tags || []).map((t: string) => {
                    const cls = t === 'approved' || t === 'release' ? 'approved' : t === 'reviewed' ? 'reviewed' : 'experiment';
                    return (
                      <span key={t} className={`vc-tag ${cls}`} style={{ fontSize: 11, padding: '2px 8px', cursor: 'pointer' }} onClick={() => handleRemoveTag(t)} title="点击移除">
                        {t} ✕
                      </span>
                    );
                  }) : <span style={{ color: 'var(--fg-2)', fontSize: 12 }}>无标签</span>}
                </div>
              </div>

              {/* Actions */}
              <div className="detail-actions">
                <button className="primary" onClick={() => setShowRestoreConfirm(true)}>恢复到此版本</button>
                <button onClick={() => { setCompareIds([selected.id]); }}>选择对比</button>
                <button onClick={() => setShowTagModal(true)}>标签</button>
                <button onClick={() => setShowBranchModal(true)}>创建分支</button>
              </div>

              {/* Downstream impact */}
              {downstreamAffected.length > 0 && (
                <div className="detail-section">
                  <span className="detail-section-title">恢复影响分析</span>
                  <div className="impact-list">
                    {downstreamAffected.map((s) => (
                      <div key={s.key} className="impact-item">
                        <span className={`impact-dot ${s.affected ? 'warn' : 'ok'}`} />
                        {s.label}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="detail-empty">点击左侧版本或图谱节点查看详情</div>
          )}
        </div>
      </div>

      {/* ─── Restore Confirmation Modal ── */}
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
                  <span key={s.key} className="badge badge-warn text-[10px]">{s.label}</span>
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
                  <button className="text-xs text-muted hover:text-danger" onClick={() => handleRemoveTag(t)}>移除</button>
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
        <div className="diff-overlay">
          <div className="diff-toolbar">
            <div className="diff-toolbar-title">
              对比 <span>{diffData.from.short_id || diffData.from.id.slice(0, 7)}</span> ← → <span>{diffData.to.short_id || diffData.to.id.slice(0, 7)}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div className="diff-tabs">
                <button className={diffMode === 'text' ? 'active' : ''} onClick={() => setDiffMode('text')}>文本对比</button>
                <button className={diffMode === 'params' ? 'active' : ''} onClick={() => setDiffMode('params')}>参数对比</button>
                <button className={diffMode === 'frames' ? 'active' : ''} onClick={() => setDiffMode('frames')}>帧对比</button>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowDiff(false)} style={{ color: 'var(--fg-2)' }}>✕ 关闭</button>
            </div>
          </div>
          <div className="diff-body">
            {renderDiffContent()}
          </div>
        </div>
      )}
    </div>
  );
}
