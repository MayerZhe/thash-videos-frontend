'use client';

import { useState, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth';
import UserDropdown from '@/components/global/UserDropdown';

/* ═══════════════════════════════════════════════════════════════════════
 * Landing Page — 1:1 replica of Thash-video-design/landing.html
 * Marketing page: nav + hero + features + 短剧工厂 + 视觉工厂 + CTA + footer
 * ═══════════════════════════════════════════════════════════════════════ */

const features = [
  {
    badge: 'P0',
    badgeClass: 'badge-accent',
    svgPath: 'M2 3h20v14H2z M8 21h8 M12 17v4',
    title: '短剧 Agent',
    desc: '上传小说，30 分钟拿到成片。9 个 AI Agent 协同拆解、编剧、分镜、视频生成与配音合成，角色一致性超过 90%。',
  },
  {
    badge: 'P0',
    badgeClass: 'badge-accent',
    svgPath: 'M23 7l-7 5 7 5V7z M1 5h15v14H1z',
    title: '智能视频生成',
    desc: 'Seedance 2.0、Veo 3.1、Sora 2、Vidu Q3、Grok——五大引擎自由切换，自动降级容错，按需选择性价比最高的方案。',
  },
  {
    badge: 'P0',
    badgeClass: 'badge-accent',
    svgPath: 'M3 3h18v18H3z M8.5 8.5a1.5 1.5 0 110-3 1.5 1.5 0 010 3z M21 15l-5-5-11 11',
    title: 'AI 图片设计',
    desc: '覆盖角色立绘、场景概念图、视频封面。不满意就"抽卡"重来，支持姿态、天气、时间维度变体。',
  },
  {
    badge: 'P1',
    badgeClass: 'badge-success',
    svgPath: 'M18 20V10 M12 20V4 M6 20v-6',
    title: '数据分析看板',
    desc: '每笔 API 调用可追溯。项目费用、模型用量、预算执行一目了然，异常消费实时告警。',
  },
  {
    badge: 'P1',
    badgeClass: 'badge-muted',
    svgPath: 'M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4 M7 10l5 5 5-5 M12 15V3',
    title: '发布与分发',
    desc: '导出 MP4 或剪映草稿，多分辨率适配抖音、YouTube、TikTok。一键分发到主流短视频平台。',
  },
  {
    badge: 'P1',
    badgeClass: 'badge-muted',
    svgPath: 'M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4-4v2 M9 7a4 4 0 100-8 4 4 0 000 8z M23 21v-2a4 4 0 00-3-3.87 M16 3.13a4 4 0 010 7.75',
    title: '团队协作',
    desc: '多人协作工作空间，版本历史可追溯，评论标注清晰。分镜审核通过后再交 AI 生成，省时省力。',
  },
  {
    badge: 'P2',
    badgeClass: 'badge-muted',
    svgPath: 'M12 15a3 3 0 100-6 3 3 0 000 6z M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l-.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z',
    title: '扩展能力',
    desc: '数字人口播、爆款视频复刻分析、智能背景替换、静态照片转动态视频——持续解锁新玩法。',
  },
];

const shortDramaHighlights = [
  { title: '小说解析', desc: '拖入任意小说或输入一句话创意，AI 自动提取角色、场景、情节线。' },
  { title: 'AI 编剧', desc: '从大纲到分镜——自动生成标准化剧本，每集、每镜头精确到秒。' },
  { title: '全流程生成', desc: '角色设计→分镜→视频→配音→合成，8 个阶段一条线走到底。' },
  { title: '多引擎自由', desc: 'Seedance 2.0、Veo 3.1、Sora 2……不锁定供应商，随时切换。' },
];

const videoHighlights = [
  { title: '文生视频', desc: '用文字描述想要的画面，AI 直接生成视频片段——不需要摄影机。' },
  { title: '图生视频', desc: '一张静态图就能让角色动起来，表情、动作、运镜全自动。' },
  { title: '风格迁移', desc: '赛博朋克、日系动漫、古典油画——点击切换整条视频的视觉风格。' },
  { title: '4K 超分', desc: 'AI 将低清素材放大到 4K，保留纹理细节，不模糊、不涂抹。' },
];

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  // Initialize auth on mount
  useEffect(() => {
    useAuthStore.getState().initialize();
    setAuthChecked(true);
  }, []);

  const handleProtectedNav = useCallback((path: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    if (useAuthStore.getState().isAuthenticated()) {
      router.push(path);
    } else {
      router.push(`/login?redirect=${encodeURIComponent(path)}`);
    }
  }, [router]);

  return (
    <>
      {/* ── Nav ── */}
      <nav className="topnav">
        <div className="container">
          <Link href="/landing" className="nav-brand">
            <img src="/logo.png" style={{ width: 28, height: 28, borderRadius: 'var(--radius-sm)', objectFit: 'contain' }} alt="Thash.videos" />
            Thash.videos
          </Link>
          <div className="nav-links">
            <Link href="/landing#features">功能</Link>
            <a href="/dashboard" onClick={handleProtectedNav('/dashboard')}>短剧工厂</a>
            <a href="/short-video/projects" onClick={handleProtectedNav('/short-video/projects')}>视觉工厂</a>
          </div>
          <div className="nav-right">
            {!authChecked ? (
              <div style={{ width: 120, height: 32 }} />
            ) : isAuthenticated() && user ? (
              <UserDropdown user={user} />
            ) : (
              /* Logged out: login + register buttons */
              <>
                <Link href="/login" className="btn btn-secondary btn-sm nav-login-btn">登录</Link>
                <Link href="/register" className="btn btn-brand btn-sm nav-cta-btn">免费注册</Link>
              </>
            )}
            {/* Hamburger button (mobile only) */}
            <button
              className="landing-hamburger"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label={mobileMenuOpen ? '关闭菜单' : '打开菜单'}
            >
              {mobileMenuOpen ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile nav overlay */}
        <div className={`landing-mobile-nav${mobileMenuOpen ? ' open' : ''}`}>
          <Link href="/landing#features" onClick={() => setMobileMenuOpen(false)}>功能</Link>
          {authChecked && isAuthenticated() ? (
            <>
              <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)}>短剧工厂</Link>
              <Link href="/short-video/projects" onClick={() => setMobileMenuOpen(false)}>视觉工厂</Link>
              <Link href="/settings" onClick={() => setMobileMenuOpen(false)}>账号设置</Link>
              <button
                className="btn btn-secondary btn-sm"
                style={{ marginTop: 'var(--space-2)' }}
                onClick={() => {
                  useAuthStore.getState().clearAuth();
                  window.location.href = '/landing';
                }}
              >
                退出登录
              </button>
            </>
          ) : (
            <>
              <a href="/dashboard" onClick={(e) => { handleProtectedNav('/dashboard')(e); setMobileMenuOpen(false); }}>短剧工厂</a>
              <a href="/short-video/projects" onClick={(e) => { handleProtectedNav('/short-video/projects')(e); setMobileMenuOpen(false); }}>视觉工厂</a>
              <Link href="/login" className="btn btn-secondary btn-sm" style={{ marginTop: 'var(--space-2)' }}>登录</Link>
              <Link href="/register" className="btn btn-brand btn-sm">免费注册</Link>
            </>
          )}
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="hero-section">
        <div className="container">
          <p className="eyebrow">// AI 短剧 · 一站式创作平台</p>
          <h1>
            一句话，<br />一部短剧。
          </h1>
          <p className="hero-lede">
            输入创意或上传小说，AI 自动完成拆解、编剧、分镜、视频生成、配音与字幕合成。
            过去几周的工序，现在 30 分钟搞定。支持 Seedance 2.0、Veo 3.1、Sora 2 等
            顶级视频引擎，不绑定单一供应商。
          </p>
          <div className="hero-actions">
            <a href="/dashboard" className="btn btn-brand" onClick={handleProtectedNav('/dashboard')}>
              {useAuthStore.getState().isAuthenticated() ? '进入工作台' : '进入短剧工厂'}
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </a>
            <Link href="/landing#features" className="btn btn-secondary">了解功能</Link>
            {!useAuthStore.getState().isAuthenticated() && (
              <Link href="/login" style={{ fontSize: 'var(--text-sm)', color: 'var(--muted)', textDecoration: 'underline', textUnderlineOffset: 3 }}>
                已有账号？登录
              </Link>
            )}
          </div>
          <div className="hero-meta">
            <span className="badge badge-success">
              <span className="badge-dot" style={{ color: 'var(--success)' }} />
              开源可商用
            </span>
            <span>基于 ArcReel · AGPL-3.0</span>
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="features-section" id="features">
        <div className="container">
          <p className="eyebrow">// 七大核心能力</p>
          <h2 style={{ maxWidth: '26ch', marginTop: 'var(--space-4)' }}>
            不止是工具，是全流程生产线。
          </h2>
          <p className="body-muted" style={{ marginTop: 'var(--space-4)', maxWidth: '56ch' }}>
            从创意到成片，每个环节都有专属 AI Agent 驱动——不绑定供应商，
            每一步都可干预、可替换、可优化。
          </p>

          <div className="features-grid">
            {features.map((f) => (
              <article key={f.title} className="card">
                <div className="row-between">
                  <span className="feature-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                      <path d={f.svgPath} />
                    </svg>
                  </span>
                  <span className={`badge ${f.badgeClass}`}>{f.badge}</span>
                </div>
                <h3>{f.title}</h3>
                <p className="body-muted body-sm">{f.desc}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── 短剧工厂 ── */}
      <section className="subpage-section">
        <div className="container">
          <p className="eyebrow">// 短剧工厂</p>
          <h2>小说扔进去，短剧吐出来。</h2>
          <p className="body-muted" style={{ marginTop: 'var(--space-3)', maxWidth: '52ch' }}>
            AI 为你拆解剧情、设计角色、生成剧本、制作视频、合成配音——过去一个团队几周的工作，现在你一个人 30 分钟完成。
          </p>
          <div className="subpage-grid">
            {shortDramaHighlights.map((h) => (
              <div key={h.title} className="card subpage-card">
                <h4>{h.title}</h4>
                <p className="body-muted body-sm">{h.desc}</p>
              </div>
            ))}
          </div>
          <div className="section-cta">
            <a href="/dashboard" className="btn btn-brand" onClick={handleProtectedNav('/dashboard')}>
              {useAuthStore.getState().isAuthenticated() ? '进入工作台' : '进入短剧工厂'}
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: 6 }}>
                <path d="M5 12h14 M12 5l7 7-7 7" />
              </svg>
            </a>
          </div>
        </div>
      </section>

      {/* ── 视觉工厂 ── */}
      <section className="subpage-section">
        <div className="container">
          <p className="eyebrow">// 视觉工厂</p>
          <h2>文字生成画面，图片变成视频。</h2>
          <p className="body-muted" style={{ marginTop: 'var(--space-3)', maxWidth: '52ch' }}>
            五大视频引擎任你调用，文生视频、图生视频、风格迁移、4K 超分——让每一个创意都有画面感。
          </p>
          <div className="subpage-grid">
            {videoHighlights.map((h) => (
              <div key={h.title} className="card subpage-card">
                <h4>{h.title}</h4>
                <p className="body-muted body-sm">{h.desc}</p>
              </div>
            ))}
          </div>
          <div className="section-cta">
            <a href="/short-video/projects" className="btn btn-brand" onClick={handleProtectedNav('/short-video/projects')}>
              {useAuthStore.getState().isAuthenticated() ? '进入工作台' : '进入视觉工厂'}
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: 6 }}>
                <path d="M5 12h14 M12 5l7 7-7 7" />
              </svg>
            </a>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="cta-section">
        <div className="container">
          <p className="eyebrow">// 开源 · 可商用</p>
          <h2>开始你的第一部 AI 短剧。</h2>
          <p className="body-muted" style={{ marginTop: 'var(--space-4)', maxWidth: '48ch', marginInline: 'auto' }}>
            基于 ArcReel 构建，AGPL-3.0 开源。Docker 一键部署，五分钟启动属于你自己的短剧生产线。
          </p>
          <div className="cta-actions">
            <a href="/dashboard" className="btn btn-brand" onClick={handleProtectedNav('/dashboard')}>
              {useAuthStore.getState().isAuthenticated() ? '进入工作台' : '进入短剧工厂'}
            </a>
            <a href="/short-video/projects" className="btn btn-brand" onClick={handleProtectedNav('/short-video/projects')}>
              {useAuthStore.getState().isAuthenticated() ? '进入工作台' : '进入视觉工厂'}
            </a>
            <a href="https://github.com" className="btn btn-secondary">GitHub</a>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="footer">
        <div className="container">
          <div className="footer-grid">
            <div>
              <h4>Thash.videos</h4>
              <p className="body-muted body-sm" style={{ maxWidth: '32ch' }}>
                把创意变成短剧——AI 驱动，全流程自动化，开源可商用。
              </p>
            </div>
            <div>
              <h4>产品</h4>
              <Link href="/landing#features">功能</Link>
              <Link href="/dashboard">短剧工厂</Link>
            </div>
            <div>
              <h4>资源</h4>
              <a href="#">文档</a>
              <a href="#">API</a>
              <a href="#">GitHub</a>
            </div>
            <div>
              <h4>法律</h4>
              <a href="#">AGPL-3.0</a>
              <a href="#">隐私政策</a>
              <a href="#">服务条款</a>
            </div>
          </div>
          <div className="footer-bottom">
            <span>© 2026 Thash.videos · 基于 ArcReel 构建</span>
            <span>AGPL-3.0 License</span>
          </div>
        </div>
      </footer>

      {/* ══ Landing-specific CSS ══ */}
      <style jsx global>{`
        .topnav {
          position: sticky; top: 0; z-index: 50;
          background: color-mix(in oklab, var(--bg) 88%, transparent);
          backdrop-filter: blur(12px);
          border-bottom: 1px solid var(--border-soft);
        }
        .topnav .container {
          display: flex; align-items: center; justify-content: space-between;
          height: 56px;
        }
        .nav-brand {
          display: flex; align-items: center; gap: var(--space-3);
          font-family: var(--font-display);
          font-size: var(--text-lg); font-weight: 500; color: var(--fg);
          text-decoration: none;
        }
        .nav-links { display: flex; align-items: center; gap: var(--space-8); }
        .nav-links a { color: var(--fg-2); font-size: var(--text-sm); font-weight: 400; }

        .hero-section {
          position: relative; overflow: hidden;
          padding-block: var(--section-y-desktop);
        }
        .hero-section::before {
          content: ""; position: absolute;
          inset: -20% -10% auto -10%; height: 70%;
          background: radial-gradient(55% 60% at 18% 30%, color-mix(in oklab, var(--accent), var(--bg) 70%) 0%, var(--bg) 60%);
          opacity: 0.55; filter: blur(60px); z-index: 0; pointer-events: none;
        }
        .hero-section > * { position: relative; z-index: 1; }
        .hero-section h1 { max-width: 18ch; }
        .hero-lede {
          margin-top: var(--space-6);
          font-size: var(--text-lg); line-height: 1.56; max-width: 52ch;
          color: var(--fg-2);
        }
        .hero-actions, .cta-actions {
          display: flex; gap: var(--space-3); margin-top: var(--space-8);
          align-items: center; flex-wrap: wrap;
        }
        .cta-actions { justify-content: center; }
        .hero-meta {
          display: inline-flex; align-items: center; gap: var(--space-3);
          margin-top: var(--space-6); color: var(--muted); font-size: var(--text-sm);
          flex-wrap: wrap;
        }

        .features-section {
          padding-block: var(--section-y-desktop);
          border-top: 1px solid var(--border);
        }
        .features-grid {
          display: grid; grid-template-columns: repeat(3, 1fr);
          gap: var(--space-5); margin-top: var(--space-8);
        }
        .feature-icon {
          width: 40px; height: 40px; border-radius: var(--radius-md);
          border: 1px solid var(--border); background: var(--bg);
          display: inline-flex; align-items: center; justify-content: center;
          color: var(--accent); flex-shrink: 0;
        }
        .feature-icon svg { width: 20px; height: 20px; }

        .subpage-section {
          padding-block: var(--section-y-desktop);
          border-top: 1px solid var(--border);
        }
        .subpage-grid {
          display: grid; grid-template-columns: repeat(4, 1fr);
          gap: var(--space-4); margin-top: var(--space-6);
        }
        .subpage-card {
          padding: var(--space-6);
          display: flex; flex-direction: column; gap: var(--space-2);
        }
        .subpage-card h4 {
          font-size: var(--text-lg); font-weight: 500; color: var(--fg);
        }
        .section-cta {
          margin-top: var(--space-8); display: flex; justify-content: center;
        }

        .cta-section {
          padding-block: var(--section-y-desktop);
          border-top: 1px solid var(--border); text-align: center;
        }
        .cta-section h2 { max-width: 20ch; margin-inline: auto; }

        .footer { padding-block: var(--space-12); border-top: 1px solid var(--border); }
        .footer-grid {
          display: grid; grid-template-columns: 2fr 1fr 1fr 1fr;
          gap: var(--space-8);
        }
        .footer-grid h4 {
          font-size: var(--text-sm); font-weight: 500; color: var(--fg);
          margin-bottom: var(--space-3);
        }
        .footer-grid a {
          display: block; color: var(--muted); font-size: var(--text-sm);
          line-height: 2;
        }
        .footer-bottom {
          margin-top: var(--space-8); padding-top: var(--space-6);
          border-top: 1px solid var(--border-soft);
          display: flex; justify-content: space-between;
          color: var(--meta); font-size: var(--text-xs);
        }

        .nav-right {
          display: flex;
          align-items: center;
          gap: var(--space-3);
        }
        .nav-login-btn {
          color: var(--fg-2);
          border-color: var(--border);
          text-decoration: none;
        }
        .nav-login-btn:hover {
          color: var(--fg);
          border-color: var(--fg-2);
        }
        .landing-hamburger {
          display: none;
          align-items: center;
          justify-content: center;
          width: 44px;
          height: 44px;
          padding: 0;
          border: none;
          background: transparent;
          color: var(--fg-2);
          cursor: pointer;
          border-radius: var(--radius-sm);
        }
        .landing-hamburger:hover {
          color: var(--fg);
        }

        /* Mobile nav overlay */
        .landing-mobile-nav {
          display: none;
        }

        @media (max-width: 1023px) {
          .features-grid, .subpage-grid { grid-template-columns: 1fr 1fr; }
          .footer-grid { grid-template-columns: 1fr 1fr; }
          .nav-links { display: none; }
          .nav-cta-btn { display: none; }
          .nav-login-btn { display: none; }
          .landing-hamburger { display: flex; }
          .landing-mobile-nav {
            display: flex;
            flex-direction: column;
            gap: var(--space-1);
            padding: var(--space-3);
            background: var(--bg);
            border-top: 1px solid var(--border-soft);
            position: absolute;
            top: 100%;
            left: 0;
            right: 0;
            z-index: 49;
            transform: translateY(-8px);
            opacity: 0;
            visibility: hidden;
            pointer-events: none;
            transition: all var(--motion-base) var(--ease-standard);
          }
          .landing-mobile-nav.open {
            transform: translateY(0);
            opacity: 1;
            visibility: visible;
            pointer-events: auto;
          }
          .landing-mobile-nav a {
            display: flex;
            align-items: center;
            padding: var(--space-3) var(--space-4);
            color: var(--fg-2);
            font-size: var(--text-sm);
            border-radius: var(--radius-sm);
            min-height: 48px;
            text-decoration: none;
          }
          .landing-mobile-nav a:hover {
            background: var(--surface);
            color: var(--fg);
          }
          .landing-mobile-nav .btn {
            margin-top: var(--space-2);
            justify-content: center;
          }
        }
        @media (max-width: 767px) {
          .nav-links { display: none; }
          .features-grid, .subpage-grid { grid-template-columns: 1fr; }
          .footer-grid { grid-template-columns: 1fr; }
          .hero-section h1 { font-size: var(--text-2xl); }
          .hero-section { padding-block: var(--section-y-phone); }
          .hero-lede { font-size: var(--text-base); }
          .hero-actions { flex-direction: column; }
          .hero-actions .btn { width: 100%; justify-content: center; }
          .features-section, .subpage-section, .cta-section {
            padding-block: var(--section-y-phone);
          }
          .cta-actions { flex-direction: column; }
          .cta-actions .btn { width: 100%; justify-content: center; }
          .nav-cta-btn { display: none; }
          .nav-login-btn { display: none; }
          .landing-hamburger { display: flex; }
          .footer-bottom { flex-direction: column; gap: var(--space-2); text-align: center; }
        }
      `}</style>
    </>
  );
}
