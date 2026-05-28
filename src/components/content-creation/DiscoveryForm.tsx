'use client';

import { useState } from 'react';
import { useAppStore } from '@/stores/app';

type CreationType = 'one_sentence' | 'novel_to_drama' | 'asset_remix';
type TargetAudience = 'children' | 'teen' | 'young_adult' | 'adult' | 'all';
type NarrativeTone = 'light' | 'dark' | 'suspenseful' | 'comedic' | 'romantic' | 'epic';
type ContentMood = 'warm' | 'cold' | 'neutral' | 'dramatic' | 'whimsical';
type QualityTier = 'economy' | 'standard' | 'premium';

const CREATION_TYPES: { key: CreationType; label: string; desc: string }[] = [
  { key: 'one_sentence', label: '一句话创意', desc: '输入一句话创意，AI 自动扩展为完整剧本' },
  { key: 'novel_to_drama', label: '小说改编', desc: '上传小说文本，AI 自动分集改编' },
  { key: 'asset_remix', label: '素材混剪', desc: '基于已有素材和主题，AI 混剪生成' },
];

const AUDIENCES: { key: TargetAudience; label: string }[] = [
  { key: 'children', label: '儿童 (6-12)' },
  { key: 'teen', label: '青少年 (13-17)' },
  { key: 'young_adult', label: '青年 (18-25)' },
  { key: 'adult', label: '成人 (26+)' },
  { key: 'all', label: '全年龄' },
];

const NARRATIVE_TONES: { key: NarrativeTone; label: string }[] = [
  { key: 'light', label: '轻松' },
  { key: 'dark', label: '暗黑' },
  { key: 'suspenseful', label: '悬疑' },
  { key: 'comedic', label: '喜剧' },
  { key: 'romantic', label: '浪漫' },
  { key: 'epic', label: '史诗' },
];

const CONTENT_MOODS: { key: ContentMood; label: string }[] = [
  { key: 'warm', label: '温暖' },
  { key: 'cold', label: '冷峻' },
  { key: 'neutral', label: '中性' },
  { key: 'dramatic', label: '戏剧' },
  { key: 'whimsical', label: '奇想' },
];

const QUALITY_TIERS: { key: QualityTier; label: string; cost: string }[] = [
  { key: 'economy', label: '经济', cost: '¥15/集' },
  { key: 'standard', label: '标准', cost: '¥45/集' },
  { key: 'premium', label: '高级', cost: '¥120/集' },
];

interface DiscoveryFormProps {
  onSubmit: (data: Record<string, unknown>) => void;
}

export default function DiscoveryForm({ onSubmit }: DiscoveryFormProps) {
  const { activePipeline, setActivePipeline } = useAppStore();

  const [creationType, setCreationType] = useState<CreationType>('one_sentence');
  const [idea, setIdea] = useState('');
  const [targetAudiences, setTargetAudiences] = useState<TargetAudience[]>(['young_adult']);
  const [narrativeTone, setNarrativeTone] = useState<NarrativeTone>('light');
  const [contentMood, setContentMood] = useState<ContentMood>('warm');
  const [episodeCount, setEpisodeCount] = useState(6);
  const [quality, setQuality] = useState<QualityTier>('standard');
  const [budget, setBudget] = useState(4500);

  const toggleAudience = (audience: TargetAudience) => {
    setTargetAudiences((prev) =>
      prev.includes(audience)
        ? prev.filter((a) => a !== audience)
        : [...prev, audience]
    );
  };

  const handleSubmit = () => {
    const payload = {
      pipeline_type: creationType,
      input_params: {
        idea,
        episode_count: episodeCount,
        target_audience: targetAudiences,
        narrative_tone: narrativeTone,
        content_mood: contentMood,
        quality,
        available_budget_cents: budget,
      },
      quality,
      episode_number: 1,
    };
    setActivePipeline(creationType === 'one_sentence' ? 'standard' : creationType === 'novel_to_drama' ? 'standard' : 'asset-based');
    onSubmit(payload);
  };

  return (
    <div className="w-full max-w-2xl mx-auto bg-surface border border-border rounded-lg p-6 space-y-6">
      <h2 className="text-lg font-semibold text-fg">创作发现</h2>

      {/* Creation Type */}
      <fieldset>
        <legend className="text-sm font-medium text-fg-2 mb-3">创作类型</legend>
        <div className="grid grid-cols-3 gap-3">
          {CREATION_TYPES.map((ct) => (
            <button
              key={ct.key}
              onClick={() => setCreationType(ct.key)}
              className={`p-3 rounded-sm border text-left transition-all ${
                creationType === ct.key
                  ? 'border-accent bg-[color-mix(in_oklab,var(--accent)_8%,transparent)]'
                  : 'border-border hover:border-[#393939] bg-bg'
              }`}
            >
              <div className="text-sm font-medium text-fg">{ct.label}</div>
              <div className="text-xs text-muted mt-1">{ct.desc}</div>
            </button>
          ))}
        </div>
      </fieldset>

      {/* Idea Input */}
      <div>
        <label className="text-sm font-medium text-fg-2 mb-2 block">创意描述</label>
        <textarea
          value={idea}
          onChange={(e) => setIdea(e.target.value)}
          placeholder="例如：一个废柴少年意外获得上古神器，在AI助手的陪伴下踏上修仙之路..."
          rows={3}
          className="w-full bg-bg border border-border rounded-sm px-3 py-2 text-sm text-fg outline-none focus:border-accent placeholder:text-meta resize-none"
        />
      </div>

      {/* Target Audience */}
      <fieldset>
        <legend className="text-sm font-medium text-fg-2 mb-2">目标受众（多选）</legend>
        <div className="flex flex-wrap gap-2">
          {AUDIENCES.map((a) => (
            <button
              key={a.key}
              onClick={() => toggleAudience(a.key)}
              className={`px-3 py-1.5 rounded-sm text-xs border transition-all ${
                targetAudiences.includes(a.key)
                  ? 'border-accent bg-[color-mix(in_oklab,var(--accent)_12%,transparent)] text-accent'
                  : 'border-border text-fg-2 hover:border-[#393939]'
              }`}
            >
              {a.label}
            </button>
          ))}
        </div>
      </fieldset>

      {/* Narrative Tone */}
      <fieldset>
        <legend className="text-sm font-medium text-fg-2 mb-2">叙事语调</legend>
        <div className="flex flex-wrap gap-2">
          {NARRATIVE_TONES.map((t) => (
            <button
              key={t.key}
              onClick={() => setNarrativeTone(t.key)}
              className={`px-4 py-1.5 rounded-sm text-xs border transition-all ${
                narrativeTone === t.key
                  ? 'border-accent bg-[color-mix(in_oklab,var(--accent)_12%,transparent)] text-accent'
                  : 'border-border text-fg-2 hover:border-[#393939]'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </fieldset>

      {/* Content Mood */}
      <fieldset>
        <legend className="text-sm font-medium text-fg-2 mb-2">内容基调</legend>
        <div className="flex flex-wrap gap-2">
          {CONTENT_MOODS.map((m) => (
            <button
              key={m.key}
              onClick={() => setContentMood(m.key)}
              className={`px-4 py-1.5 rounded-sm text-xs border transition-all ${
                contentMood === m.key
                  ? 'border-accent bg-[color-mix(in_oklab,var(--accent)_12%,transparent)] text-accent'
                  : 'border-border text-fg-2 hover:border-[#393939]'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </fieldset>

      {/* Episode Count + Duration */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium text-fg-2 mb-2 block">
            集数: <span className="text-accent">{episodeCount}</span>
          </label>
          <input
            type="range"
            min={1}
            max={24}
            value={episodeCount}
            onChange={(e) => setEpisodeCount(Number(e.target.value))}
            className="w-full accent-accent"
          />
          <div className="flex justify-between text-[10px] text-meta mt-1">
            <span>1</span><span>12</span><span>24</span>
          </div>
        </div>
        <div>
          <label className="text-sm font-medium text-fg-2 mb-2 block">时长预估</label>
          <p className="text-sm text-fg-2">{episodeCount * 3}-{episodeCount * 5} 分钟</p>
        </div>
      </div>

      {/* Quality + Budget */}
      <div className="grid grid-cols-2 gap-4">
        <fieldset>
          <legend className="text-sm font-medium text-fg-2 mb-2">质量档位</legend>
          <div className="space-y-2">
            {QUALITY_TIERS.map((q) => (
              <button
                key={q.key}
                onClick={() => {
                  setQuality(q.key);
                  setBudget(q.key === 'economy' ? 1500 : q.key === 'standard' ? 4500 : 12000);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-sm text-xs border transition-all ${
                  quality === q.key
                    ? 'border-accent bg-[color-mix(in_oklab,var(--accent)_8%,transparent)]'
                    : 'border-border hover:border-[#393939]'
                }`}
              >
                <span className="text-fg-2">{q.label}</span>
                <span className="text-meta font-mono">{q.cost}</span>
              </button>
            ))}
          </div>
        </fieldset>
        <div>
          <label className="text-sm font-medium text-fg-2 mb-2 block">预算 (分)</label>
          <input
            type="number"
            value={budget}
            onChange={(e) => setBudget(Number(e.target.value))}
            className="w-full bg-bg border border-border rounded-sm px-3 py-2 text-sm text-fg outline-none focus:border-accent font-mono"
            min={500}
            step={500}
          />
          <p className="text-[10px] text-meta mt-1">预估总成本: ¥{(budget / 100).toFixed(0)} (约 {budget} 分)</p>
        </div>
      </div>

      {/* Submit */}
      <button
        onClick={handleSubmit}
        disabled={!idea.trim()}
        className="btn btn-brand w-full"
      >
        提交创作
      </button>
    </div>
  );
}
