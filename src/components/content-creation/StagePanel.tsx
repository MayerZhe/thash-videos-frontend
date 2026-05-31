'use client';

import { useState } from 'react';
import type { StageLabel } from '@/lib/types';

// ─── Stage 01: Source Content ───
export function SourceContentPanel({ data }: { data?: Record<string, unknown> }) {
  const initialText = typeof data?.raw_text === 'string' ? data.raw_text : '';
  const [rawText, setRawText] = useState(initialText);
  const [analysis, setAnalysis] = useState<Record<string, unknown> | null>(() => {
    if (data?.raw_text) {
      return {
        characters: Array.isArray(data.detected_characters) ? data.detected_characters : [],
        scenes: Array.isArray(data.detected_scenes) ? data.detected_scenes : [],
        tone: typeof data.tone === 'string' ? data.tone : '',
        episodes: 3,
        word_count: String(data.raw_text).length,
      };
    }
    return null;
  });

  const handleAnalyze = () => {
    // Simulate NLP analysis
    setAnalysis({
      characters: ['男主·萧炎', '女主·萧薰儿', '药老', '反派·韩枫'],
      scenes: ['乌坦城·萧家', '魔兽山脉', '坊市', '云岚宗'],
      episodes: 3,
      tone: '热血玄幻+成长',
      word_count: rawText.length,
    });
  };

  return (
    <div className="ws-split">
      {/* Left: Source Editor */}
      <div className="ws-left">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-normal text-fg">原始内容</h3>
          <button className="btn btn-brand btn-sm" onClick={handleAnalyze}>分析</button>
        </div>
        <textarea
          className="flex-1 bg-surface border border-border rounded-sm p-4 text-sm text-fg-2 font-mono resize-none outline-none focus:border-accent min-h-[380px]"
          placeholder="粘贴或输入原始故事内容、小说片段、创意描述..."
          value={rawText}
          onChange={(e) => setRawText(e.target.value)}
        />
      </div>

      {/* Right: NLP Analysis */}
      <div className="ws-right">
        <h4 className="text-sm font-medium text-fg mb-4">NLP 分析结果</h4>
        {analysis ? (
          <div className="space-y-4">
            {Object.entries(analysis).map(([key, val]) => (
              <div key={key}>
                <p className="text-[11px] text-meta uppercase mb-1">{key}</p>
                {Array.isArray(val) ? (
                  <div className="flex flex-wrap gap-1.5">
                    {val.map((v: string) => (
                      <span key={v} className="badge badge-muted text-[11px]">{v}</span>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-fg-2">{String(val)}</p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted">输入内容后点击「分析」，AI 将提取角色、场景、基调等信息。</p>
        )}
      </div>
    </div>
  );
}

// ─── Stage 02: Script Rewrite ───
export function ScriptRewritePanel({ data }: { data?: Record<string, unknown> }) {
  const initialScript = typeof data?.formatted_script === 'string' ? data.formatted_script : '';
  const [script, setScript] = useState(initialScript);

  return (
    <div className="ws-split">
      <div className="ws-left">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-normal text-fg">AI 改写剧本</h3>
          <button className="btn btn-brand btn-sm">生成</button>
        </div>
        <textarea
          className="flex-1 bg-surface border border-border rounded-sm p-4 text-sm text-fg-2 resize-none outline-none focus:border-accent font-mono"
          placeholder="AI 生成的格式化剧本将在此显示..."
          value={script}
          onChange={(e) => setScript(e.target.value)}
        />
      </div>
      <div className="ws-right">
        <h4 className="text-sm font-medium text-fg mb-4">统计与分析</h4>
        <div className="space-y-3">
          <div className="bg-bg border border-border rounded-sm p-3">
            <p className="text-[11px] text-meta mb-1">对白统计</p>
            <p className="text-sm text-fg-2">{script.split('：').length - 1} 句对白</p>
          </div>
          <div className="bg-bg border border-border rounded-sm p-3">
            <p className="text-[11px] text-meta mb-1">场景切换</p>
            <p className="text-sm text-fg-2">{(script.match(/场景|Scene/g) || []).length} 处</p>
          </div>
          <div>
            <p className="text-[11px] text-meta mb-2">标注图例</p>
            <div className="space-y-1 text-xs">
              <p className="text-warn">⚠ 对白 — 黄色高亮</p>
              <p className="text-accent">✓ 场景 — 绿色标记</p>
              <p className="text-muted">· 旁白 — 灰色</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Stage 03: Character Management ───
export function CharacterPanel({ data }: { data?: Record<string, unknown> }) {
  const [selectedChar, setSelectedChar] = useState<number | null>(null);

  const pipelineChars = Array.isArray(data?.characters) ? data.characters as Array<Record<string, unknown>> : null;
  const characters = pipelineChars && pipelineChars.length > 0
    ? pipelineChars.map((c, i) => ({
        id: (c.id as number) || i + 1,
        name: (c.name as string) || `角色 ${i + 1}`,
        role: (c.role as string) || '未知',
        age: c.age as number | null,
        traits: Array.isArray(c.traits) ? c.traits as string[] : [],
        voice: (c.voice_id as string) || '未配置',
      }))
    : [
    { id: 1, name: '萧炎', role: '男主', age: 17, traits: ['坚韧', '机智', '重情义'], voice: 'MiniMax 男03' },
    { id: 2, name: '萧薰儿', role: '女主', age: 16, traits: ['冷艳', '聪慧', '独立'], voice: 'FishAudio 女02' },
    { id: 3, name: '药老', role: '导师', age: null, traits: ['神秘', '睿智', '幽默'], voice: 'MiniMax 男05' },
    { id: 4, name: '韩枫', role: '反派', age: 28, traits: ['野心', '狠辣', '阴沉'], voice: 'Edge TTS 男02' },
  ];

  return (
    <div className="ws-split">
      {/* Left: Character List */}
      <div className="ws-right" style={{ borderRight: '1px solid var(--border-soft)', borderLeft: 'none', paddingLeft: 0, paddingRight: 16 }}>
        <h3 className="text-lg font-normal text-fg mb-4">角色管理</h3>
        <div className="space-y-1">
          {characters.map((char) => (
            <div
              key={char.id}
              onClick={() => setSelectedChar(char.id)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-sm cursor-pointer transition-all border
                ${selectedChar === char.id
                  ? 'bg-[color-mix(in_oklab,var(--accent)_10%,transparent)] border-[color-mix(in_oklab,var(--accent)_20%,transparent)]'
                  : 'border-transparent hover:bg-surface hover:border-border'
                }`}
            >
              <div className="w-8 h-8 rounded-pill bg-accent flex items-center justify-center text-accent-on text-xs font-medium">
                {char.name[0]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-fg">{char.name}</p>
                <p className="text-xs text-muted">{char.role}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right: Character Detail Inspector */}
      <div className="ws-left">
        {selectedChar ? (
          (() => {
            const char = characters.find((c) => c.id === selectedChar)!;
            return (
              <div className="space-y-5">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-pill bg-accent flex items-center justify-center text-accent-on text-lg font-medium">
                    {char.name[0]}
                  </div>
                  <div>
                    <h4 className="text-xl font-normal text-fg">{char.name}</h4>
                    <p className="text-sm text-muted">{char.role} · {char.age ? `${char.age}岁` : '未知年龄'}</p>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-meta uppercase mb-2">性格特质</p>
                  <div className="flex flex-wrap gap-1.5">
                    {char.traits.map((t) => (
                      <span key={t} className="badge badge-accent text-xs">{t}</span>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs text-meta uppercase mb-2">语音配置</p>
                  <p className="text-sm text-fg-2 bg-bg border border-border rounded-sm px-3 py-2">{char.voice}</p>
                </div>
                <button className="btn btn-ghost btn-sm">编辑角色</button>
              </div>
            );
          })()
        ) : (
          <div className="flex items-center justify-center h-full text-muted text-sm">
            点击左侧角色查看详情
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Stage 04: Scene Management ───
export function ScenePanel({ data }: { data?: Record<string, unknown> }) {
  const [selectedScene, setSelectedScene] = useState<number | null>(null);

  const pipelineScenes = Array.isArray(data?.scenes) ? data.scenes as Array<Record<string, unknown>> : null;
  const scenes = pipelineScenes && pipelineScenes.length > 0
    ? pipelineScenes.map((s, i) => ({
        id: (s.id as number) || i + 1,
        name: (s.location as string) || (s.name as string) || `场景 ${i + 1}`,
        time: (s.time_of_day as string) || '白天',
        ambiance: (s.ambiance as string) || '普通',
        chars: Array.isArray(s.characters) ? s.characters as string[] : [],
        description: `位置: ${s.location || '未知'}`,
      }))
    : [
    { id: 1, name: '乌坦城·萧家', time: '白天', ambiance: '温馨+压抑', chars: ['萧炎', '萧薰儿'], description: '萧家大院，青石铺地，古色古香' },
    { id: 2, name: '魔兽山脉', time: '黄昏', ambiance: '危险+神秘', chars: ['萧炎', '药老'], description: '密林深处，雾气缭绕，野兽低吼' },
    { id: 3, name: '坊市', time: '白天', ambiance: '热闹+喧嚣', chars: ['萧炎'], description: '修真者交易的集市，摊位林立' },
    { id: 4, name: '云岚宗大殿', time: '夜晚', ambiance: '庄严+肃穆', chars: ['韩枫'], description: '高耸的石柱，摇曳的烛光' },
  ];

  return (
    <div className="ws-split">
      <div className="ws-right" style={{ borderRight: '1px solid var(--border-soft)', borderLeft: 'none', paddingLeft: 0, paddingRight: 16 }}>
        <h3 className="text-lg font-normal text-fg mb-4">场景管理</h3>
        <div className="space-y-1">
          {scenes.map((scene) => (
            <div
              key={scene.id}
              onClick={() => setSelectedScene(scene.id)}
              className={`px-3 py-2.5 rounded-sm cursor-pointer transition-all border
                ${selectedScene === scene.id
                  ? 'bg-[color-mix(in_oklab,var(--accent)_10%,transparent)] border-[color-mix(in_oklab,var(--accent)_20%,transparent)]'
                  : 'border-transparent hover:bg-surface hover:border-border'
                }`}
            >
              <div className="flex items-center gap-2">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="1.75" strokeLinecap="round">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" />
                </svg>
                <p className="text-sm font-medium text-fg">{scene.name}</p>
              </div>
              <p className="text-xs text-muted mt-1 ml-6">{scene.time} · {scene.ambiance}</p>
            </div>
          ))}
        </div>
      </div>
      <div className="ws-left">
        {selectedScene ? (
          (() => {
            const scene = scenes.find((s) => s.id === selectedScene)!;
            return (
              <div className="space-y-5">
                <div>
                  <h4 className="text-xl font-normal text-fg mb-1">{scene.name}</h4>
                  <p className="text-sm text-muted">{scene.time} · {scene.ambiance}</p>
                </div>
                <div>
                  <p className="text-xs text-meta uppercase mb-2">出场角色</p>
                  <div className="flex flex-wrap gap-1.5">
                    {scene.chars.map((c) => (
                      <span key={c} className="badge badge-muted text-xs">{c}</span>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs text-meta uppercase mb-2">场景描述</p>
                  <p className="text-sm text-fg-2 bg-bg border border-border rounded-sm px-3 py-2">{scene.description}</p>
                </div>
              </div>
            );
          })()
        ) : (
          <div className="flex items-center justify-center h-full text-muted text-sm">
            点击左侧场景查看详情
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Stage 05: Storyboard ───
export function StoryboardPanel({ data }: { data?: Record<string, unknown> }) {
  const [selectedShot, setSelectedShot] = useState<number | null>(null);

  const pipelineShots = Array.isArray(data?.shots) ? data.shots as Array<Record<string, unknown>> : null;
  const shots = pipelineShots && pipelineShots.length > 0
    ? pipelineShots.map((s, i) => ({
        id: (s.shot_id as number) || i + 1,
        type: (s.shot_type as string) || 'Medium Shot',
        camera: (s.camera_motion as string) || 'Static',
        duration: (s.duration_seconds as number) || 5,
        dialogue: Array.isArray(s.dialogue) && s.dialogue.length > 0
          ? { speaker: (s.dialogue as Array<Record<string, unknown>>)[0]?.speaker as string || '', line: (s.dialogue as Array<Record<string, unknown>>)[0]?.line as string || '' }
          : undefined,
      }))
    : Array.from({ length: 8 }, (_, i) => ({
    id: i + 1,
    type: ['Medium Shot', 'Close-up', 'Long Shot', 'Medium Shot', 'Close-up', 'Long Shot', 'Medium Shot', 'Close-up'][i],
    camera: ['Static', 'Pan Left', 'Zoom In', 'Static', 'Pan Right', 'Zoom Out', 'Static', 'Zoom In'][i],
    duration: [5, 3, 8, 4, 6, 7, 5, 4][i],
    dialogue: [
      { speaker: '萧炎', line: '这里...就是修仙界？' },
      { speaker: '药老', line: '小子，你可知那戒指里封印的是何等存在？' },
      { speaker: '萧炎', line: '我不知道...但我能感受到它的强大。' },
      { speaker: '药老', line: '很好。那我们开始吧。' },
    ].find((_, di) => di === Math.floor(i / 2)),
  }));

  return (
    <div className="flex flex-col h-full">
      {/* Timeline strip */}
      <div className="ws-full overflow-x-auto overflow-y-hidden">
        <div className="flex gap-4 min-w-max h-full items-start">
          {shots.map((shot) => (
            <div
              key={shot.id}
              onClick={() => setSelectedShot(shot.id)}
              className={`w-[200px] flex-shrink-0 bg-surface border rounded-lg p-4 cursor-pointer transition-all
                ${selectedShot === shot.id
                  ? 'border-accent'
                  : 'border-border hover:border-accent'
                }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-xs text-accent">Shot {shot.id}</span>
                <span className="text-[10px] text-meta">{shot.duration}s</span>
              </div>
              <p className="text-xs text-fg-2 mb-1">{shot.type}</p>
              <p className="text-xs text-muted mb-3">{shot.camera}</p>
              {shot.dialogue && (
                <div className="bg-bg border border-border-soft rounded-sm p-2">
                  <p className="text-[10px] text-warn font-medium mb-0.5">{shot.dialogue.speaker}</p>
                  <p className="text-[11px] text-fg-2 leading-relaxed">{shot.dialogue.line}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Bottom: Shot detail */}
      <div className="h-[200px] border-t border-border-soft p-6 overflow-y-auto">
        {selectedShot ? (
          (() => {
            const shot = shots.find((s) => s.id === selectedShot)!;
            return (
              <div className="grid grid-cols-4 gap-4">
                <div>
                  <p className="text-[11px] text-meta mb-1">景别</p>
                  <p className="text-sm text-fg">{shot.type}</p>
                </div>
                <div>
                  <p className="text-[11px] text-meta mb-1">运镜</p>
                  <p className="text-sm text-fg">{shot.camera}</p>
                </div>
                <div>
                  <p className="text-[11px] text-meta mb-1">时长</p>
                  <p className="text-sm text-fg">{shot.duration}s</p>
                </div>
                <div>
                  <p className="text-[11px] text-meta mb-1">对白</p>
                  <p className="text-sm text-fg">{shot.dialogue ? `${shot.dialogue.speaker}: ${shot.dialogue.line}` : '无'}</p>
                </div>
              </div>
            );
          })()
        ) : (
          <p className="text-muted text-sm">点击上方分镜卡片查看详情</p>
        )}
      </div>
    </div>
  );
}

// ─── Stage 06: Image Generation ───
export function ImageGalleryPanel({ data }: { data?: Record<string, unknown> }) {
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);

  const pipelineAssets = Array.isArray(data?.assets) ? data.assets as Array<Record<string, unknown>> : null;
  const images = pipelineAssets && pipelineAssets.length > 0
    ? pipelineAssets.map((a, i) => ({
        id: (a.id as number) || i + 1,
        shotLabel: `Shot ${i + 1}`,
        status: (a.status as 'done' | 'processing' | 'pending' | 'failed') || 'done',
        clipScore: (a.clip_score as number) || 0.9,
        supplier: (a.supplier as string) || 'Seedream',
        model: 'Seedream 3.0',
        resolution: '1920×1080',
        seed: 420000 + i * 173,
        prompt: `Shot ${i + 1}`,
        generatedAt: '2026-05-27',
      }))
    : Array.from({ length: 12 }, (_, i) => ({
    id: i + 1,
    shotLabel: `Shot ${i + 1}`,
    status: (['done', 'done', 'processing', 'done', 'done', 'pending', 'done', 'done', 'failed', 'done', 'pending', 'done'] as const)[i],
    clipScore: [0.92, 0.88, 0.75, 0.95, 0.84, 0.67, 0.91, 0.79, 0.45, 0.89, 0.72, 0.93][i],
    supplier: 'Seedream',
    model: 'Seedream 3.0',
    resolution: '1920×1080',
    seed: 420000 + i * 173,
    prompt: `分镜${i + 1}: ${['萧炎初次进入修仙界', '药老从戒指中显现', '坊市交易场景', '魔兽山脉战斗', '云岚宗对峙', '药老传授功法', '萧炎突破境界', '萧薰儿出场', '韩枫阴谋败露', '丹药炼制过程', '宗门比试', '最终决战'][i]}`,
    generatedAt: '2026-05-27 14:3' + i,
  }));

  const statusLabel: Record<string, string> = {
    done: '已生成', processing: '生成中', pending: '待生成', failed: '失败',
  };
  const statusColor: Record<string, string> = {
    done: 'bg-success', processing: 'bg-accent animate-pulse', pending: 'bg-border', failed: 'bg-danger',
  };
  const clipColor = (score: number) =>
    score >= 0.9 ? 'text-success' : score >= 0.75 ? 'text-warn' : 'text-danger';

  return (
    <div className="ws-split">
      {/* Left: Thumbnail gallery */}
      <div className="ws-right" style={{ width: 420, borderRight: '1px solid var(--border-soft)', borderLeft: 'none', paddingLeft: 0, paddingRight: 16 }}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-normal text-fg">图片生成</h3>
          <span className="text-xs text-muted">{images.filter((i) => i.status === 'done').length}/{images.length} 已完成</span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {images.map((img) => (
            <div
              key={img.id}
              onClick={() => setSelectedIdx(img.id - 1)}
              className={`bg-surface border rounded-sm overflow-hidden cursor-pointer transition-all
                ${selectedIdx === img.id - 1
                  ? 'border-accent'
                  : 'border-border hover:border-accent'
                }`}
            >
              {/* Thumbnail area */}
              <div className="h-[90px] bg-bg flex items-center justify-center relative">
                {img.status === 'done' ? (
                  <div className="w-full h-full bg-[color-mix(in_oklab,var(--accent)_15%,var(--bg))] flex items-center justify-center">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5" fill="var(--accent)"/><path d="M21 15l-5-5L5 21"/></svg>
                  </div>
                ) : img.status === 'processing' ? (
                  <div className="flex flex-col items-center gap-1">
                    <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-pill animate-spin" />
                    <span className="text-[10px] text-muted">生成中...</span>
                  </div>
                ) : img.status === 'failed' ? (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--danger)" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
                ) : (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
                )}
                {/* Status badge */}
                <span className={`absolute top-1.5 right-1.5 text-[10px] px-1.5 py-0.5 rounded-sm text-bg font-medium ${statusColor[img.status]}`}>
                  {statusLabel[img.status]}
                </span>
              </div>
              {/* Bottom bar */}
              <div className="px-2.5 py-2 flex items-center justify-between">
                <span className="text-xs text-fg-2 font-mono">{img.shotLabel}</span>
                <span className={`text-[10px] font-mono font-medium ${clipColor(img.clipScore)}`}>
                  CLIP {(img.clipScore * 100).toFixed(0)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right: Detail preview */}
      <div className="ws-left">
        {selectedIdx !== null ? (
          (() => {
            const img = images[selectedIdx];
            return (
              <div className="space-y-5">
                <h4 className="text-xl font-normal text-fg">{img.shotLabel} · 预览</h4>
                {/* Large preview */}
                <div className="w-full h-[200px] bg-[color-mix(in_oklab,var(--accent)_10%,var(--bg))] border border-border rounded-sm flex items-center justify-center">
                  {img.status === 'done' ? (
                    <div className="text-center">
                      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5" fill="var(--accent)"/><path d="M21 15l-5-5L5 21"/></svg>
                      <p className="text-xs text-muted mt-2">{img.resolution}</p>
                    </div>
                  ) : (
                    <span className="text-sm text-muted">{statusLabel[img.status]}</span>
                  )}
                </div>
                {/* Metadata */}
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: '供应商', value: img.supplier },
                    { label: '模型', value: img.model },
                    { label: '分辨率', value: img.resolution },
                    { label: 'Seed', value: String(img.seed) },
                  ].map((m) => (
                    <div key={m.label} className="bg-bg border border-border rounded-sm p-3">
                      <p className="text-[10px] text-meta uppercase mb-1">{m.label}</p>
                      <p className="text-sm text-fg-2">{m.value}</p>
                    </div>
                  ))}
                </div>
                {/* CLIP Score bar */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs text-meta uppercase">CLIP 评分</p>
                    <span className={`text-sm font-mono font-medium ${clipColor(img.clipScore)}`}>
                      {(img.clipScore * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="h-2 bg-border-soft rounded-pill overflow-hidden">
                    <div
                      className={`h-full rounded-pill transition-all duration-500 ${
                        img.clipScore >= 0.9 ? 'bg-success' : img.clipScore >= 0.75 ? 'bg-warn' : 'bg-danger'
                      }`}
                      style={{ width: `${img.clipScore * 100}%` }}
                    />
                  </div>
                </div>
                {/* Prompt */}
                <div>
                  <p className="text-[10px] text-meta uppercase mb-2">生成 Prompt</p>
                  <p className="text-xs text-fg-2 bg-bg border border-border-soft rounded-sm p-3 leading-relaxed">{img.prompt}</p>
                </div>
              </div>
            );
          })()
        ) : (
          <div className="flex items-center justify-center h-full text-muted text-sm">
            点击左侧图片查看详情与元数据
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Stage 07: Video Generation ───
export function VideoGalleryPanel({ data }: { data?: Record<string, unknown> }) {
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);

  const pipelineVids = Array.isArray(data?.videos) ? data.videos as Array<Record<string, unknown>> : null;
  const videos = pipelineVids && pipelineVids.length > 0
    ? pipelineVids.map((v, i) => ({
        id: (v.id as number) || i + 1,
        shotLabel: `Shot ${i + 1}`,
        status: (v.status as 'done' | 'processing' | 'pending' | 'failed') || 'done',
        clipScore: (v.clip_score as number) || 0.9,
        duration: (v.duration_seconds as number) || 5,
        supplier: (v.supplier as string) || 'Seedance',
        model: 'Seedance 1.0',
        resolution: '1920×1080',
        fps: 24,
        frames: 120,
      }))
    : Array.from({ length: 12 }, (_, i) => ({
    id: i + 1,
    shotLabel: `Shot ${i + 1}`,
    status: (['done', 'done', 'processing', 'done', 'done', 'pending', 'done', 'done', 'failed', 'done', 'pending', 'done'] as const)[i],
    clipScore: [0.89, 0.85, 0.72, 0.93, 0.81, 0.64, 0.88, 0.76, 0.42, 0.87, 0.70, 0.91][i],
    duration: [5.2, 3.1, 8.0, 4.3, 6.0, 7.2, 5.0, 4.0, 2.5, 4.8, 6.5, 3.8][i],
    supplier: 'Seedance',
    model: 'Seedance 1.0',
    resolution: '1920×1080',
    fps: 24,
    frames: [125, 74, 192, 103, 144, 173, 120, 96, 60, 115, 156, 91][i],
  }));

  const statusLabel: Record<string, string> = {
    done: '已生成', processing: '生成中', pending: '待生成', failed: '失败',
  };
  const statusBg: Record<string, string> = {
    done: 'bg-success', processing: 'bg-accent', pending: 'bg-border', failed: 'bg-danger',
  };

  return (
    <div className="ws-split">
      {/* Left: Video thumbnail grid */}
      <div className="ws-right" style={{ width: 420, borderRight: '1px solid var(--border-soft)', borderLeft: 'none', paddingLeft: 0, paddingRight: 16 }}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-normal text-fg">视频生成</h3>
          <span className="text-xs text-muted">{videos.filter((v) => v.status === 'done').length}/{videos.length} 完成</span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {videos.map((vid) => {
            const borderColor = vid.clipScore >= 0.9
              ? 'border-l-success' : vid.clipScore >= 0.75
              ? 'border-l-warn' : 'border-l-danger';
            return (
              <div
                key={vid.id}
                onClick={() => setSelectedIdx(vid.id - 1)}
                className={`bg-surface border rounded-sm overflow-hidden cursor-pointer transition-all border-l-[3px]
                  ${borderColor}
                  ${selectedIdx === vid.id - 1
                    ? 'border-r-accent border-t-accent border-b-accent ring-1 ring-accent'
                    : 'border-r-border border-t-border border-b-border hover:border-r-accent hover:border-t-accent hover:border-b-accent'
                  }`}
              >
                {/* Video preview area */}
                <div className="h-[90px] bg-bg flex items-center justify-center relative">
                  {vid.status === 'done' ? (
                    <>
                      <div className="w-full h-full bg-[color-mix(in_oklab,var(--accent)_15%,var(--bg))] flex items-center justify-center">
                        <div className="w-8 h-8 rounded-pill bg-[color-mix(in_oklab,var(--accent)_40%,transparent)] flex items-center justify-center">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="var(--accent)" stroke="var(--accent)" strokeWidth="1"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                        </div>
                      </div>
                      <span className="absolute bottom-1 right-1.5 text-[10px] font-mono bg-bg/80 px-1 rounded-sm text-fg-2">{vid.duration}s</span>
                    </>
                  ) : vid.status === 'processing' ? (
                    <div className="flex flex-col items-center gap-1">
                      <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-pill animate-spin" />
                      <span className="text-[10px] text-muted">生成中...</span>
                    </div>
                  ) : (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
                  )}
                  <span className={`absolute top-1.5 right-1.5 text-[10px] px-1.5 py-0.5 rounded-sm text-bg font-medium ${statusBg[vid.status]}`}>
                    {statusLabel[vid.status]}
                  </span>
                </div>
                <div className="px-2.5 py-2 flex items-center justify-between">
                  <span className="text-xs text-fg-2 font-mono">{vid.shotLabel}</span>
                  <span className="text-[10px] text-muted font-mono">{vid.fps}fps</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Right: Preview + CLIP chart */}
      <div className="ws-left">
        {selectedIdx !== null ? (
          (() => {
            const vid = videos[selectedIdx];
            return (
              <div className="space-y-5">
                <h4 className="text-xl font-normal text-fg">{vid.shotLabel} · 视频预览</h4>
                {/* Large video preview */}
                <div className="w-full h-[220px] bg-[color-mix(in_oklab,var(--accent)_10%,var(--bg))] border border-border rounded-sm flex items-center justify-center">
                  {vid.status === 'done' ? (
                    <div className="text-center">
                      <div className="w-12 h-12 rounded-pill bg-[color-mix(in_oklab,var(--accent)_40%,transparent)] flex items-center justify-center mx-auto">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="var(--accent)" stroke="var(--accent)" strokeWidth="1"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                      </div>
                      <p className="text-xs text-muted mt-2">{vid.resolution} · {vid.duration}s · {vid.fps}fps</p>
                    </div>
                  ) : (
                    <span className="text-sm text-muted">{statusLabel[vid.status]}</span>
                  )}
                </div>
                {/* Metadata */}
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: '供应商', value: vid.supplier },
                    { label: '模型', value: vid.model },
                    { label: '分辨率', value: vid.resolution },
                    { label: '帧率', value: `${vid.fps} fps` },
                    { label: '总帧数', value: String(vid.frames) },
                    { label: '时长', value: `${vid.duration}s` },
                  ].map((m) => (
                    <div key={m.label} className="bg-bg border border-border rounded-sm p-3">
                      <p className="text-[10px] text-meta uppercase mb-1">{m.label}</p>
                      <p className="text-sm text-fg-2">{m.value}</p>
                    </div>
                  ))}
                </div>
                {/* CLIP Score bar chart — all shots */}
                <div>
                  <p className="text-xs text-meta uppercase mb-3">CLIP 评分对比 (全部镜头)</p>
                  <div className="space-y-1.5">
                    {videos.map((v) => (
                      <div key={v.id} className="flex items-center gap-3">
                        <span className="text-[10px] text-muted font-mono w-12 text-right">S{v.id < 10 ? '0' : ''}{v.id}</span>
                        <div className="flex-1 h-3 bg-border-soft rounded-pill overflow-hidden">
                          <div
                            className={`h-full rounded-pill transition-all duration-500 ${
                              v.clipScore >= 0.9 ? 'bg-success' : v.clipScore >= 0.75 ? 'bg-warn' : 'bg-danger'
                            }`}
                            style={{ width: `${v.clipScore * 100}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-fg-2 font-mono w-10">{(v.clipScore * 100).toFixed(0)}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })()
        ) : (
          <div className="flex items-center justify-center h-full text-muted text-sm">
            点击左侧视频查看详情与 CLIP 评分对比
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Stage 08: TTS Dubbing ───
export function TTSMatrixPanel({ data }: { data?: Record<string, unknown> }) {
  const pipelineVoices = Array.isArray(data?.voices) ? data.voices as Array<Record<string, unknown>> : null;
  const characters = pipelineVoices && pipelineVoices.length > 0
    ? pipelineVoices.map(v => (v.character_name as string) || '未知角色')
    : ['萧炎', '萧薰儿', '药老', '韩枫'];
  const suppliers = [
    { name: 'MiniMax', voices: ['男03·沉稳', '男05·沧桑', '女02·温柔', '男02·阴沉'] },
    { name: 'FishAudio', voices: ['男01·热血', '女01·冷艳', '男04·睿智', '男03·狠辣'] },
    { name: 'Edge TTS', voices: ['男02·标准', '女03·标准', '男01·标准', '男04·标准'] },
  ];

  const [selectedCell, setSelectedCell] = useState<{ char: number; sup: number } | null>(null);

  return (
    <div className="ws-split">
      {/* Left: Voice matrix */}
      <div className="ws-left">
        <h3 className="text-lg font-normal text-fg mb-4">TTS 配音 · 音色矩阵</h3>
        <p className="text-xs text-muted mb-4">行: 角色 · 列: 供应商 — 点击单元格选择音色</p>
        <div className="inline-block min-w-max">
          {/* Header row */}
          <div className="flex">
            <div className="w-[100px] flex-shrink-0" />
            {suppliers.map((sup) => (
              <div key={sup.name} className="w-[180px] flex-shrink-0 text-center py-2">
                <span className="text-xs font-medium text-fg">{sup.name}</span>
              </div>
            ))}
          </div>
          {/* Matrix rows */}
          {characters.map((char, ci) => (
            <div key={char} className="flex items-stretch">
              <div className="w-[100px] flex-shrink-0 flex items-center py-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-pill bg-accent flex items-center justify-center text-accent-on text-[11px] font-medium flex-shrink-0">
                    {char[0]}
                  </div>
                  <span className="text-sm font-medium text-fg">{char}</span>
                </div>
              </div>
              {suppliers.map((sup, si) => {
                const isSelected = selectedCell?.char === ci && selectedCell?.sup === si;
                return (
                  <button
                    key={sup.name}
                    onClick={() => setSelectedCell({ char: ci, sup: si })}
                    className={`w-[180px] flex-shrink-0 flex items-center gap-2 px-3 py-2.5 border rounded-sm m-0.5 transition-all text-left
                      ${isSelected
                        ? 'border-accent bg-[color-mix(in_oklab,var(--accent)_10%,transparent)]'
                        : 'border-border-soft bg-surface hover:border-border'
                      }`}
                  >
                    <div className={`w-6 h-6 rounded-pill flex items-center justify-center flex-shrink-0 ${
                      isSelected ? 'bg-accent' : 'bg-border-soft'
                    }`}>
                      <svg width="10" height="10" viewBox="0 0 24 24" fill={isSelected ? 'var(--accent-on)' : 'var(--muted)'}>
                        <polygon points="5 3 19 12 5 21 5 3" />
                      </svg>
                    </div>
                    <div className="min-w-0">
                      <p className={`text-xs truncate ${isSelected ? 'text-fg font-medium' : 'text-fg-2'}`}>
                        {sup.voices[ci]}
                      </p>
                      <p className="text-[10px] text-muted">点击试听</p>
                    </div>
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Right: Voice detail inspector */}
      <div className="ws-right">
        <h4 className="text-sm font-medium text-fg mb-4">音色详情</h4>
        {selectedCell ? (
          (() => {
            const char = characters[selectedCell.char];
            const sup = suppliers[selectedCell.sup];
            const voice = sup.voices[selectedCell.char];
            return (
              <div className="space-y-5">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-pill bg-accent flex items-center justify-center text-accent-on font-medium">
                    {char[0]}
                  </div>
                  <div>
                    <p className="text-lg font-normal text-fg">{char}</p>
                    <p className="text-sm text-muted">{voice}</p>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-meta uppercase mb-2">供应商</p>
                  <p className="text-sm text-fg-2 bg-bg border border-border rounded-sm px-3 py-2">{sup.name}</p>
                </div>
                <div>
                  <p className="text-xs text-meta uppercase mb-2">音色 ID</p>
                  <p className="text-sm text-fg-2 bg-bg border border-border rounded-sm px-3 py-2 font-mono">
                    {sup.name.toLowerCase()}-{voice.replace(/[^\w]/g, '-').toLowerCase()}
                  </p>
                </div>
                {/* Waveform visualization placeholder */}
                <div>
                  <p className="text-xs text-meta uppercase mb-2">波形预览</p>
                  <div className="h-[60px] bg-bg border border-border rounded-sm flex items-center justify-center gap-[2px] px-4">
                    {Array.from({ length: 40 }, (_, i) => (
                      <div
                        key={i}
                        className="w-[3px] bg-accent/60 rounded-pill"
                        style={{ height: `${14 + Math.sin(i * 0.5) * 12 + Math.sin(i * 1.7) * 8}px` }}
                      />
                    ))}
                  </div>
                </div>
                {/* Controls */}
                <div className="space-y-3">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] text-meta uppercase">语速</span>
                      <span className="text-[10px] text-fg-2 font-mono">1.0x</span>
                    </div>
                    <input type="range" min="0.5" max="2.0" step="0.1" defaultValue="1.0"
                      className="w-full h-1 bg-border-soft rounded-pill appearance-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-pill [&::-webkit-slider-thumb]:bg-accent" />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] text-meta uppercase">情感强度</span>
                      <span className="text-[10px] text-fg-2 font-mono">0.7</span>
                    </div>
                    <input type="range" min="0" max="1.0" step="0.1" defaultValue="0.7"
                      className="w-full h-1 bg-border-soft rounded-pill appearance-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-pill [&::-webkit-slider-thumb]:bg-accent" />
                  </div>
                </div>
                <button className="btn btn-brand btn-sm">应用音色</button>
              </div>
            );
          })()
        ) : (
          <div className="flex items-center justify-center h-full text-muted text-sm">
            点击左侧矩阵中的音色单元格查看详情
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Stage 09: Shot Composition ───
export function ShotCompositionPanel({ data }: { data?: Record<string, unknown> }) {
  const pipelineComps = Array.isArray(data?.compositions) ? data.compositions as Array<Record<string, unknown>> : null;
  const shots = pipelineComps && pipelineComps.length > 0
    ? pipelineComps.map((c, i) => {
        const progress = (c.progress as number) || 0;
        const status = (c.status as string) || 'pending';
        return {
          id: i + 1,
          label: (c.shot_id as string) || `Shot ${String(i + 1).padStart(2, '0')}`,
          type: 'Medium Shot',
          status: status === 'compositing' ? 'processing' as const : status === 'done' ? 'done' as const : status === 'pending' ? 'pending' as const : 'failed' as const,
          progress: status === 'done' ? 100 : status === 'compositing' ? progress : 0,
          imageSupplier: 'Seedream',
          videoSupplier: 'Seedance',
          ttsSupplier: 'MiniMax',
        };
      })
    : Array.from({ length: 12 }, (_, i) => ({
    id: i + 1,
    label: `Shot ${i < 9 ? '0' : ''}${i + 1}`,
    type: ['Medium Shot', 'Close-up', 'Long Shot', 'Medium Shot', 'Close-up', 'Long Shot', 'Medium Shot', 'Close-up', 'Wide Shot', 'Medium Shot', 'Long Shot', 'Close-up'][i],
    status: (['done', 'done', 'processing', 'done', 'done', 'pending', 'done', 'done', 'failed', 'done', 'pending', 'done'] as const)[i],
    progress: [100, 100, 64, 100, 100, 0, 100, 100, 32, 100, 0, 100][i],
    imageSupplier: 'Seedream',
    videoSupplier: 'Seedance',
    ttsSupplier: 'MiniMax',
  }));

  const counts = {
    total: shots.length,
    done: shots.filter((s) => s.status === 'done').length,
    processing: shots.filter((s) => s.status === 'processing').length,
    failed: shots.filter((s) => s.status === 'failed').length,
    pending: shots.filter((s) => s.status === 'pending').length,
  };

  return (
    <div className="flex flex-col h-full">
      {/* Summary bar */}
      <div className="px-6 py-4 border-b border-border-soft">
        <div className="flex items-center gap-6">
          <h3 className="text-lg font-normal text-fg">镜头合成</h3>
          <div className="flex gap-3 text-xs">
            <span className="text-fg-2">总计 <span className="text-fg font-medium">{counts.total}</span></span>
            <span className="text-success">已完成 <span className="font-medium">{counts.done}</span></span>
            <span className="text-accent">进行中 <span className="font-medium">{counts.processing}</span></span>
            <span className="text-danger">失败 <span className="font-medium">{counts.failed}</span></span>
            <span className="text-muted">待开始 <span className="font-medium">{counts.pending}</span></span>
          </div>
        </div>
      </div>

      {/* Composition queue */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-2 max-w-[960px]">
          {shots.map((shot) => (
            <div
              key={shot.id}
              className={`flex items-center gap-4 bg-surface border rounded-sm p-4 transition-all
                ${shot.status === 'processing' ? 'border-accent' : 'border-border'}`}
            >
              {/* Shot number */}
              <span className="font-mono text-sm text-accent w-16 flex-shrink-0">{shot.label}</span>
              {/* Thumbnail placeholder */}
              <div className="w-[72px] h-[40px] bg-bg border border-border-soft rounded-sm flex items-center justify-center flex-shrink-0">
                {shot.status === 'done' ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5" fill="var(--accent)"/><path d="M21 15l-5-5L5 21"/></svg>
                ) : shot.status === 'processing' ? (
                  <div className="w-4 h-4 border-2 border-accent border-t-transparent rounded-pill animate-spin" />
                ) : shot.status === 'failed' ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--danger)" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/></svg>
                )}
              </div>
              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm text-fg">{shot.type}</span>
                  <span className={`badge text-[10px] ${
                    shot.status === 'done' ? 'badge-success' :
                    shot.status === 'processing' ? 'badge-accent' :
                    shot.status === 'failed' ? 'badge-danger' : 'badge-muted'
                  }`}>
                    {shot.status === 'done' ? '已完成' : shot.status === 'processing' ? '进行中' : shot.status === 'failed' ? '失败' : '待开始'}
                  </span>
                </div>
                {/* Suppliers */}
                <div className="flex gap-3 text-[10px] text-muted">
                  <span>图片: {shot.imageSupplier}</span>
                  <span>视频: {shot.videoSupplier}</span>
                  <span>TTS: {shot.ttsSupplier}</span>
                </div>
              </div>
              {/* Progress bar */}
              <div className="w-[140px] flex-shrink-0">
                {shot.status === 'processing' ? (
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] text-accent font-mono">{shot.progress}%</span>
                    </div>
                    <div className="h-1.5 bg-border-soft rounded-pill overflow-hidden">
                      <div className="h-full bg-accent rounded-pill transition-all duration-500" style={{ width: `${shot.progress}%` }} />
                    </div>
                  </div>
                ) : shot.status === 'done' ? (
                  <div className="text-right">
                    <span className="text-xs text-success font-mono">100%</span>
                  </div>
                ) : shot.status === 'failed' ? (
                  <div className="text-right">
                    <button className="btn btn-ghost btn-sm text-[11px] text-danger">重试</button>
                  </div>
                ) : (
                  <div className="text-right">
                    <span className="text-xs text-muted">等待中</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Stage 10: Episode Merge ───
export function EpisodeMergePanel({ data }: { data?: Record<string, unknown> }) {
  const pipelineTimeline = Array.isArray(data?.merge_timeline) ? data.merge_timeline as Array<Record<string, unknown>> : null;
  const shots = pipelineTimeline && pipelineTimeline.length > 0
    ? pipelineTimeline.map((m, i) => ({
        id: i + 1,
        label: (m.shot_id as string) || `S${String(i + 1).padStart(2, '0')}`,
        type: 'Medium',
        duration: (m.duration as number) || 5,
        status: 'done' as const,
      }))
    : Array.from({ length: 12 }, (_, i) => ({
    id: i + 1,
    label: `S${i < 9 ? '0' : ''}${i + 1}`,
    type: ['Medium', 'Close-up', 'Long', 'Medium', 'Close-up', 'Long', 'Medium', 'Close-up', 'Wide', 'Medium', 'Long', 'Close-up'][i],
    duration: [5.2, 3.1, 8.0, 4.3, 6.0, 7.2, 5.0, 4.0, 2.5, 4.8, 6.5, 3.8][i],
    status: (['done', 'done', 'done', 'done', 'done', 'done', 'done', 'done', 'done', 'done', 'done', 'done'] as const)[i],
  }));

  const totalDuration = shots.reduce((sum, s) => sum + s.duration, 0);
  const maxDuration = Math.max(...shots.map((s) => s.duration));

  const durationColor = (d: number) =>
    d >= 7 ? 'bg-[color-mix(in_oklab,var(--accent)_85%,var(--bg))]' :
    d >= 5 ? 'bg-[color-mix(in_oklab,var(--accent)_60%,var(--bg))]' :
    d >= 3 ? 'bg-[color-mix(in_oklab,var(--accent)_40%,var(--bg))]' : 'bg-[color-mix(in_oklab,var(--accent)_20%,var(--bg))]';

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="p-4">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-normal text-fg">整集拼接</h3>
          <div className="flex gap-4 text-sm">
            <span className="text-muted">总时长 <span className="text-fg font-medium">{Math.floor(totalDuration / 60)}分{Math.round(totalDuration % 60)}秒</span></span>
            <span className="text-muted">镜头数 <span className="text-fg font-medium">{shots.length}</span></span>
            <span className="text-muted">平均 <span className="text-fg font-medium">{(totalDuration / shots.length).toFixed(1)}秒</span></span>
          </div>
        </div>

        {/* Timeline visualization */}
        <div className="mb-8">
          <h4 className="text-sm font-medium text-fg mb-4">拼接时间线</h4>
          <div className="bg-surface border border-border rounded-sm p-4">
            <div className="flex h-[80px] rounded-sm overflow-hidden">
              {shots.map((shot) => {
                const widthPct = (shot.duration / totalDuration) * 100;
                return (
                  <div
                    key={shot.id}
                    className={`${durationColor(shot.duration)} flex items-center justify-center transition-all hover:brightness-125 cursor-default`}
                    style={{ width: `${widthPct}%`, minWidth: '40px' }}
                    title={`${shot.label}: ${shot.type} — ${shot.duration}s`}
                  >
                    <div className="text-center">
                      <p className="text-[10px] font-mono text-fg font-medium">{shot.label}</p>
                      <p className="text-[9px] text-fg-2">{shot.duration}s</p>
                    </div>
                  </div>
                );
              })}
            </div>
            {/* Time markers */}
            <div className="flex justify-between mt-2 text-[10px] text-muted font-mono">
              <span>0:00</span>
              <span>{Math.floor(totalDuration / 120)}:{(Math.round(totalDuration / 2) % 60).toString().padStart(2, '0')}</span>
              <span>{Math.floor(totalDuration / 60)}:{(Math.round(totalDuration) % 60).toString().padStart(2, '0')}</span>
            </div>
          </div>
        </div>

        {/* Duration distribution bar chart */}
        <div className="mb-8">
          <h4 className="text-sm font-medium text-fg mb-4">分镜时长分布</h4>
          <div className="bg-surface border border-border rounded-sm p-6">
            <div className="flex items-end gap-4 h-[160px]">
              {shots.map((shot) => {
                const barHeight = (shot.duration / maxDuration) * 140;
                return (
                  <div key={shot.id} className="flex-1 flex flex-col items-center gap-2">
                    <span className="text-[10px] text-fg-2 font-mono">{shot.duration}s</span>
                    <div
                      className="w-full max-w-[40px] rounded-sm transition-all hover:brightness-125"
                      style={{
                        height: `${barHeight}px`,
                        backgroundColor: shot.duration >= 7 ? 'var(--accent)' :
                          shot.duration >= 5 ? 'color-mix(in oklab, var(--accent) 75%, var(--bg))' :
                          shot.duration >= 3 ? 'color-mix(in oklab, var(--accent) 50%, var(--bg))' : 'color-mix(in oklab, var(--accent) 25%, var(--bg))',
                        background: shot.duration >= 7
                          ? 'var(--accent)'
                          : shot.duration >= 5
                          ? 'color-mix(in oklab, var(--accent) 75%, var(--bg))'
                          : shot.duration >= 3
                          ? 'color-mix(in oklab, var(--accent) 50%, var(--bg))'
                          : 'color-mix(in oklab, var(--accent) 25%, var(--bg))',
                      }}
                    />
                    <span className="text-[10px] text-muted font-mono">{shot.label}</span>
                    <span className="text-[9px] text-muted">{shot.type}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Shot detail table */}
        <div>
          <h4 className="text-sm font-medium text-fg mb-4">镜头明细</h4>
          <table>
            <thead>
              <tr>
                <th>镜头</th><th>类型</th><th>时长</th><th>状态</th><th>占比</th>
              </tr>
            </thead>
            <tbody>
              {shots.map((shot) => (
                <tr key={shot.id}>
                  <td className="font-mono text-xs text-accent">{shot.label}</td>
                  <td className="text-sm text-fg-2">{shot.type}</td>
                  <td className="text-sm text-fg-2">{shot.duration}s</td>
                  <td><span className="badge badge-success text-[10px]">已完成</span></td>
                  <td className="text-sm text-fg-2">{((shot.duration / totalDuration) * 100).toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
