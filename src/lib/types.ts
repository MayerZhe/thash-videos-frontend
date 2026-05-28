// ─── Thash.videos 共享 TypeScript 类型 ───
// Based on HANDOFF.md §5 Schema + interaction-spec.md §14 数据模型

// ─── Pipeline & Theme ───
export type PipelineMode =
  | 'standard'
  | 'asset-based'
  | 'digital-human'
  | 'i2v'
  | 'action-transfer';

export type ThemeId =
  | 'cinematic'
  | 'anime'
  | 'watercolor'
  | 'dark'
  | 'warm';

export type StyleType =
  | 'realistic'
  | 'anime'
  | 'ghibli'
  | 'cinematic'
  | 'comic'
  | 'watercolor'
  | 'chinese_ink';

export type ProjectStatus = 'draft' | 'in_progress' | 'completed';
export type ScriptStatus = 'not_started' | 'drafting' | 'completed';
export type TaskStatus = 'completed' | 'failed' | 'running' | 'pending';
export type AuthorType = 'ai' | 'human';
export type SupplierType = 'image' | 'video' | 'tts';

// ─── Stage labels ───
export const STAGE_LABELS = [
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

export type StageLabel = (typeof STAGE_LABELS)[number];

export const STAGE_NAMES: Record<StageLabel, string> = {
  source_content: '原始内容',
  script_rewrite: 'AI改写',
  character_management: '角色管理',
  scene_management: '场景管理',
  storyboard: '分镜表',
  image_generation: '图片生成',
  video_generation: '视频生成',
  tts_dubbing: 'TTS配音',
  shot_composition: '镜头合成',
  episode_merge: '整集拼接',
  export: '导出',
};

// ─── Pipeline State (stored as JSONB in episodes) ───
export interface PipelineState {
  source_content?: SourceContentState;
  script_rewrite?: ScriptRewriteState;
  character_management?: CharacterManagementState;
  scene_management?: SceneManagementState;
  storyboard?: StoryboardState;
  image_generation?: ImageGenerationState;
  video_generation?: VideoGenerationState;
  tts_dubbing?: TtsDubbingState;
  shot_composition?: ShotCompositionState;
  episode_merge?: EpisodeMergeState;
  export?: ExportState;
}

export interface SourceContentState {
  raw_text: string;
  detected_characters: string[];
  detected_scenes: string[];
  tone: string;
}

export interface ScriptRewriteState {
  formatted_script: string;
  analysis: Record<string, unknown>;
}

export interface CharacterManagementState {
  characters: Character[];
}

export interface SceneManagementState {
  scenes: Scene[];
}

export interface StoryboardState {
  shots: StoryboardShot[];
}

export interface ImageGenerationState {
  assets: GeneratedImage[];
}

export interface VideoGenerationState {
  videos: GeneratedVideo[];
}

export interface TtsDubbingState {
  voices: VoiceConfig[];
  timeline: SubtitleSegment[];
}

export interface ShotCompositionState {
  compositions: CompositionEntry[];
}

export interface EpisodeMergeState {
  merge_timeline: MergeSegment[];
}

export interface ExportState {
  export_formats: ExportConfig[];
  cost_summary: CostSummary | null;
}

// ─── Domain objects ───
export interface Project {
  id: string;
  title: string;
  style: string;
  description: string;
  status: ProjectStatus;
  created_at: string;
  updated_at: string;
  total_episodes: number;
  total_cost_cents: number;
}

export interface Episode {
  id: string;
  project_id: string;
  episode_number: number;
  title: string;
  script_status: ScriptStatus;
  duration_seconds: number | null;
  pipeline_state: PipelineState;
  ai_config_locked: boolean;
  created_at: string;
  updated_at: string;
}

export interface Character {
  id: string;
  name: string;
  role: string;
  age: number;
  traits: string[];
  voice_id: string;
  reference_images: string[];
  status: {
    location: string;
    mood: string;
    outfit: string;
    relationships: Record<string, string>;
    last_episode: number;
  };
}

export interface Scene {
  id: string;
  location: string;
  time_of_day: string;
  ambiance: string;
  characters: string[];
}

export interface StoryboardShot {
  shot_id: string;
  shot_type: string;
  camera_motion: string;
  duration_seconds: number;
  image_prompt: {
    scene: string;
    composition: string;
    lighting: string;
    ambiance: string;
  };
  video_prompt: {
    action: string;
    camera_motion: string;
    ambiance_audio: string;
  };
  dialogue: DialogueLine[];
}

export interface DialogueLine {
  speaker: string;
  line: string;
}

export interface GeneratedImage {
  id: string;
  url: string;
  supplier: string;
  cost: number;
  clip_score: number;
  status: 'generated' | 'generating' | 'queued';
}

export interface GeneratedVideo {
  id: string;
  url: string;
  supplier: string;
  cost: number;
  clip_score: number;
  status: 'generated' | 'generating' | 'queued';
}

export interface VoiceConfig {
  character_id: string;
  character_name: string;
  supplier: string;
  voice_name: string;
}

export interface SubtitleSegment {
  start: number;
  end: number;
  text: string;
  speaker: string;
}

export interface CompositionEntry {
  shot_id: string;
  progress: number;
  status: 'pending' | 'compositing' | 'done';
}

export interface MergeSegment {
  shot_id: string;
  start: number;
  end: number;
  duration: number;
}

export interface ExportConfig {
  format: 'mp4' | 'jianying_draft';
  resolution: string;
  bitrate: string;
}

export interface CostSummary {
  total: number;
  image: number;
  video: number;
  tts: number;
  by_supplier: Record<string, number>;
}

export interface Version {
  id: string;
  project_id: string;
  short_id: string;
  parent_ids: string[];
  branch: string;
  author_id: string | null;
  author_type: AuthorType;
  message: string;
  pipeline_stage: string;
  changes: Record<string, number>;      // { files, additions, deletions } from JSONB
  metadata: Record<string, unknown>;     // { model, supplier, cost, qualityScore } from JSONB
  tags: string[];
  is_checkpoint: boolean;
  snapshot: Record<string, unknown>;
  created_at: string;
}

export interface Task {
  task_id: string;
  title: string;
  status: TaskStatus;
  created_at: string;
  completed_at: string | null;
  duration: number;
  n_frames: number;
  video_path: string;
  input_text: string;
  pipeline: PipelineMode;
  supplier: {
    image: string;
    video: string;
    tts: string;
  };
}

export interface Comment {
  id: string;
  stage: string;
  author: {
    name: string;
    avatar: string;
  };
  timestamp: string;
  text: string;
  resolved: boolean;
}

export interface SupplierConfig {
  id: string;
  user_id: string;
  supplier_type: SupplierType;
  supplier_name: string;
  priority: number;
  auto_failover: boolean;
  api_key_ref: string | null;
  is_enabled: boolean;
}

// ─── API response wrappers ───
export interface ProjectListResponse {
  projects: Project[];
  total: number;
}

export interface VersionListResponse {
  versions: Version[];
  total: number;
  branches: string[];
  head: Record<string, string>;
}

export interface DiffResponse {
  from: string;
  to: string;
  changes: {
    field: string;
    type: 'text' | 'param' | 'frame' | 'metadata';
    old_value: unknown;
    new_value: unknown;
  }[];
  stats: {
    additions: number;
    deletions: number;
    files_changed: number;
  };
}

export interface RestoreResponse {
  restored_to: string;
  affected_downstream_stages: string[];
  warning: string;
  new_head_version_id: string;
}

// ─── Phase 4: Auth & User ───
export interface User {
  id: string;
  email: string;
  name: string;
  avatar_url: string | null;
  created_at: string;
  plan: 'free' | 'starter' | 'pro' | 'enterprise';
  monthly_budget_limit: number | null;
  project_budget_limit: number | null;
}

// ─── Phase 4: Credits ───
export interface CreditBalance {
  total_cents: number;
  bonus_cents: number;
  paid_cents: number;
  plan: 'free' | 'starter' | 'pro' | 'enterprise';
  updated_at: string;
}

export interface CreditTransaction {
  id: string;
  user_id: string;
  amount_cents: number;
  balance_after_cents: number;
  type: 'charge' | 'purchase' | 'refund' | 'bonus' | 'monthly_allowance';
  description: string;
  created_at: string;
}

export interface CreditPackage {
  id: string;
  name: string;
  amount_cents: number;
  price_yuan: number;
  label: string;
  recommended: boolean;
  badge: string | null;
}

export interface PaymentIntent {
  client_secret: string;
  payment_intent_id: string;
  amount_yuan: number;
}

// ─── Phase 4: Usage ───
export interface UsageSummary {
  period: string;
  total_calls: number;
  total_cost_cents: number;
  by_supplier: Record<string, number>;
  by_stage: Record<string, number>;
  updated_at: string;
}

export interface UsageRecord {
  id: string;
  user_id: string;
  project_id: string | null;
  supplier: string;
  stage: string;
  cost_cents: number;
  created_at: string;
}

// ─── Phase 4: Export ───
export interface ExportJob {
  id: string;
  project_id: string;
  episode_id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  format: 'mp4' | 'jianying_draft';
  resolution: '720p' | '1080p' | '4k';
  file_url: string | null;
  file_size_bytes: number | null;
  created_at: string;
  completed_at: string | null;
}

// ─── Pipeline 任务管理 ───

export interface PrecheckRequest {
  project_id: string;
  episode_number: number;
  stage?: StageLabel;
  mode?: PipelineMode;
}

export interface PipelinePrecheckResponse {
  estimated_cost_cents: number;
  estimated_duration_seconds: number;
  feasibility: 'high' | 'medium' | 'low';
  warnings: string[];
  recommended_stages: StageLabel[];
}

export interface PipelineSubmitRequest {
  project_id: string;
  episode_number: number;
  stage?: StageLabel;
  mode?: PipelineMode;
  dry_run?: boolean;
}

export interface PipelineSubmitResponse {
  job_id: string;
  status: 'queued' | 'running';
  estimated_completion?: string;
}

export interface PipelineJobStatus {
  job_id: string;
  status: 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';
  stage: StageLabel;
  stage_index: number;
  total_stages: number;
  error?: string;
  started_at?: string;
  completed_at?: string;
  progress_percent: number;
  current_agent?: string;
}

export interface ReviewRequest {
  decision: 'approve' | 'reject' | 'modify';
  changes?: string;
  redo_stages?: StageLabel[];
}

export interface TweakRequest {
  pace?: number;
  pacing?: number;
  hue_shift?: number;
  bgm_volume?: number;
  dialogue_volume?: number;
  transition_speed?: string;
  subtitle_style?: string;
  tone_shift?: string;
}

export interface AgentOutputData {
  agent_name: string;
  output: unknown;
  metadata: Record<string, unknown>;
}

// ─── Video Projects ───

export interface VideoProject {
  id: string;
  title: string;
  description?: string;
  status: 'draft' | 'producing' | 'completed';
  platform: string;
  duration_seconds?: number;
  created_at: string;
  updated_at: string;
}

export interface CreateVideoProjectRequest {
  title: string;
  description?: string;
  platform?: string;
}

export interface VideoProjectListResponse {
  projects: VideoProject[];
  total: number;
}

export interface VideoProjectStats {
  total: number;
  by_status: Record<string, number>;
}

// ─── Video Scenes ───

export interface VideoScene {
  id: string;
  project_id: string;
  scene_number: number;
  title: string;
  description?: string;
  shot_type?: string;
  estimated_duration_seconds?: number;
  created_at: string;
  updated_at: string;
}

export interface CreateSceneRequest {
  title: string;
  description?: string;
  shot_type?: string;
  estimated_duration_seconds?: number;
}

// ─── Video Characters ───

export interface VideoCharacter {
  id: string;
  name: string;
  gender?: string;
  age?: number;
  role?: string;
  personality?: string;
  appearance?: string;
  voice_config?: Record<string, unknown>;
  reference_image_url?: string;
  project_id?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateCharacterRequest {
  name: string;
  gender?: string;
  age?: number;
  role?: string;
  personality?: string;
  appearance?: string;
  voice_config?: Record<string, unknown>;
  reference_image_url?: string;
}

// ─── Video Assets ───

export interface VideoAsset {
  id: string;
  project_id: string;
  name: string;
  type: 'image' | 'video' | 'audio' | 'other';
  url: string;
  thumbnail_url?: string;
  file_size_bytes?: number;
  duration_seconds?: number;
  scene_ids?: string[];
  created_at: string;
  updated_at: string;
}

export interface CreateAssetRequest {
  url: string;
  name: string;
  type: string;
}

// ─── Video Exports ───

export interface VideoExport {
  id: string;
  project_id: string;
  format: string;
  resolution: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  file_url?: string;
  file_size_bytes?: number;
  cost_cents: number;
  created_at: string;
  completed_at?: string;
}

export interface CreateExportRequest {
  format: string;
  resolution: string;
}

export interface ExportEstimateResponse {
  estimated_cost_cents: number;
  estimated_duration_seconds: number;
  details?: Record<string, number>;
}

// ─── Settings — Team & Billing ───

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: 'owner' | 'admin' | 'member';
  joined_at: string;
}

export interface TeamInvitation {
  email: string;
  role: 'admin' | 'member';
}

export interface BillingInfo {
  plan: string;
  billing_cycle: string;
  next_billing_date?: string;
  cost_to_date_cents: number;
  budget_limit_cents?: number;
}

// ─── Publishing ───

export interface PublishingChannel {
  id: string;
  name: string;
  platform: string;
  status: 'connected' | 'disconnected' | 'error';
  icon_url?: string;
}

export interface PublishingQueueItem {
  id: string;
  project_id: string;
  channel_id: string;
  status: 'queued' | 'publishing' | 'completed' | 'failed';
  progress_percent: number;
  created_at: string;
  completed_at?: string;
}

// ─── Analytics ───

export interface AnalyticsSummary {
  period: string;
  total_calls: number;
  total_cost_cents: number;
  by_supplier: Record<string, number>;
  by_stage: Record<string, number>;
}

export interface AnalyticsSupplier {
  supplier: string;
  calls: number;
  cost_cents: number;
}

export interface AnalyticsApiCall {
  id: string;
  endpoint: string;
  supplier: string;
  stage: string;
  cost_cents: number;
  duration_ms: number;
  status: string;
  created_at: string;
}

// ─── Branch Merge ───

export interface MergeResponse {
  merged: boolean;
  from_branch: string;
  to_branch: string;
  new_head_version_id: string;
  conflicts?: string[];
}

// ─── Comments ───

export interface ProjectComment {
  id: string;
  project_id: string;
  author: {
    id: string;
    name: string;
    avatar_url?: string;
  };
  content: string;
  resolved: boolean;
  created_at: string;
  updated_at: string;
}
