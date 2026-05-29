// ─── Middleware Tests ───

import { describe, it, expect } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';

// Dynamic import to resolve @ alias
const middlewareMod = await import('@/middleware');
const { middleware, config } = middlewareMod;

function buildRequest(pathname: string, token?: string): NextRequest {
  const url = `http://localhost:3000${pathname}`;
  const headers = new Headers();
  if (token) {
    headers.set('Cookie', `thash_auth_token=${token}`);
  }
  return new NextRequest(url, { headers });
}

describe('middleware config', () => {
  it('should export a matcher config', () => {
    expect(config).toBeDefined();
    expect(config.matcher).toBeDefined();
    expect(Array.isArray(config.matcher)).toBe(true);
  });
});

describe('middleware — public routes', () => {
  it('allows / (root) without token', () => {
    const req = buildRequest('/');
    const res = middleware(req);
    expect(res).toBeInstanceOf(NextResponse);
    expect(res.status).toBe(200);
  });

  it('allows /landing without token', () => {
    const req = buildRequest('/landing');
    const res = middleware(req);
    expect(res.status).toBe(200);
  });

  it('allows /login without token', () => {
    const req = buildRequest('/login');
    const res = middleware(req);
    expect(res.status).toBe(200);
  });

  it('allows /register without token', () => {
    const req = buildRequest('/register');
    const res = middleware(req);
    expect(res.status).toBe(200);
  });

  it('allows /video without token', () => {
    const req = buildRequest('/video');
    const res = middleware(req);
    expect(res.status).toBe(200);
  });

  it('allows /short-video without token', () => {
    const req = buildRequest('/short-video');
    const res = middleware(req);
    expect(res.status).toBe(200);
  });

  it('allows /video sub-paths without token', () => {
    const req = buildRequest('/video/123');
    const res = middleware(req);
    expect(res.status).toBe(200);
  });

  it('allows /_next static assets without token', () => {
    const req = buildRequest('/_next/static/chunk.js');
    const res = middleware(req);
    expect(res.status).toBe(200);
  });

  it('allows /api routes without token', () => {
    const req = buildRequest('/api/v1/auth/login');
    const res = middleware(req);
    expect(res.status).toBe(200);
  });

  it('allows favicon.ico without token', () => {
    const req = buildRequest('/favicon.ico');
    const res = middleware(req);
    expect(res.status).toBe(200);
  });
});

describe('middleware — protected routes', () => {
  it('redirects /dashboard to /login when no token', () => {
    const req = buildRequest('/dashboard');
    const res = middleware(req);
    expect(res.status).toBe(307);
    const location = res.headers.get('Location');
    expect(location).not.toBeNull();
    expect(location!).toContain('/login');
    expect(location!).toContain('redirect=');
    expect(location!).toContain(encodeURIComponent('/dashboard'));
  });

  it('redirects /settings to /login when no token', () => {
    const req = buildRequest('/settings');
    const res = middleware(req);
    expect(res.status).toBe(307);
    const location = res.headers.get('Location');
    expect(location).not.toBeNull();
    expect(location!).toContain('/login');
    expect(location!).toContain('redirect=');
  });

  it('redirects /projects to /login when no token', () => {
    const req = buildRequest('/projects');
    const res = middleware(req);
    expect(res.status).toBe(307);
  });

  it('redirects /projects/123 to /login when no token', () => {
    const req = buildRequest('/projects/123');
    const res = middleware(req);
    expect(res.status).toBe(307);
  });

  it('allows /dashboard with valid token', () => {
    const req = buildRequest('/dashboard', 'valid-token-123');
    const res = middleware(req);
    expect(res.status).toBe(200);
  });

  it('allows /settings with valid token', () => {
    const req = buildRequest('/settings', 'valid-token-456');
    const res = middleware(req);
    expect(res.status).toBe(200);
  });

  it('allows /projects with valid token', () => {
    const req = buildRequest('/projects', 'valid-token-789');
    const res = middleware(req);
    expect(res.status).toBe(200);
  });

  it('passes through any path with a valid token', () => {
    const req = buildRequest('/random-page', 'valid-token');
    const res = middleware(req);
    expect(res.status).toBe(200);
  });
});

describe('middleware — /dashboard is now protected', () => {
  it('/dashboard without token redirects to /login', () => {
    const req = buildRequest('/dashboard');
    const res = middleware(req);
    expect(res.status).toBe(307);
  });

  it('/dashboard with token passes through', () => {
    const req = buildRequest('/dashboard', 'token');
    const res = middleware(req);
    expect(res.status).toBe(200);
  });

  it('/dashboard sub-paths also require auth', () => {
    // /dashboard/analytics is not an exact match for /dashboard
    // and is not a prefix of any public path, so it's protected
    const req = buildRequest('/dashboard/analytics');
    const res = middleware(req);
    expect(res.status).toBe(307);
    expect(res.headers.get('Location')).toContain('/login');
  });
});
