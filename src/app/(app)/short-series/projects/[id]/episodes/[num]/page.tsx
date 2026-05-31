'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAppStore } from '@/stores/app';
import { versionsApi, episodesApi, pipelineApi, BASE_URL } from '@/lib/api';
import { useToast } from '@/components/global/Toast';
import { type AgentStatus } from '@/components/content-creation/PipelineSidebar';
import PipelineModeSelector from '@/components/content-creation/PipelineModeSelector';
import Topbar from '@/components/content-creation/Topbar';
import AgentRuntime from '@/components/content-creation/AgentRuntime';
import type { AgentTurn } from '@/components/content-creation/AgentRuntime';
import DrawMode from '@/components/content-creation/DrawMode';
import VersionHistoryDrawer from '@/components/content-creation/VersionHistoryDrawer';
import DiffOverlay from '@/components/content-creation/DiffOverlay';
import {
  SourceContentPanel,
  ScriptRewritePanel,
  CharacterPanel,
  ScenePanel,
  StoryboardPanel,
  ImageGalleryPanel,
  VideoGalleryPanel,
  TTSMatrixPanel,
  ShotCompositionPanel,
  EpisodeMergePanel,
} from '@/components/content-creation/StagePanel';
import TweakPanel from '@/components/content-creation/TweakPanel';
import { STAGE_NAMES } from '@/lib/types';
import type { StageLabel, Version, PipelineState, PipelineJobStatus, PipelinePrecheckResponse } from '@/lib/types';

// Static export: no prerendered paths (all client-side routing).
export function generateStaticParams() { return []; }

export default function ContentCreationPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;
  const episodeNum = parseInt(params.num as string) || 1;

  const {
    activeStage, setActiveStage,
    activeTheme, setActiveTheme,
    rightPanelOpen, setRightPanelOpen,
  } = useAppStore();

  const { toast } = useToast();

  // ─── Data loading ───
  const [versions, setVersions] = useState<Version[]>([]);
  const [versionsLoading, setVersionsLoading] = useState(false);
  const [episodeState, setEpisodeState] = useState<PipelineState | null>(null);

  const loadVersions = useCallback(async () => {
    setVersionsLoading(true);
    try {
      const data = await versionsApi.list(projectId, {});
      setVersions(data.versions || []);
    } catch {
      setVersions([]);
    } finally {
      setVersionsLoading(false);
    }
  }, [projectId]);

  const loadEpisodeState = useCallback(async () => {
    try {
      const ep = await episodesApi.get(projectId, episodeNum);
      setEpisodeState(ep.pipeline_state as PipelineState || null);
    } catch {
      // Episode may not exist yet
    }
  }, [projectId, episodeNum]);

  useEffect(() => {
    loadVersions();
    loadEpisodeState();
  }, [loadVersions, loadEpisodeState]);

  const versionCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const v of versions) {
      const stage = v.pipeline_stage;
      if (stage) counts[stage] = (counts[stage] || 0) + 1;
    }
    return counts;
  }, [versions]);

  const computedStats = useMemo(() => {
    const state = episodeState as Record<string, unknown> | null;
    return {
      charCount: state?.character_management ? 8 : 0,
      sceneCount: state?.scene_management ? 5 : 0,
      shotCount: state?.storyboard ? 12 : 0,
    };
  }, [episodeState]);

  // ─── Pipeline job management ───
  const [activeJob, setActiveJob] = useState<PipelineJobStatus | null>(null);
  const [showPrecheck, setShowPrecheck] = useState(false);
  const [precheckResult, setPrecheckResult] = useState<PipelinePrecheckResponse | null>(null);
  const [precheckLoading, setPrecheckLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [pipelineError, setPipelineError] = useState<string | null>(null);

  const handlePrecheck = useCallback(async () => {
    setPrecheckLoading(true);
    setPipelineError(null);
    try {
      const result = await pipelineApi.precheck(projectId, episodeNum, {
        project_id: projectId,
        episode_number: episodeNum,
      });
      setPrecheckResult(result);
      setShowPrecheck(true);
    } catch (err) {
      toast(`预检失败: ${(err as Error).message}`);
    } finally {
      setPrecheckLoading(false);
    }
  }, [projectId, episodeNum, toast]);

  const handleSubmit = useCallback(async () => {
    setSubmitting(true);
    setPipelineError(null);
    try {
      const result = await pipelineApi.submit(projectId, episodeNum, {
        project_id: projectId,
        episode_number: episodeNum,
      });
      setShowPrecheck(false);
      setPrecheckResult(null);
      toast(`任务已提交: ${result.job_id}`);
      setActiveJob({
        job_id: result.job_id,
        status: 'queued',
        stage: 'source_content',
        stage_index: 0,
        total_stages: 11,
        progress_percent: 0,
      });
      setUrlJobId(result.job_id);
    } catch (err) {
      toast(`提交失败: ${(err as Error).message}`);
    } finally {
      setSubmitting(false);
    }
  }, [projectId, episodeNum, toast]);

  const handleCancel = useCallback(async () => {
    if (!activeJob || !confirm('确定取消当前任务？')) return;
    try {
      await pipelineApi.stop(activeJob.job_id);
      setActiveJob(prev => prev ? { ...prev, status: 'cancelled' } : null);
      toast('任务已取消');
    } catch (err) {
      toast(`取消失败: ${(err as Error).message}`);
    }
  }, [activeJob, toast]);

  const handleRetry = useCallback(async () => {
    if (!activeJob) return;
    try {
      const result = await pipelineApi.retry(activeJob.job_id);
      toast(`已重新提交: ${result.job_id}`);
      setActiveJob({
        job_id: result.job_id,
        status: 'queued',
        stage: 'source_content',
        stage_index: 0,
        total_stages: 11,
        progress_percent: 0,
      });
      setUrlJobId(result.job_id);
    } catch (err) {
      toast(`重试失败: ${(err as Error).message}`);
    }
  }, [activeJob, toast]);

  const handleGenerate = useCallback(async (stage: StageLabel, index: number) => {
    if (!confirm(`确定要生成「${STAGE_NAMES[stage]}」吗？`)) return;
    try {
      await episodesApi.generate(projectId, episodeNum, stage);
      toast(`${STAGE_NAMES[stage]} 生成任务已启动`);
    } catch (err) {
      toast(`生成失败: ${(err as Error).message}`);
    }
  }, [projectId, episodeNum, toast]);

  // ─── Agent runtime state ───
  const [agentDialogOpen, setAgentDialogOpen] = useState(false);
  const [agentTurns, setAgentTurns] = useState<AgentTurn[]>([]);
  const [agentMessages, setAgentMessages] = useState<Array<{ id: string; role: 'user' | 'assistant'; content: string; timestamp: string }>>([]);
  const [agentStreaming, setAgentStreaming] = useState(false);

  // SSE pipeline progress
  const [agentStates, setAgentStates] = useState<Record<string, AgentStatus>>({});
  const [reviewPointActive, setReviewPointActive] = useState(false);

  // Draw mode
  const [drawMode, setDrawMode] = useState(false);

  // Tweak panel
  const [tweakPanelOpen, setTweakPanelOpen] = useState(false);

  // Version history drawer
  const [versionDrawerOpen, setVersionDrawerOpen] = useState(false);

  // Current job ID from URL params
  const [urlJobId, setUrlJobId] = useState('');

  // Diff overlay
  const [diffOverlayOpen, setDiffOverlayOpen] = useState(false);
  const [diffPair, setDiffPair] = useState<{
    from: { id: string; shortId: string; label: string };
    to: { id: string; shortId: string; label: string };
  }>({ from: { id: '', shortId: '', label: '' }, to: { id: '', shortId: '', label: '' } });

  // Esc key to exit draw mode
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape' && drawMode) setDrawMode(false);
  }, [drawMode]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // SSE subscription
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const jobId = searchParams.get('job_id') || urlJobId;
    if (!jobId) return;
    setUrlJobId(jobId);

    const controller = new AbortController();
    const token = localStorage.getItem('thash_auth_token');

    (async () => {
      try {
        const sseHeaders: Record<string, string> = { 'Accept': 'text/event-stream' };
        if (token) sseHeaders['Authorization'] = `Bearer ${token}`;
        const response = await fetch(`${BASE_URL}/api/v1/pipeline/stream/${jobId}`, {
          signal: controller.signal,
          headers: sseHeaders,
        });

        const reader = response.body?.getReader();
        if (!reader) return;

        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const parsed = JSON.parse(line.slice(6));
                const eventType: string | undefined = parsed.data?.event_type || parsed.event_type;
                const stage: string | undefined = parsed.stage;
                const progressPercent: number | undefined = parsed.progress_percent ?? parsed.data?.progress_percent;

                setActiveJob((prev) => {
                  if (!prev || prev.job_id !== jobId) {
                    if (eventType === 'job_completed' || eventType === 'job_failed') return prev;
                    return {
                      job_id: jobId,
                      status: 'running',
                      stage: (stage as StageLabel) || 'source_content',
                      stage_index: 0,
                      total_stages: 11,
                      progress_percent: progressPercent || 0,
                      current_agent: stage || undefined,
                    };
                  }
                  return {
                    ...prev,
                    status: eventType === 'job_completed' ? 'completed' :
                            eventType === 'job_failed' ? 'failed' : 'running',
                    stage: (stage as StageLabel) || prev.stage,
                    progress_percent: progressPercent ?? prev.progress_percent,
                    current_agent: stage || prev.current_agent,
                  };
                });

                if (!stage || stage === 'complete' || stage === 'error') continue;

                const statusMap: Record<string, AgentStatus> = {
                  stage_started: 'IN_PROGRESS',
                  stage_completed: 'COMPLETED',
                  stage_failed: 'FAILED',
                  stage_skipped: 'SKIPPED',
                  review_point_reached: 'PAUSED',
                };

                const status = eventType ? statusMap[eventType] : undefined;
                if (status) {
                  setAgentStates((prev) => ({ ...prev, [stage]: status }));
                  if (eventType === 'review_point_reached') setReviewPointActive(true);
                }
              } catch { /* parse error */ }
            }
          }
        }
      } catch (err) {
        if ((err as Error).name !== 'AbortError') console.error('SSE stream error:', err);
      }
    })();

    return () => controller.abort();
  }, [urlJobId]);

  const handleStageClick = (_stage: StageLabel, stageIndex: number) => {
    setActiveStage(stageIndex);
  };

  // ─── Agent send handler ───
  const handleAgentSend = (text: string) => {
    const ts = new Date().toISOString();
    const userMsg = { id: `u-${Date.now()}`, role: 'user' as const, content: text, timestamp: ts };
    setAgentMessages((prev) => [...prev, userMsg]);
    setAgentStreaming(true);

    // Simulate agent turn
    const turnId = `turn-${Date.now()}`;
    const newTurn: AgentTurn = {
      id: turnId,
      statusLabel: '分析中',
      statusState: 'active',
      thinking: [{
        id: `think-${Date.now()}`,
        label: `分析 "${text.slice(0, 30)}${text.length > 30 ? '...' : ''}"`,
        content: `1. 解析用户意图\n2. 检索相关上下文\n3. 评估影响范围\n4. 生成执行计划`,
        open: false,
      }],
      toolCalls: [{
        id: `tc-${Date.now()}`,
        name: 'Read: content_script.md',
        iconType: 'read',
        status: 'complete',
        body: '读取当前剧集剧本内容...\n找到 3 个场景, 12 个镜头定义',
        open: false,
      }],
      fileOps: [
        { op: 'modified', path: 'episode_script.txt', detail: '+2/-1 lines' },
      ],
      producedFiles: [
        { name: 'episode_script_v2.txt', path: '/versions/episode_script_v2.txt' },
      ],
      assistantText: `已分析你的请求「${text}」。基于当前项目上下文，我建议进行相应的调整。具体修改已应用到 episode_script.txt。`,
    };

    setTimeout(() => {
      newTurn.statusLabel = '完成';
      newTurn.statusState = 'done';
      setAgentTurns((prev) => [...prev, newTurn]);
      setAgentMessages((prev) => [...prev, {
        id: `a-${Date.now()}`,
        role: 'assistant',
        content: newTurn.assistantText || '完成。',
        timestamp: new Date().toISOString(),
      }]);
      setAgentStreaming(false);
    }, 1500);
  };

  // Map stage index to pipeline_state key
  const stageDataKeys = [
    'source_content', 'script_rewrite', 'character_management', 'scene_management',
    'storyboard', 'image_generation', 'video_generation', 'tts_dubbing',
    'shot_composition', 'episode_merge', 'export',
  ] as const;

  const renderStage = () => {
    const state = episodeState as Record<string, unknown> | null;
    const stageData = state?.[stageDataKeys[activeStage]] as Record<string, unknown> | undefined;

    switch (activeStage) {
      case 0: return <SourceContentPanel data={stageData} />;
      case 1: return <ScriptRewritePanel data={stageData} />;
      case 2: return <CharacterPanel data={stageData} />;
      case 3: return <ScenePanel data={stageData} />;
      case 4: return <StoryboardPanel data={stageData} />;
      case 5: return <ImageGalleryPanel data={stageData} />;
      case 6: return <VideoGalleryPanel data={stageData} />;
      case 7: return <TTSMatrixPanel data={stageData} />;
      case 8: return <ShotCompositionPanel data={stageData} />;
      case 9: return <EpisodeMergePanel data={stageData} />;
      case 10: return <ExportStage />;
      default: return <SourceContentPanel data={stageData} />;
    }
  };

  const activeStageLabel = STAGE_NAMES[stageDataKeys[activeStage]] || '';

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* Studio Topbar — prototype exact */}
      <Topbar
        projectTitle={projectId}
        episodeNum={episodeNum}
        stageLabel={activeStageLabel}
        stageProgress={activeJob?.status === 'running' ? `${activeJob.progress_percent || 0}%` : undefined}
      />

      {/* Pipeline mode bar */}
      <PipelineModeSelector />

      {/* Three-panel workspace — prototype: left storyboard + center content + right chat */}
      <div className="main-body">
        {/* Left: Storyboard list — prototype pattern */}
        <div className="left-panel">
          <div className="panel-header">
            <div className="panel-title">分镜列表</div>
            <div className="panel-actions">
              <button className="icon-btn" title="刷新">
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M13 8A5 5 0 1 1 8 3"/><path d="M8 1v4l3-2-3-2z"/></svg>
              </button>
            </div>
          </div>
          <div className="storyboard-list">
            {Array.from({ length: 5 }, (_, i) => (
              <div key={i} className={`shot-card ${activeStage === 4 ? 'active' : ''}`}>
                <div className="shot-thumb">
                  <div className="shot-thumb-placeholder">
                    <svg viewBox="0 0 24 24" fill="none" stroke="#4d4d4d" strokeWidth="1.5" width="24" height="24"><rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="12" cy="12" r="3"/></svg>
                  </div>
                </div>
                <div className="shot-meta">
                  <span className="shot-number">SHOT {String(i + 1).padStart(2, '0')}</span>
                  <span className="shot-type">MS</span>
                </div>
                <div className="shot-desc">分镜 {i + 1} · 待生成</div>
              </div>
            ))}
          </div>
          <div style={{ padding: 8 }}>
            <button className="add-shot-btn">
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" width="14" height="14"><path d="M8 3v10M3 8h10" strokeLinecap="round"/></svg>
              添加分镜
            </button>
          </div>
        </div>

        {/* Center: AI Execution area */}
        <div className="center-panel">
          {/* Agent stage buttons */}
          <div className="agent-stages">
            {[
              { key: 'script', icon: '1', label: '编剧 Agent' },
              { key: 'storyboard', icon: '2', label: '导演 Agent' },
              { key: 'visual', icon: '3', label: '视觉 Agent' },
              { key: 'audio', icon: '4', label: '音频 Agent' },
              { key: 'compose', icon: '5', label: '合成 Agent' },
            ].map((stage, i) => {
              const isActive = activeStage >= i * 2 && activeStage <= i * 2 + 1;
              return (
                <button
                  key={stage.key}
                  className={`agent-stage-btn ${isActive ? 'active' : 'idle'}`}
                  onClick={() => setActiveStage(i * 2)}
                >
                  <span className="stage-icon">{stage.icon}</span>
                  {stage.label}
                </button>
              );
            })}
          </div>

          {/* Scrollable content */}
          <div className="center-scroll">
            <div className="content-panel active">
              {renderStage()}
            </div>
          </div>
        </div>

        {/* Right: AI Chat panel — prototype pattern */}
        <div className="right-panel">
          <div className="panel-header">
            <div className="panel-title">AI 指令中心</div>
            <div className="panel-actions">
              <button className="icon-btn" title="清空对话" onClick={() => setAgentMessages([])}>
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M2 4h12M5 4V2h6v2M6 7v5M10 7v5M3 4l1 10h8l1-10"/></svg>
              </button>
            </div>
          </div>
          <div className="chat-messages">
            {agentMessages.length === 0 ? (
              <div className="chat-empty-state">
                <div className="chat-empty-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2zm0 5v4l3 3"/></svg>
                </div>
                <div className="chat-empty-title">对话式创作</div>
                <div className="chat-empty-desc">用自然语言描述你的需求，AI 自动完成编剧→分镜→视频生成→合成</div>
              </div>
            ) : (
              agentMessages.map((msg) => (
                <div key={msg.id} className={`msg-wrap ${msg.role}`}>
                  <div className={`msg-avatar ${msg.role}`}>
                    {msg.role === 'user' ? 'U' : 'A'}
                  </div>
                  <div className="msg-body">
                    <div className="msg-role">{msg.role === 'user' ? '你' : 'AI Agent'}</div>
                    <div className={`msg-text ${msg.role === 'user' ? 'user-msg' : ''}`}>
                      {msg.content}
                    </div>
                  </div>
                </div>
              ))
            )}
            {agentStreaming && (
              <div className="typing-indicator">
                <div className="typing-dot" />
                <div className="typing-dot" />
                <div className="typing-dot" />
              </div>
            )}
          </div>
          <div className="chat-input-area">
            <div className="input-wrapper">
              <textarea
                className="chat-input"
                rows={1}
                placeholder="描述你的视频需求..."
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    const target = e.target as HTMLTextAreaElement;
                    if (target.value.trim()) {
                      handleAgentSend(target.value.trim());
                      target.value = '';
                    }
                  }
                }}
              />
              <button className="send-btn" onClick={() => setAgentDialogOpen(true)}>
                <svg viewBox="0 0 16 16" fill="currentColor"><path d="M14 1L2 8l5 1.5 1.5 5L14 1zM2 8l12 1"/></svg>
              </button>
            </div>
            <div className="suggestions-row">
              <button className="suggestion-pill" onClick={() => handleAgentSend('做一个产品展示视频，30秒')}>产品展示</button>
              <button className="suggestion-pill" onClick={() => handleAgentSend('做一个品牌故事视频，45秒')}>品牌故事</button>
              <button className="suggestion-pill" onClick={() => handleAgentSend('做一个知识科普视频，60秒')}>知识科普</button>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Timeline — prototype pattern */}
      <div className="timeline-strip-bottom">
        <div className="timeline-header">
          <div className="timeline-title">时间线</div>
          <span style={{ fontSize: 11, color: '#898989', marginLeft: 8 }}>竖版 9:16 · 1080×1920</span>
          <div className="timeline-meta">总时长 0:00 / 目标 30s</div>
        </div>
        <div className="timeline-tracks">
          <div className="track-row">
            <div className="track-label">视频</div>
            <div className="track-clips">
              {Array.from({ length: 5 }, (_, i) => (
                <div key={i} className="clip-block video" style={{ left: `${i * 20}%`, width: '19%' }}>
                  S{i + 1}
                </div>
              ))}
            </div>
          </div>
          <div className="track-row">
            <div className="track-label">音频</div>
            <div className="track-clips">
              <div className="clip-block audio" style={{ left: '0%', width: '100%' }}>旁白 + BGM</div>
            </div>
          </div>
          <div className="track-row">
            <div className="track-label">字幕</div>
            <div className="track-clips">
              {Array.from({ length: 5 }, (_, i) => (
                <div key={i} className="clip-block subtitle" style={{ left: `${i * 20}%`, width: '19%' }}>
                  字幕{i + 1}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Draw Mode ── */}
      <DrawMode active={drawMode} onClose={() => setDrawMode(false)} />

      {/* ── Version History Drawer ── */}
      <VersionHistoryDrawer
        open={versionDrawerOpen}
        onClose={() => setVersionDrawerOpen(false)}
        versions={versions}
        versionsLoading={versionsLoading}
        onRestore={async (versionId) => {
          try {
            await versionsApi.restore(projectId, versionId);
            toast('版本已恢复');
            setVersionDrawerOpen(false);
            loadVersions();
          } catch (err) {
            toast(`恢复失败: ${(err as Error).message}`);
          }
        }}
        onCompare={(fromId, toId) => {
          setVersionDrawerOpen(false);
          const fromV = versions.find((v) => v.id === fromId);
          const toV = versions.find((v) => v.id === toId);
          setDiffPair({
            from: { id: fromId, shortId: (fromV?.short_id || fromId), label: '旧版本' },
            to: { id: toId, shortId: (toV?.short_id || toId), label: '新版本' },
          });
          setDiffOverlayOpen(true);
        }}
      />

      {/* ── Diff Overlay ── */}
      {diffOverlayOpen && (
        <DiffOverlay
          open={diffOverlayOpen}
          onClose={() => setDiffOverlayOpen(false)}
          fromVersion={diffPair.from}
          toVersion={diffPair.to}
          tab="text"
        />
      )}

      {/* ── Pipeline Precheck Modal ── */}
      {showPrecheck && (
        <div className="overlay" onClick={() => setShowPrecheck(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">任务预检</h2>
              <button className="btn btn-ghost btn-sm text-muted" onClick={() => setShowPrecheck(false)}>✕</button>
            </div>

            <div className="p-4">
              {!precheckResult ? (
                <p className="text-sm text-muted text-center py-8">加载中...</p>
              ) : (
                <div className="flex flex-col gap-4">
                  <div className="flex justify-between items-center py-2 border-b border-border-soft">
                    <span className="text-sm text-muted">预估成本</span>
                    <span className="text-sm font-mono text-fg">
                      ¥{(precheckResult.estimated_cost_cents / 100).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-border-soft">
                    <span className="text-sm text-muted">预估耗时</span>
                    <span className="text-sm font-mono text-fg">
                      {Math.ceil(precheckResult.estimated_duration_seconds / 60)} 分钟
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-border-soft">
                    <span className="text-sm text-muted">可行性</span>
                    <span className={`badge text-[10px] px-1.5 py-0 ${
                      precheckResult.feasibility === 'high' ? 'badge-success' :
                      precheckResult.feasibility === 'medium' ? 'badge-warn' : 'badge-danger'
                    }`}>
                      {precheckResult.feasibility === 'high' ? '高' :
                       precheckResult.feasibility === 'medium' ? '中' : '低'}
                    </span>
                  </div>
                  {precheckResult.recommended_stages && precheckResult.recommended_stages.length > 0 && (
                    <div className="py-2 border-b border-border-soft">
                      <span className="text-sm text-muted mb-2 block">推荐阶段</span>
                      <div className="flex flex-wrap gap-1.5">
                        {precheckResult.recommended_stages.map((s) => (
                          <span key={s} className="badge badge-muted text-[10px] px-1.5 py-0">
                            {STAGE_NAMES[s] || s}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {precheckResult.warnings && precheckResult.warnings.length > 0 && (
                    <div className="p-3 bg-[var(--warn)]/10 border border-[var(--warn)]/20 rounded-sm">
                      <span className="text-xs font-medium text-warn mb-1.5 block">注意事项</span>
                      {precheckResult.warnings.map((w, i) => (
                        <p key={i} className="text-xs text-warn/80">{w}</p>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="modal-actions">
              <button className="btn btn-ghost" onClick={() => setShowPrecheck(false)}>取消</button>
              <button
                className="btn btn-brand"
                onClick={handleSubmit}
                disabled={submitting || !precheckResult}
              >
                {submitting ? '提交中...' : '确认提交'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── TweakPanel Floating ── */}
      {tweakPanelOpen && (
        <div className="fixed inset-0 z-40 flex justify-end pointer-events-none" style={{ top: 56 }}>
          <div className="pointer-events-auto w-[380px] max-h-[calc(100vh-56px)] overflow-y-auto border-l border-border-soft bg-surface shadow-xl">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border-soft">
              <h3 className="text-sm font-medium text-fg">参数微调</h3>
              <button onClick={() => setTweakPanelOpen(false)} className="text-muted hover:text-fg">✕</button>
            </div>
            <div className="p-3">
              <TweakPanel jobId={urlJobId} onApply={() => {}} />
            </div>
          </div>
        </div>
      )}

      {/* ── Agent Runtime Dialog ── */}
      <AgentRuntime
        open={agentDialogOpen}
        onClose={() => setAgentDialogOpen(false)}
        turns={agentTurns}
        messages={agentMessages}
        onSend={handleAgentSend}
        isStreaming={agentStreaming}
      />
    </div>
  );
}

// ─── Stage 11: Export ───
function ExportStage() {
  const [progress, setProgress] = useState(0);
  const [exporting, setExporting] = useState(false);
  const [events, setEvents] = useState<Array<{ type: string; label: string; time: string }>>([]);
  const [exportFormat, setExportFormat] = useState<'mp4' | 'jianying'>('mp4');

  const handleExport = () => {
    if (exporting) return;
    setExporting(true);
    setProgress(0);
    setEvents([]);

    const steps = [
      '初始化导出管道', '编码视频流', '合成音频轨道', '生成字幕文件',
      '混音处理', '色彩校正', '添加转场效果', '渲染输出',
      '质量检查', '打包导出文件',
    ];

    steps.forEach((step, i) => {
      setTimeout(() => {
        setProgress((i + 1) * 10);
        setEvents((prev) => [...prev, {
          type: i === steps.length - 1 ? 'done' : 'frame',
          label: step,
          time: new Date().toLocaleTimeString(),
        }]);
        if (i === steps.length - 1) setExporting(false);
      }, (i + 1) * 800);
    });
  };

  return (
    <div className="flex flex-col h-full p-8 overflow-y-auto">
      <div className="step-toolbar">
        <div className="toolbar-left">
          <div className="step-indicator">
            <span className="step-num">11</span>
            <span className="step-name">导出</span>
          </div>
        </div>
        <div className="toolbar-right">
          <span className="char-count">最终输出</span>
        </div>
      </div>

      <div className="export-dashboard">
        <div className="export-stats-row">
          {[
            { label: '镜头数', value: '12' },
            { label: '总时长', value: '2m 15s' },
            { label: '格式', value: exportFormat === 'mp4' ? 'MP4' : '剪映草稿' },
            { label: '预估费用', value: '¥8.40' },
          ].map((stat) => (
            <div key={stat.label} className="export-stat-card">
              <p className="es-value">{stat.value}</p>
              <p className="es-label">{stat.label}</p>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          {(['mp4', 'jianying'] as const).map((fmt) => (
            <button
              key={fmt}
              onClick={() => setExportFormat(fmt)}
              className={`badge cursor-pointer ${exportFormat === fmt ? 'badge-accent' : 'badge-muted'}`}
            >
              {fmt === 'mp4' ? 'MP4 视频' : '剪映草稿'}
            </button>
          ))}
        </div>

        {exporting && (
          <div className="export-progress">
            <div className="bar">
              <div className="fill" style={{ width: `${progress}%` }} />
            </div>
            <p className="label">{progress}%</p>
          </div>
        )}

        <button
          className="btn btn-brand"
          onClick={handleExport}
          disabled={exporting}
          style={{ alignSelf: 'flex-start' }}
        >
          {exporting ? '导出中...' : '开始导出'}
        </button>

        <div>
          <h4 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--fg)', marginBottom: '12px' }}>费用明细</h4>
          <table className="cost-table">
            <thead>
              <tr>
                <th>供应商</th><th>类型</th><th>调用次数</th><th>费用</th><th>占比</th>
              </tr>
            </thead>
            <tbody>
              <tr><td>Seedream</td><td>图片</td><td className="mono">12</td><td className="mono">¥3.60</td><td className="mono">42.9%</td></tr>
              <tr><td>Seedance</td><td>视频</td><td className="mono">12</td><td className="mono">¥4.20</td><td className="mono">50.0%</td></tr>
              <tr><td>MiniMax</td><td>TTS</td><td className="mono">8</td><td className="mono">¥0.60</td><td className="mono">7.1%</td></tr>
            </tbody>
          </table>
        </div>

        {events.length > 0 && (
          <div className="progress-events">
            {events.map((evt, i) => (
              <div key={i} className="progress-event">
                <span className={`pe-icon ${evt.type === 'done' ? 'done' : evt.type === 'frame' ? 'frame' : 'err'}`}>
                  {evt.type === 'done' ? '✓' : evt.type === 'frame' ? '●' : '✕'}
                </span>
                <div className="pe-body">
                  <span className="pe-label">{evt.label}</span>
                  <span className="pe-extra">{evt.time}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
