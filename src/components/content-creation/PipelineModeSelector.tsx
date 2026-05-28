'use client';

import { useAppStore } from '@/stores/app';
import type { PipelineMode } from '@/lib/types';

const MODES: { key: PipelineMode; label: string }[] = [
  { key: 'standard', label: '标准模式' },
  { key: 'asset-based', label: '素材驱动' },
  { key: 'digital-human', label: '数字人' },
  { key: 'i2v', label: '图生视频' },
  { key: 'action-transfer', label: '动作迁移' },
];

export default function PipelineModeSelector() {
  const { activePipeline, setActivePipeline } = useAppStore();

  return (
    <div className="flex gap-2 px-8 py-3 border-b border-border-soft bg-bg overflow-x-auto">
      {MODES.map((mode) => (
        <button
          key={mode.key}
          onClick={() => setActivePipeline(mode.key)}
          className={`badge cursor-pointer whitespace-nowrap transition-all ${
            activePipeline === mode.key ? 'badge-accent' : 'badge-muted'
          }`}
        >
          {mode.label}
        </button>
      ))}
    </div>
  );
}
