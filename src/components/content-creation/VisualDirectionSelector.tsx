'use client';

import { useAppStore } from '@/stores/app';

type DesignSystemId = 'cinematic' | 'anime' | 'watercolor' | 'dark' | 'warm';

interface DesignSystem {
  id: DesignSystemId;
  label: string;
  description: string;
  colorPalette: string[];
  typography: string;
  atmosphere: string;
}

const DESIGN_SYSTEMS: DesignSystem[] = [
  {
    id: 'cinematic',
    label: '电影写实',
    description: '好莱坞级电影质感，真实光影与物理摄像机模拟',
    colorPalette: ['#1a1a2e', '#16213e', '#0f3460', '#e94560'],
    typography: '严肃衬线体 / Cinematic Serif',
    atmosphere: '史诗感、沉浸式、大银幕',
  },
  {
    id: 'anime',
    label: '动漫渲染',
    description: '日式动漫风格，三渲二技术，鲜明色彩与动态线条',
    colorPalette: ['#2d1b69', '#6b3fa0', '#ff6b6b', '#ffd93d'],
    typography: '活泼无衬线体 / Anime Sans',
    atmosphere: '活力、夸张、青春感',
  },
  {
    id: 'watercolor',
    label: '水墨国风',
    description: '中国传统水墨画风格，留白意境与笔触质感',
    colorPalette: ['#1a1a1a', '#2d2d2d', '#8b9d83', '#c4a882'],
    typography: '书法楷体 / 国风楷体',
    atmosphere: '禅意、留白、东方美学',
  },
  {
    id: 'dark',
    label: '暗黑美学',
    description: '哥特式暗黑风格，高对比度光影与氛围感',
    colorPalette: ['#0a0a0a', '#1a1a1a', '#3d0000', '#8b0000'],
    typography: '哥特体 / Dark Gothic',
    atmosphere: '神秘、压抑、暗黑浪漫',
  },
  {
    id: 'warm',
    label: '田园暖调',
    description: '温暖治愈风格，柔光滤镜与自然色调',
    colorPalette: ['#2c1810', '#5c3a2e', '#d4a574', '#f5deb3'],
    typography: '圆体手写 / Warm Rounded',
    atmosphere: '温馨、治愈、田园诗',
  },
];

export default function VisualDirectionSelector() {
  const { activeDesignSystem, setActiveDesignSystem } = useAppStore();

  const currentId = (activeDesignSystem || 'cinematic') as DesignSystemId;

  return (
    <div className="w-full p-3 space-y-4">
      <h2 className="text-lg font-semibold text-fg">视觉方向</h2>
      <p className="text-sm text-muted mb-4">
        选择一个视觉方向，AI 将在所有下游生成中保持一致的视觉风格
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {DESIGN_SYSTEMS.map((ds) => {
          const isActive = currentId === ds.id;

          return (
            <button
              key={ds.id}
              onClick={() => setActiveDesignSystem(ds.id)}
              className={`relative p-3 rounded-lg border-2 text-left transition-all duration-200 ${
                isActive
                  ? 'border-accent bg-[color-mix(in_oklab,var(--accent)_6%,transparent)] shadow-accent/10 shadow-lg'
                  : 'border-border hover:border-[#555] bg-surface'
              }`}
            >
              {/* Color palette preview */}
              <div className="flex gap-1 mb-3">
                {ds.colorPalette.map((color, i) => (
                  <div
                    key={i}
                    className="flex-1 h-3 rounded-sm"
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>

              <h3 className="text-sm font-semibold text-fg mb-1">{ds.label}</h3>
              <p className="text-xs text-muted mb-2 leading-relaxed">{ds.description}</p>

              <div className="space-y-1 text-[10px] text-meta">
                <div className="flex flex-col gap-0.5">
                  <span>字体</span>
                  <span className="text-fg-2 break-words">{ds.typography}</span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span>氛围</span>
                  <span className="text-fg-2 break-words">{ds.atmosphere}</span>
                </div>
              </div>

              {/* Active indicator */}
              {isActive && (
                <div className="absolute top-2 right-2 w-5 h-5 bg-accent rounded-full flex items-center justify-center">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Active direction summary */}
      {currentId && (
        <div className="mt-6 p-4 bg-bg border border-border rounded-sm">
          <p className="text-xs text-muted">
            当前方向：
            <span className="text-accent font-medium">
              {DESIGN_SYSTEMS.find((d) => d.id === currentId)?.label}
            </span>
            — 此选择将影响角色设计、场景渲染、视频风格和后期调色
          </p>
        </div>
      )}
    </div>
  );
}
