// ─── API Client Tests ───

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// ═══════════════════════════════════════════════════════════════
// Generic ApiClient class tests (existing)
// ═══════════════════════════════════════════════════════════════

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = 'http://localhost:3001') {
    this.baseUrl = baseUrl;
  }

  async get<T>(path: string): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path}`);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    return response.json() as Promise<T>;
  }

  async post<T>(path: string, body: unknown): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    return response.json() as Promise<T>;
  }

  async put<T>(path: string, body: unknown): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    return response.json() as Promise<T>;
  }
}

describe('API Client', () => {
  let api: ApiClient;

  beforeEach(() => {
    api = new ApiClient();
    vi.restoreAllMocks();
  });

  it('should perform GET request and parse JSON response', async () => {
    const mockData = { id: '1', title: 'Test Project' };
    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockData),
    } as Response);

    const result = await api.get<{ id: string; title: string }>('/api/projects/1');
    expect(result.id).toBe('1');
    expect(result.title).toBe('Test Project');
  });

  it('should perform POST request with JSON body', async () => {
    const mockData = { id: 'new', title: 'New Project' };
    const mockFetch = vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockData),
    } as Response);

    const result = await api.post<{ id: string }>('/api/projects', {
      title: 'New Project',
    });

    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:3001/api/projects',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
    );
    expect(result.id).toBe('new');
  });

  it('should handle 404 errors', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: false,
      status: 404,
      statusText: 'Not Found',
    } as Response);

    await expect(api.get('/api/projects/nonexistent')).rejects.toThrow('HTTP 404');
  });

  it('should handle 500 errors', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
    } as Response);

    await expect(api.get('/api/projects')).rejects.toThrow('HTTP 500');
  });

  it('should handle network errors', async () => {
    vi.spyOn(global, 'fetch').mockRejectedValueOnce(new Error('Network Error'));

    await expect(api.get('/api/projects')).rejects.toThrow('Network Error');
  });

  it('should support PUT requests', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ id: 'p1', title: 'Updated' }),
    } as Response);

    const result = await api.put<{ id: string; title: string }>('/api/projects/p1', {
      title: 'Updated',
    });

    expect(result.title).toBe('Updated');
  });
});

// ═══════════════════════════════════════════════════════════════
// Real api.ts module tests
// ═══════════════════════════════════════════════════════════════

// Setup a proper localStorage mock for the entire test file.
// The real api.ts reads localStorage for auth tokens.
function setupLocalStorageMock() {
  const store: Record<string, string> = {};
  const localStorageMock = {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
    removeItem: vi.fn((key: string) => { delete store[key]; }),
    clear: vi.fn(() => { Object.keys(store).forEach((k) => delete store[k]); }),
    get length() { return Object.keys(store).length; },
    key: vi.fn((index: number) => Object.keys(store)[index] ?? null),
  };
  Object.defineProperty(window, 'localStorage', {
    value: localStorageMock,
    writable: true,
    configurable: true,
  });
  return localStorageMock;
}

// Pre-mock auth store
vi.mock('@/stores/auth', () => ({
  useAuthStore: {
    getState: vi.fn(() => ({
      clearAuth: vi.fn(),
    })),
  },
}));

describe('Real api.ts — BASE_URL', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('uses NEXT_PUBLIC_API_URL when set', async () => {
    process.env.NEXT_PUBLIC_API_URL = 'https://custom.thash.app';
    process.env.NEXT_PUBLIC_MOCK_API = 'false';

    const { BASE_URL } = await import('@/lib/api');
    expect(BASE_URL).toBe('https://custom.thash.app');
  });

  it('falls back to default production URL when NEXT_PUBLIC_API_URL is not set', async () => {
    delete (process.env as Record<string, string>).NEXT_PUBLIC_API_URL;
    process.env.NEXT_PUBLIC_MOCK_API = 'false';

    const { BASE_URL } = await import('@/lib/api');
    expect(BASE_URL).toBe('https://api.videos.thash.app');
  });
});

describe('Real api.ts — USE_MOCK=false calls real fetch', () => {
  beforeEach(() => {
    vi.resetModules();
    setupLocalStorageMock();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('USE_MOCK=false calls real fetch', async () => {
    process.env.NEXT_PUBLIC_MOCK_API = 'false';
    process.env.NEXT_PUBLIC_API_URL = 'https://api.videos.thash.app';

    const mockData = { total_cents: 5000, bonus_cents: 0, paid_cents: 5000, plan: 'free' };
    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve(mockData),
    } as Response);

    const { creditsApi } = await import('@/lib/api');

    const result = await creditsApi.getBalance();
    expect(result.total_cents).toBe(5000);
    expect(result.plan).toBe('free');
  });

  it('network error does NOT silently fallback to mock when USE_MOCK=false', async () => {
    process.env.NEXT_PUBLIC_MOCK_API = 'false';
    process.env.NEXT_PUBLIC_API_URL = 'https://api.videos.thash.app';

    vi.spyOn(global, 'fetch').mockRejectedValueOnce(new Error('Network Error'));

    const { creditsApi } = await import('@/lib/api');

    // Network error must propagate — must NOT silently return mock data
    await expect(creditsApi.getBalance()).rejects.toThrow('Network Error');
  });
});

describe('Real api.ts — exported API objects', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should export all expected API object proxies', async () => {
    process.env.NEXT_PUBLIC_MOCK_API = 'false';
    process.env.NEXT_PUBLIC_API_URL = 'https://api.videos.thash.app';

    const mod = await import('@/lib/api');

    expect(mod.projectsApi).toBeDefined();
    expect(mod.episodesApi).toBeDefined();
    expect(mod.versionsApi).toBeDefined();
    expect(mod.settingsApi).toBeDefined();
    expect(mod.authApi).toBeDefined();
    expect(mod.creditsApi).toBeDefined();
    expect(mod.paymentsApi).toBeDefined();
    expect(mod.usageApi).toBeDefined();
    expect(mod.exportApi).toBeDefined();
    expect(mod.pipelineApi).toBeDefined();
    expect(mod.videoProjectsApi).toBeDefined();
    expect(mod.videoScenesApi).toBeDefined();
    expect(mod.videoCharactersApi).toBeDefined();
    expect(mod.videoAssetsApi).toBeDefined();
    expect(mod.videoExportsApi).toBeDefined();
    expect(mod.publishingApi).toBeDefined();
    expect(mod.analyticsApi).toBeDefined();
    expect(mod.commentsApi).toBeDefined();
    expect(mod.assetsApi).toBeDefined();
  });

  it('should export core utility exports', async () => {
    process.env.NEXT_PUBLIC_MOCK_API = 'false';
    process.env.NEXT_PUBLIC_API_URL = 'https://api.videos.thash.app';

    const mod = await import('@/lib/api');

    expect(mod.BASE_URL).toBeDefined();
    expect(typeof mod.setTokenGetter).toBe('function');
    expect(typeof mod.apiGet).toBe('function');
    expect(typeof mod.apiPost).toBe('function');
    expect(typeof mod.apiPatch).toBe('function');
    expect(typeof mod.apiPut).toBe('function');
    expect(typeof mod.apiDelete).toBe('function');
    expect(mod.ApiError).toBeDefined();
  });

  it('should have documented methods on key API objects', async () => {
    process.env.NEXT_PUBLIC_MOCK_API = 'false';
    process.env.NEXT_PUBLIC_API_URL = 'https://api.videos.thash.app';

    const mod = await import('@/lib/api');

    expect(typeof mod.projectsApi.list).toBe('function');
    expect(typeof mod.projectsApi.get).toBe('function');
    expect(typeof mod.projectsApi.create).toBe('function');
    expect(typeof mod.projectsApi.update).toBe('function');
    expect(typeof mod.projectsApi.delete).toBe('function');

    expect(typeof mod.authApi.login).toBe('function');
    expect(typeof mod.authApi.register).toBe('function');
    expect(typeof mod.authApi.logout).toBe('function');

    expect(typeof mod.creditsApi.getBalance).toBe('function');
    expect(typeof mod.creditsApi.getTransactions).toBe('function');

    expect(typeof mod.pipelineApi.submit).toBe('function');
    expect(typeof mod.pipelineApi.status).toBe('function');

    expect(typeof mod.videoProjectsApi.list).toBe('function');
    expect(typeof mod.videoProjectsApi.create).toBe('function');
  });

  it('ApiError should be constructable with status and body', async () => {
    const mod = await import('@/lib/api');
    const error = new mod.ApiError(422, { error: 'Validation failed' });
    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe('ApiError');
    expect(error.status).toBe(422);
    expect(error.message).toBe('Validation failed');
  });
});

describe('Real api.ts — setTokenGetter / token injection', () => {
  let localStorageMock: ReturnType<typeof setupLocalStorageMock>;

  beforeEach(() => {
    vi.resetModules();
    localStorageMock = setupLocalStorageMock();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('setTokenGetter injects custom token into requests', async () => {
    process.env.NEXT_PUBLIC_MOCK_API = 'false';
    process.env.NEXT_PUBLIC_API_URL = 'https://api.videos.thash.app';

    const { setTokenGetter, creditsApi } = await import('@/lib/api');

    // Inject a custom token getter
    setTokenGetter(() => 'injected-token-abc123');

    const mockFetch = vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ total_cents: 100, bonus_cents: 0, paid_cents: 100, plan: 'free' }),
    } as Response);

    await creditsApi.getBalance();

    // Verify the Authorization header contains the injected token
    const fetchCall = mockFetch.mock.calls[0];
    const fetchOptions = fetchCall[1] as RequestInit;
    const headers = fetchOptions.headers as Record<string, string>;
    expect(headers['Authorization']).toBe('Bearer injected-token-abc123');
  });

  it('falls back to localStorage token when no token getter is set', async () => {
    process.env.NEXT_PUBLIC_MOCK_API = 'false';
    process.env.NEXT_PUBLIC_API_URL = 'https://api.videos.thash.app';

    localStorageMock.setItem('thash_auth_token', 'localstorage-token-xyz');

    const { creditsApi } = await import('@/lib/api');

    const mockFetch = vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ total_cents: 100, bonus_cents: 0, paid_cents: 100, plan: 'free' }),
    } as Response);

    await creditsApi.getBalance();

    const fetchCall = mockFetch.mock.calls[0];
    const fetchOptions = fetchCall[1] as RequestInit;
    const headers = fetchOptions.headers as Record<string, string>;
    expect(headers['Authorization']).toBe('Bearer localstorage-token-xyz');
  });

  it('does not send Authorization header when no token available', async () => {
    process.env.NEXT_PUBLIC_MOCK_API = 'false';
    process.env.NEXT_PUBLIC_API_URL = 'https://api.videos.thash.app';

    // No localStorage token, no setTokenGetter
    const { creditsApi } = await import('@/lib/api');

    const mockFetch = vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ total_cents: 100, bonus_cents: 0, paid_cents: 100, plan: 'free' }),
    } as Response);

    await creditsApi.getBalance();

    const fetchCall = mockFetch.mock.calls[0];
    const fetchOptions = fetchCall[1] as RequestInit;
    const headers = fetchOptions.headers as Record<string, string>;
    expect(headers['Authorization']).toBeUndefined();
  });

  it('setTokenGetter takes priority over localStorage token', async () => {
    process.env.NEXT_PUBLIC_MOCK_API = 'false';
    process.env.NEXT_PUBLIC_API_URL = 'https://api.videos.thash.app';

    localStorageMock.setItem('thash_auth_token', 'localstorage-old-token');

    const { setTokenGetter, creditsApi } = await import('@/lib/api');
    setTokenGetter(() => 'overriding-token-new');

    const mockFetch = vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ total_cents: 100, bonus_cents: 0, paid_cents: 100, plan: 'free' }),
    } as Response);

    await creditsApi.getBalance();

    const fetchCall = mockFetch.mock.calls[0];
    const fetchOptions = fetchCall[1] as RequestInit;
    const headers = fetchOptions.headers as Record<string, string>;
    // Injected token should take priority over localStorage
    expect(headers['Authorization']).toBe('Bearer overriding-token-new');
  });
});

// ═══════════════════════════════════════════════════════════════
// 401 Interceptor tests
// ═══════════════════════════════════════════════════════════════

describe('Real api.ts — 401 interceptor', () => {
  const clearAuthMock = vi.fn();
  const originalLocation = window.location;

  beforeEach(() => {
    vi.resetModules();
    setupLocalStorageMock();

    // Reset auth store mock for each test
    vi.doMock('@/stores/auth', () => ({
      useAuthStore: {
        getState: vi.fn(() => ({
          clearAuth: clearAuthMock,
        })),
      },
    }));

    // Mock window.location as a plain object so href assignment works
    // jsdom Location objects have special behaviors that prevent direct href mutation
    const mockLocation: any = {
      href: '',
      pathname: '/dashboard',
      origin: 'http://localhost:3000',
      search: '',
      hash: '',
      assign: vi.fn(),
      replace: vi.fn(),
      reload: vi.fn(),
    };
    Object.defineProperty(window, 'location', {
      value: mockLocation,
      writable: true,
      configurable: true,
    });

    // Clear sessionStorage
    sessionStorage.clear();
    clearAuthMock.mockClear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    // Restore original location
    try {
      Object.defineProperty(window, 'location', {
        value: originalLocation,
        writable: true,
        configurable: true,
      });
    } catch {
      // location may be non-configurable in some jsdom setups; ignore
    }
  });

  it('401 response calls clearAuth and throws Session expired', async () => {
    process.env.NEXT_PUBLIC_MOCK_API = 'false';
    process.env.NEXT_PUBLIC_API_URL = 'https://api.videos.thash.app';

    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
      json: () => Promise.resolve({ error: 'Invalid token' }),
    } as Response);

    const { creditsApi, ApiError } = await import('@/lib/api');

    let caught: any;
    try {
      await creditsApi.getBalance();
    } catch (err) {
      caught = err;
    }

    expect(caught).toBeInstanceOf(ApiError);
    expect(caught.status).toBe(401);
    expect(caught.message).toBe('Session expired');

    // clearAuth should have been called
    expect(clearAuthMock).toHaveBeenCalled();
  });

  it('401 sets session expiration marker', async () => {
    process.env.NEXT_PUBLIC_MOCK_API = 'false';
    process.env.NEXT_PUBLIC_API_URL = 'https://api.videos.thash.app';

    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
      json: () => Promise.resolve({ error: 'Expired' }),
    } as Response);

    const { creditsApi } = await import('@/lib/api');

    try { await creditsApi.getBalance(); } catch { /* expected */ }
    expect(sessionStorage.getItem('thash_session_expired')).toBe('1');
  });

  it('401 on protected path redirects to /login with redirect param', async () => {
    process.env.NEXT_PUBLIC_MOCK_API = 'false';
    process.env.NEXT_PUBLIC_API_URL = 'https://api.videos.thash.app';

    window.location.pathname = '/dashboard';

    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
      json: () => Promise.resolve({ error: 'Expired' }),
    } as Response);

    const { creditsApi } = await import('@/lib/api');

    try { await creditsApi.getBalance(); } catch { /* expected */ }

    // Should redirect to /login with the current path as redirect param
    expect(window.location.href).toContain('/login?redirect=');
    expect(window.location.href).toContain(encodeURIComponent('/dashboard'));
  });

  it('401 on public path does NOT redirect (avoids redirect loop)', async () => {
    process.env.NEXT_PUBLIC_MOCK_API = 'false';
    process.env.NEXT_PUBLIC_API_URL = 'https://api.videos.thash.app';

    window.location.pathname = '/landing';
    window.location.href = '';

    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
      json: () => Promise.resolve({ error: 'Expired' }),
    } as Response);

    const { creditsApi } = await import('@/lib/api');

    try { await creditsApi.getBalance(); } catch { /* expected */ }

    // Should NOT redirect because /landing is a public path
    expect(window.location.href).toBe('');
  });

  it('non-401 errors are NOT swallowed — propagates as ApiError', async () => {
    process.env.NEXT_PUBLIC_MOCK_API = 'false';
    process.env.NEXT_PUBLIC_API_URL = 'https://api.videos.thash.app';

    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
      json: () => Promise.resolve({ error: 'Server error' }),
    } as Response);

    const { creditsApi, ApiError } = await import('@/lib/api');

    let caught: any;
    try {
      await creditsApi.getBalance();
    } catch (err) {
      caught = err;
    }

    expect(caught).toBeInstanceOf(ApiError);
    expect(caught.status).toBe(500);
    expect(caught.message).toBe('Server error');

    // clearAuth should NOT be called for non-401
    expect(clearAuthMock).not.toHaveBeenCalled();
  });

  it('422 error is not treated as 401 — propagates normally', async () => {
    process.env.NEXT_PUBLIC_MOCK_API = 'false';
    process.env.NEXT_PUBLIC_API_URL = 'https://api.videos.thash.app';

    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: false,
      status: 422,
      statusText: 'Unprocessable Entity',
      json: () => Promise.resolve({ error: 'Validation failed' }),
    } as Response);

    const { creditsApi, ApiError } = await import('@/lib/api');

    let caught: any;
    try {
      await creditsApi.getBalance();
    } catch (err) {
      caught = err;
    }

    expect(caught).toBeInstanceOf(ApiError);
    expect(caught.status).toBe(422);

    // clearAuth should NOT be called
    expect(clearAuthMock).not.toHaveBeenCalled();
  });
});
