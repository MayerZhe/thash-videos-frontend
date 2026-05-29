'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAppStore } from '@/stores/app';
import { versionsApi, episodesApi, pipelineApi, BASE_URL } from '@/lib/api';
import { useToast } from '@/components/global/Toast';
import PipelineSidebar, { type AgentStatus } from '@/components/content-creation/PipelineSidebar';
import PipelineModeSelector from '@/components/content-creation/PipelineModeSelector';
import RightPanel from '@/components/content-creation/RightPanel';
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

export default function ContentCreationPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;
  const episodeNum = parseInt(params.num as string) || 1;

  const {
    activeStage, setActiveStage,
    activeTheme, setActiveTheme,
    rightPanelOpen, toggleRightPanel, setRightPanelOpen,
  } = useAppStore();

  const { toast } = useToast();

  // ─── Data loading ───
  const [versions, setVersions] = useState<Version[]>([]);
  const [versionsLoading, setVersionsLoading] = useState(false);
  const [episodeState, setEpisodeState] = useState<PipelineState | null>(null);

  // Load versions for this project
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

  // Load episode pipeline state
  const loadEpisodeState = useCallback(async () => {
    try {
      const ep = await episodesApi.get(projectId, episodeNum);
      setEpisodeState(ep.pipeline_state as PipelineState || null);
    } catch {
      // Episode may not exist yet — ignore
    }
  }, [projectId, episodeNum]);

  useEffect(() => {
    loadVersions();
    loadEpisodeState();
  }, [loadVersions, loadEpisodeState]);

  // Compute version counts from real data
  const versionCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const v of versions) {
      const stage = v.pipeline_stage;
      if (stage) {
        counts[stage] = (counts[stage] || 0) + 1;
      }
    }
    return counts;
  }, [versions]);

  // Compute stats from episode state or versions
  const computedStats = useMemo(() => {
    // These come from pipeline_state JSONB when it exists
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

  // ─── Pipeline handlers ───

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
      // Set active job immediately for status polling
      setActiveJob({
        job_id: result.job_id,
        status: 'queued',
        stage: 'source_content',
        stage_index: 0,
        total_stages: 11,
        progress_percent: 0,
      });
      // Start SSE stream for this job
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

  // Agent dialog
  const [agentDialogOpen, setAgentDialogOpen] = useState(false);
  const [agentMessages, setAgentMessages] = useState<Array<{ role: 'user' | 'ai'; text: string; thinking?: string; tools?: string[]; edits?: string }>>([]);
  const [agentInput, setAgentInput] = useState('');

  // SSE pipeline progress
  const [agentStates, setAgentStates] = useState<Record<string, AgentStatus>>({});
  const [reviewPointActive, setReviewPointActive] = useState(false);

  // Draw mode
  const [drawMode, setDrawMode] = useState(false);

  // Tweak panel
  const [tweakPanelOpen, setTweakPanelOpen] = useState(false);

  // Version history drawer
  const [versionDrawerOpen, setVersionDrawerOpen] = useState(false);

  // Current job ID from URL params (shared between SSE and TweakPanel)
  const [urlJobId, setUrlJobId] = useState('');

  // Diff overlay
  const [diffOverlayOpen, setDiffOverlayOpen] = useState(false);
  const [diffPair, setDiffPair] = useState<{
    from: { id: string; shortId: string; label: string };
    to: { id: string; shortId: string; label: string };
  }>({ from: { id: '', shortId: '', label: '' }, to: { id: '', shortId: '', label: '' } });

  // Esc key to exit draw mode
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape' && drawMode) {
      setDrawMode(false);
    }
  }, [drawMode]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // SSE subscription for real-time pipeline progress
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
        if (token) {
          sseHeaders['Authorization'] = `Bearer ${token}`;
        }
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

                // Update active job status
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
                            eventType === 'job_failed' ? 'failed' :
                            'running',
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
                  if (eventType === 'review_point_reached') {
                    setReviewPointActive(true);
                  }
                }
              } catch {
                // Ignore parse errors on individual events
              }
            }
          }
        }
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          console.error('SSE stream error:', err);
        }
      }
    })();

    return () => controller.abort();
  }, [urlJobId]);

  const handleStageClick = (_stage: StageLabel, stageIndex: number) => {
    setActiveStage(stageIndex);
  };

  const handleSendAgent = () => {
    if (!agentInput.trim()) return;
    const msg = agentInput.trim();
    setAgentMessages((prev) => [...prev, { role: 'user', text: msg }]);
    setAgentInput('');

    // Simulate AI response
    setTimeout(() => {
      setAgentMessages((prev) => [...prev, {
        role: 'ai',
        text: `收到，我来分析「${msg}」。这涉及${msg.includes('角色') ? '角色管理' : msg.includes('分镜') ? '分镜设计' : msg.includes('对白') ? '对白优化' : '项目内容'}。建议进行以下调整...`,
        thinking: `1. 分析请求上下文\n2. 检索相关数据\n3. 评估影响范围\n4. 生成建议方案`,
        tools: ['Read: episode_script.txt', 'Grep: 关键词匹配', 'Edit: 修改目标段落'],
        edits: 'episode_script.txt (+2/-1)',
      }]);
    }, 800);
  };

  // Map stage index to pipeline_state key
  const stageDataKeys = [
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
  ] as const;

  // Render active stage with pipeline_state data
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

  return (
    <div className="flex flex-col h-[calc(100vh-56px)]">
      {/* Top bar */}
      <div className="content-topbar flex items-center justify-between px-6 py-2 border-b border-border-soft bg-bg">
        <div className="flex items-center gap-3 content-topbar-left">
          <button
            onClick={() => router.push(`/projects/${projectId}`)}
            className="text-sm text-muted hover:text-fg-2 flex items-center gap-1 flex-shrink-0"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            <span className="content-topbar-back-label">返回</span>
          </button>
          <span className="text-sm text-fg font-medium content-topbar-title">
            <span className="font-mono text-accent">E{episodeNum < 10 ? '0' : ''}{episodeNum}</span>
            <span className="content-topbar-pid"> 项目 {projectId}</span>
          </span>
          <span className="text-xs text-muted content-topbar-stats">
            角色:{computedStats.charCount || '—'} 场景:{computedStats.sceneCount || '—'} 镜头:{computedStats.shotCount || '—'}
          </span>
        </div>

        <div className="flex items-center gap-2 content-topbar-actions">
          {/* Draw mode toggle */}
          <button
            className={`btn btn-ghost btn-sm text-xs ${drawMode ? 'text-accent' : ''}`}
            onClick={() => setDrawMode(!drawMode)}
          >
            绘制
          </button>

          {/* Version history toggle */}
          <button
            className="btn btn-ghost btn-sm text-xs"
            onClick={() => setVersionDrawerOpen(true)}
          >
            版本
          </button>

          {/* Right panel toggle */}
          <button
            className={`btn btn-ghost btn-sm text-xs ${rightPanelOpen ? 'text-accent' : ''}`}
            onClick={toggleRightPanel}
          >
            {rightPanelOpen ? '隐藏面板' : '显示面板'}
          </button>

          {/* Agent dialog toggle */}
          <button
            className="btn btn-ghost btn-sm text-xs"
            onClick={() => setAgentDialogOpen(true)}
          >
            Agent
          </button>

          {/* Phase 2: Tweak panel toggle */}
          <button
            className={`btn btn-ghost btn-sm text-xs ${tweakPanelOpen ? 'text-accent' : ''}`}
            onClick={() => setTweakPanelOpen(!tweakPanelOpen)}
          >
            微调
          </button>

          {/* Pipeline job status bar */}
          {activeJob && (
            <div className="flex items-center gap-2 pl-3 border-l border-border-soft">
              <span className={`badge text-[10px] px-1.5 py-0 ${
                activeJob.status === 'running' ? 'badge-accent' :
                activeJob.status === 'completed' ? 'badge-success' :
                activeJob.status === 'failed' ? 'badge-danger' :
                activeJob.status === 'cancelled' ? 'badge-muted' :
                'badge-warn'
              }`}>
                {activeJob.status === 'queued' ? '排队中' :
                 activeJob.status === 'running' ? `运行中 ${activeJob.progress_percent || 0}%` :
                 activeJob.status === 'completed' ? '已完成' :
                 activeJob.status === 'failed' ? '失败' :
                 activeJob.status === 'cancelled' ? '已取消' : activeJob.status}
              </span>
              {activeJob.status === 'running' && (
                <button className="btn btn-ghost btn-sm text-xs text-danger" onClick={handleCancel}>
                  取消
                </button>
              )}
              {activeJob.status === 'failed' && (
                <button className="btn btn-brand btn-sm text-xs" onClick={handleRetry}>
                  重试
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Pipeline mode selector */}
      <PipelineModeSelector />

      {/* Three-panel workspace */}
      <div className="content-workspace flex flex-1 overflow-hidden">
        {/* Left: Pipeline sidebar */}
        <PipelineSidebar
          onStageClick={handleStageClick}
          versionCounts={versionCounts}
          agentStates={agentStates}
          onGenerate={handleGenerate}
          onPrecheck={handlePrecheck}
          activeJob={activeJob}
          precheckLoading={precheckLoading}
        />

        {/* Center: Main canvas */}
        <div className="content-canvas flex-1 overflow-hidden bg-bg">
          <div className="h-full">
            {renderStage()}
          </div>
        </div>

        {/* Right: Theme/Inspect/Comments panel */}
        <RightPanel />
      </div>

      <style jsx global>{`
        /* ─── Content creation workspace responsive layout ─── */
        @media (max-width: 767px) {
          .content-workspace {
            flex-direction: column;
          }
          .content-canvas {
            order: 1;
            flex: 1;
            min-height: 0;
          }
          /* Compact top bar */
          .content-topbar {
            padding: 0 var(--space-3);
            flex-wrap: wrap;
            gap: var(--space-2);
          }
          .content-topbar-left {
            flex: 1;
            min-width: 0;
          }
          .content-topbar-back-label {
            display: none;
          }
          .content-topbar-title {
            font-size: var(--text-xs);
          }
          .content-topbar-pid {
            display: none;
          }
          .content-topbar-stats {
            display: none;
          }
          .content-topbar-actions {
            flex-wrap: wrap;
          }
          .content-topbar-actions .btn {
            min-height: 36px;
            padding: var(--space-1) var(--space-2);
          }
        }

        @media (max-width: 1023px) {
          .content-topbar-stats {
            display: none;
          }
        }
      `}</style>

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
                  {/* Cost estimate */}
                  <div className="flex justify-between items-center py-2 border-b border-border-soft">
                    <span className="text-sm text-muted">预估成本</span>
                    <span className="text-sm font-mono text-fg">
                      ¥{(precheckResult.estimated_cost_cents / 100).toFixed(2)}
                    </span>
                  </div>

                  {/* Duration */}
                  <div className="flex justify-between items-center py-2 border-b border-border-soft">
                    <span className="text-sm text-muted">预估耗时</span>
                    <span className="text-sm font-mono text-fg">
                      {Math.ceil(precheckResult.estimated_duration_seconds / 60)} 分钟
                    </span>
                  </div>

                  {/* Feasibility */}
                  <div className="flex justify-between items-center py-2 border-b border-border-soft">
                    <span className="text-sm text-muted">可行性</span>
                    <span className={`badge text-[10px] px-1.5 py-0 ${
                      precheckResult.feasibility === 'high' ? 'badge-success' :
                      precheckResult.feasibility === 'medium' ? 'badge-warn' :
                      'badge-danger'
                    }`}>
                      {precheckResult.feasibility === 'high' ? '高' :
                       precheckResult.feasibility === 'medium' ? '中' : '低'}
                    </span>
                  </div>

                  {/* Recommended stages */}
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

                  {/* Warnings */}
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

      {/* ── Phase 2: TweakPanel Floating ── */}
      {tweakPanelOpen && (
        <div className="fixed inset-0 z-40 flex justify-end pointer-events-none" style={{ top: 56 }}>
          <div className="pointer-events-auto w-[380px] max-h-[calc(100vh-56px)] overflow-y-auto border-l border-border-soft bg-surface shadow-xl">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border-soft">
              <h3 className="text-sm font-medium text-fg">参数微调</h3>
              <button onClick={() => setTweakPanelOpen(false)} className="text-muted hover:text-fg">✕</button>
            </div>
            <div className="p-3">
              <TweakPanel
                jobId={urlJobId}
                onApply={() => {}}
              />
            </div>
          </div>
        </div>
      )}

      {/* ── Agent Dialog ── */}
      {agentDialogOpen && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setAgentDialogOpen(false); }}>
          <div className="modal-box !max-w-[700px] !max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-lg font-normal text-fg">
                Claude Code · Agent <span className="text-muted text-sm">项目 · E{episodeNum < 10 ? '0' : ''}{episodeNum}</span>
              </h3>
              <button className="btn btn-ghost btn-sm" onClick={() => setAgentDialogOpen(false)}>✕</button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto space-y-4 mb-4 min-h-[300px] max-h-[500px]">
              {agentMessages.length === 0 && (
                <p className="text-sm text-muted text-center py-8">
                  输入指令，AI Agent 将帮您编辑剧本、优化角色、调整分镜...
                </p>
              )}
              {agentMessages.map((m, i) => (
                <div key={i} className={`${m.role === 'user' ? 'text-right' : ''}`}>
                  {m.role === 'user' ? (
                    <div className="inline-block bg-accent/10 border border-[color-mix(in_oklab,var(--accent)_20%,transparent)] rounded-sm px-4 py-2 text-sm text-fg max-w-[80%] text-left">
                      {m.text}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {/* Thinking */}
                      {m.thinking && (
                        <details className="bg-bg border border-border-soft rounded-sm p-3">
                          <summary className="text-xs text-muted cursor-pointer">思考过程</summary>
                          <pre className="text-xs text-muted mt-2 whitespace-pre-wrap font-mono">{m.thinking}</pre>
                        </details>
                      )}
                      {/* Tool calls */}
                      {m.tools && (
                        <div className="bg-bg border border-border-soft rounded-sm p-3">
                          <p className="text-[10px] text-meta uppercase mb-1">工具调用</p>
                          {m.tools.map((t, j) => (
                            <p key={j} className="text-xs text-fg-2 font-mono">{t}</p>
                          ))}
                        </div>
                      )}
                      {/* Edits */}
                      {m.edits && (
                        <div className="bg-bg border border-border-soft rounded-sm p-3">
                          <p className="text-[10px] text-meta uppercase mb-1">文件操作</p>
                          <p className="text-xs text-fg-2 font-mono">{m.edits}</p>
                        </div>
                      )}
                      {/* Response */}
                      <div className="text-sm text-fg-2 leading-relaxed bg-surface border border-border rounded-sm p-4">
                        {m.text}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Input */}
            <div className="flex gap-2 pt-4 border-t border-border-soft">
              <input
                type="text"
                placeholder="输入指令..."
                value={agentInput}
                onChange={(e) => setAgentInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleSendAgent(); }}
                className="flex-1 text-sm bg-bg border border-border rounded-sm px-4 py-2.5 text-fg-2 outline-none focus:border-accent placeholder:text-meta"
                autoFocus
              />
              <button className="btn btn-brand" onClick={handleSendAgent}>发送</button>
            </div>
          </div>
        </div>
      )}
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
        if (i === steps.length - 1) {
          setExporting(false);
        }
      }, (i + 1) * 800);
    });
  };

  return (
    <div className="flex flex-col h-full p-8 overflow-y-auto">
      <h3 className="text-lg font-normal text-fg mb-6">导出</h3>

      {/* Stats cards */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {[
          { label: '镜头数', value: '12' },
          { label: '总时长', value: '2m 15s' },
          { label: '格式', value: exportFormat === 'mp4' ? 'MP4' : '剪映草稿' },
          { label: '预估费用', value: '¥8.40' },
        ].map((stat) => (
          <div key={stat.label} className="bg-surface border border-border rounded-lg p-4">
            <p className="text-xs text-muted mb-1">{stat.label}</p>
            <p className="text-lg font-medium text-fg">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Format selector */}
      <div className="flex gap-2 mb-6">
        {(['mp4', 'jianying'] as const).map((fmt) => (
          <button
            key={fmt}
            onClick={() => setExportFormat(fmt)}
            className={`badge cursor-pointer ${exportFormat === fmt ? 'badge-accent' : 'badge-muted'}`}
          >
            {fmt === 'mp4' ? 'MP4' : '剪映草稿'}
          </button>
        ))}
      </div>

      {/* Progress */}
      {exporting && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted">导出进度</span>
            <span className="text-xs text-accent font-mono">{progress}%</span>
          </div>
          <div className="h-2 bg-border-soft rounded-pill overflow-hidden">
            <div
              className="h-full bg-accent rounded-pill transition-all duration-500 ease-standard"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Export button */}
      <button
        className="btn btn-brand mb-6 w-fit"
        onClick={handleExport}
        disabled={exporting}
      >
        {exporting ? '导出中...' : '开始导出'}
      </button>

      {/* Cost summary table */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-fg mb-3">费用明细</h4>
        <table>
          <thead>
            <tr>
              <th>供应商</th><th>类型</th><th>调用次数</th><th>费用</th><th>占比</th>
            </tr>
          </thead>
          <tbody>
            <tr><td>Seedream</td><td>图片</td><td>12</td><td>¥3.60</td><td>42.9%</td></tr>
            <tr><td>Seedance</td><td>视频</td><td>12</td><td>¥4.20</td><td>50.0%</td></tr>
            <tr><td>MiniMax</td><td>TTS</td><td>8</td><td>¥0.60</td><td>7.1%</td></tr>
          </tbody>
        </table>
      </div>

      {/* Progress event log */}
      {events.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-fg mb-3">事件日志</h4>
          <div className="space-y-1">
            {events.map((evt, i) => (
              <div key={i} className="flex items-center gap-3 text-xs py-1">
                <span className={`w-1.5 h-1.5 rounded-pill flex-shrink-0 ${
                  evt.type === 'done' ? 'bg-success' : evt.type === 'frame' ? 'bg-accent' : 'bg-muted'
                }`} />
                <span className="text-fg-2">{evt.label}</span>
                <span className="text-meta ml-auto">{evt.time}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
