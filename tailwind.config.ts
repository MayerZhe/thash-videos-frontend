import type { Config } from 'tailwindcss';

// Design tokens from css/tokens.css — EXACT mapping.
// DO NOT use Tailwind default colors (slate, gray, emerald, green, etc.)
// All colors MUST use the custom tokens defined below.

const config: Config = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Surface — from tokens.css :root { --bg, --surface }
        bg:         '#171717',   // 页面画布
        surface:    '#1c1c1c',   // 卡片、容器

        // Foreground ramp — from tokens.css :root { --fg, --fg-2, --muted, --meta }
        fg:         '#fafafa',   // 主文字
        'fg-2':     '#b4b4b4',   // 次要文字
        muted:      '#898989',   // 辅助文字
        meta:       '#4d4d4d',   // 元数据

        // Border — from tokens.css :root { --border, --border-soft }
        border:     '#2e2e2e',   // 标准边框
        'border-soft': '#242424',// 微弱分隔线

        // Accent — from tokens.css :root { --accent, --accent-hover, --accent-on }
        accent:     '#3ecf8e',   // 品牌翡翠绿
        'accent-hover': '#00c573', // 悬停绿
        'accent-on': '#0f0f0f',  // 翡翠绿上的文字

        // Semantic — from tokens.css :root { --success, --warn, --danger }
        success:    '#16a34a',
        warn:       '#eab308',
        danger:     '#dc2626',
      },
      fontFamily: {
        display: ['Circular', '"custom-font"', '"Helvetica Neue"', 'Helvetica', 'Arial', 'sans-serif'],
        body:    ['Circular', '"custom-font"', '"Helvetica Neue"', 'Helvetica', 'Arial', 'sans-serif'],
        mono:    ['"Source Code Pro"', '"Office Code Pro"', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      },
      fontSize: {
        'xs':    '12px',
        'sm':    '14px',
        'base':  '16px',
        'lg':    '18px',
        'xl':    '24px',
        '2xl':   '32px',
        '3xl':   '36px',
        '4xl':   '72px',
      },
      borderRadius: {
        'sm':    '6px',
        'md':    '8px',
        'lg':    '16px',
        'pill':  '9999px',
      },
      spacing: {
        '1':     '4px',
        '2':     '8px',
        '3':     '12px',
        '4':     '16px',
        '5':     '20px',
        '6':     '24px',
        '8':     '32px',
        '12':    '48px',
      },
      boxShadow: {
        'raised': '0 0 0 1px #2e2e2e, 0 4px 12px rgba(0,0,0,0.4)',
        'focus':  '0 0 0 2px color-mix(in oklab, #3ecf8e, transparent 50%)',
      },
      lineHeight: {
        'body':   '1.5',
        'tight':  '1.00',
      },
      letterSpacing: {
        'display': 'normal',
      },
      animation: {
        'fade-in': 'fadeIn 150ms cubic-bezier(0.2, 0, 0, 1)',
        'slide-up': 'slideUp 200ms cubic-bezier(0.2, 0, 0, 1)',
        'slide-in': 'slideIn 200ms cubic-bezier(0.2, 0, 0, 1)',
        'shimmer': 'shimmer 1.5s infinite',
      },
      keyframes: {
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(12px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        slideIn: {
          from: { opacity: '0', transform: 'translateX(24px)' },
          to: { opacity: '1', transform: 'translateX(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '200% 0' },
          '100%': { backgroundPosition: '-200% 0' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
