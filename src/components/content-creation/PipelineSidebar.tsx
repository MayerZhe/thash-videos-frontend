'use client';

import { useState } from 'react';
import { useAppStore } from '@/stores/app';
import { STAGE_NAMES, type StageLabel, type PipelineMode, type PipelineJobStatus } from '@/lib/types';
import AgentStatusFooter from './AgentStatusFooter';

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
  'asset-based': STANDARD_STAGES.filter((_, i) => [2, 3, 4, 5].includes(i)),
  'digital-human': STANDARD_STAGES.filter((_, i) => [2, 4, 5, 7].includes(i)),
  'i2v': STANDARD_STAGES.filter((_, i) => [2, 3, 5, 6].includes(i)),
  'action-transfer': STANDARD_STAGES.filter((_, i) => [5, 6].includes(i)),
};

export type AgentStatus = 'PENDING' | 'RECONCILING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED' | 'SKIPPED' | 'PAUSED';

interface SectionDef {
  label: string;
  stages: StageLabel[];
}

const PIPE_SECTIONS: SectionDef[] = [
  { label: '内容准备', stages: ['source_content', 'script_rewrite'] },
  { label: '角色与场景', stages: ['character_management', 'scene_management'] },
  { label: '视觉生成', stages: ['storyboard', 'image_generation', 'video_generation'] },
  { label: '配音', stages: ['tts_dubbing'] },
  { label: '合成', stages: ['shot_composition', 'episode_merge'] },
  { label: '导出', stages: ['export'] },
];

interface PipelineSidebarProps {
  onStageClick: (stage: StageLabel, index: number) => void;
  versionCounts: Record<string, number>;
  agentStates?: Record<string, AgentStatus>;
  onGenerate?: (stage: StageLabel, index: number) => void;
  onPrecheck?: () => void;
  activeJob?: PipelineJobStatus | null;
  precheckLoading?: boolean;
}

export default function PipelineSidebar({
  onStageClick,
  versionCounts,
  agentStates = {},
  onGenerate,
  onPrecheck,
  activeJob,
  precheckLoading,
}: PipelineSidebarProps) {
  const { activePipeline, activeStage } = useAppStore();
  const stages = PIPELINE_STAGES[activePipeline] || STANDARD_STAGES;
  const [collapsed, setCollapsed] = useState(false);

  const completedStages = 0;
  const totalStages = stages.length;

  const getStageSub = (stage: StageLabel): string => {
    switch (stage) {
      case 'source_content': return '原始素材导入';
      case 'script_rewrite': return 'AI 剧本改写';
      case 'character_management': return '角色设定与一致性';
      case 'scene_management': return '场景划分与转场';
      case 'storyboard': return '分镜脚本与预览';
      case 'image_generation': return 'AI 图像生成';
      case 'video_generation': return 'AI 视频生成';
      case 'tts_dubbing': return '文字转语音配音';
      case 'shot_composition': return '镜头合成与特效';
      case 'episode_merge': return '剧集合并与母带';
      case 'export': return '多格式导出分发';
      default: return '';
    }
  };

  const filteredSections = PIPE_SECTIONS.map((sec) => ({
    ...sec,
    stages: sec.stages.filter((s) => stages.includes(s)),
  })).filter((sec) => sec.stages.length > 0);

  return (
    <div className={`sidebar ${collapsed ? 'sidebar--collapsed' : ''}`}>
      <button
        className="sidebar-collapse-btn"
        onClick={() => setCollapsed(!collapsed)}
        aria-label={collapsed ? '展开阶段列表' : '收起阶段列表'}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          {collapsed
            ? <polyline points="9 18 15 12 9 6" />
            : <polyline points="15 18 9 12 15 6" />
          }
        </svg>
      </button>

      <div className="flex-1 overflow-y-auto">
        {/* Precheck button + job status */}
        {(onPrecheck || activeJob) && (
          <div className="px-3 pt-2 pb-3 mb-1 border-b border-border-soft">
            {activeJob ? (
              <div className="flex flex-col gap-1.5">
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
                {activeJob.status === 'running' && (
                  <div className="progress-track">
                    <div
                      className="progress-fill"
                      style={{ width: `${activeJob.progress_percent || 0}%` }}
                    />
                  </div>
                )}
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

        {/* Grouped sections */}
        {filteredSections.map((section) => (
          <div key={section.label} className="pipe-section">
            <div className="pipe-section-label">{section.label}</div>
            {section.stages.map((stage) => {
              const stageNum = STANDARD_STAGES.indexOf(stage);
              const isActive = activeStage === stageNum;
              const vCount = versionCounts[stage] || 0;

              return (
                <button
                  key={stage}
                  onClick={() => onStageClick(stage, stageNum)}
                  className={`pipe-item ${isActive ? 'active' : ''} ${completedStages > stageNum ? 'done' : ''}`}
                >
                  <span className="pipe-icon">
                    {stageNum < 9 ? '0' : ''}{stageNum + 1}
                  </span>
                  <span className="pipe-copy">
                    <span className="pipe-label">{STAGE_NAMES[stage]}</span>
                    <span className="pipe-sub">{getStageSub(stage)}</span>
                  </span>
                  {vCount > 1 && (
                    <span className={`ver-badge ${vCount > 2 ? 'has-multi' : ''}`}>
                      v{vCount}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {/* Bottom: progress + refresh */}
      <div className="sidebar-bottom">
        <div>
          <div className="progress-head">
            <span className="progress-label">流水线进度</span>
            <span className="progress-val">{completedStages}/{totalStages}</span>
          </div>
          <div className="progress-track">
            <div
              className="progress-fill"
              style={{ width: `${totalStages > 0 ? (completedStages / totalStages) * 100 : 0}%` }}
            />
          </div>
        </div>
        <button className="refresh-btn" onClick={() => window.location.reload()}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="23 4 23 10 17 10" />
            <path d="M20.49 15a9 9 0 11-2.12-9.36L23 10" />
          </svg>
          刷新状态
        </button>
      </div>

      {/* Agent status footer */}
      <AgentStatusFooter agentStates={agentStates} />

      <style jsx global>{`
        .sidebar-collapse-btn {
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
          flex-shrink: 0;
        }
        .sidebar-collapse-btn:hover { color: var(--fg); }

        @media (max-width: 1023px) {
          .sidebar-collapse-btn { display: flex; }
          .sidebar--collapsed { width: 48px; }
          .sidebar--collapsed .pipe-section-label,
          .sidebar--collapsed .pipe-copy,
          .sidebar--collapsed .ver-badge,
          .sidebar--collapsed .sidebar-bottom,
          .sidebar--collapsed .border-t.border-border-soft { display: none; }
          .sidebar--collapsed .pipe-item { justify-content: center; padding: 7px; }
        }

        @media (max-width: 767px) {
          .sidebar {
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
          .sidebar-collapse-btn { display: none; }
          .sidebar > .flex-1 {
            display: flex;
            flex-direction: row;
            overflow-x: auto;
            padding: var(--space-2);
            gap: var(--space-1);
          }
          .pipe-section { margin-bottom: 0; display: flex; gap: var(--space-1); }
          .pipe-section-label { display: none; }
          .pipe-item { white-space: nowrap; flex-shrink: 0; font-size: var(--text-xs); padding: var(--space-1) var(--space-3); }
          .pipe-sub { display: none; }
          .sidebar-bottom, .border-t.border-border-soft { display: none; }
        }
      `}</style>
    </div>
  );
}
