'use client';

import { useState } from 'react';

interface QADimension {
  key: string;
  label: string;
  score: number; // 0-100
  color: string;
}

interface QAIssue {
  shot_id: string;
  severity: 'must_fix' | 'warning' | 'info';
  dimension: string;
  detail: string;
}

interface QACritiquePanelProps {
  scores?: Record<string, number>;
  issues?: QAIssue[];
  onRegenerate?: (shotIds: string[]) => void;
}

const DIMENSIONS: QADimension[] = [
  { key: 'character_consistency', label: '角色一致性', score: 0, color: '#e94560' },
  { key: 'shot_coherence', label: '镜头连贯性', score: 0, color: '#ff6b6b' },
  { key: 'audio_sync', label: '音频同步', score: 0, color: '#ffd93d' },
  { key: 'subtitle_accuracy', label: '字幕准确性', score: 0, color: '#6b3fa0' },
  { key: 'video_quality', label: '视频质量', score: 0, color: '#0f3460' },
  { key: 'story_completeness', label: '故事完整性', score: 0, color: '#2d1b69' },
];

export default function QACritiquePanel({ scores = {}, issues = [], onRegenerate = () => {} }: QACritiquePanelProps) {
  const [selectedIssues, setSelectedIssues] = useState<Set<string>>(new Set());
  const [hoveredDimension, setHoveredDimension] = useState<string | null>(null);

  const dimensions: QADimension[] = DIMENSIONS.map((d) => ({
    ...d,
    score: scores[d.key] ?? 0,
  }));

  const mustFixIssues = issues.filter((i) => i.severity === 'must_fix');
  const overallScore = dimensions.length > 0
    ? Math.round(dimensions.reduce((sum, d) => sum + d.score, 0) / dimensions.length)
    : 0;

  const toggleIssue = (shotId: string) => {
    setSelectedIssues((prev) => {
      const next = new Set(prev);
      if (next.has(shotId)) next.delete(shotId);
      else next.add(shotId);
      return next;
    });
  };

  const selectAllMustFix = () => {
    setSelectedIssues(new Set(mustFixIssues.map((i) => i.shot_id)));
  };

  // SVG Radar chart rendering
  const radarSize = 200;
  const radarCenter = radarSize / 2;
  const radarRadius = 80;
  const numAxes = dimensions.length;
  const angleStep = (2 * Math.PI) / numAxes;

  const getPoint = (index: number, value: number) => {
    const angle = angleStep * index - Math.PI / 2;
    const r = (value / 100) * radarRadius;
    return {
      x: radarCenter + r * Math.cos(angle),
      y: radarCenter + r * Math.sin(angle),
    };
  };

  const getAxisEndpoint = (index: number) => {
    const angle = angleStep * index - Math.PI / 2;
    return {
      x: radarCenter + radarRadius * Math.cos(angle),
      y: radarCenter + radarRadius * Math.sin(angle),
    };
  };

  const dataPoints = dimensions.map((d, i) => getPoint(i, d.score));
  const dataPath = dataPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') + ' Z';

  // Background grid (25%, 50%, 75%)
  const gridPaths = [0.25, 0.5, 0.75].map((fraction) => {
    const r = fraction * radarRadius;
    return dimensions.map((_, i) => {
      const angle = angleStep * i - Math.PI / 2;
      const x1 = radarCenter + r * Math.cos(angle);
      const y1 = radarCenter + r * Math.sin(angle);
      const nextAngle = angleStep * ((i + 1) % numAxes) - Math.PI / 2;
      const x2 = radarCenter + r * Math.cos(nextAngle);
      const y2 = radarCenter + r * Math.sin(nextAngle);
      return `M ${x1} ${y1} L ${x2} ${y2}`;
    }).join(' ');
  });

  return (
    <div className="w-full bg-surface border border-border rounded-lg p-5 space-y-5">
      <h3 className="text-sm font-semibold text-fg">QA 评判</h3>

      {/* Overall score */}
      <div className="flex items-center gap-4">
        <div className={`text-3xl font-bold font-mono ${
          overallScore >= 80 ? 'text-success' :
          overallScore >= 60 ? 'text-warning' :
          'text-error'
        }`}>
          {overallScore}
        </div>
        <div>
          <div className="text-xs text-muted">综合评分</div>
          <div className="text-[10px] text-meta">6 维平均值</div>
        </div>
      </div>

      {/* SVG Radar Chart */}
      <div className="flex justify-center">
        <svg width={radarSize} height={radarSize} viewBox={`0 0 ${radarSize} ${radarSize}`} className="overflow-visible">
          {/* Grid */}
          {gridPaths.map((path, i) => (
            <path key={i} d={path} fill="none" stroke="var(--border-soft, #333)" strokeWidth="0.5" opacity={0.5} />
          ))}

          {/* Axes */}
          {dimensions.map((_, i) => {
            const end = getAxisEndpoint(i);
            return (
              <line key={i} x1={radarCenter} y1={radarCenter} x2={end.x} y2={end.y}
                stroke="var(--border-soft, #333)" strokeWidth="0.5" />
            );
          })}

          {/* Data area */}
          <path d={dataPath} fill="rgba(233, 69, 96, 0.15)" stroke="#e94560" strokeWidth="1.5" />

          {/* Data points */}
          {dataPoints.map((p, i) => (
            <circle key={i} cx={p.x} cy={p.y} r="3" fill="#e94560"
              onMouseEnter={() => setHoveredDimension(dimensions[i].key)}
              onMouseLeave={() => setHoveredDimension(null)}
            />
          ))}

          {/* Labels */}
          {dimensions.map((d, i) => {
            const end = getAxisEndpoint(i);
            const labelR = radarRadius + 20;
            const angle = angleStep * i - Math.PI / 2;
            const lx = radarCenter + labelR * Math.cos(angle);
            const ly = radarCenter + labelR * Math.sin(angle);
            return (
              <text key={i} x={lx} y={ly} textAnchor="middle" dominantBaseline="middle"
                className={`text-[9px] fill-meta ${hoveredDimension === d.key ? 'fill-accent font-semibold' : ''}`}>
                {d.label}
              </text>
            );
          })}
        </svg>
      </div>

      {/* Dimension scores */}
      <div className="grid grid-cols-2 gap-2">
        {dimensions.map((d) => (
          <div key={d.key} className="flex items-center justify-between bg-bg rounded-sm px-3 py-2">
            <span className="text-xs text-fg-2">{d.label}</span>
            <div className="flex items-center gap-2">
              <div className="w-16 h-1.5 bg-border rounded-pill overflow-hidden">
                <div className="h-full rounded-pill transition-all duration-300"
                  style={{ width: `${d.score}%`, backgroundColor: d.color }} />
              </div>
              <span className="text-[10px] text-meta font-mono w-6 text-right">{d.score}</span>
            </div>
          </div>
        ))}
      </div>

      {/* MUST_FIX issues */}
      {mustFixIssues.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-semibold text-error flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-error" />
              MUST FIX ({mustFixIssues.length})
            </h4>
            <button onClick={selectAllMustFix} className="text-[10px] text-accent hover:underline">
              全选
            </button>
          </div>
          <div className="space-y-1 max-h-[200px] overflow-y-auto">
            {mustFixIssues.map((issue) => (
              <label
                key={issue.shot_id}
                className={`flex items-center gap-2 px-3 py-2 rounded-sm border cursor-pointer transition-all text-xs ${
                  selectedIssues.has(issue.shot_id)
                    ? 'border-error bg-error/5'
                    : 'border-border hover:border-[#555]'
                }`}
              >
                <input
                  type="checkbox"
                  checked={selectedIssues.has(issue.shot_id)}
                  onChange={() => toggleIssue(issue.shot_id)}
                  className="w-3 h-3 accent-error"
                />
                <span className="font-mono text-meta">{issue.shot_id}</span>
                <span className="text-fg-2">{issue.detail}</span>
                <span className="text-[10px] text-meta ml-auto">{issue.dimension}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Regenerate button */}
      <button
        onClick={() => onRegenerate(Array.from(selectedIssues))}
        disabled={selectedIssues.size === 0}
        className="btn btn-danger w-full"
      >
        重新生成 {selectedIssues.size > 0 ? `(${selectedIssues.size})` : ''} 问题镜头
      </button>
    </div>
  );
}
