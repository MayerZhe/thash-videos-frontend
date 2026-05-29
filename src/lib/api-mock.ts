// ─── API Mock Layer — videos.thash ───
// Provides transparent mock data when backend is unreachable.
// All types strictly match @/lib/types.ts to ensure type safety.
//
// CRUD operations mutate in-memory storage for data consistency:
// - create() returns an object that list() will include
// - delete() removes the object from subsequent list() calls
// - update() modifies the in-memory record

import type {
  Project,
  ProjectListResponse,
  Episode,
  VersionListResponse,
  DiffResponse,
  RestoreResponse,
  PipelineState,
  SupplierConfig,
  User,
  CreditBalance,
  CreditTransaction,
  CreditPackage,
  PaymentIntent,
  UsageSummary,
  UsageRecord,
  ExportJob,
  PrecheckRequest,
  PipelinePrecheckResponse,
  PipelineSubmitRequest,
  PipelineSubmitResponse,
  PipelineJobStatus,
  ReviewRequest,
  TweakRequest,
  AgentOutputData,
  VideoProject,
  VideoProjectListResponse,
  VideoProjectStats,
  CreateVideoProjectRequest,
  VideoScene,
  CreateSceneRequest,
  VideoCharacter,
  CreateCharacterRequest,
  VideoAsset,
  CreateAssetRequest,
  VideoExport,
  CreateExportRequest,
  ExportEstimateResponse,
  TeamMember,
  TeamInvitation,
  BillingInfo,
  PublishingChannel,
  PublishingQueueItem,
  AnalyticsSummary,
  AnalyticsSupplier,
  AnalyticsApiCall,
  MergeResponse,
  ProjectComment,
} from './types';

// ─── Helpers ───

let _idCounter = 1000;
function uid(prefix = 'mock'): string {
  return `${prefix}_${String(++_idCounter)}_${Date.now().toString(36)}`;
}

function delay(ms = 300): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms + Math.random() * 200));
}

function isoDate(offsetDays = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString();
}

// ─── In-Memory Stores ───

let mockProjects: Project[] = [
  {
    id: uid('proj'), title: '霸道总裁的99次告白', style: 'realistic',
    description: '现代都市爱情故事，讲述霸道总裁与灰姑娘的情感纠葛',
    status: 'in_progress', created_at: isoDate(-14), updated_at: isoDate(-1),
    total_episodes: 12, total_cost_cents: 54000,
  },
  {
    id: uid('proj'), title: '绝世剑仙在校园', style: 'anime',
    description: '修仙大佬转生为普通高中生，开启爆笑修真校园生活',
    status: 'draft', created_at: isoDate(-7), updated_at: isoDate(-2),
    total_episodes: 24, total_cost_cents: 0,
  },
  {
    id: uid('proj'), title: '重生之豪门千金', style: 'cinematic',
    description: '前世惨死的千金小姐重生成18岁少女，步步为营复仇归来',
    status: 'completed', created_at: isoDate(-30), updated_at: isoDate(-3),
    total_episodes: 20, total_cost_cents: 128000,
  },
  {
    id: uid('proj'), title: '我在古代当县令', style: 'chinese_ink',
    description: '现代公务员穿越古代，用现代管理思维治理一方百姓',
    status: 'in_progress', created_at: isoDate(-21), updated_at: isoDate(-1),
    total_episodes: 16, total_cost_cents: 32000,
  },
  {
    id: uid('proj'), title: '末日求生之AI觉醒', style: 'cinematic',
    description: '2049年人工智能觉醒，人类在末日废墟中重建文明',
    status: 'draft', created_at: isoDate(-3), updated_at: isoDate(-1),
    total_episodes: 8, total_cost_cents: 15600,
  },
];

let mockEpisodes: Episode[] = [];
function seedEpisodes(): void {
  if (mockEpisodes.length > 0) return;
  const pipelineState: PipelineState = {};
  for (const project of mockProjects.slice(0, 3)) {
    for (let i = 1; i <= 3; i++) {
      mockEpisodes.push({
        id: uid('ep'),
        project_id: project.id,
        episode_number: i,
        title: project.title.replace(/的\d+次|在|之/g, '') + ` 第${i}集`,
        script_status: i === 1 ? 'completed' : i === 2 ? 'drafting' : 'not_started',
        duration_seconds: i === 1 ? 180 : null,
        pipeline_state: pipelineState,
        ai_config_locked: false,
        created_at: isoDate(-7 + i),
        updated_at: isoDate(-1 + i),
      });
    }
  }
}
seedEpisodes();

let mockUsers: User[] = [
  {
    id: 'user_mock_1', email: 'admin@thash.videos', name: '管理员',
    display_name: '管理员', avatar_url: null, is_active: true, is_superuser: false,
    created_at: isoDate(-90), plan: 'pro',
    monthly_budget_limit: 100000, project_budget_limit: 50000,
  },
];

let mockApiKeys: Array<{ id: string; name: string; created_at: string }> = [
  { id: 'key_mock_1', name: '开发环境密钥', created_at: isoDate(-30) },
];

let mockSuppliers: SupplierConfig[] = [
  { id: 'sup_mock_1', user_id: 'user_mock_1', supplier_type: 'image', supplier_name: 'StableDiffusionXL', priority: 1, auto_failover: true, api_key_ref: 'sk-img-xxx', is_enabled: true },
  { id: 'sup_mock_2', user_id: 'user_mock_1', supplier_type: 'video', supplier_name: 'Runway Gen-3', priority: 2, auto_failover: true, api_key_ref: 'sk-vid-xxx', is_enabled: true },
  { id: 'sup_mock_3', user_id: 'user_mock_1', supplier_type: 'tts', supplier_name: 'Azure TTS', priority: 1, auto_failover: false, api_key_ref: null, is_enabled: false },
];

let mockTeamMembers: TeamMember[] = [
  { id: 'tm_mock_1', name: '管理员', email: 'admin@thash.videos', role: 'owner', joined_at: isoDate(-90) },
  { id: 'tm_mock_2', name: '编剧小王', email: 'wang@thash.videos', role: 'admin', joined_at: isoDate(-60) },
  { id: 'tm_mock_3', name: '剪辑师张三', email: 'zhang@thash.videos', role: 'member', joined_at: isoDate(-30) },
];

let mockCreditTransactions: CreditTransaction[] = [
  { id: uid('ctxn'), user_id: 'user_mock_1', amount_cents: 50000, balance_after_cents: 50000, type: 'purchase', description: '购买500元充值包', created_at: isoDate(-14) },
  { id: uid('ctxn'), user_id: 'user_mock_1', amount_cents: 10000, balance_after_cents: 60000, type: 'bonus', description: '新用户赠送', created_at: isoDate(-14) },
  { id: uid('ctxn'), user_id: 'user_mock_1', amount_cents: -5400, balance_after_cents: 54600, type: 'charge', description: '项目"霸道总裁的99次告白"消费', created_at: isoDate(-7) },
  { id: uid('ctxn'), user_id: 'user_mock_1', amount_cents: -3200, balance_after_cents: 51400, type: 'charge', description: '项目"我在古代当县令"消费', created_at: isoDate(-3) },
  { id: uid('ctxn'), user_id: 'user_mock_1', amount_cents: 3000, balance_after_cents: 54400, type: 'monthly_allowance', description: 'Pro套餐月度赠送', created_at: isoDate(-1) },
  { id: uid('ctxn'), user_id: 'user_mock_1', amount_cents: -1560, balance_after_cents: 52840, type: 'charge', description: '项目"末日求生之AI觉醒"消费', created_at: isoDate(-1) },
];

let mockCreditPackages: CreditPackage[] = [
  { id: 'pkg_mock_1', name: '入门包', amount_cents: 5000, price_yuan: 50, label: '￥50 = 50积分', recommended: false, badge: null },
  { id: 'pkg_mock_2', name: '创作者包', amount_cents: 30000, price_yuan: 288, label: '￥288 = 300积分', recommended: true, badge: '推荐' },
  { id: 'pkg_mock_3', name: '专业包', amount_cents: 100000, price_yuan: 888, label: '￥888 = 1000积分', recommended: false, badge: '畅销' },
  { id: 'pkg_mock_4', name: '企业包', amount_cents: 500000, price_yuan: 3888, label: '￥3888 = 5000积分', recommended: false, badge: null },
];

let mockPayments = [
  { id: uid('pmt'), amount_yuan: 288, status: 'completed', created_at: isoDate(-14) },
  { id: uid('pmt'), amount_yuan: 888, status: 'completed', created_at: isoDate(-30) },
];

let mockUsageRecords: UsageRecord[] = [
  { id: uid('ur'), user_id: 'user_mock_1', project_id: mockProjects[0].id, supplier: 'StableDiffusionXL', stage: 'image_generation', cost_cents: 2400, created_at: isoDate(-5) },
  { id: uid('ur'), user_id: 'user_mock_1', project_id: mockProjects[0].id, supplier: 'Runway Gen-3', stage: 'video_generation', cost_cents: 3000, created_at: isoDate(-4) },
  { id: uid('ur'), user_id: 'user_mock_1', project_id: mockProjects[3].id, supplier: 'Azure TTS', stage: 'tts_dubbing', cost_cents: 800, created_at: isoDate(-3) },
  { id: uid('ur'), user_id: 'user_mock_1', project_id: null, supplier: 'GPT-4o', stage: 'script_rewrite', cost_cents: 1200, created_at: isoDate(-2) },
];

let mockExportJobs: ExportJob[] = [
  { id: uid('exp'), project_id: mockProjects[0].id, episode_id: mockEpisodes[0]?.id ?? '', status: 'completed', format: 'mp4', resolution: '1080p', file_url: 'https://example.com/exports/v1.mp4', file_size_bytes: 52428800, created_at: isoDate(-3), completed_at: isoDate(-3) },
  { id: uid('exp'), project_id: mockProjects[0].id, episode_id: mockEpisodes[1]?.id ?? '', status: 'processing', format: 'mp4', resolution: '720p', file_url: null, file_size_bytes: null, created_at: isoDate(-1), completed_at: null },
];

let mockVideoProjects: VideoProject[] = [
  { id: uid('vp'), title: '抖音短剧·霸道总裁', description: '竖屏短剧，每集60秒', status: 'producing', platform: 'douyin', duration_seconds: 60, created_at: isoDate(-10), updated_at: isoDate(-2) },
  { id: uid('vp'), title: '快手短剧·剑仙校园', description: '轻松搞笑竖屏短剧', status: 'draft', platform: 'kuaishou', duration_seconds: undefined, created_at: isoDate(-5), updated_at: isoDate(-1) },
  { id: uid('vp'), title: 'B站短片·末日AI', description: '横屏高质量短片', status: 'completed', platform: 'bilibili', duration_seconds: 300, created_at: isoDate(-20), updated_at: isoDate(-3) },
];

let mockVideoScenes: VideoScene[] = [];
function seedVideoScenes(): void {
  if (mockVideoScenes.length > 0) return;
  for (const vp of mockVideoProjects) {
    for (let i = 1; i <= 3; i++) {
      mockVideoScenes.push({
        id: uid('vs'), project_id: vp.id, scene_number: i,
        title: vp.title + ` 场景${i}`,
        description: `场景${i}描述 - ${vp.platform}平台适配`,
        shot_type: i === 1 ? '特写' : i === 2 ? '中景' : '远景',
        estimated_duration_seconds: i * 15,
        created_at: isoDate(-5 + i), updated_at: isoDate(-1 + i),
      });
    }
  }
}
seedVideoScenes();

let mockVideoCharacters: VideoCharacter[] = [
  { id: uid('vc'), name: '陆总裁', gender: '男', age: 28, role: '主角', personality: '高冷霸气', appearance: '西装革履，英俊冷酷', voice_config: { supplier: 'Azure TTS', voice: 'zh-CN-YunxiNeural' }, reference_image_url: undefined, project_id: mockVideoProjects[0]?.id, created_at: isoDate(-10), updated_at: isoDate(-2) },
  { id: uid('vc'), name: '林小白', gender: '女', age: 22, role: '主角', personality: '善良坚韧', appearance: '清纯可人，长发飘逸', voice_config: { supplier: 'Azure TTS', voice: 'zh-CN-XiaoxiaoNeural' }, reference_image_url: undefined, project_id: mockVideoProjects[0]?.id, created_at: isoDate(-10), updated_at: isoDate(-2) },
  { id: uid('vc'), name: '叶剑仙', gender: '男', age: 18, role: '主角', personality: '低调强大', appearance: '校服少年，眼神锐利', voice_config: { supplier: 'Azure TTS', voice: 'zh-CN-YunyangNeural' }, reference_image_url: undefined, project_id: mockVideoProjects[1]?.id, created_at: isoDate(-5), updated_at: isoDate(-1) },
];

let mockVideoAssets: VideoAsset[] = [
  { id: uid('va'), project_id: mockVideoProjects[0]?.id ?? '', name: '总裁办公室背景', type: 'image', url: 'https://picsum.photos/seed/office/800/600', thumbnail_url: 'https://picsum.photos/seed/office/200/150', file_size_bytes: 204800, scene_ids: [mockVideoScenes[0]?.id ?? ''], created_at: isoDate(-8), updated_at: isoDate(-2) },
  { id: uid('va'), project_id: mockVideoProjects[0]?.id ?? '', name: '开场BGM', type: 'audio', url: 'https://example.com/audio/bgm_opening.mp3', thumbnail_url: undefined, file_size_bytes: 3145728, duration_seconds: 30, scene_ids: [], created_at: isoDate(-7), updated_at: isoDate(-2) },
  { id: uid('va'), project_id: mockVideoProjects[1]?.id ?? '', name: '校园场景素材', type: 'video', url: 'https://example.com/video/school_bg.mp4', thumbnail_url: 'https://picsum.photos/seed/school/200/150', file_size_bytes: 15728640, duration_seconds: 15, scene_ids: [mockVideoScenes[3]?.id ?? ''], created_at: isoDate(-4), updated_at: isoDate(-1) },
];

let mockVideoExports: VideoExport[] = [
  { id: uid('vexp'), project_id: mockVideoProjects[0]?.id ?? '', format: 'mp4', resolution: '1080p', status: 'completed', file_url: 'https://example.com/exports/video_proj_1.mp4', file_size_bytes: 52428800, cost_cents: 1200, created_at: isoDate(-3), completed_at: isoDate(-3) },
  { id: uid('vexp'), project_id: mockVideoProjects[2]?.id ?? '', format: 'mp4', resolution: '4k', status: 'processing', file_url: undefined, file_size_bytes: undefined, cost_cents: 3500, created_at: isoDate(-1), completed_at: undefined },
];

let mockPublishingChannels: PublishingChannel[] = [
  { id: 'ch_mock_1', name: '抖音创作者平台', platform: 'douyin', status: 'connected', icon_url: undefined },
  { id: 'ch_mock_2', name: '快手开放平台', platform: 'kuaishou', status: 'disconnected', icon_url: undefined },
  { id: 'ch_mock_3', name: 'B站创作中心', platform: 'bilibili', status: 'connected', icon_url: undefined },
];

let mockPublishingQueue: PublishingQueueItem[] = [
  { id: uid('pq'), project_id: mockProjects[0]?.id ?? '', channel_id: 'ch_mock_1', status: 'completed', progress_percent: 100, created_at: isoDate(-5), completed_at: isoDate(-5) },
  { id: uid('pq'), project_id: mockProjects[2]?.id ?? '', channel_id: 'ch_mock_3', status: 'publishing', progress_percent: 65, created_at: isoDate(-1), completed_at: undefined },
];

let mockProjectComments: ProjectComment[] = [
  { id: uid('cmt'), project_id: mockProjects[0]?.id ?? '', author: { id: 'user_mock_1', name: '管理员', avatar_url: undefined }, content: '第一集的节奏可以再快一些', resolved: false, created_at: isoDate(-3), updated_at: isoDate(-3) },
  { id: uid('cmt'), project_id: mockProjects[0]?.id ?? '', author: { id: 'tm_mock_2', name: '编剧小王', avatar_url: undefined }, content: '好的，我会调整台词密度', resolved: true, created_at: isoDate(-2), updated_at: isoDate(-1) },
];

let mockVersions: any[] = [];
function seedVersions(): void {
  if (mockVersions.length > 0) return;
  for (const project of mockProjects.slice(0, 2)) {
    for (let v = 1; v <= 2; v++) {
      mockVersions.push({
        id: uid('ver'), project_id: project.id, short_id: `v${v}_${project.id.slice(-6)}`,
        parent_ids: v > 1 ? [mockVersions[mockVersions.length - 1]?.id ?? ''] : [],
        branch: 'main', author_id: null, author_type: 'human' as const,
        message: `第${v}版迭代`, pipeline_stage: 'script_rewrite',
        changes: { files: 3, additions: 120, deletions: 45 },
        metadata: { model: 'GPT-4o', supplier: 'OpenAI', cost: 0.05, qualityScore: 0.92 },
        tags: v === 1 ? [] : ['reviewed'], is_checkpoint: v === 2,
        snapshot: {}, created_at: isoDate(-7 + v),
      });
    }
  }
}
seedVersions();

// ─── Mock API Objects ───

export const mockProjectsApi = {
  list: async (params?: { q?: string; status?: string; sort?: string }): Promise<ProjectListResponse> => {
    await delay();
    let filtered = [...mockProjects];
    if (params?.q) {
      const q = params.q.toLowerCase();
      filtered = filtered.filter((p) => p.title.toLowerCase().includes(q) || p.description?.toLowerCase().includes(q));
    }
    if (params?.status) {
      filtered = filtered.filter((p) => p.status === params.status);
    }
    return { projects: filtered, total: filtered.length };
  },

  get: async (id: string): Promise<Project> => {
    await delay();
    const found = mockProjects.find((p) => p.id === id);
    if (!found) throw new Error(`Project ${id} not found`);
    return found;
  },

  create: async (data: { title: string; style?: string; description?: string }): Promise<Project> => {
    await delay();
    const project: Project = {
      id: uid('proj'),
      title: data.title,
      style: data.style ?? 'realistic',
      description: data.description ?? '',
      status: 'draft',
      created_at: isoDate(0),
      updated_at: isoDate(0),
      total_episodes: 0,
      total_cost_cents: 0,
    };
    mockProjects.unshift(project);
    return project;
  },

  update: async (id: string, data: Partial<Project>): Promise<Project> => {
    await delay();
    const idx = mockProjects.findIndex((p) => p.id === id);
    if (idx === -1) throw new Error(`Project ${id} not found`);
    mockProjects[idx] = { ...mockProjects[idx], ...data, updated_at: isoDate(0) };
    return mockProjects[idx];
  },

  delete: async (id: string): Promise<void> => {
    await delay();
    const idx = mockProjects.findIndex((p) => p.id === id);
    if (idx === -1) throw new Error(`Project ${id} not found`);
    mockProjects.splice(idx, 1);
    // Also remove related episodes
    mockEpisodes = mockEpisodes.filter((e) => e.project_id !== id);
  },
};

export const mockEpisodesApi = {
  list: async (projectId: string): Promise<Episode[]> => {
    await delay();
    return mockEpisodes.filter((e) => e.project_id === projectId);
  },

  get: async (projectId: string, episodeNum: number): Promise<Episode> => {
    await delay();
    const found = mockEpisodes.find((e) => e.project_id === projectId && e.episode_number === episodeNum);
    if (!found) throw new Error(`Episode ${episodeNum} not found in project ${projectId}`);
    return found;
  },

  create: async (projectId: string, data: { episode_number: number; title?: string }): Promise<Episode> => {
    await delay();
    const project = mockProjects.find((p) => p.id === projectId);
    const episode: Episode = {
      id: uid('ep'),
      project_id: projectId,
      episode_number: data.episode_number,
      title: data.title ?? `${project?.title ?? 'Unknown'} 第${data.episode_number}集`,
      script_status: 'not_started',
      duration_seconds: null,
      pipeline_state: {},
      ai_config_locked: false,
      created_at: isoDate(0),
      updated_at: isoDate(0),
    };
    mockEpisodes.unshift(episode);
    return episode;
  },

  update: async (projectId: string, episodeNum: number, data: Partial<Episode>): Promise<Episode> => {
    await delay();
    const idx = mockEpisodes.findIndex((e) => e.project_id === projectId && e.episode_number === episodeNum);
    if (idx === -1) throw new Error(`Episode ${episodeNum} not found in project ${projectId}`);
    mockEpisodes[idx] = { ...mockEpisodes[idx], ...data, updated_at: isoDate(0) };
    return mockEpisodes[idx];
  },

  delete: async (projectId: string, episodeNum: number): Promise<void> => {
    await delay();
    const idx = mockEpisodes.findIndex((e) => e.project_id === projectId && e.episode_number === episodeNum);
    if (idx === -1) throw new Error(`Episode ${episodeNum} not found in project ${projectId}`);
    mockEpisodes.splice(idx, 1);
  },

  updateStages: async (_projectId: string, _episodeNum: number, stages: Partial<PipelineState>): Promise<PipelineState> => {
    await delay();
    return stages as PipelineState;
  },

  getStage: async (_projectId: string, _episodeNum: number, stage: string): Promise<PipelineState> => {
    await delay();
    return { [stage]: {} } as unknown as PipelineState;
  },

  generate: async (_projectId: string, _episodeNum: number, stage: string, _options?: { supplier?: string; options?: Record<string, unknown> }): Promise<{ task_id: string; status: string }> => {
    await delay(600);
    return { task_id: uid('task'), status: 'queued' };
  },

  regenerate: async (_projectId: string, _episodeNum: number, stage: string, _options?: { supplier?: string; options?: Record<string, unknown> }): Promise<{ task_id: string; status: string }> => {
    await delay(600);
    return { task_id: uid('task'), status: 'queued' };
  },
};

export const mockVersionsApi = {
  list: async (_projectId: string, _params?: { branch?: string; q?: string; stage?: string; tagged?: string }): Promise<VersionListResponse> => {
    await delay();
    const filtered = mockVersions.filter((v) => v.project_id === _projectId);
    return { versions: filtered, total: filtered.length, branches: ['main', 'feature/v2'], head: { main: filtered[filtered.length - 1]?.id ?? '' } };
  },

  diff: async (_projectId: string, from: string, to: string): Promise<DiffResponse> => {
    await delay();
    return {
      from, to,
      changes: [
        { field: 'script.formatted_script', type: 'text', old_value: '旧脚本内容...', new_value: '新脚本内容...' },
        { field: 'pipeline.mode', type: 'param', old_value: 'standard', new_value: 'asset-based' },
        { field: 'metadata.model', type: 'metadata', old_value: 'GPT-4o', new_value: 'Claude Opus 4' },
      ],
      stats: { additions: 245, deletions: 78, files_changed: 5 },
    };
  },

  restore: async (_projectId: string, versionId: string): Promise<RestoreResponse> => {
    await delay();
    return {
      restored_to: versionId,
      affected_downstream_stages: ['image_generation', 'video_generation', 'tts_dubbing'],
      warning: '恢复操作将覆盖当前未提交的修改，请确认已保存所有进度',
      new_head_version_id: uid('ver'),
    };
  },

  tags: async (_projectId: string, _versionId: string, data: { tags: string[] }): Promise<{ tags: string[] }> => {
    await delay();
    return { tags: data.tags };
  },

  createBranch: async (_projectId: string, data: { name: string; description?: string; base_version_id?: string }): Promise<{ name: string; created_at: string }> => {
    await delay();
    return { name: data.name, created_at: isoDate(0) };
  },

  merge: async (branchName: string, targetBranch: string): Promise<MergeResponse> => {
    await delay(500);
    return {
      merged: true,
      from_branch: branchName,
      to_branch: targetBranch,
      new_head_version_id: uid('ver'),
    };
  },
};

export const mockSettingsApi = {
  getProfile: async (): Promise<Record<string, unknown>> => {
    await delay();
    return { name: '管理员', email: 'admin@thash.videos', plan: 'pro', language: 'zh-CN', timezone: 'Asia/Shanghai' };
  },

  updateProfile: async (data: Record<string, unknown>): Promise<Record<string, unknown>> => {
    await delay();
    return { ...data, updated_at: isoDate(0) };
  },

  getApiKeys: async (): Promise<Array<{ id: string; name: string; created_at: string }>> => {
    await delay();
    return mockApiKeys;
  },

  createApiKey: async (data: { name: string }): Promise<{ id: string; key: string }> => {
    await delay();
    const newKey = { id: uid('key'), name: data.name, created_at: isoDate(0) };
    mockApiKeys.unshift(newKey);
    return { id: newKey.id, key: `thash_${uid('sk').slice(5)}` };
  },

  deleteApiKey: async (id: string): Promise<void> => {
    await delay();
    mockApiKeys = mockApiKeys.filter((k) => k.id !== id);
  },

  getSuppliers: async (): Promise<SupplierConfig[]> => {
    await delay();
    return mockSuppliers;
  },

  updateSupplier: async (id: string, data: Partial<SupplierConfig>): Promise<SupplierConfig> => {
    await delay();
    const idx = mockSuppliers.findIndex((s) => s.id === id);
    if (idx === -1) throw new Error(`Supplier ${id} not found`);
    mockSuppliers[idx] = { ...mockSuppliers[idx], ...data };
    return mockSuppliers[idx];
  },

  getTeam: async (): Promise<TeamMember[]> => {
    await delay();
    return mockTeamMembers;
  },

  inviteMember: async (data: TeamInvitation): Promise<TeamMember> => {
    await delay();
    const member: TeamMember = {
      id: uid('tm'),
      name: data.email.split('@')[0],
      email: data.email,
      role: data.role,
      joined_at: isoDate(0),
    };
    mockTeamMembers.push(member);
    return member;
  },

  getBilling: async (): Promise<BillingInfo> => {
    await delay();
    return {
      plan: 'pro',
      billing_cycle: 'monthly',
      next_billing_date: isoDate(15),
      cost_to_date_cents: 54200,
      budget_limit_cents: 100000,
    };
  },
};

export const mockAuthApi = {
  login: async (data: { email: string; password: string }): Promise<{ user: User; token: string }> => {
    await delay(500);
    if (!data.email || !data.password) throw new Error('邮箱和密码不能为空');
    const user = mockUsers[0];
    return { user: { ...user, email: data.email }, token: `mock_jwt_${uid('tk').slice(5)}` };
  },

  register: async (data: { email: string; password: string; name: string }): Promise<{ user: User; token: string }> => {
    await delay(500);
    const user: User = {
      id: uid('user'),
      email: data.email,
      name: data.name,
      display_name: data.name,
      avatar_url: null,
      is_active: true,
      is_superuser: false,
      created_at: isoDate(0),
      plan: 'free',
      monthly_budget_limit: null,
      project_budget_limit: null,
    };
    mockUsers.push(user);
    return { user, token: `mock_jwt_${uid('tk').slice(5)}` };
  },

  verifyEmail: async (_data: { user_id: string; code: string }): Promise<{ verified: boolean }> => {
    await delay();
    return { verified: true };
  },

  resendVerification: async (_data: { user_id: string }): Promise<void> => {
    await delay();
  },

  logout: async (): Promise<void> => {
    await delay();
  },

  getCurrentUser: async (): Promise<User> => {
    await delay();
    return mockUsers[0];
  },

  updateProfile: async (data: Partial<Pick<User, 'name' | 'avatar_url'>>): Promise<User> => {
    await delay();
    mockUsers[0] = { ...mockUsers[0], ...data };
    return mockUsers[0];
  },

  requestPasswordReset: async (_data: { email: string }): Promise<void> => {
    await delay();
  },

  resetPassword: async (_data: { token: string; new_password: string }): Promise<void> => {
    await delay();
  },

  changePassword: async (_data: { current_password: string; new_password: string }): Promise<void> => {
    await delay(300);
  },
};

export const mockCreditsApi = {
  getBalance: async (): Promise<CreditBalance> => {
    await delay();
    return {
      total_cents: 52840,
      bonus_cents: 13000,
      paid_cents: 39840,
      plan: 'pro',
      updated_at: isoDate(0),
    };
  },

  getTransactions: async (params?: { limit?: number; offset?: number; type?: string }): Promise<{ transactions: CreditTransaction[]; total: number }> => {
    await delay();
    let filtered = [...mockCreditTransactions];
    if (params?.type) {
      filtered = filtered.filter((t) => t.type === params.type);
    }
    const start = params?.offset ?? 0;
    const end = params?.limit ? start + params.limit : filtered.length;
    return { transactions: filtered.slice(start, end), total: filtered.length };
  },

  getPackages: async (): Promise<CreditPackage[]> => {
    await delay();
    return mockCreditPackages;
  },

  createPaymentIntent: async (data: { package_id: string }): Promise<PaymentIntent> => {
    await delay(500);
    const pkg = mockCreditPackages.find((p) => p.id === data.package_id);
    return {
      client_secret: `pi_mock_${uid('cs').slice(5)}`,
      payment_intent_id: uid('pi'),
      amount_yuan: pkg?.price_yuan ?? 0,
    };
  },

  confirmPayment: async (_data: { payment_intent_id: string }): Promise<{ success: boolean }> => {
    await delay(800);
    return { success: true };
  },
};

export const mockPaymentsApi = {
  getPaymentHistory: async (_params?: { limit?: number; offset?: number }): Promise<{ payments: Array<{ id: string; amount_yuan: number; status: string; created_at: string }>; total: number }> => {
    await delay();
    return { payments: mockPayments, total: mockPayments.length };
  },

  createPaymentIntent: async (data: { package_id: string; payment_method?: string }): Promise<PaymentIntent> => {
    await delay(500);
    return {
      client_secret: `pi_mock_${uid('cs').slice(5)}`,
      payment_intent_id: uid('pi'),
      amount_yuan: 288,
    };
  },
};

export const mockUsageApi = {
  getSummary: async (_params?: { period?: string }): Promise<UsageSummary> => {
    await delay();
    return {
      period: _params?.period ?? '2026-05',
      total_calls: 47,
      total_cost_cents: 7400,
      by_supplier: { 'StableDiffusionXL': 2400, 'Runway Gen-3': 3000, 'Azure TTS': 800, 'GPT-4o': 1200 },
      by_stage: { image_generation: 2400, video_generation: 3000, tts_dubbing: 800, script_rewrite: 1200 },
      updated_at: isoDate(0),
    };
  },

  getRecords: async (_params?: { limit?: number; offset?: number; supplier?: string; stage?: string; project_id?: string }): Promise<{ records: UsageRecord[]; total: number }> => {
    await delay();
    let filtered = [...mockUsageRecords];
    if (_params?.supplier) filtered = filtered.filter((r) => r.supplier === _params.supplier);
    if (_params?.stage) filtered = filtered.filter((r) => r.stage === _params.stage);
    if (_params?.project_id) filtered = filtered.filter((r) => r.project_id === _params.project_id);
    return { records: filtered, total: filtered.length };
  },
};

export const mockExportApi = {
  list: async (projectId: string): Promise<ExportJob[]> => {
    await delay();
    return mockExportJobs.filter((j) => j.project_id === projectId);
  },

  create: async (data: { project_id: string; episode_id?: string; format: 'mp4' | 'jianying_draft'; resolution: '720p' | '1080p' | '4k' }): Promise<ExportJob> => {
    await delay(600);
    const job: ExportJob = {
      id: uid('exp'),
      project_id: data.project_id,
      episode_id: data.episode_id ?? '',
      status: 'pending',
      format: data.format,
      resolution: data.resolution,
      file_url: null,
      file_size_bytes: null,
      created_at: isoDate(0),
      completed_at: null,
    };
    mockExportJobs.unshift(job);
    return job;
  },

  getStatus: async (_projectId: string, exportId: string): Promise<ExportJob> => {
    await delay();
    const found = mockExportJobs.find((j) => j.id === exportId);
    if (!found) throw new Error(`Export job ${exportId} not found`);
    return found;
  },

  download: (_projectId: string, _exportId: string): string => {
    return 'https://example.com/exports/mock_download.mp4';
  },
};

export const mockPipelineApi = {
  precheck: async (_projectId: string, _episodeNumber: number, _data: PrecheckRequest): Promise<PipelinePrecheckResponse> => {
    await delay(600);
    return {
      estimated_cost_cents: 540,
      estimated_duration_seconds: 180,
      feasibility: 'high',
      warnings: ['当前阶段依赖已完成的script_rewrite，请确认脚本已通过审核'],
      recommended_stages: ['image_generation', 'video_generation', 'tts_dubbing'],
    };
  },

  submit: async (_projectId: string, _episodeNumber: number, _data: PipelineSubmitRequest): Promise<PipelineSubmitResponse> => {
    await delay(800);
    return {
      job_id: uid('job'),
      status: 'queued',
      estimated_completion: isoDate(0),
    };
  },

  status: async (jobId: string): Promise<PipelineJobStatus> => {
    await delay();
    return {
      job_id: jobId,
      status: 'running',
      stage: 'video_generation',
      stage_index: 6,
      total_stages: 11,
      started_at: isoDate(-1),
      progress_percent: 55,
      current_agent: 'video-generator',
    };
  },

  stop: async (jobId: string): Promise<PipelineJobStatus> => {
    await delay();
    return {
      job_id: jobId,
      status: 'cancelled',
      stage: 'video_generation',
      stage_index: 6,
      total_stages: 11,
      started_at: isoDate(-1),
      completed_at: isoDate(0),
      progress_percent: 55,
    };
  },

  retry: async (jobId: string): Promise<PipelineSubmitResponse> => {
    await delay();
    return { job_id: jobId, status: 'queued', estimated_completion: isoDate(0) };
  },

  review: async (jobId: string, _data: Record<string, unknown>): Promise<PipelineJobStatus> => {
    await delay();
    return {
      job_id: jobId,
      status: 'completed',
      stage: 'shot_composition',
      stage_index: 9,
      total_stages: 11,
      started_at: isoDate(-2),
      completed_at: isoDate(0),
      progress_percent: 100,
    };
  },

  tweak: async (jobId: string, _data: Record<string, unknown>): Promise<PipelineJobStatus> => {
    await delay();
    return {
      job_id: jobId,
      status: 'running',
      stage: 'shot_composition',
      stage_index: 9,
      total_stages: 11,
      started_at: isoDate(-1),
      progress_percent: 82,
      current_agent: 'compositor',
    };
  },

  agentOutput: async (_jobId: string, agentName: string): Promise<AgentOutputData> => {
    await delay();
    return {
      agent_name: agentName,
      output: { status: 'success', generated_count: 12, warnings: [] },
      metadata: { model: 'StableDiffusionXL', duration_ms: 4500, cost_cents: 120 },
    };
  },
};

export const mockVideoProjectsApi = {
  list: async (params?: { status?: string; search?: string }): Promise<VideoProjectListResponse> => {
    await delay();
    let filtered = [...mockVideoProjects];
    if (params?.status) filtered = filtered.filter((p) => p.status === params.status);
    if (params?.search) {
      const s = params.search.toLowerCase();
      filtered = filtered.filter((p) => p.title.toLowerCase().includes(s) || p.description?.toLowerCase().includes(s));
    }
    return { projects: filtered, total: filtered.length };
  },

  create: async (data: CreateVideoProjectRequest): Promise<VideoProject> => {
    await delay();
    const vp: VideoProject = {
      id: uid('vp'),
      title: data.title,
      description: data.description,
      status: 'draft',
      platform: data.platform ?? 'douyin',
      created_at: isoDate(0),
      updated_at: isoDate(0),
    };
    mockVideoProjects.unshift(vp);
    return vp;
  },

  stats: async (): Promise<VideoProjectStats> => {
    await delay();
    const by_status: Record<string, number> = {};
    for (const vp of mockVideoProjects) {
      by_status[vp.status] = (by_status[vp.status] ?? 0) + 1;
    }
    return { total: mockVideoProjects.length, by_status };
  },

  delete: async (projectId: string): Promise<void> => {
    await delay();
    const idx = mockVideoProjects.findIndex((p) => p.id === projectId);
    if (idx === -1) throw new Error(`Video project ${projectId} not found`);
    mockVideoProjects.splice(idx, 1);
    mockVideoScenes = mockVideoScenes.filter((s) => s.project_id !== projectId);
    mockVideoAssets = mockVideoAssets.filter((a) => a.project_id !== projectId);
  },
};

export const mockVideoScenesApi = {
  list: async (projectId: string): Promise<VideoScene[]> => {
    await delay();
    return mockVideoScenes.filter((s) => s.project_id === projectId);
  },

  create: async (projectId: string, data: CreateSceneRequest): Promise<VideoScene> => {
    await delay();
    const maxNum = mockVideoScenes.filter((s) => s.project_id === projectId).reduce((m, s) => Math.max(m, s.scene_number), 0);
    const scene: VideoScene = {
      id: uid('vs'),
      project_id: projectId,
      scene_number: maxNum + 1,
      title: data.title,
      description: data.description,
      shot_type: data.shot_type,
      estimated_duration_seconds: data.estimated_duration_seconds,
      created_at: isoDate(0),
      updated_at: isoDate(0),
    };
    mockVideoScenes.unshift(scene);
    return scene;
  },

  get: async (_projectId: string, sceneId: string): Promise<VideoScene> => {
    await delay();
    const found = mockVideoScenes.find((s) => s.id === sceneId);
    if (!found) throw new Error(`Scene ${sceneId} not found`);
    return found;
  },

  update: async (_projectId: string, sceneId: string, data: Partial<VideoScene>): Promise<VideoScene> => {
    await delay();
    const idx = mockVideoScenes.findIndex((s) => s.id === sceneId);
    if (idx === -1) throw new Error(`Scene ${sceneId} not found`);
    mockVideoScenes[idx] = { ...mockVideoScenes[idx], ...data, updated_at: isoDate(0) };
    return mockVideoScenes[idx];
  },

  delete: async (_projectId: string, sceneId: string): Promise<void> => {
    await delay();
    mockVideoScenes = mockVideoScenes.filter((s) => s.id !== sceneId);
  },

  reorder: async (_projectId: string, _sceneIds: string[]): Promise<void> => {
    await delay();
  },
};

export const mockVideoCharactersApi = {
  list: async (): Promise<VideoCharacter[]> => {
    await delay();
    return mockVideoCharacters;
  },

  create: async (data: CreateCharacterRequest): Promise<VideoCharacter> => {
    await delay();
    const character: VideoCharacter = {
      id: uid('vc'),
      name: data.name,
      gender: data.gender,
      age: data.age,
      role: data.role,
      personality: data.personality,
      appearance: data.appearance,
      voice_config: data.voice_config,
      reference_image_url: data.reference_image_url,
      created_at: isoDate(0),
      updated_at: isoDate(0),
    };
    mockVideoCharacters.unshift(character);
    return character;
  },

  get: async (characterId: string): Promise<VideoCharacter> => {
    await delay();
    const found = mockVideoCharacters.find((c) => c.id === characterId);
    if (!found) throw new Error(`Character ${characterId} not found`);
    return found;
  },

  update: async (characterId: string, data: Partial<VideoCharacter>): Promise<VideoCharacter> => {
    await delay();
    const idx = mockVideoCharacters.findIndex((c) => c.id === characterId);
    if (idx === -1) throw new Error(`Character ${characterId} not found`);
    mockVideoCharacters[idx] = { ...mockVideoCharacters[idx], ...data, updated_at: isoDate(0) };
    return mockVideoCharacters[idx];
  },

  delete: async (characterId: string): Promise<void> => {
    await delay();
    mockVideoCharacters = mockVideoCharacters.filter((c) => c.id !== characterId);
  },

  importFromDrama: async (projectId: string): Promise<VideoCharacter[]> => {
    await delay(500);
    const imported: VideoCharacter[] = [
      { id: uid('vc'), name: '导入角色A', gender: '男', age: 25, role: '配角', personality: '机智幽默', appearance: '普通青年', voice_config: undefined, reference_image_url: undefined, project_id: projectId, created_at: isoDate(0), updated_at: isoDate(0) },
      { id: uid('vc'), name: '导入角色B', gender: '女', age: 20, role: '主角', personality: '活泼外向', appearance: '青春靓丽', voice_config: undefined, reference_image_url: undefined, project_id: projectId, created_at: isoDate(0), updated_at: isoDate(0) },
    ];
    mockVideoCharacters.unshift(...imported);
    return imported;
  },
};

export const mockVideoAssetsApi = {
  list: async (projectId: string, _params?: { type?: string; search?: string }): Promise<VideoAsset[]> => {
    await delay();
    let filtered = mockVideoAssets.filter((a) => a.project_id === projectId);
    if (_params?.type) filtered = filtered.filter((a) => a.type === _params.type);
    if (_params?.search) {
      const s = _params.search.toLowerCase();
      filtered = filtered.filter((a) => a.name.toLowerCase().includes(s));
    }
    return filtered;
  },

  create: async (projectId: string, data: CreateAssetRequest): Promise<VideoAsset> => {
    await delay();
    const asset: VideoAsset = {
      id: uid('va'),
      project_id: projectId,
      name: data.name,
      type: data.type as VideoAsset['type'],
      url: data.url,
      created_at: isoDate(0),
      updated_at: isoDate(0),
    };
    mockVideoAssets.unshift(asset);
    return asset;
  },

  update: async (_projectId: string, assetId: string, data: Partial<VideoAsset>): Promise<VideoAsset> => {
    await delay();
    const idx = mockVideoAssets.findIndex((a) => a.id === assetId);
    if (idx === -1) throw new Error(`Asset ${assetId} not found`);
    mockVideoAssets[idx] = { ...mockVideoAssets[idx], ...data, updated_at: isoDate(0) };
    return mockVideoAssets[idx];
  },

  delete: async (_projectId: string, assetId: string): Promise<void> => {
    await delay();
    mockVideoAssets = mockVideoAssets.filter((a) => a.id !== assetId);
  },

  batchDelete: async (_projectId: string, assetIds: string[]): Promise<void> => {
    await delay();
    mockVideoAssets = mockVideoAssets.filter((a) => !assetIds.includes(a.id));
  },

  linkToScenes: async (_projectId: string, assetId: string, sceneIds: string[]): Promise<void> => {
    await delay();
    const idx = mockVideoAssets.findIndex((a) => a.id === assetId);
    if (idx !== -1) {
      mockVideoAssets[idx] = { ...mockVideoAssets[idx], scene_ids: sceneIds, updated_at: isoDate(0) };
    }
  },
};

export const mockVideoExportsApi = {
  list: async (projectId: string): Promise<VideoExport[]> => {
    await delay();
    return mockVideoExports.filter((e) => e.project_id === projectId);
  },

  create: async (projectId: string, data: CreateExportRequest): Promise<VideoExport> => {
    await delay(600);
    const exportJob: VideoExport = {
      id: uid('vexp'),
      project_id: projectId,
      format: data.format,
      resolution: data.resolution,
      status: 'pending',
      cost_cents: 0,
      created_at: isoDate(0),
    };
    mockVideoExports.unshift(exportJob);
    return exportJob;
  },

  estimate: async (_projectId: string, _params?: { resolution?: string; format?: string }): Promise<ExportEstimateResponse> => {
    await delay();
    const resolutionCost: Record<string, number> = { '720p': 500, '1080p': 1200, '4k': 3500 };
    return {
      estimated_cost_cents: resolutionCost[_params?.resolution ?? '1080p'] ?? 1200,
      estimated_duration_seconds: 240,
      details: { render: 600, encoding: 300, upload: 300 },
    };
  },

  delete: async (_projectId: string, exportId: string): Promise<void> => {
    await delay();
    mockVideoExports = mockVideoExports.filter((e) => e.id !== exportId);
  },
};

export const mockPublishingApi = {
  listChannels: async (): Promise<PublishingChannel[]> => {
    await delay();
    return mockPublishingChannels;
  },

  connectChannel: async (channelId: string): Promise<{ redirect_url: string }> => {
    await delay();
    return { redirect_url: `https://auth.thash.videos/connect/${channelId}?state=mock` };
  },

  exportToChannel: async (data: { channel_id: string; project_id: string }): Promise<PublishingQueueItem> => {
    await delay(600);
    const item: PublishingQueueItem = {
      id: uid('pq'),
      project_id: data.project_id,
      channel_id: data.channel_id,
      status: 'queued',
      progress_percent: 0,
      created_at: isoDate(0),
    };
    mockPublishingQueue.unshift(item);
    return item;
  },

  getQueue: async (): Promise<PublishingQueueItem[]> => {
    await delay();
    return mockPublishingQueue;
  },

  cancelPublish: async (queueId: string): Promise<void> => {
    await delay();
    const idx = mockPublishingQueue.findIndex((q) => q.id === queueId);
    if (idx === -1) throw new Error(`Queue item ${queueId} not found`);
    mockPublishingQueue[idx] = { ...mockPublishingQueue[idx], status: 'failed', completed_at: isoDate(0) };
  },
};

export const mockAnalyticsApi = {
  getSummary: async (_projectId: string): Promise<AnalyticsSummary> => {
    await delay();
    return {
      period: '2026-05',
      total_calls: 47,
      total_cost_cents: 7400,
      by_supplier: { 'StableDiffusionXL': 2400, 'Runway Gen-3': 3000, 'Azure TTS': 800, 'GPT-4o': 1200 },
      by_stage: { image_generation: 2400, video_generation: 3000, tts_dubbing: 800, script_rewrite: 1200 },
    };
  },

  getSuppliers: async (_projectId: string): Promise<AnalyticsSupplier[]> => {
    await delay();
    return [
      { supplier: 'StableDiffusionXL', calls: 24, cost_cents: 2400 },
      { supplier: 'Runway Gen-3', calls: 10, cost_cents: 3000 },
      { supplier: 'Azure TTS', calls: 8, cost_cents: 800 },
      { supplier: 'GPT-4o', calls: 5, cost_cents: 1200 },
    ];
  },

  getApiCalls: async (_projectId: string): Promise<AnalyticsApiCall[]> => {
    await delay();
    return [
      { id: uid('ac'), endpoint: '/api/v1/pipeline/jobs/xxx/generate', supplier: 'StableDiffusionXL', stage: 'image_generation', cost_cents: 240, duration_ms: 3500, status: 'success', created_at: isoDate(-5) },
      { id: uid('ac'), endpoint: '/api/v1/pipeline/jobs/xxx/generate', supplier: 'Runway Gen-3', stage: 'video_generation', cost_cents: 600, duration_ms: 12000, status: 'success', created_at: isoDate(-4) },
      { id: uid('ac'), endpoint: '/api/v1/pipeline/jobs/xxx/generate', supplier: 'Azure TTS', stage: 'tts_dubbing', cost_cents: 200, duration_ms: 800, status: 'success', created_at: isoDate(-3) },
    ];
  },
};

export const mockCommentsApi = {
  list: async (projectId: string): Promise<ProjectComment[]> => {
    await delay();
    return mockProjectComments.filter((c) => c.project_id === projectId);
  },

  create: async (projectId: string, data: { content: string }): Promise<ProjectComment> => {
    await delay();
    const comment: ProjectComment = {
      id: uid('cmt'),
      project_id: projectId,
      author: { id: 'user_mock_1', name: '管理员', avatar_url: undefined },
      content: data.content,
      resolved: false,
      created_at: isoDate(0),
      updated_at: isoDate(0),
    };
    mockProjectComments.unshift(comment);
    return comment;
  },

  resolve: async (commentId: string): Promise<ProjectComment> => {
    await delay();
    const idx = mockProjectComments.findIndex((c) => c.id === commentId);
    if (idx === -1) throw new Error(`Comment ${commentId} not found`);
    mockProjectComments[idx] = { ...mockProjectComments[idx], resolved: true, updated_at: isoDate(0) };
    return mockProjectComments[idx];
  },
};

export const mockAssetsApi = {
  list: async (projectId: string): Promise<VideoAsset[]> => {
    await delay();
    return mockVideoAssets.filter((a) => a.project_id === projectId);
  },

  delete: async (assetId: string): Promise<void> => {
    await delay();
    mockVideoAssets = mockVideoAssets.filter((a) => a.id !== assetId);
  },

  batch: async (data: { action: string; asset_ids: string[] }): Promise<void> => {
    await delay();
    if (data.action === 'delete') {
      mockVideoAssets = mockVideoAssets.filter((a) => !data.asset_ids.includes(a.id));
    }
  },
};

// ─── Aggregated Mock API (for Proxy fallback usage) ───

export const mockApi = {
  projectsApi: mockProjectsApi,
  episodesApi: mockEpisodesApi,
  versionsApi: mockVersionsApi,
  settingsApi: mockSettingsApi,
  authApi: mockAuthApi,
  creditsApi: mockCreditsApi,
  paymentsApi: mockPaymentsApi,
  usageApi: mockUsageApi,
  exportApi: mockExportApi,
  pipelineApi: mockPipelineApi,
  videoProjectsApi: mockVideoProjectsApi,
  videoScenesApi: mockVideoScenesApi,
  videoCharactersApi: mockVideoCharactersApi,
  videoAssetsApi: mockVideoAssetsApi,
  videoExportsApi: mockVideoExportsApi,
  publishingApi: mockPublishingApi,
  analyticsApi: mockAnalyticsApi,
  commentsApi: mockCommentsApi,
  assetsApi: mockAssetsApi,
};
