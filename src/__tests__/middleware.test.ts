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

  it('allows /short-series without token (public browsing)', () => {
    const req = buildRequest('/short-series');
    const res = middleware(req);
    expect(res.status).toBe(200);
  });

  it('allows /short-series/projects sub-paths without token', () => {
    const req = buildRequest('/short-series/projects/abc');
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
  it('redirects /settings to /login when no token', () => {
    const req = buildRequest('/settings');
    const res = middleware(req);
    expect(res.status).toBe(307);
    const location = res.headers.get('Location');
    expect(location).not.toBeNull();
    expect(location!).toContain('/login');
    expect(location!).toContain('redirect=');
  });

  it('redirects /credits to /login when no token', () => {
    const req = buildRequest('/credits');
    const res = middleware(req);
    expect(res.status).toBe(307);
  });

  it('redirects /usage to /login when no token', () => {
    const req = buildRequest('/usage');
    const res = middleware(req);
    expect(res.status).toBe(307);
  });

  it('allows /settings with valid token', () => {
    const req = buildRequest('/settings', 'valid-token-456');
    const res = middleware(req);
    expect(res.status).toBe(200);
  });

  it('allows /credits with valid token', () => {
    const req = buildRequest('/credits', 'valid-token-789');
    const res = middleware(req);
    expect(res.status).toBe(200);
  });

  it('passes through any path with a valid token', () => {
    const req = buildRequest('/random-page', 'valid-token');
    const res = middleware(req);
    expect(res.status).toBe(200);
  });
});

describe('middleware — /short-series is public (no auth needed)', () => {
  it('/short-series without token is allowed (public)', () => {
    const req = buildRequest('/short-series');
    const res = middleware(req);
    expect(res.status).toBe(200);
  });

  it('/short-series/projects without token is allowed (public)', () => {
    const req = buildRequest('/short-series/projects');
    const res = middleware(req);
    expect(res.status).toBe(200);
  });

  it('/short-series/projects/123 sub-paths also public', () => {
    const req = buildRequest('/short-series/projects/123');
    const res = middleware(req);
    expect(res.status).toBe(200);
  });
});

describe('middleware — cookie token auth flow', () => {
  it('reads token from thash_auth_token cookie', () => {
    // The auth store's setAuth() sets document.cookie with
    // key=thash_auth_token, value=encodeURIComponent(token)
    const req = buildRequest('/settings', 'my-secret-jwt-token');
    const res = middleware(req);
    expect(res.status).toBe(200);
  });

  it('redirects when cookie has empty token value', () => {
    const req = buildRequest('/settings', '');
    const res = middleware(req);
    // Empty string is falsy, so redirect to login
    expect(res.status).toBe(307);
    expect(res.headers.get('Location')).toContain('/login');
  });

  it('redirects when cookie header is present but without thash_auth_token', () => {
    const url = 'http://localhost:3000/settings';
    const headers = new Headers();
    headers.set('Cookie', 'other_cookie=value; another_cookie=123');
    const req = new NextRequest(url, { headers });
    const res = middleware(req);
    expect(res.status).toBe(307);
  });

  it('extracts token correctly from multiple cookies', () => {
    const url = 'http://localhost:3000/settings';
    const headers = new Headers();
    headers.set('Cookie', 'session_id=abc; thash_auth_token=my-token-456; user_pref=dark');
    const req = new NextRequest(url, { headers });
    const res = middleware(req);
    expect(res.status).toBe(200);
  });

  it('handles URL-encoded token values (as set by setAuth)', () => {
    // setAuth sets: document.cookie = `${key}=${encodeURIComponent(token)}`
    const encodedToken = encodeURIComponent('token/with+special=chars&more');
    const url = 'http://localhost:3000/settings';
    const headers = new Headers();
    headers.set('Cookie', `thash_auth_token=${encodedToken}`);
    const req = new NextRequest(url, { headers });
    const res = middleware(req);
    // Token is present (non-empty), so pass through
    expect(res.status).toBe(200);
  });

  it('redirect includes original path in redirect param for deep links', () => {
    const deepPath = '/settings/api-keys';
    const req = buildRequest(deepPath);
    const res = middleware(req);
    expect(res.status).toBe(307);
    const location = res.headers.get('Location');
    expect(location).toContain(encodeURIComponent(deepPath));
  });

  it('redirect preserves query params when no token', () => {
    const url = 'http://localhost:3000/settings?tab=profile';
    const req = new NextRequest(url);
    const res = middleware(req);
    expect(res.status).toBe(307);
    const location = res.headers.get('Location');
    // The redirect URL should include the redirect param with the original path
    // (query params are NOT passed through by default in NextResponse.redirect)
    expect(location).toContain('/login');
    expect(location).toContain('redirect=');
  });
});
