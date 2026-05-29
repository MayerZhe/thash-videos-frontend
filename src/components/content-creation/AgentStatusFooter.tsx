'use client';

import type { AgentStatus } from './PipelineSidebar';

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
  RECONCILING: 'bg-[#ffd93d]',
  IN_PROGRESS: 'bg-accent',
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

interface AgentStatusFooterProps {
  agentStates: Record<string, AgentStatus>;
}

export default function AgentStatusFooter({ agentStates }: AgentStatusFooterProps) {
  return (
    <div className="border-t border-border-soft">
      <div className="px-3 pt-3 pb-2">
        <p className="text-[10px] text-meta font-medium mb-2 uppercase tracking-wider">Agent 状态</p>
        <div className="space-y-1">
          {AGENT_LIST.map((agent) => {
            const status = agentStates[agent.key] || 'PENDING';
            return (
              <div
                key={agent.key}
                className="flex items-center gap-2 px-2 py-1.5 rounded-sm hover:bg-bg transition-colors cursor-default"
              >
                <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${STATUS_DOT_COLORS[status]}`} />
                <span className="text-[11px] text-fg-2 flex-1 truncate">{agent.label}</span>
                <span className={`text-[9px] font-mono ${STATUS_TEXT_COLORS[status]}`}>
                  {STATUS_LABELS[status]}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
