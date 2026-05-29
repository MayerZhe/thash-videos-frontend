// ─── API Client — videos.thash ───

// During Cloudflare Pages build, NEXT_PUBLIC_API_URL may not be injected.
// Always fall back to the production API URL so the app doesn't crash.
// API calls will fail gracefully if the backend is unreachable.
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.videos.thash.app';

export { BASE_URL };

// ─── Token injection ───
let _tokenGetter: (() => string | null) | null = null;

export function setTokenGetter(fn: () => string | null) {
  _tokenGetter = fn;
}

function getToken(): string | null {
  if (_tokenGetter) return _tokenGetter();
  if (typeof window !== 'undefined') {
    return localStorage.getItem('thash_auth_token');
  }
  return null;
}

// ─── Core request ───
interface RequestOptions {
  params?: Record<string, string | number | undefined>;
  signal?: AbortSignal;
}

class ApiError extends Error {
  status: number;
  body: unknown;

  constructor(status: number, body: unknown) {
    const message = typeof body === 'object' && body !== null && 'error' in body
      ? String((body as Record<string, unknown>).error)
      : `API error ${status}`;
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.body = body;
  }
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
  options?: RequestOptions,
): Promise<T> {
  const url = new URL(`${BASE_URL}${path}`);

  if (options?.params) {
    Object.entries(options.params).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        url.searchParams.set(key, String(value));
      }
    });
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  const token = getToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(url.toString(), {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
    signal: options?.signal,
  });

  if (!res.ok) {
    let errorBody: unknown;
    try {
      errorBody = await res.json();
    } catch {
      errorBody = { error: res.statusText };
    }

    // Global 401 interceptor — clear auth and redirect to login
    if (res.status === 401 && typeof window !== 'undefined') {
      const { useAuthStore } = await import('@/stores/auth');
      useAuthStore.getState().clearAuth();
      sessionStorage.setItem('thash_session_expired', '1');
      const currentPath = window.location.pathname;
      const publicPaths = ['/', '/landing', '/login', '/register', '/verify-email', '/auth', '/video', '/short-video', '/dashboard'];
      const isPublicPath = publicPaths.some(p => currentPath === p || (p !== '/' && currentPath.startsWith(p + '/')));
      if (!isPublicPath) {
        window.location.href = `/login?redirect=${encodeURIComponent(currentPath)}`;
      }
      throw new ApiError(401, { error: 'Session expired' });
    }

    throw new ApiError(res.status, errorBody);
  }

  // 204 No Content
  if (res.status === 204) {
    return undefined as T;
  }

  return res.json();
}

// ─── Convenience methods ───

export function apiGet<T>(path: string, options?: RequestOptions): Promise<T> {
  return request<T>('GET', path, undefined, options);
}

export function apiPost<T>(path: string, body?: unknown, options?: RequestOptions): Promise<T> {
  return request<T>('POST', path, body, options);
}

export function apiPatch<T>(path: string, body?: unknown, options?: RequestOptions): Promise<T> {
  return request<T>('PATCH', path, body, options);
}

export function apiPut<T>(path: string, body?: unknown, options?: RequestOptions): Promise<T> {
  return request<T>('PUT', path, body, options);
}

export function apiDelete<T>(path: string, options?: RequestOptions): Promise<T> {
  return request<T>('DELETE', path, undefined, options);
}

// ─── Resource-specific API functions ───

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

// Lazy-load mock API — the module is only imported when NEXT_PUBLIC_MOCK_API=true at runtime.
// In production builds the getter is never called, so the chunk is never fetched.
const USE_MOCK = process.env.NEXT_PUBLIC_MOCK_API === 'true';
type MockApiType = typeof import('./api-mock').mockApi;
let _mockApiCache: MockApiType | undefined;
function getMockApi(): MockApiType {
  if (!_mockApiCache) {
    // Dynamic import — webpack splits api-mock into a separate chunk
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    _mockApiCache = require('./api-mock').mockApi as MockApiType;
  }
  return _mockApiCache;
}

// ─── Real API object implementations (unexported, wrapped below) ───

// Projects
const _projectsApi = {
  list: (params?: { q?: string; status?: string; sort?: string }) =>
    apiGet<ProjectListResponse>('/api/v1/projects', { params }),

  get: (id: string) =>
    apiGet<Project>(`/api/v1/projects/${id}`),

  create: (data: { title: string; style?: string; description?: string }) =>
    apiPost<Project>('/api/v1/projects', data),

  update: (id: string, data: Partial<Project>) =>
    apiPatch<Project>(`/api/v1/projects/${id}`, data),

  delete: (id: string) =>
    apiDelete<void>(`/api/v1/projects/${id}`),
};

// Episodes
const _episodesApi = {
  list: (projectId: string) =>
    apiGet<Episode[]>(`/api/v1/projects/${projectId}/episodes`),

  get: (projectId: string, episodeNum: number) =>
    apiGet<Episode>(`/api/v1/projects/${projectId}/episodes/${episodeNum}`),

  create: (projectId: string, data: { episode_number: number; title?: string }) =>
    apiPost<Episode>(`/api/v1/projects/${projectId}/episodes`, data),

  update: (projectId: string, episodeNum: number, data: Partial<Episode>) =>
    apiPatch<Episode>(`/api/v1/projects/${projectId}/episodes/${episodeNum}`, data),

  delete: (projectId: string, episodeNum: number) =>
    apiDelete<void>(`/api/v1/projects/${projectId}/episodes/${episodeNum}`),

  // Pipeline stages
  updateStages: (projectId: string, episodeNum: number, stages: Partial<PipelineState>) =>
    apiPatch<PipelineState>(`/api/v1/projects/${projectId}/episodes/${episodeNum}/stages`, { stages }),

  getStage: (projectId: string, episodeNum: number, stage: string) =>
    apiGet<PipelineState>(`/api/v1/projects/${projectId}/episodes/${episodeNum}/stages/${stage}`),

  generate: (projectId: string, episodeNum: number, stage: string, options?: { supplier?: string; options?: Record<string, unknown> }) =>
    apiPost<{ task_id: string; status: string }>(`/api/v1/projects/${projectId}/episodes/${episodeNum}/stages/${stage}/generate`, options),

  regenerate: (projectId: string, episodeNum: number, stage: string, options?: { supplier?: string; options?: Record<string, unknown> }) =>
    apiPost<{ task_id: string; status: string }>(`/api/v1/projects/${projectId}/episodes/${episodeNum}/stages/${stage}/regenerate`, options),
};

// Versions
const _versionsApi = {
  list: (projectId: string, params?: { branch?: string; q?: string; stage?: string; tagged?: string }) =>
    apiGet<VersionListResponse>(`/api/v1/projects/${projectId}/versions`, { params }),

  diff: (_projectId: string, from: string, to: string) =>
    apiGet<DiffResponse>('/api/v1/versions/diff', { params: { from, to } }),

  restore: (_projectId: string, versionId: string) =>
    apiPost<RestoreResponse>(`/api/v1/versions/${versionId}/restore`),

  tags: (_projectId: string, versionId: string, data: { tags: string[] }) =>
    apiPost<{ tags: string[] }>(`/api/v1/versions/${versionId}/tags`, { action: 'add', tag: data.tags[data.tags.length - 1] || '' }),

  createBranch: (_projectId: string, data: { name: string; description?: string; base_version_id?: string }) =>
    apiPost<{ name: string; created_at: string }>('/api/v1/branches', data),

  merge: (branchName: string, targetBranch: string) =>
    apiPost<MergeResponse>(`/api/v1/branches/${branchName}/merge`, { target_branch: targetBranch }),
};

// Settings
const _settingsApi = {
  getProfile: () =>
    apiGet<Record<string, unknown>>('/api/v1/settings/profile'),

  updateProfile: (data: Record<string, unknown>) =>
    apiPatch<Record<string, unknown>>('/api/v1/settings/profile', data),

  getApiKeys: () =>
    apiGet<Array<{ id: string; name: string; created_at: string }>>('/api/v1/settings/api-keys'),

  createApiKey: (data: { name: string }) =>
    apiPost<{ id: string; key: string }>('/api/v1/settings/api-keys', data),

  deleteApiKey: (id: string) =>
    apiDelete<void>(`/api/v1/settings/api-keys/${id}`),

  getSuppliers: () =>
    apiGet<SupplierConfig[]>('/api/v1/settings/suppliers'),

  updateSupplier: (id: string, data: Partial<SupplierConfig>) =>
    apiPatch<SupplierConfig>(`/api/v1/settings/suppliers/${id}`, data),

  getTeam: () =>
    apiGet<TeamMember[]>('/api/v1/settings/team'),

  inviteMember: (data: TeamInvitation) =>
    apiPost<TeamMember>('/api/v1/settings/team', data),

  getBilling: () =>
    apiGet<BillingInfo>('/api/v1/settings/billing'),
};

// ─── Phase 4: Auth API ───
const _authApi = {
  login: (data: { email: string; password: string }) =>
    apiPost<{ user: User; token: string }>('/api/v1/auth/login', data),

  register: (data: { email: string; password: string; name: string }) =>
    apiPost<{ user: User; token: string }>('/api/v1/auth/register', data),

  verifyEmail: (data: { user_id: string; code: string }) =>
    apiPost<{ verified: boolean }>('/api/v1/auth/verify-email', data),

  resendVerification: (data: { user_id: string }) =>
    apiPost<void>('/api/v1/auth/resend-verification', data),

  logout: () =>
    apiPost<void>('/api/v1/auth/logout'),

  getCurrentUser: () =>
    apiGet<User>('/api/v1/auth/me'),

  updateProfile: (data: Partial<Pick<User, 'name' | 'avatar_url'>>) =>
    apiPatch<User>('/api/v1/auth/profile', data),

  requestPasswordReset: (data: { email: string }) =>
    apiPost<void>('/api/v1/auth/password-reset/request', data),

  resetPassword: (data: { token: string; new_password: string }) =>
    apiPost<void>('/api/v1/auth/password-reset/confirm', data),

  changePassword: (data: { current_password: string; new_password: string }) =>
    apiPost<void>('/api/v1/auth/change-password', data),
};

// ─── Phase 4: Credits API ───
const _creditsApi = {
  getBalance: () =>
    apiGet<CreditBalance>('/api/v1/credits/balance'),

  getTransactions: (params?: { limit?: number; offset?: number; type?: string }) =>
    apiGet<{ transactions: CreditTransaction[]; total: number }>('/api/v1/credits/transactions', { params }),

  getPackages: () =>
    apiGet<CreditPackage[]>('/api/v1/credits/packages'),

  createPaymentIntent: (data: { package_id: string }) =>
    apiPost<PaymentIntent>('/api/v1/credits/payment/intent', data),

  confirmPayment: (data: { payment_intent_id: string }) =>
    apiPost<{ success: boolean }>('/api/v1/credits/payment/confirm', data),
};

// ─── Phase 4: Payments API ───
const _paymentsApi = {
  getPaymentHistory: (params?: { limit?: number; offset?: number }) =>
    apiGet<{ payments: Array<{ id: string; amount_yuan: number; status: string; created_at: string }>; total: number }>('/api/v1/payments/history', { params }),

  createPaymentIntent: (data: { package_id: string; payment_method?: string }) =>
    apiPost<PaymentIntent>('/api/v1/payments/intent', data),
};

// ─── Phase 4: Usage API ───
const _usageApi = {
  getSummary: (params?: { period?: string }) =>
    apiGet<UsageSummary>('/api/v1/usage/summary', { params }),

  getRecords: (params?: { limit?: number; offset?: number; supplier?: string; stage?: string; project_id?: string }) =>
    apiGet<{ records: UsageRecord[]; total: number }>('/api/v1/usage/records', { params }),
};

// ─── Phase 4: Export API ───
const _exportApi = {
  list: (projectId: string) =>
    apiGet<ExportJob[]>(`/api/v1/projects/${projectId}/exports`),

  create: (data: { project_id: string; episode_id?: string; format: 'mp4' | 'jianying_draft'; resolution: '720p' | '1080p' | '4k' }) =>
    apiPost<ExportJob>(`/api/v1/projects/${data.project_id}/exports`, data),

  getStatus: (projectId: string, exportId: string) =>
    apiGet<ExportJob>(`/api/v1/projects/${projectId}/exports/${exportId}`),

  download: (projectId: string, exportId: string) =>
    `${BASE_URL}/api/v1/projects/${projectId}/exports/${exportId}/download`,
};

// ─── Pipeline ───

const _pipelineApi = {
  precheck: (projectId: string, episodeNumber: number, data: PrecheckRequest) =>
    apiPost<PipelinePrecheckResponse>('/api/v1/pipeline/precheck', {
      pipeline_type: data.mode || 'novel_to_drama',
      episode_number: episodeNumber,
      project_id: projectId,
      stage: data.stage,
    }),

  submit: (projectId: string, episodeNumber: number, data: PipelineSubmitRequest) =>
    apiPost<PipelineSubmitResponse>('/api/v1/pipeline/submit', {
      pipeline_type: data.mode || 'novel_to_drama',
      episode_number: episodeNumber,
      project_id: projectId,
      stage: data.stage,
      dry_run: data.dry_run,
    }),

  status: (jobId: string) =>
    apiGet<PipelineJobStatus>(`/api/v1/pipeline/jobs/${jobId}`),

  stop: (jobId: string) =>
    apiPost<PipelineJobStatus>(`/api/v1/pipeline/jobs/${jobId}/stop`),

  retry: (jobId: string) =>
    apiPost<PipelineSubmitResponse>(`/api/v1/pipeline/jobs/${jobId}/retry`),

  review: (jobId: string, data: Record<string, unknown>) =>
    apiPost<PipelineJobStatus>(`/api/v1/pipeline/jobs/${jobId}/review`, data),

  tweak: (jobId: string, data: Record<string, unknown>) =>
    apiPost<PipelineJobStatus>(`/api/v1/pipeline/jobs/${jobId}/tweak`, data),

  agentOutput: (jobId: string, agentName: string) =>
    apiGet<AgentOutputData>(`/api/v1/pipeline/jobs/${jobId}/agent-output/${agentName}`),

  streamUrl: (jobId: string) => {
    const url = new URL(`${BASE_URL}/api/v1/pipeline/stream/${jobId}`);
    const token = getToken();
    if (token) url.searchParams.set('token', token);
    return url.toString();
  },
};

// ─── Video Projects ───

const _videoProjectsApi = {
  list: (params?: { status?: string; search?: string }) =>
    apiGet<VideoProjectListResponse>('/api/v1/video-projects', { params }),

  create: (data: CreateVideoProjectRequest) =>
    apiPost<VideoProject>('/api/v1/video-projects', data),

  stats: () =>
    apiGet<VideoProjectStats>('/api/v1/video-projects/stats'),

  delete: (projectId: string) =>
    apiDelete<void>(`/api/v1/video-projects/${projectId}`),
};

// ─── Video Scenes ───

const _videoScenesApi = {
  list: (projectId: string) =>
    apiGet<VideoScene[]>(`/api/v1/video-projects/${projectId}/scenes`),

  create: (projectId: string, data: CreateSceneRequest) =>
    apiPost<VideoScene>(`/api/v1/video-projects/${projectId}/scenes`, data),

  get: (projectId: string, sceneId: string) =>
    apiGet<VideoScene>(`/api/v1/video-projects/${projectId}/scenes/${sceneId}`),

  update: (projectId: string, sceneId: string, data: Partial<VideoScene>) =>
    apiPatch<VideoScene>(`/api/v1/video-projects/${projectId}/scenes/${sceneId}`, data),

  delete: (projectId: string, sceneId: string) =>
    apiDelete<void>(`/api/v1/video-projects/${projectId}/scenes/${sceneId}`),

  reorder: (projectId: string, sceneIds: string[]) =>
    apiPut<void>(`/api/v1/video-projects/${projectId}/scenes/reorder`, { scene_ids: sceneIds }),
};

// ─── Video Characters ───

const _videoCharactersApi = {
  list: () =>
    apiGet<VideoCharacter[]>('/api/v1/video-characters'),

  create: (data: CreateCharacterRequest) =>
    apiPost<VideoCharacter>('/api/v1/video-characters', data),

  get: (characterId: string) =>
    apiGet<VideoCharacter>(`/api/v1/video-characters/${characterId}`),

  update: (characterId: string, data: Partial<VideoCharacter>) =>
    apiPatch<VideoCharacter>(`/api/v1/video-characters/${characterId}`, data),

  delete: (characterId: string) =>
    apiDelete<void>(`/api/v1/video-characters/${characterId}`),

  importFromDrama: (projectId: string) =>
    apiPost<VideoCharacter[]>(`/api/v1/video-characters/import-from-drama`, { project_id: projectId }),
};

// ─── Video Assets ───

const _videoAssetsApi = {
  list: (projectId: string, params?: { type?: string; search?: string }) =>
    apiGet<VideoAsset[]>(`/api/v1/video-projects/${projectId}/assets`, { params }),

  create: (projectId: string, data: CreateAssetRequest) =>
    apiPost<VideoAsset>(`/api/v1/video-projects/${projectId}/assets`, data),

  upload: (projectId: string, file: File, metadata?: { name?: string; type?: string }) => {
    const formData = new FormData();
    formData.append('file', file);
    if (metadata) {
      if (metadata.name) formData.append('name', metadata.name);
      if (metadata.type) formData.append('type', metadata.type);
    }
    const url = `${BASE_URL}/api/v1/video-projects/${projectId}/assets/upload`;
    const token = getToken();
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return fetch(url, { method: 'POST', headers, body: formData }).then(r => r.json()) as Promise<VideoAsset>;
  },

  update: (projectId: string, assetId: string, data: Partial<VideoAsset>) =>
    apiPatch<VideoAsset>(`/api/v1/video-projects/${projectId}/assets/${assetId}`, data),

  delete: (projectId: string, assetId: string) =>
    apiDelete<void>(`/api/v1/video-projects/${projectId}/assets/${assetId}`),

  batchDelete: (projectId: string, assetIds: string[]) =>
    apiPost<void>(`/api/v1/video-projects/${projectId}/assets/batch-delete`, { asset_ids: assetIds }),

  linkToScenes: (projectId: string, assetId: string, sceneIds: string[]) =>
    apiPost<void>(`/api/v1/video-projects/${projectId}/assets/link`, { asset_id: assetId, scene_ids: sceneIds }),
};

// ─── Video Exports ───

const _videoExportsApi = {
  list: (projectId: string) =>
    apiGet<VideoExport[]>(`/api/v1/video-projects/${projectId}/exports`),

  create: (projectId: string, data: CreateExportRequest) =>
    apiPost<VideoExport>(`/api/v1/video-projects/${projectId}/exports`, data),

  estimate: (projectId: string, params?: { resolution?: string; format?: string }) =>
    apiGet<ExportEstimateResponse>(`/api/v1/video-projects/${projectId}/exports/estimate`, { params }),

  delete: (projectId: string, exportId: string) =>
    apiDelete<void>(`/api/v1/video-projects/${projectId}/exports/${exportId}`),
};

// ─── Publishing ───

const _publishingApi = {
  listChannels: () =>
    apiGet<PublishingChannel[]>('/api/v1/publishing/channels'),

  connectChannel: (channelId: string) =>
    apiPost<{ redirect_url: string }>(`/api/v1/channels/${channelId}/connect`),

  exportToChannel: (data: { channel_id: string; project_id: string }) =>
    apiPost<PublishingQueueItem>('/api/v1/publishing/export', data),

  getQueue: () =>
    apiGet<PublishingQueueItem[]>('/api/v1/publishing/queue'),

  cancelPublish: (queueId: string) =>
    apiPost<void>(`/api/v1/queue/${queueId}/cancel`),
};

// ─── Analytics ───

const _analyticsApi = {
  getSummary: (projectId: string) =>
    apiGet<AnalyticsSummary>(`/api/v1/projects/${projectId}/analytics/summary`),

  getSuppliers: (projectId: string) =>
    apiGet<AnalyticsSupplier[]>(`/api/v1/projects/${projectId}/analytics/suppliers`),

  getApiCalls: (projectId: string) =>
    apiGet<AnalyticsApiCall[]>(`/api/v1/projects/${projectId}/analytics/api-calls`),
};

// ─── Comments ───

const _commentsApi = {
  list: (projectId: string) =>
    apiGet<ProjectComment[]>(`/api/v1/projects/${projectId}/comments`),

  create: (projectId: string, data: { content: string }) =>
    apiPost<ProjectComment>(`/api/v1/projects/${projectId}/comments`, data),

  resolve: (commentId: string) =>
    apiPatch<ProjectComment>(`/api/v1/comments/${commentId}/resolve`),
};

// ─── Assets (legacy/extra endpoints for non-video projects) ───

const _assetsApi = {
  list: (projectId: string) =>
    apiGet<VideoAsset[]>(`/api/v1/projects/${projectId}/assets`),

  delete: (assetId: string) =>
    apiDelete<void>(`/api/v1/assets/${assetId}`),

  batch: (data: { action: string; asset_ids: string[] }) =>
    apiPost<void>('/api/v1/assets/batch', data),
};

// ─── Mock Fallback Proxy ───
// In dev mode (NEXT_PUBLIC_MOCK_API=true), API calls use mock data directly.
// In production, only real API calls are made — network errors propagate to callers.

function withMockFallback<T extends Record<string, (...args: any[]) => any>>(
  realApi: T,
  mockApiGetter: () => T,
  apiName: string,
): T {
  const handler: ProxyHandler<T> = {
    get(target, prop, receiver) {
      const realMethod = Reflect.get(target, prop, receiver);
      if (typeof realMethod !== 'function') return realMethod;

      if (USE_MOCK) {
        const mockApiObj = mockApiGetter();
        const mockMethod = Reflect.get(mockApiObj, prop, receiver) as (...args: any[]) => any;
        return async (...args: any[]) => {
          console.debug(`[Mock] ${apiName}.${String(prop)}`);
          return mockMethod(...args);
        };
      }

      return async (...args: any[]) => {
        return realMethod(...args);
      };
    },
  };
  return new Proxy(realApi, handler);
}

// ─── Exported API objects (real API with mock fallback) ───

export const projectsApi = withMockFallback(_projectsApi, () => getMockApi().projectsApi, 'projectsApi');
export const episodesApi = withMockFallback(_episodesApi, () => getMockApi().episodesApi, 'episodesApi');
export const versionsApi = withMockFallback(_versionsApi, () => getMockApi().versionsApi, 'versionsApi');
export const settingsApi = withMockFallback(_settingsApi, () => getMockApi().settingsApi, 'settingsApi');
export const authApi = withMockFallback(_authApi, () => getMockApi().authApi, 'authApi');
export const creditsApi = withMockFallback(_creditsApi, () => getMockApi().creditsApi, 'creditsApi');
export const paymentsApi = withMockFallback(_paymentsApi, () => getMockApi().paymentsApi, 'paymentsApi');
export const usageApi = withMockFallback(_usageApi, () => getMockApi().usageApi, 'usageApi');
export const exportApi = withMockFallback(_exportApi, () => getMockApi().exportApi, 'exportApi');
export const pipelineApi = withMockFallback(_pipelineApi, () => getMockApi().pipelineApi, 'pipelineApi');
export const videoProjectsApi = withMockFallback(_videoProjectsApi, () => getMockApi().videoProjectsApi, 'videoProjectsApi');
export const videoScenesApi = withMockFallback(_videoScenesApi, () => getMockApi().videoScenesApi, 'videoScenesApi');
export const videoCharactersApi = withMockFallback(_videoCharactersApi, () => getMockApi().videoCharactersApi, 'videoCharactersApi');
export const videoAssetsApi = withMockFallback(_videoAssetsApi, () => getMockApi().videoAssetsApi, 'videoAssetsApi');
export const videoExportsApi = withMockFallback(_videoExportsApi, () => getMockApi().videoExportsApi, 'videoExportsApi');
export const publishingApi = withMockFallback(_publishingApi, () => getMockApi().publishingApi, 'publishingApi');
export const analyticsApi = withMockFallback(_analyticsApi, () => getMockApi().analyticsApi, 'analyticsApi');
export const commentsApi = withMockFallback(_commentsApi, () => getMockApi().commentsApi, 'commentsApi');
export const assetsApi = withMockFallback(_assetsApi, () => getMockApi().assetsApi, 'assetsApi');

export { ApiError };
