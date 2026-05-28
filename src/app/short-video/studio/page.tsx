'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

/* ═══════════════════════════════════════════════════════════════════════
 * /short-video/studio — Visual Factory creative studio (Flava layout)
 * 1:1 replica of Thash-video-design/video-studio.html
 * Three-panel: Storyboard list | Pipeline output | Agent chat
 * Bottom: Timeline
 * ═══════════════════════════════════════════════════════════════════════ */

type StageKey = 'script' | 'storyboard' | 'visual' | 'audio' | 'compose';
type AgentStatus = 'pending' | 'initializing' | 'analyzing' | 'executing' | 'turn_complete' | 'error';
type SceneStatus = 'pending' | 'generating' | 'done' | 'edited';

interface StoryboardItem {
  id: string;
  index: number;
  title: string;
  type: string;
  duration: number;
  status: SceneStatus;
  emotion: string;
  cost: number;
}

interface AgentStage {
  key: StageKey;
  label: string;
  icon: string;
  agent: string;
  status: AgentStatus;
  model: string;
  duration: string;
  cost: number;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'agent' | 'system';
  text: string;
  timestamp: Date;
  toolCalls?: string[];
}

const INITIAL_SHOTS: StoryboardItem[] = [
  { id: 's1', index: 1, title: '开场 · 口播介绍', type: '口播', duration: 12, status: 'done', emotion: '激情', cost: 0.32 },
  { id: 's2', index: 2, title: '产品特写展示', type: '产品展示', duration: 15, status: 'generating', emotion: '专业', cost: 0.40 },
  { id: 's3', index: 3, title: '使用效果对比', type: '产品展示', duration: 20, status: 'pending', emotion: '轻松', cost: 0 },
  { id: 's4', index: 4, title: '结尾 · 行动号召', type: '结尾', duration: 10, status: 'pending', emotion: '激情', cost: 0 },
];

const AGENT_STAGES: AgentStage[] = [
  { key: 'script', label: '脚本', icon: '✏️', agent: '编剧 Agent', status: 'turn_complete', model: 'GPT-4o', duration: '~45s', cost: 0.08 },
  { key: 'storyboard', label: '分镜', icon: '🎬', agent: '导演 Agent', status: 'turn_complete', model: 'Claude', duration: '~60s', cost: 0.12 },
  { key: 'visual', label: '视觉', icon: '🎨', agent: '视觉生成 Agent', status: 'executing', model: 'SDXL', duration: '~120s', cost: 0.35 },
  { key: 'audio', label: '音频', icon: '🔊', agent: '音频 Agent', status: 'pending', model: 'ElevenLabs', duration: '—', cost: 0 },
  { key: 'compose', label: '合成', icon: '🧩', agent: '合成 Agent', status: 'pending', model: 'FFmpeg', duration: '—', cost: 0 },
];

const STAGE_OUTPUTS: Record<StageKey, string> = {
  script: `[脚本阶段 · 已完成]

场景一：开场 · 口播介绍（12秒 · 口播 · 激情）
  旁白：大家好，欢迎来到本期产品推荐！今天我们要介绍一款改变生活的神器——夏季护肤精华液。

场景二：产品特写展示（15秒 · 产品展示 · 专业）
  旁白：这款精华液采用天然植物提取配方，含有玻尿酸、维生素C和胶原蛋白三重活性成分。

场景三：使用效果对比（20秒 · 产品展示 · 轻松）
  旁白：使用一周后，肌肤水润度提升45%，千人实测，满意度高达98%！

场景四：结尾 · 行动号召（10秒 · 结尾 · 激情）
  旁白：限时优惠仅剩3天！点击下方链接立即购买。`,
  storyboard: `[分镜阶段 · 已完成]

S01 · 开场口播 | 中景 · 平视 · 固定 | 12s | CLIP 91
  视觉Prompt: Medium shot of female host in modern studio...
  状态: ✅ done

S02 · 产品特写 | 特写 · 俯视 · 推 | 15s | CLIP 78
  视觉Prompt: Close-up macro shot of bottle on rotating...
  状态: 🔄 generating

S03 · 效果对比 | 近景 · 平视 · 固定 | 20s | —
  状态: ⏳ pending

S04 · 行动号召 | 中景 · 平视 · 跟 | 10s | —
  状态: ⏳ pending`,
  visual: `[视觉生成阶段 · 执行中...]

当前任务：为 S02 生成产品特写视觉素材
进度：78% — 正在优化 CLIP 评分
预计完成：45s

已完成：
- S01 · 开场口播 — 已生成 3 个候选素材 — CLIP 91 ✅`,
  audio: `[音频阶段 · 等待上游完成]

等待视觉生成完成后开始音频合成。
将生成 4 段旁白音频，使用默认主播音色。`,
  compose: `[合成阶段 · 等待上游完成]

等待所有分镜完成视觉和音频生成后开始合成。
最终输出：9:16 竖版视频，30fps，1080p。`,
};

const INITIAL_CHAT: ChatMessage[] = [
  { id: 'm1', role: 'system', text: '欢迎来到创作工坊。我是你的 AI 创作助手，可以用自然语言指挥我完成所有操作。试试：「把第3个分镜改成产品特写，背景换成城市夜景」', timestamp: new Date() },
];

function statusIndicator(status: AgentStatus): string {
  const map: Record<AgentStatus, string> = {
    pending: '⏺',
    initializing: '⏺',
    analyzing: '⏺',
    executing: '⏺',
    turn_complete: '✅',
    error: '⚠️',
  };
  return map[status];
}

function statusColor(status: AgentStatus): string {
  const map: Record<AgentStatus, string> = {
    pending: 'var(--muted)',
    initializing: 'var(--accent)',
    analyzing: 'var(--accent)',
    executing: 'var(--accent)',
    turn_complete: 'var(--accent)',
    error: 'var(--danger)',
  };
  return map[status];
}

function statusPulse(status: AgentStatus): boolean {
  return ['analyzing', 'executing'].includes(status);
}

function sceneStatusBadge(status: SceneStatus): string {
  const map: Record<SceneStatus, string> = { pending: '⏳', generating: '🔄', done: '✅', edited: '✏️' };
  return map[status];
}

/* ─── Icons ─────────────────────────────────────────────────────────────── */

function IconPlay() {
  return <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor"><path d="M5 4l8 4-8 4V4z"/></svg>;
}
function IconPlus() {
  return <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M8 3v10M3 8h10" strokeLinecap="round"/></svg>;
}
function IconSend() {
  return <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M15 1L8 8M15 1L10 15 8 8 1 5 15 1z"/></svg>;
}
function IconChevronLeft() {
  return <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M10 3L5 8l5 5"/></svg>;
}
function IconPanelLeft() {
  return <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="1" y="2" width="14" height="12" rx="2"/><line x1="6" y1="2" x2="6" y2="14"/></svg>;
}
function IconPanelRight() {
  return <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="1" y="2" width="14" height="12" rx="2"/><line x1="10" y1="2" x2="10" y2="14"/></svg>;
}
function IconFolder() {
  return <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/></svg>;
}

export default function VideoStudioPage() {
  const searchParams = useSearchParams();
  const projectId = searchParams.get('id') || '';
  const projectName = searchParams.get('name') || '未命名项目';

  const [scenes, setScenes] = useState<StoryboardItem[]>(INITIAL_SHOTS);
  const [activeSceneId, setActiveSceneId] = useState<string>(INITIAL_SHOTS[0]?.id || '');
  const [activeStage, setActiveStage] = useState<StageKey>('script');
  const [stages, setStages] = useState<AgentStage[]>(AGENT_STAGES);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(INITIAL_CHAT);
  const [chatInput, setChatInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [collapsedLeft, setCollapsedLeft] = useState(false);
  const [collapsedRight, setCollapsedRight] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [activeSceneInspector, setActiveSceneInspector] = useState<string | null>(null);

  const activeScene = useMemo(() => scenes.find((s) => s.id === activeSceneId), [scenes, activeSceneId]);

  const totalDuration = useMemo(() => scenes.reduce((sum, s) => sum + s.duration, 0), [scenes]);
  const totalCost = useMemo(() => scenes.reduce((sum, s) => sum + s.cost, 0), [scenes]);

  /* ── Left panel: scene selection ── */
  const handleSelectScene = useCallback((id: string) => {
    setActiveSceneId(id);
  }, []);

  const handleAddScene = useCallback(() => {
    const newIdx = scenes.length + 1;
    const newScene: StoryboardItem = {
      id: `s${Date.now()}`,
      index: newIdx,
      title: `分镜 ${newIdx}`,
      type: '口播',
      duration: 10,
      status: 'pending',
      emotion: '温和',
      cost: 0,
    };
    setScenes((prev) => [...prev, newScene]);
    setActiveSceneId(newScene.id);
  }, [scenes.length]);

  /* ── Center: pipeline stage switch ── */
  const handleStageClick = useCallback((key: StageKey) => {
    setActiveStage(key);
  }, []);

  /* ── Right: chat ── */
  const handleSendMessage = useCallback(() => {
    const text = chatInput.trim();
    if (!text) return;

    const userMsg: ChatMessage = { id: `u${Date.now()}`, role: 'user', text, timestamp: new Date() };
    setChatMessages((prev) => [...prev, userMsg]);
    setChatInput('');
    setIsTyping(true);

    // Simulate agent response
    setTimeout(() => {
      let response = '';
      let toolCalls: string[] | undefined;

      if (text.includes('分镜') || text.includes('场景')) {
        response = `收到！正在根据你的要求修改分镜内容。\n\n已更新分镜配置：\n- 识别到关键词：分镜修改\n- 正在调用导演 Agent 更新分镜参数\n- 完成后将自动刷新分镜列表和预览\n\n相关分镜已标记为待重新生成状态。`;
        toolCalls = ['Read storyboard.json', 'Edit shot config', 'Update visual prompt'];
      } else if (text.includes('角色')) {
        response = `已识别角色管理意图。\n\n如果要修改角色属性，请前往「角色管理」页面进行详细编辑。\n当前项目中使用的角色：默认主播、产品展示员。`;
      } else if (text.includes('导出')) {
        response = `导出功能已就绪。\n\n建议在导出前确认：\n1. 所有分镜已完成生成\n2. 音频已合成\n3. 视觉素材 CLIP 评分 ≥ 70\n\n准备好后可以前往「导出管理」页面。`;
      } else {
        response = `收到你的指令：「${text}」\n\n正在分析意图并调用相应的 Agent...\n\n你可以进一步指定：\n- 具体分镜编号（如 S02）\n- 修改参数（如景别、角度、运镜）\n- 风格要求（如「电影级质感」「温暖色调」）`;
        toolCalls = ['Analyze intent', 'Route to agent'];
      }

      const agentMsg: ChatMessage = { id: `a${Date.now()}`, role: 'agent', text: response, timestamp: new Date(), toolCalls };
      setChatMessages((prev) => [...prev, agentMsg]);
      setIsTyping(false);
    }, 1200);
  }, [chatInput]);

  /* ── Timeline ── */
  const handleTimelineClick = useCallback((sceneId: string) => {
    setActiveSceneId(sceneId);
  }, []);

  const togglePlayAll = useCallback(() => {
    setPlaying((p) => !p);
  }, []);

  /* ── Scene inspector ── */
  const handleSceneClickTimeline = useCallback((sceneId: string) => {
    setActiveSceneInspector(sceneId);
    setActiveSceneId(sceneId);
  }, []);

  return (
    <div className="vst-shell">
      {/* Top bar */}
      <div className="vst-topbar">
        <a href="/short-video/projects" className="vst-topbar-back">
          <IconChevronLeft /> 返回
        </a>
        <span className="vst-topbar-divider" />
        <span className="vst-topbar-brand">视觉工厂</span>
        <span className="vst-topbar-divider" />
        <span className="vst-topbar-title">{projectName}</span>
        <div className="vst-topbar-spacer" />
        <div className="vst-topbar-status">
          <span className="vst-status-dot running" />
          {stages.filter((s) => s.status === 'executing').length > 0 ? 'Agent 运行中' : '就绪'}
        </div>
        <a href="/short-video/export" className="btn btn-brand btn-sm" style={{ textDecoration: 'none', marginLeft: 12 }}>
          导出
        </a>
      </div>

      {/* Main body */}
      <div className="vst-body">
        {/* Left panel: Storyboard */}
        {!collapsedLeft && (
          <div className="vst-left">
            <div className="vst-panel-header">
              <span className="vst-panel-title">故事板</span>
              <div className="vst-panel-actions">
                <button className="vst-icon-btn" onClick={handleAddScene} title="添加分镜"><IconPlus /></button>
                <button className="vst-icon-btn" onClick={() => setCollapsedLeft(true)} title="收起"><IconPanelLeft /></button>
              </div>
            </div>
            <div className="vst-storyboard-list">
              {scenes.map((s) => (
                <div
                  key={s.id}
                  className={`vst-shot-card${activeSceneId === s.id ? ' active' : ''}`}
                  onClick={() => handleSelectScene(s.id)}
                >
                  <div className="vst-shot-thumb">
                    <span className="vst-shot-index">S{s.index.toString().padStart(2, '0')}</span>
                    <span className="vst-shot-duration">{s.duration}s</span>
                  </div>
                  <div className="vst-shot-info">
                    <div className="vst-shot-title">{s.title}</div>
                    <div className="vst-shot-tags">
                      <span className="vst-shot-tag">{s.type}</span>
                      <span className="vst-shot-tag">{s.emotion}</span>
                    </div>
                    <div className="vst-shot-cost">¥{s.cost.toFixed(2)}</div>
                  </div>
                  <div className="vst-shot-status" title={s.status}>
                    {sceneStatusBadge(s.status)}
                  </div>
                </div>
              ))}
              {scenes.length === 0 && (
                <div className="vst-empty-shots">
                  <p>暂无分镜</p>
                  <button className="btn btn-brand btn-sm" onClick={handleAddScene}>
                    <IconPlus /> 添加分镜
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Collapsed left toggle */}
        {collapsedLeft && (
          <button className="vst-panel-edge left" onClick={() => setCollapsedLeft(false)} title="展开故事板">
            <IconPanelLeft />
            <span className="vst-edge-label">故事板</span>
          </button>
        )}

        {/* Center panel: Pipeline output */}
        <div className="vst-center">
          {/* Pipeline tabs */}
          <div className="vst-pipeline-tabs">
            {stages.map((stage) => (
              <button
                key={stage.key}
                className={`vst-pipe-tab${activeStage === stage.key ? ' active' : ''}`}
                onClick={() => handleStageClick(stage.key)}
              >
                <span className="vst-pipe-icon">{stage.icon}</span>
                <span className="vst-pipe-label">{stage.label}</span>
                <span
                  className={`vst-pipe-status${statusPulse(stage.status) ? ' pulse' : ''}`}
                  style={{ color: statusColor(stage.status) }}
                >
                  {statusIndicator(stage.status)}
                </span>
              </button>
            ))}
          </div>

          {/* Stage output */}
          <div className="vst-stage-content">
            <div className="vst-stage-header">
              <h3 className="vst-stage-title">
                {stages.find((s) => s.key === activeStage)?.icon}{' '}
                {stages.find((s) => s.key === activeStage)?.label}生成
              </h3>
              <div className="vst-stage-meta">
                {stages.find((s) => s.key === activeStage)?.agent} · {stages.find((s) => s.key === activeStage)?.model} · {stages.find((s) => s.key === activeStage)?.duration}
              </div>
            </div>

            <div className="vst-stage-agent-status">
              <span
                className={`vst-agent-indicator${statusPulse(stages.find((s) => s.key === activeStage)?.status || 'pending') ? ' pulse' : ''}`}
                style={{ background: statusColor(stages.find((s) => s.key === activeStage)?.status || 'pending') }}
              />
              <span className="vst-agent-status-text">
                {stages.find((s) => s.key === activeStage)?.status === 'executing' ? '生成中...' :
                 stages.find((s) => s.key === activeStage)?.status === 'turn_complete' ? '已完成' :
                 '等待中'}
              </span>
            </div>

            <pre className="vst-stage-output">{STAGE_OUTPUTS[activeStage]}</pre>
          </div>
        </div>

        {/* Collapsed right toggle */}
        {collapsedRight && (
          <button className="vst-panel-edge right" onClick={() => setCollapsedRight(false)} title="展开对话">
            <IconPanelRight />
            <span className="vst-edge-label">对话</span>
          </button>
        )}

        {/* Right panel: Agent chat */}
        {!collapsedRight && (
          <div className="vst-right">
            <div className="vst-panel-header">
              <span className="vst-panel-title">Agent 对话</span>
              <button className="vst-icon-btn" onClick={() => setCollapsedRight(true)} title="收起">
                <IconPanelRight />
              </button>
            </div>
            <div className="vst-chat-messages">
              {chatMessages.map((m) => (
                <div key={m.id} className={`vst-chat-msg ${m.role}`}>
                  {m.role === 'system' && (
                    <div className="vst-chat-system">{m.text}</div>
                  )}
                  {m.role === 'user' && (
                    <div className="vst-chat-user">{m.text}</div>
                  )}
                  {m.role === 'agent' && (
                    <div className="vst-chat-agent">
                      {m.toolCalls && m.toolCalls.length > 0 && (
                        <div className="vst-tool-calls">
                          {m.toolCalls.map((tc, i) => (
                            <span key={i} className="vst-tool-call">{tc}</span>
                          ))}
                        </div>
                      )}
                      <div className="vst-chat-agent-text" style={{ whiteSpace: 'pre-wrap' }}>{m.text}</div>
                    </div>
                  )}
                </div>
              ))}
              {isTyping && (
                <div className="vst-chat-typing">
                  <span className="vst-typing-dot" />
                  <span className="vst-typing-dot" />
                  <span className="vst-typing-dot" />
                </div>
              )}
            </div>
            <div className="vst-chat-composer">
              <textarea
                className="vst-chat-input"
                placeholder="用自然语言指挥 AI，例如：「把第3个分镜改成产品特写，背景换成城市夜景」"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                rows={2}
              />
              <button className="vst-chat-send" onClick={handleSendMessage} disabled={!chatInput.trim()}>
                <IconSend />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Bottom timeline */}
      <div className="vst-timeline">
        <div className="vst-timeline-controls">
          <button className={`vst-tl-btn${playing ? ' active' : ''}`} onClick={togglePlayAll}>
            {playing ? '⏸ 暂停' : '▶ 播放全部'}
          </button>
          <span className="vst-tl-duration">总时长 {Math.floor(totalDuration / 60)}:{(totalDuration % 60).toString().padStart(2, '0')}</span>
          <span className="vst-tl-cost">总成本 ¥{totalCost.toFixed(2)}</span>
        </div>
        <div className="vst-timeline-track">
          {scenes.map((s) => {
            const widthPct = (s.duration / Math.max(totalDuration, 1)) * 100;
            return (
              <div
                key={s.id}
                className={`vst-tl-segment${activeSceneId === s.id ? ' active' : ''}`}
                style={{ flex: widthPct }}
                onClick={() => handleTimelineClick(s.id)}
              >
                <div className="vst-tl-segment-label">S{s.index.toString().padStart(2, '0')}</div>
                <div className="vst-tl-segment-bar">
                  <div className="vst-tl-segment-fill" style={{ width: s.status === 'done' ? '100%' : s.status === 'generating' ? '60%' : '5%' }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <style jsx>{`
        .vst-shell { display: flex; flex-direction: column; height: 100%; overflow: hidden; }

        /* Topbar */
        .vst-topbar {
          height: 48px; background: var(--surface); border-bottom: 1px solid var(--border);
          display: flex; align-items: center; padding: 0 14px; gap: 10px; flex-shrink: 0; z-index: 100;
        }
        .vst-topbar-back {
          display: flex; align-items: center; gap: 4px; color: var(--muted); font-size: 12px;
          text-decoration: none; padding: 4px 8px; border-radius: 4px; transition: color 0.15s;
        }
        .vst-topbar-back:hover { color: var(--fg); }
        .vst-topbar-divider { width: 1px; height: 16px; background: var(--border); }
        .vst-topbar-brand { font-size: 12px; color: var(--muted); }
        .vst-topbar-title { font-size: 13px; font-weight: 500; color: var(--fg); }
        .vst-topbar-spacer { flex: 1; }
        .vst-topbar-status { display: flex; align-items: center; gap: 6px; font-size: 12px; color: var(--muted); }
        .vst-status-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--muted); }
        .vst-status-dot.running { background: var(--accent); animation: vstPulse 1.5s ease-in-out infinite; }
        @keyframes vstPulse { 0%,100% { opacity: 1; } 50% { opacity: 0.4; } }

        /* Body */
        .vst-body { display: flex; flex: 1; overflow: hidden; }

        /* Left panel */
        .vst-left { width: 260px; flex-shrink: 0; background: var(--surface); border-right: 1px solid var(--border); display: flex; flex-direction: column; overflow: hidden; }
        .vst-panel-header {
          padding: 10px 14px; border-bottom: 1px solid var(--border);
          display: flex; align-items: center; gap: 8px; flex-shrink: 0;
        }
        .vst-panel-title {
          font-size: 10px; font-family: var(--font-mono); color: var(--meta);
          text-transform: uppercase; letter-spacing: 1px; flex: 1;
        }
        .vst-panel-actions { display: flex; gap: 4px; }
        .vst-icon-btn {
          width: 26px; height: 26px; border-radius: 4px; border: 1px solid var(--border);
          background: transparent; color: var(--muted); cursor: pointer;
          display: flex; align-items: center; justify-content: center; transition: all 0.15s;
        }
        .vst-icon-btn:hover { background: var(--border-soft); color: var(--fg); }

        .vst-storyboard-list { flex: 1; overflow-y: auto; padding: 6px 8px; }
        .vst-shot-card {
          background: var(--bg); border: 1px solid var(--border); border-radius: 8px;
          padding: 8px; margin-bottom: 6px; cursor: pointer; transition: all 0.15s; position: relative;
        }
        .vst-shot-card:hover { border-color: #363636; }
        .vst-shot-card.active { border-color: var(--accent); background: rgba(62,207,142,0.04); }
        .vst-shot-thumb {
          aspect-ratio: 16/9; background: var(--border-soft); border-radius: 4px;
          margin-bottom: 6px; display: flex; align-items: center; justify-content: center;
          position: relative; overflow: hidden;
        }
        .vst-shot-index { font-size: 18px; color: rgba(250,250,250,0.12); font-family: var(--font-mono); }
        .vst-shot-duration {
          position: absolute; bottom: 3px; right: 4px; background: rgba(0,0,0,0.65);
          color: var(--fg); font-size: 9px; font-family: var(--font-mono); padding: 1px 4px; border-radius: 3px;
        }
        .vst-shot-title { font-size: 12px; font-weight: 500; color: var(--fg); margin-bottom: 2px; }
        .vst-shot-tags { display: flex; gap: 4px; margin-bottom: 2px; }
        .vst-shot-tag { font-size: 9px; padding: 1px 5px; border-radius: 3px; background: var(--border-soft); color: var(--muted); }
        .vst-shot-cost { font-size: 10px; color: var(--meta); font-family: var(--font-mono); }
        .vst-shot-status { position: absolute; top: 4px; right: 6px; font-size: 10px; }
        .vst-empty-shots { text-align: center; padding: 40px 16px; color: var(--muted); font-size: 12px; }

        /* Panel edge toggle */
        .vst-panel-edge {
          width: 28px; flex-shrink: 0; background: var(--surface); border: none;
          border-left: 1px solid var(--border); cursor: pointer; display: flex;
          flex-direction: column; align-items: center; justify-content: center;
          gap: 6px; color: var(--muted); transition: all 0.15s; padding: 0;
        }
        .vst-panel-edge.right { border-left: 1px solid var(--border); border-right: none; }
        .vst-panel-edge.left { border-right: 1px solid var(--border); }
        .vst-panel-edge:hover { color: var(--fg); background: var(--border-soft); }
        .vst-edge-label {
          writing-mode: vertical-rl; font-size: 9px; font-family: var(--font-mono);
          text-transform: uppercase; letter-spacing: 0.5px;
        }

        /* Center panel */
        .vst-center { flex: 1; display: flex; flex-direction: column; overflow: hidden; min-width: 0; }

        /* Pipeline tabs */
        .vst-pipeline-tabs {
          display: flex; padding: 10px 14px; gap: 6px; border-bottom: 1px solid var(--border);
          background: var(--bg); flex-shrink: 0;
        }
        .vst-pipe-tab {
          display: flex; align-items: center; gap: 6px; padding: 6px 14px;
          border-radius: 6px; border: 1px solid var(--border); background: var(--surface);
          color: var(--muted); font-size: 12px; font-family: var(--font-body); cursor: pointer;
          transition: all 0.15s;
        }
        .vst-pipe-tab:hover { border-color: #363636; color: var(--fg); }
        .vst-pipe-tab.active { border-color: var(--accent); color: var(--accent); background: rgba(62,207,142,0.06); }
        .vst-pipe-icon { font-size: 14px; }
        .vst-pipe-status { font-size: 10px; }
        .vst-pipe-status.pulse { animation: vstPulse 1.5s ease-in-out infinite; }

        /* Stage content */
        .vst-stage-content { flex: 1; overflow-y: auto; padding: 20px 24px; }
        .vst-stage-header { margin-bottom: 14px; }
        .vst-stage-title { font-size: 15px; font-weight: 500; margin: 0 0 4px; font-family: var(--font-display); }
        .vst-stage-meta { font-size: 11px; color: var(--muted); }
        .vst-stage-agent-status { display: flex; align-items: center; gap: 8px; }
        .vst-agent-indicator {
          width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0;
        }
        .vst-agent-indicator.pulse { animation: vstPulse 1.5s ease-in-out infinite; }
        .vst-agent-status-text { font-size: 12px; color: var(--muted); }
        .vst-stage-output {
          margin-top: 12px; padding: 16px; background: var(--border-soft); border: 1px solid var(--border);
          border-radius: 8px; font-size: 13px; line-height: 1.7; color: var(--fg-2);
          font-family: var(--font-mono); white-space: pre-wrap; overflow-x: auto;
        }

        /* Right panel: Chat */
        .vst-right { width: 340px; flex-shrink: 0; background: var(--surface); border-left: 1px solid var(--border); display: flex; flex-direction: column; overflow: hidden; }
        .vst-chat-messages { flex: 1; overflow-y: auto; padding: 12px 14px; display: flex; flex-direction: column; gap: 10px; }
        .vst-chat-msg.system { text-align: center; }
        .vst-chat-system {
          font-size: 12px; color: var(--muted); line-height: 1.6; padding: 10px 14px;
          background: var(--border-soft); border-radius: 8px; border: 1px solid var(--border);
        }
        .vst-chat-user {
          font-size: 13px; color: var(--fg); padding: 8px 12px; border-radius: 8px;
          background: rgba(62,207,142,0.08); border: 1px solid rgba(62,207,142,0.15);
          align-self: flex-end; max-width: 85%; line-height: 1.5;
        }
        .vst-chat-agent { max-width: 90%; }
        .vst-tool-calls { display: flex; flex-wrap: wrap; gap: 4px; margin-bottom: 6px; }
        .vst-tool-call {
          font-size: 10px; padding: 2px 7px; border-radius: 4px; background: var(--border-soft);
          color: var(--accent); font-family: var(--font-mono);
        }
        .vst-chat-agent-text {
          font-size: 12px; color: var(--fg-2); line-height: 1.6; padding: 8px 12px;
          background: var(--border-soft); border-radius: 8px; border: 1px solid var(--border);
        }
        .vst-chat-typing { display: flex; gap: 4px; padding: 8px 12px; }
        .vst-typing-dot {
          width: 6px; height: 6px; border-radius: 50%; background: var(--muted);
          animation: vstBounce 0.8s ease infinite;
        }
        .vst-typing-dot:nth-child(2) { animation-delay: 0.15s; }
        .vst-typing-dot:nth-child(3) { animation-delay: 0.3s; }
        @keyframes vstBounce { 0%,100% { opacity: 0.3; transform: translateY(0); } 50% { opacity: 1; transform: translateY(-4px); } }
        .vst-chat-composer {
          display: flex; gap: 6px; padding: 10px 14px; border-top: 1px solid var(--border); flex-shrink: 0;
        }
        .vst-chat-input {
          flex: 1; background: var(--border-soft); border: 1px solid var(--border); border-radius: 8px;
          padding: 8px 12px; color: var(--fg); font-size: 12px; font-family: var(--font-body);
          resize: none; outline: none; line-height: 1.5;
        }
        .vst-chat-input:focus { border-color: var(--accent); }
        .vst-chat-send {
          width: 36px; height: 36px; border-radius: 8px; border: 1px solid var(--accent);
          background: rgba(62,207,142,0.1); color: var(--accent); cursor: pointer;
          display: flex; align-items: center; justify-content: center; flex-shrink: 0;
          transition: all 0.15s; padding: 0; align-self: flex-end;
        }
        .vst-chat-send:hover:not(:disabled) { background: rgba(62,207,142,0.2); }
        .vst-chat-send:disabled { opacity: 0.3; cursor: default; border-color: var(--border); background: transparent; color: var(--muted); }

        /* Timeline */
        .vst-timeline {
          height: 72px; flex-shrink: 0; background: var(--surface); border-top: 1px solid var(--border);
          display: flex; flex-direction: column; padding: 0 14px;
        }
        .vst-timeline-controls {
          display: flex; align-items: center; gap: 12px; padding: 6px 0; flex-shrink: 0;
        }
        .vst-tl-btn {
          display: flex; align-items: center; gap: 4px; padding: 3px 10px; border-radius: 4px;
          border: 1px solid var(--border); background: transparent; color: var(--muted);
          font-size: 11px; cursor: pointer; font-family: var(--font-body); transition: all 0.15s;
        }
        .vst-tl-btn:hover { border-color: #363636; color: var(--fg); }
        .vst-tl-btn.active { border-color: var(--accent); color: var(--accent); }
        .vst-tl-duration, .vst-tl-cost { font-size: 11px; color: var(--muted); font-family: var(--font-mono); }

        .vst-timeline-track { display: flex; align-items: stretch; gap: 3px; flex: 1; padding-bottom: 8px; }
        .vst-tl-segment {
          flex: 1; display: flex; flex-direction: column; justify-content: flex-end; gap: 3px;
          cursor: pointer; min-width: 40px; transition: opacity 0.15s;
        }
        .vst-tl-segment:hover { opacity: 0.85; }
        .vst-tl-segment.active .vst-tl-segment-bar { border-color: var(--accent); }
        .vst-tl-segment-label { font-size: 9px; color: var(--meta); font-family: var(--font-mono); text-align: center; }
        .vst-tl-segment-bar {
          height: 20px; border-radius: 4px; background: var(--border-soft); border: 1px solid var(--border);
          overflow: hidden; position: relative;
        }
        .vst-tl-segment-fill {
          height: 100%; border-radius: 3px; background: var(--accent); opacity: 0.35; transition: width 0.5s;
        }

        /* Responsive */
        @media (max-width: 1023px) {
          .vst-left { width: 220px; }
          .vst-right { width: 280px; }
          .vst-pipeline-tabs { overflow-x: auto; -webkit-overflow-scrolling: touch; }
          .vst-pipe-tab { white-space: nowrap; flex-shrink: 0; }
        }
        @media (max-width: 767px) {
          .vst-body { flex-direction: column; }
          .vst-left { width: 100%; max-height: 180px; border-right: none; border-bottom: 1px solid var(--border); }
          .vst-right { width: 100%; max-height: 240px; border-left: none; border-top: 1px solid var(--border); }
          .vst-center { flex: 1; min-height: 300px; }
          .vst-timeline { height: 56px; }
          .vst-topbar { padding: 0 10px; }
          .vst-topbar-title { display: none; }
          .vst-panel-edge { width: 100%; height: 24px; flex-direction: row; }
          .vst-edge-label { writing-mode: horizontal-tb; }
        }
      `}</style>
    </div>
  );
}
