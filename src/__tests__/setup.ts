// ─── Frontend Test Setup ───

import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';

// Mock Next.js navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({}),
}));

// Mock Next.js Link
vi.mock('next/link', () => ({
  default: ({ children, ...props }: { children: React.ReactNode; href: string; [key: string]: unknown }) => {
    // Using createElement avoids JSX in setup file
    // eslint-disable-next-line
    const React = require('react');
    return React.createElement('a', props, children);
  },
}));

// Mock Next.js Image
vi.mock('next/image', () => ({
  default: (props: Record<string, unknown>) => {
    const React = require('react');
    // eslint-disable-next-line @next/next/no-img-element
    return React.createElement('img', { ...props, alt: props.alt || '' });
  },
}));
