'use client';

import { useState } from 'react';
import { pipelineApi } from '@/lib/api';

type TransitionSpeed = 'slow' | 'standard' | 'fast';
type SubtitleStyle = 'classic' | 'modern' | 'comic' | 'minimal';
type ToneShift = 'none' | 'lighter' | 'darker' | 'warmer' | 'cooler';

interface TweakParams {
  pace: number;            // 0.5 - 2.0
  hue_shift: number;       // 0 - 360
  bgm_volume: number;      // 0 - 100
  dialogue_volume: number; // 0 - 100
  transition_speed: TransitionSpeed;
  subtitle_style: SubtitleStyle;
  tone_shift: ToneShift;
}

interface TweakPanelProps {
  jobId: string;
  initialParams?: Partial<TweakParams>;
  onApply: (params: TweakParams) => void;
}

const DEFAULT_PARAMS: TweakParams = {
  pace: 1.0,
  hue_shift: 0,
  bgm_volume: 80,
  dialogue_volume: 90,
  transition_speed: 'standard',
  subtitle_style: 'classic',
  tone_shift: 'none',
};

export default function TweakPanel({ jobId, initialParams = {}, onApply }: TweakPanelProps) {
  const [params, setParams] = useState<TweakParams>({ ...DEFAULT_PARAMS, ...initialParams });
  const [applying, setApplying] = useState(false);

  const updateParam = <K extends keyof TweakParams>(key: K, value: TweakParams[K]) => {
    setParams((prev) => ({ ...prev, [key]: value }));
  };

  const handleApply = async () => {
    setApplying(true);
    try {
      await pipelineApi.tweak(jobId, {
        ...params,
        bgm_volume: params.bgm_volume / 100,
        dialogue_volume: params.dialogue_volume / 100,
      });
      onApply(params);
    } catch (err) {
      console.error('Tweak apply failed:', err);
    } finally {
      setApplying(false);
    }
  };

  const hueToStyle = (hue: number) => {
    const h = ((hue % 360) + 360) % 360;
    return `hsl(${h}, 70%, 50%)`;
  };

  return (
    <div className="w-full bg-surface border border-border rounded-lg p-5 space-y-5">
      <h3 className="text-sm font-semibold text-fg">微调参数</h3>

      {/* Pace slider */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-medium text-fg-2">视频节奏</label>
          <span className="text-xs text-accent font-mono">{params.pace.toFixed(1)}x</span>
        </div>
        <input
          type="range"
          min={0.5}
          max={2.0}
          step={0.1}
          value={params.pace}
          onChange={(e) => updateParam('pace', parseFloat(e.target.value))}
          className="w-full accent-accent"
        />
        <div className="flex justify-between text-[10px] text-meta mt-1">
          <span>慢 (0.5x)</span><span>标准 (1.0x)</span><span>快 (2.0x)</span>
        </div>
      </div>

      {/* Hue wheel (simplified as slider) */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-medium text-fg-2">色相偏移</label>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full border border-border" style={{ backgroundColor: hueToStyle(params.hue_shift) }} />
            <span className="text-xs text-accent font-mono">{params.hue_shift}°</span>
          </div>
        </div>
        <input
          type="range"
          min={0}
          max={360}
          step={5}
          value={params.hue_shift}
          onChange={(e) => updateParam('hue_shift', parseInt(e.target.value))}
          className="w-full accent-accent"
          style={{
            background: `linear-gradient(to right,
              hsl(0, 70%, 50%), hsl(60, 70%, 50%), hsl(120, 70%, 50%),
              hsl(180, 70%, 50%), hsl(240, 70%, 50%), hsl(300, 70%, 50%), hsl(360, 70%, 50%))`,
          }}
        />
        <div className="flex justify-between text-[10px] text-meta mt-1">
          <span>0°</span><span>180°</span><span>360°</span>
        </div>
      </div>

      {/* Tone shift */}
      <div>
        <label className="text-xs font-medium text-fg-2 mb-2 block">色调偏移</label>
        <div className="grid grid-cols-5 gap-1.5">
          {([
            { key: 'none' as ToneShift, label: '无' },
            { key: 'lighter' as ToneShift, label: '提亮' },
            { key: 'darker' as ToneShift, label: '压暗' },
            { key: 'warmer' as ToneShift, label: '暖调' },
            { key: 'cooler' as ToneShift, label: '冷调' },
          ]).map((t) => (
            <button
              key={t.key}
              onClick={() => updateParam('tone_shift', t.key)}
              className={`py-1.5 rounded-sm text-[11px] border transition-all ${
                params.tone_shift === t.key
                  ? 'border-accent bg-[color-mix(in_oklab,var(--accent)_10%,transparent)] text-accent'
                  : 'border-border text-fg-2 hover:border-[#555]'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* BGM Volume */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-medium text-fg-2">BGM 音量</label>
          <span className="text-xs text-accent font-mono">{params.bgm_volume}%</span>
        </div>
        <input
          type="range"
          min={0}
          max={100}
          step={5}
          value={params.bgm_volume}
          onChange={(e) => updateParam('bgm_volume', parseInt(e.target.value))}
          className="w-full accent-accent"
        />
      </div>

      {/* Dialogue Volume */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-medium text-fg-2">对白音量</label>
          <span className="text-xs text-accent font-mono">{params.dialogue_volume}%</span>
        </div>
        <input
          type="range"
          min={0}
          max={100}
          step={5}
          value={params.dialogue_volume}
          onChange={(e) => updateParam('dialogue_volume', parseInt(e.target.value))}
          className="w-full accent-accent"
        />
      </div>

      {/* Transition speed */}
      <div>
        <label className="text-xs font-medium text-fg-2 mb-2 block">转场速度</label>
        <div className="grid grid-cols-3 gap-2">
          {([
            { key: 'slow' as TransitionSpeed, label: '慢' },
            { key: 'standard' as TransitionSpeed, label: '标准' },
            { key: 'fast' as TransitionSpeed, label: '快' },
          ]).map((opt) => (
            <button
              key={opt.key}
              onClick={() => updateParam('transition_speed', opt.key)}
              className={`py-2 rounded-sm text-xs border transition-all ${
                params.transition_speed === opt.key
                  ? 'border-accent bg-[color-mix(in_oklab,var(--accent)_10%,transparent)] text-accent'
                  : 'border-border text-fg-2 hover:border-[#555]'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Subtitle style */}
      <div>
        <label className="text-xs font-medium text-fg-2 mb-2 block">字幕样式</label>
        <div className="grid grid-cols-4 gap-2">
          {([
            { key: 'classic' as SubtitleStyle, label: '经典' },
            { key: 'modern' as SubtitleStyle, label: '现代' },
            { key: 'comic' as SubtitleStyle, label: '漫画' },
            { key: 'minimal' as SubtitleStyle, label: '极简' },
          ]).map((opt) => (
            <button
              key={opt.key}
              onClick={() => updateParam('subtitle_style', opt.key)}
              className={`py-2 rounded-sm text-xs border transition-all ${
                params.subtitle_style === opt.key
                  ? 'border-accent bg-[color-mix(in_oklab,var(--accent)_10%,transparent)] text-accent'
                  : 'border-border text-fg-2 hover:border-[#555]'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Apply button */}
      <button
        onClick={handleApply}
        disabled={applying}
        className="btn btn-brand w-full"
      >
        {applying ? '应用参数中...' : '应用微调'}
      </button>
    </div>
  );
}
