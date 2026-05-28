'use client';

import { useState, useEffect } from 'react';
import { useAppStore } from '@/stores/app';
import { pipelineApi } from '@/lib/api';

type ReviewAction = 'approve' | 'reject' | 'modify';
type PipelineStage = 'director' | 'writer' | 'character' | 'storyboard' | 'router' | 'video' | 'voice' | 'post' | 'qa';

const STAGE_LABELS: Record<PipelineStage, string> = {
  director: '导演',
  writer: '编剧',
  character: '角色',
  storyboard: '分镜',
  router: '路由',
  video: '视频',
  voice: '配音',
  post: '后期',
  qa: '质检',
};

interface ReviewPanelProps {
  jobId?: string;
  reviewStage?: string;
  reviewData?: Record<string, unknown>;
  onReviewSubmit?: (action: ReviewAction, payload: Record<string, unknown>) => void;
}

export default function ReviewPanel({ jobId = '', reviewStage = '', reviewData, onReviewSubmit }: ReviewPanelProps) {
  const { reviewPointActive, setReviewPointActive } = useAppStore();
  const [action, setAction] = useState<ReviewAction | null>(null);
  const [redoStages, setRedoStages] = useState<PipelineStage[]>([]);
  const [edits, setEdits] = useState<Record<string, string>>({});
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (reviewPointActive) {
      setAction(null);
      setRedoStages([]);
      setEdits({});
      setComment('');
    }
  }, [reviewPointActive]);

  const toggleRedoStage = (stage: PipelineStage) => {
    setRedoStages((prev) =>
      prev.includes(stage) ? prev.filter((s) => s !== stage) : [...prev, stage]
    );
  };

  const handleSubmit = async () => {
    if (!action) return;
    setSubmitting(true);

    const payload: Record<string, unknown> = {
      action,
      comment,
    };

    if (action === 'reject') {
      payload.redo_stages = redoStages;
    }
    if (action === 'modify') {
      payload.changes = edits;
    }

    try {
      await pipelineApi.review(jobId, payload);
      onReviewSubmit?.(action, payload);
      setReviewPointActive(false);
    } catch {
      // Review submission failed silently — user can retry
    } finally {
      setSubmitting(false);
    }
  };

  // Inactive state: show placeholder in right panel
  if (!reviewPointActive) {
    return (
      <div className="space-y-4">
        <h4 className="text-sm font-medium text-fg">审查面板</h4>
        <div className="bg-bg border border-border rounded-sm p-6 text-center">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="1.5" strokeLinecap="round" className="mx-auto mb-3">
            <path d="M9 11l3 3L22 4" />
            <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
          </svg>
          <p className="text-sm text-muted mb-2">当前无活跃审查点</p>
          <p className="text-xs text-meta">Pipeline 运行到审查阶段时，此处将显示审查操作面板。</p>
        </div>
        <div className="bg-bg border border-border rounded-sm p-4">
          <h5 className="text-xs font-medium text-fg-2 mb-3">Pipeline 审查阶段</h5>
          <div className="grid grid-cols-3 gap-1.5">
            {(Object.keys(STAGE_LABELS) as PipelineStage[]).map((stage) => (
              <span key={stage} className="px-2 py-1.5 rounded-sm text-[11px] border border-border text-fg-2 bg-surface">
                {STAGE_LABELS[stage]}
              </span>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h4 className="text-sm font-medium text-fg">审查面板</h4>

      {/* Active review indicator */}
      <div className="flex items-center gap-2 px-3 py-2 bg-warning/10 border border-warning/30 rounded-sm">
        <div className="w-2 h-2 rounded-full bg-warning animate-pulse" />
        <span className="text-xs font-medium text-warning">审查点活跃 — {reviewStage || '未知阶段'}</span>
      </div>

      <div className="bg-surface border border-border rounded-sm overflow-hidden">
        {/* Content */}
        <div className="p-4 space-y-4">
          <p className="text-sm text-fg-2">
            Pipeline 已到达审查点。请审查当前阶段的输出，选择批准、拒绝或修改。
          </p>

          {/* Action buttons */}
          <div className="grid grid-cols-3 gap-2">
            {([
              { key: 'approve' as ReviewAction, label: '批准', icon: '✓', class: 'border-success text-success hover:bg-success/5' },
              { key: 'reject' as ReviewAction, label: '拒绝', icon: '✗', class: 'border-error text-error hover:bg-error/5' },
              { key: 'modify' as ReviewAction, label: '修改', icon: '✎', class: 'border-warning text-warning hover:bg-warning/5' },
            ]).map((btn) => (
              <button
                key={btn.key}
                onClick={() => setAction(btn.key)}
                className={`flex items-center justify-center gap-1 py-2.5 rounded-sm border text-xs font-medium transition-all ${
                  action === btn.key
                    ? `${btn.class} bg-opacity-10`
                    : 'border-border text-muted hover:border-[#555]'
                }`}
              >
                <span>{btn.icon}</span>
                <span>{btn.label}</span>
              </button>
            ))}
          </div>

          {/* Reject: Stage selector */}
          {action === 'reject' && (
            <div className="space-y-2">
              <label className="text-xs font-medium text-fg-2">选择需要重做的阶段：</label>
              <div className="grid grid-cols-3 gap-1.5">
                {(Object.keys(STAGE_LABELS) as PipelineStage[]).map((stage) => (
                  <button
                    key={stage}
                    onClick={() => toggleRedoStage(stage)}
                    className={`px-2 py-1.5 rounded-sm text-[11px] border transition-all ${
                      redoStages.includes(stage)
                        ? 'border-error bg-error/10 text-error'
                        : 'border-border text-fg-2 hover:border-[#555]'
                    }`}
                  >
                    {STAGE_LABELS[stage]}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Modify: Editable fields */}
          {action === 'modify' && (
            <div className="space-y-2">
              <label className="text-xs font-medium text-fg-2">编辑字段：</label>
              {reviewData && Object.entries(reviewData).slice(0, 6).map(([key, val]) => (
                <div key={key} className="flex gap-2 items-center">
                  <span className="text-[11px] text-meta min-w-[100px] font-mono">{key}:</span>
                  <input
                    type="text"
                    value={edits[key] ?? String(val)}
                    onChange={(e) => setEdits((prev) => ({ ...prev, [key]: e.target.value }))}
                    className="flex-1 bg-bg border border-border rounded-sm px-2 py-1 text-xs text-fg outline-none focus:border-accent"
                  />
                </div>
              ))}
              {(!reviewData || Object.keys(reviewData).length === 0) && (
                <p className="text-xs text-muted">无可用字段</p>
              )}
            </div>
          )}

          {/* Comment */}
          <div>
            <label className="text-xs font-medium text-fg-2 mb-1 block">评论（可选）：</label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={2}
              placeholder="输入审查意见..."
              className="w-full bg-bg border border-border rounded-sm px-3 py-2 text-xs text-fg outline-none focus:border-accent placeholder:text-meta resize-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-border-soft bg-bg flex justify-end gap-3">
          <button
            onClick={() => setReviewPointActive(false)}
            className="px-4 py-2 text-xs text-muted hover:text-fg transition-colors"
          >
            稍后处理
          </button>
          <button
            onClick={handleSubmit}
            disabled={!action || submitting}
            className="btn btn-brand btn-sm"
          >
            {submitting ? '提交中...' : '提交审查'}
          </button>
        </div>
      </div>
    </div>
  );
}
