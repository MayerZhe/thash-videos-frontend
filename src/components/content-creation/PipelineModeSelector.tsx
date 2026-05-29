'use client';

import { useAppStore } from '@/stores/app';
import type { PipelineMode } from '@/lib/types';

const MODES: { key: PipelineMode; icon: string; label: string; badge?: string }[] = [
  { key: 'standard', icon: 'S', label: '标准模式', badge: '默认' },
  { key: 'asset-based', icon: 'A', label: '素材驱动' },
  { key: 'digital-human', icon: 'D', label: '数字人' },
  { key: 'i2v', icon: 'I', label: '图生视频' },
  { key: 'action-transfer', icon: 'T', label: '动作迁移' },
];

export default function PipelineModeSelector() {
  const { activePipeline, setActivePipeline } = useAppStore();

  return (
    <div className="pipeline-mode-bar">
      {MODES.map((mode) => (
        <button
          key={mode.key}
          className={`pipeline-mode-tab ${activePipeline === mode.key ? 'active' : ''}`}
          onClick={() => setActivePipeline(mode.key)}
        >
          <span className="mode-icon">{mode.icon}</span>
          {mode.label}
          {mode.badge && <span className="mode-badge">{mode.badge}</span>}
        </button>
      ))}
    </div>
  );
}
