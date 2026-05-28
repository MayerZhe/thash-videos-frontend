'use client';

import { create } from 'zustand';
import type { User } from '@/lib/types';
import { setTokenGetter } from '@/lib/api';

const AUTH_TOKEN_KEY = 'thash_auth_token';
const AUTH_USER_KEY = 'thash_auth_user';
const AUTH_EXPIRY_KEY = 'thash_auth_expiry';

function getStoredToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(AUTH_TOKEN_KEY);
}

function getStoredUser(): User | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(AUTH_USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
}

function getStoredExpiry(): number | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(AUTH_EXPIRY_KEY);
  if (!raw) return null;
  const ts = parseInt(raw, 10);
  return Number.isFinite(ts) ? ts : null;
}

const DEFAULT_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours

export interface AuthState {
  user: User | null;
  token: string | null;
  sessionExpiry: number | null;
  initialized: boolean;

  isAuthenticated: () => boolean;
  setAuth: (user: User, token: string, expiresInMs?: number) => void;
  clearAuth: () => void;
  initialize: () => void;
  getToken: () => string | null;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  sessionExpiry: null,
  initialized: false,

  initialize: () => {
    const token = getStoredToken();
    const user = getStoredUser();
    const expiry = getStoredExpiry();
    setTokenGetter(() => get().token);
    if (token && user) {
      set({ token, user, sessionExpiry: expiry, initialized: true });
    } else {
      set({ initialized: true });
    }
  },

  isAuthenticated: () => {
    const s = get();
    if (!s.token || !s.user) return false;
    if (s.sessionExpiry && Date.now() >= s.sessionExpiry) return false;
    return true;
  },

  setAuth: (user: User, token: string, expiresInMs?: number) => {
    const expiry = Date.now() + (expiresInMs ?? DEFAULT_EXPIRY_MS);
    localStorage.setItem(AUTH_TOKEN_KEY, token);
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
    localStorage.setItem(AUTH_EXPIRY_KEY, String(expiry));
    // Sync token to cookie so server-side middleware can read it for route guarding
    if (typeof document !== 'undefined') {
      const maxAge = Math.floor((expiresInMs ?? DEFAULT_EXPIRY_MS) / 1000);
      document.cookie = `${AUTH_TOKEN_KEY}=${encodeURIComponent(token)}; path=/; max-age=${maxAge}; SameSite=Lax`;
    }
    set({ user, token, sessionExpiry: expiry });
    setTokenGetter(() => get().token);
  },

  clearAuth: () => {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(AUTH_USER_KEY);
    localStorage.removeItem(AUTH_EXPIRY_KEY);
    // Clear the cookie as well
    if (typeof document !== 'undefined') {
      document.cookie = `${AUTH_TOKEN_KEY}=; path=/; max-age=0; SameSite=Lax`;
    }
    set({ user: null, token: null, sessionExpiry: null });
  },

  getToken: () => get().token,
}));