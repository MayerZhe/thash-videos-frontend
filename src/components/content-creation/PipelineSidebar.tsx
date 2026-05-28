'use client';

import { useState } from 'react';
import { useAppStore } from '@/stores/app';
import { STAGE_NAMES, type StageLabel, type PipelineMode, type PipelineJobStatus } from '@/lib/types';

const STANDARD_STAGES: StageLabel[] = [
  'source_content',
  'script_rewrite',
  'character_management',
  'scene_management',
  'storyboard',
  'image_generation',
  'video_generation',
  'tts_dubbing',
  'shot_composition',
  'episode_merge',
  'export',
];

const PIPELINE_STAGES: Record<PipelineMode, StageLabel[]> = {
  'standard': STANDARD_STAGES,
  'asset-based': STANDARD_STAGES.filter((_, i) => [2, 3, 4, 5].includes(i)),       // 03-06
  'digital-human': STANDARD_STAGES.filter((_, i) => [2, 4, 5, 7].includes(i)),     // 03, 05, 06, 08
  'i2v': STANDARD_STAGES.filter((_, i) => [2, 3, 5, 6].includes(i)),               // 03, 04, 06, 07
  'action-transfer': STANDARD_STAGES.filter((_, i) => [5, 6].includes(i)),           // 06, 07
};

// ─── Phase 2: Agent status types ───

export type AgentStatus = 'PENDING' | 'RECONCILING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED' | 'SKIPPED' | 'PAUSED';

interface AgentInfo {
  key: string;
  label: string;
}

const AGENT_LIST: AgentInfo[] = [
  { key: 'director', label: '导演' },
  { key: 'writer', label: '编剧' },
  { key: 'character', label: '角色' },
  { key: 'storyboard', label: '分镜' },
  { key: 'router', label: '路由' },
  { key: 'video', label: '视频' },
  { key: 'voice', label: '配音' },
  { key: 'post', label: '后期' },
  { key: 'qa', label: '质检' },
];

const STATUS_LABELS: Record<AgentStatus, string> = {
  PENDING: '等待',
  RECONCILING: '对齐中',
  IN_PROGRESS: '执行中',
  COMPLETED: '完成',
  FAILED: '失败',
  SKIPPED: '跳过',
  PAUSED: '等待审查',
};

const STATUS_DOT_COLORS: Record<AgentStatus, string> = {
  PENDING: 'bg-[#555]',
  RECONCILING: 'bg-[#ffd93d] animate-pulse',
  IN_PROGRESS: 'bg-accent animate-pulse',
  COMPLETED: 'bg-success',
  FAILED: 'bg-error',
  SKIPPED: 'bg-[#555]',
  PAUSED: 'bg-[#ffd93d]',
};

const STATUS_TEXT_COLORS: Record<AgentStatus, string> = {
  PENDING: 'text-[#555]',
  RECONCILING: 'text-[#ffd93d]',
  IN_PROGRESS: 'text-accent',
  COMPLETED: 'text-success',
  FAILED: 'text-error',
  SKIPPED: 'text-[#555]',
  PAUSED: 'text-[#ffd93d]',
};

interface PipelineSidebarProps {
  onStageClick: (stage: StageLabel, index: number) => void;
  versionCounts: Record<string, number>;
  agentStates?: Record<string, AgentStatus>;
  onGenerate?: (stage: StageLabel, index: number) => void;
  onPrecheck?: () => void;
  activeJob?: PipelineJobStatus | null;
  precheckLoading?: boolean;
}

export default function PipelineSidebar({ onStageClick, versionCounts, agentStates = {}, onGenerate, onPrecheck, activeJob, precheckLoading }: PipelineSidebarProps) {
  const { activePipeline, activeStage } = useAppStore();
  const stages = PIPELINE_STAGES[activePipeline] || STANDARD_STAGES;
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className={`pipeline-sidebar flex-shrink-0 bg-bg border-r border-border-soft flex flex-col overflow-hidden ${collapsed ? 'pipeline-sidebar--collapsed' : ''}`}>
      {/* Toggle collapse button (tablet only) */}
      <button
        className="pipeline-toggle-btn"
        onClick={() => setCollapsed(!collapsed)}
        aria-label={collapsed ? '展开阶段列表' : '收起阶段列表'}
        title={collapsed ? '展开阶段列表' : '收起阶段列表'}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          {collapsed
            ? <polyline points="9 18 15 12 9 6" />
            : <polyline points="15 18 9 12 15 6" />
          }
        </svg>
      </button>

      <div className="flex-1 p-3 flex flex-col gap-0.5 pipeline-stage-list">
        {/* Precheck button + job status */}
        {(onPrecheck || activeJob) && (
          <div className="mb-2 pb-2 border-b border-border-soft">
            {activeJob ? (
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center gap-2">
                  <span className={`badge text-[10px] px-1.5 py-0 ${
                    activeJob.status === 'running' ? 'badge-accent' :
                    activeJob.status === 'completed' ? 'badge-success' :
                    activeJob.status === 'failed' ? 'badge-danger' :
                    activeJob.status === 'cancelled' ? 'badge-muted' :
                    'badge-warn'
                  }`}>
                    {activeJob.status === 'queued' ? '排队中' :
                     activeJob.status === 'running' ? '运行中' :
                     activeJob.status === 'completed' ? '已完成' :
                     activeJob.status === 'failed' ? '失败' :
                     activeJob.status === 'cancelled' ? '已取消' : activeJob.status}
                  </span>
                </div>
                {activeJob.status === 'running' && (
                  <div className="w-full h-1 bg-border-soft rounded-pill overflow-hidden">
                    <div
                      className="h-full bg-accent rounded-pill transition-all duration-500 ease-standard"
                      style={{ width: `${activeJob.progress_percent || 0}%` }}
                    />
                  </div>
                )}
                <span className="text-[10px] text-meta pipeline-agent-label">
                  {activeJob.current_agent ? `${activeJob.current_agent}` : `任务 ${activeJob.job_id}`}
                </span>
              </div>
            ) : (
              <button
                className="btn btn-brand btn-sm w-full text-xs"
                onClick={onPrecheck}
                disabled={precheckLoading}
              >
                {precheckLoading ? '检查中...' : '预检与提交'}
              </button>
            )}
          </div>
        )}

        {/* Stage rows */}
        {stages.map((stage, i) => {
          const stageNum = STANDARD_STAGES.indexOf(stage);
          const isActive = activeStage === stageNum;
          const showCheck = false; // Would be computed from pipeline_state
          const vCount = versionCounts[stage] || 0;

          return (
            <button
              key={stage}
              onClick={() => onStageClick(stage, stageNum)}
              className={`
                pipeline-stage-item flex items-center gap-3 px-3 py-2.5 rounded-sm text-sm text-left
                transition-all duration-150 ease-standard border border-transparent
                ${isActive
                  ? 'bg-[color-mix(in_oklab,var(--accent)_10%,transparent)] text-accent border-[color-mix(in_oklab,var(--accent)_20%,transparent)] font-medium'
                  : 'text-fg-2 hover:bg-surface hover:text-fg hover:border-border'
                }
              `}
              title={collapsed ? STAGE_NAMES[stage] : undefined}
            >
              <span className="font-mono text-xs w-6 text-center flex-shrink-0">
                {stageNum < 9 ? '0' : ''}{stageNum + 1}
              </span>
              <span className="flex-1 pipeline-stage-label">{STAGE_NAMES[stage]}</span>
              {showCheck && (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
              {vCount > 1 && (
                <span className="badge badge-warn text-[10px] px-1.5 py-0 pipeline-stage-badge">v{vCount}</span>
              )}
              {onGenerate && !activeJob && (
                <button
                  className="btn btn-brand text-[10px] px-1.5 py-0.5 leading-none pipeline-generate-btn"
                  onClick={(e) => { e.stopPropagation(); onGenerate(stage, stageNum); }}
                  title={`生成 ${STAGE_NAMES[stage]}`}
                >
                  生成
                </button>
              )}
            </button>
          );
        })}
      </div>

      {/* Phase 2: Agent status cards replacing progress bar */}
      <div className="border-t border-border-soft pipeline-agent-section">
        <div className="px-3 pt-3 pb-2">
          <p className="text-[10px] text-meta font-medium mb-2 uppercase tracking-wider pipeline-agent-header">Agent 状态</p>
          <div className="space-y-1">
            {AGENT_LIST.map((agent) => {
              const status = agentStates[agent.key] || 'PENDING';
              return (
                <div
                  key={agent.key}
                  className="flex items-center gap-2 px-2 py-1.5 rounded-sm hover:bg-bg transition-colors cursor-default"
                  title={collapsed ? `${agent.label}: ${STATUS_LABELS[status]}` : undefined}
                >
                  {/* Status dot */}
                  <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${STATUS_DOT_COLORS[status]}`} />
                  {/* Agent name */}
                  <span className="text-[11px] text-fg-2 flex-1 truncate pipeline-agent-label">{agent.label}</span>
                  {/* Status label */}
                  <span className={`text-[9px] font-mono pipeline-agent-status ${STATUS_TEXT_COLORS[status]}`}>
                    {STATUS_LABELS[status]}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <style jsx global>{`
        /* Default (desktop + tablet): sidebar is 220px */
        .pipeline-sidebar {
          width: 220px;
        }

        /* Collapse toggle button (tablet + mobile) */
        .pipeline-toggle-btn {
          display: none;
          align-items: center;
          justify-content: center;
          width: 100%;
          height: 32px;
          border: none;
          background: transparent;
          color: var(--muted);
          cursor: pointer;
          border-bottom: 1px solid var(--border-soft);
          transition: color var(--motion-fast);
        }
        .pipeline-toggle-btn:hover {
          color: var(--fg);
        }

        /* Tablet: collapsible sidebar */
        @media (max-width: 1023px) {
          .pipeline-toggle-btn {
            display: flex;
          }
          .pipeline-sidebar--collapsed {
            width: 48px;
          }
          .pipeline-sidebar--collapsed .pipeline-stage-label,
          .pipeline-sidebar--collapsed .pipeline-stage-badge,
          .pipeline-sidebar--collapsed .pipeline-generate-btn,
          .pipeline-sidebar--collapsed .pipeline-agent-label,
          .pipeline-sidebar--collapsed .pipeline-agent-status,
          .pipeline-sidebar--collapsed .pipeline-agent-header {
            display: none;
          }
          .pipeline-sidebar--collapsed .pipeline-stage-item {
            justify-content: center;
            padding: var(--space-2) var(--space-1);
          }
        }

        /* Mobile: bottom bar with horizontal scroll */
        @media (max-width: 767px) {
          .pipeline-sidebar {
            width: 100%;
            flex-direction: row;
            height: 56px;
            border-right: none;
            border-top: 1px solid var(--border-soft);
            overflow-x: auto;
            overflow-y: hidden;
            flex-shrink: 0;
            order: 2;
          }
          .pipeline-toggle-btn {
            display: none;
          }
          .pipeline-stage-list {
            flex-direction: row;
            flex: 1;
            overflow-x: auto;
            padding: var(--space-2);
            gap: var(--space-1);
          }
          .pipeline-stage-item {
            white-space: nowrap;
            flex-shrink: 0;
            font-size: var(--text-xs);
            padding: var(--space-1) var(--space-3);
          }
          .pipeline-stage-item .font-mono {
            display: none;
          }
          .pipeline-agent-section {
            display: none;
          }
        }
      `}</style>
    </div>
  );
}
