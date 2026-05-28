// ─── API Client Tests (4+ cases) ───

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock fetch-based API client
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
