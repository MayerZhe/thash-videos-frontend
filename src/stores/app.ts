'use client';

import { create } from 'zustand';
import type {
  PipelineMode,
  ThemeId,
  Project,
  Episode,
  Task,
} from '@/lib/types';

// ─── App State — HANDOFF.md §3.3 ───

// ─── Phase 2 types ───

export type PipelineStep = 'idle' | 'discovery' | 'configure' | 'running' | 'review' | 'complete' | 'failed';

export interface DriftRecord {
  driftType: string;
  stageName: string;
  field: string;
  repaired: boolean;
}

export interface GenUISurface {
  surfaceId: string;
  surfaceType: 'script-reader' | 'character-cards' | 'storyboard-grid' | 'video-player' | 'radar-chart' | 'tweak-panel';
  agentName: string;
  data: Record<string, unknown>;
}

export interface AppState {
  // Current context
  activeProjectId: string | null;
  activeEpisodeNum: number | null;
  activePipeline: PipelineMode;
  activeStage: number;          // 0-10 (11 pipeline stages)
  activeTheme: ThemeId;

  // Version control
  activeBranch: string;
  selectedVersionId: string | null;
  diffPair: [string, string] | null;

  // Right panel
  rightPanelOpen: boolean;
  rightPanelTab: 'theme' | 'inspect' | 'comments' | 'review' | 'qa';

  // Tool modes
  drawMode: boolean;
  agentDialogOpen: boolean;

  // Data cache
  projects: Project[];
  currentProjectEpisodes: Episode[];
  taskHistory: Task[];

  // Loading states
  projectsLoading: boolean;
  episodesLoading: boolean;

  // Sidebar state (mobile/tablet overlay)
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  closeSidebar: () => void;

  // Phase 2: Pipeline state
  pipelineStep: PipelineStep;
  driftRecords: DriftRecord[];
  exitReason: string | null;
  reviewPointActive: boolean;
  activeDesignSystem: string;
  genuiSurfaces: GenUISurface[];

  // Actions
  setActiveProject: (id: string | null) => void;
  setActiveEpisode: (num: number | null) => void;
  setActiveStage: (stage: number) => void;
  setActivePipeline: (pipeline: PipelineMode) => void;
  setActiveTheme: (theme: ThemeId) => void;
  setActiveBranch: (branch: string) => void;
  setSelectedVersion: (id: string | null) => void;
  setDiffPair: (pair: [string, string] | null) => void;
  toggleRightPanel: () => void;
  setRightPanelOpen: (open: boolean) => void;
  setRightPanelTab: (tab: 'theme' | 'inspect' | 'comments' | 'review' | 'qa') => void;
  setDrawMode: (active: boolean) => void;
  setAgentDialogOpen: (open: boolean) => void;
  setProjects: (projects: Project[]) => void;
  setEpisodes: (episodes: Episode[]) => void;
  setTaskHistory: (tasks: Task[]) => void;
  setProjectsLoading: (loading: boolean) => void;
  setEpisodesLoading: (loading: boolean) => void;

  // Phase 2: Pipeline actions
  setPipelineStep: (step: PipelineStep) => void;
  setDriftRecords: (records: DriftRecord[]) => void;
  setExitReason: (reason: string | null) => void;
  setReviewPointActive: (active: boolean) => void;
  setActiveDesignSystem: (system: string) => void;
  setGenuiSurfaces: (surfaces: GenUISurface[]) => void;
  addGenuiSurface: (surface: GenUISurface) => void;
  removeGenuiSurface: (surfaceId: string) => void;
}

export const useAppStore = create<AppState>((set) => ({
  // Initial state
  activeProjectId: null,
  activeEpisodeNum: null,
  activePipeline: 'standard',
  activeStage: 0,
  activeTheme: 'cinematic',
  activeBranch: 'main',
  selectedVersionId: null,
  diffPair: null,
  rightPanelOpen: false,
  rightPanelTab: 'theme',
  drawMode: false,
  agentDialogOpen: false,
  projects: [],
  currentProjectEpisodes: [],
  taskHistory: [],
  projectsLoading: false,
  episodesLoading: false,

  // Sidebar state
  sidebarOpen: false,

  // Phase 2: Pipeline state initial values
  pipelineStep: 'idle',
  driftRecords: [],
  exitReason: null,
  reviewPointActive: false,
  activeDesignSystem: 'cinematic',
  genuiSurfaces: [],

  // Actions
  setActiveProject: (id) => set({ activeProjectId: id }),
  setActiveEpisode: (num) => set({ activeEpisodeNum: num }),
  setActiveStage: (stage) => set({ activeStage: stage }),
  setActivePipeline: (pipeline) => set({ activePipeline: pipeline }),
  setActiveTheme: (theme) => set({ activeTheme: theme }),
  setActiveBranch: (branch) => set({ activeBranch: branch }),
  setSelectedVersion: (id) => set({ selectedVersionId: id }),
  setDiffPair: (pair) => set({ diffPair: pair }),
  toggleRightPanel: () => set((s) => ({ rightPanelOpen: !s.rightPanelOpen })),
  setRightPanelOpen: (open) => set({ rightPanelOpen: open }),
  setRightPanelTab: (tab) => set({ rightPanelTab: tab }),
  setDrawMode: (active) => set({ drawMode: active }),
  setAgentDialogOpen: (open) => set({ agentDialogOpen: open }),
  setProjects: (projects) => set({ projects }),
  setEpisodes: (episodes) => set({ currentProjectEpisodes: episodes }),
  setTaskHistory: (tasks) => set({ taskHistory: tasks }),
  setProjectsLoading: (loading) => set({ projectsLoading: loading }),
  setEpisodesLoading: (loading) => set({ episodesLoading: loading }),

  // Sidebar actions
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  closeSidebar: () => set({ sidebarOpen: false }),

  // Phase 2: Pipeline actions
  setPipelineStep: (step) => set({ pipelineStep: step }),
  setDriftRecords: (records) => set({ driftRecords: records }),
  setExitReason: (reason) => set({ exitReason: reason }),
  setReviewPointActive: (active) => set({ reviewPointActive: active }),
  setActiveDesignSystem: (system) => set({ activeDesignSystem: system }),
  setGenuiSurfaces: (surfaces) => set({ genuiSurfaces: surfaces }),
  addGenuiSurface: (surface) => set((s) => ({
    genuiSurfaces: [...s.genuiSurfaces.filter((gs) => gs.surfaceId !== surface.surfaceId), surface],
  })),
  removeGenuiSurface: (surfaceId) => set((s) => ({
    genuiSurfaces: s.genuiSurfaces.filter((gs) => gs.surfaceId !== surfaceId),
  })),
}));
