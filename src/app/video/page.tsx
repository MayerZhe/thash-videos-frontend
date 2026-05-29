'use client';

import Link from 'next/link';

export default function VideoPage() {
  const features = [
    {
      title: '文生视频',
      desc: '输入文字描述，AI 自动生成高质量视频片段。支持 Seedance 2.0、Veo 3.1、Sora 2 等引擎。',
      available: true,
    },
    {
      title: '图生视频',
      desc: '上传一张图片，让静态画面动起来。支持角色表情动画、场景运镜。',
      available: true,
    },
    {
      title: '视频编辑',
      desc: 'AI 辅助剪辑、自动字幕生成、背景音乐合成。一键导出多平台格式。',
      available: true,
    },
    {
      title: '风格迁移',
      desc: '将现有视频转换为不同视觉风格——动漫、油画、赛博朋克。',
      available: false,
    },
    {
      title: '超分辨率',
      desc: 'AI 超分将低清视频升级至 4K/8K，保留细节不模糊。',
      available: false,
    },
    {
      title: '数字人播报',
      desc: '虚拟数字人口播视频生成，支持自定义形象与声音。',
      available: false,
    },
  ];

  return (
    <div className="video-page">
      {/* Nav */}
      <nav className="video-nav">
        <div className="container">
          <Link href="/landing" className="nav-brand">
            <img
              src="/logo.png"
              style={{ width: 28, height: 28, borderRadius: 'var(--radius-sm)', objectFit: 'contain' }}
              alt="videos.thash"
            />
            videos.thash
          </Link>
          <div className="nav-links">
            <Link href="/landing#features">功能</Link>
            <Link href="/dashboard">短剧工厂</Link>
            <Link href="/short-video/projects">视觉工厂</Link>
            <Link href="/short-video/projects">进入工作台</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="video-hero">
        <div className="container">
          <p className="eyebrow">// 视觉工厂</p>
          <h1>AI 视频生成引擎</h1>
          <p className="body-muted hero-desc">
            接入 Seedance 2.0、Veo 3.1、Sora 2、Vidu Q3、Grok 五大视频引擎，
            文生视频、图生视频、风格迁移——将创意转化为高质量视频内容。
          </p>
          <div className="hero-actions">
            <Link href="/short-video/projects" className="btn btn-brand">
              进入工作台
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: 6 }}>
                <path d="M5 12h14 M12 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="video-features">
        <div className="container">
          <p className="eyebrow">// 核心能力</p>
          <h2>六大视频引擎能力</h2>
          <div className="feature-grid">
            {features.map((f) => (
              <article key={f.title} className="card feature-card">
                <div className="feature-header">
                  <h3>{f.title}</h3>
                  {f.available ? (
                    <span className="badge badge-accent">可用</span>
                  ) : (
                    <span className="badge badge-muted">即将推出</span>
                  )}
                </div>
                <p className="body-muted body-sm">{f.desc}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="video-cta">
        <div className="container">
          <p className="eyebrow">// 开始创作</p>
          <h2>让你的故事动起来</h2>
          <p className="body-muted">
            选择你喜欢的视频引擎，输入创意，AI 为你生成专业级视频。
          </p>
          <Link href="/short-video/projects" className="btn btn-brand">开始创作</Link>
        </div>
      </section>

      <style jsx global>{`
        .video-page {
          background: var(--bg);
          min-height: 100vh;
        }
        .container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 var(--space-6);
        }

        /* Nav */
        .video-nav {
          position: sticky;
          top: 0;
          z-index: 50;
          background: rgba(23, 23, 23, 0.85);
          backdrop-filter: blur(12px);
          border-bottom: 1px solid var(--border-soft);
        }
        .video-nav .container {
          display: flex;
          align-items: center;
          height: 56px;
          gap: var(--space-6);
        }
        .nav-brand {
          display: flex;
          align-items: center;
          gap: var(--space-2);
          color: var(--fg);
          font-family: var(--font-display);
          font-size: var(--text-lg);
          font-weight: 500;
          text-decoration: none;
        }
        .nav-links {
          display: flex;
          align-items: center;
          gap: var(--space-5);
          margin-left: auto;
        }
        .nav-links a {
          color: var(--fg-2);
          font-size: var(--text-sm);
          text-decoration: none;
          transition: color var(--motion-fast);
        }
        .nav-links a:hover {
          color: var(--fg);
        }

        /* Hero */
        .video-hero {
          padding: var(--space-12) 0 var(--space-8);
          text-align: center;
        }
        .video-hero h1 {
          font-size: 48px;
          font-family: var(--font-display);
          font-weight: 500;
          margin: var(--space-4) 0;
        }
        .hero-desc {
          max-width: 640px;
          margin: 0 auto var(--space-8);
          font-size: var(--text-sm);
          line-height: 1.7;
        }
        .hero-actions {
          display: flex;
          justify-content: center;
          gap: var(--space-3);
        }

        /* Features */
        .video-features {
          padding: var(--space-8) 0 var(--space-12);
        }
        .video-features h2 {
          margin-bottom: var(--space-6);
          font-family: var(--font-display);
        }
        .feature-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: var(--space-4);
        }
        .feature-card {
          padding: var(--space-6);
          display: flex;
          flex-direction: column;
          gap: var(--space-3);
        }
        .feature-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: var(--space-3);
        }
        .feature-header h3 {
          font-size: var(--text-lg);
          font-weight: 500;
        }

        /* CTA */
        .video-cta {
          padding: var(--space-12) 0;
          text-align: center;
          border-top: 1px solid var(--border-soft);
        }
        .video-cta h2 {
          font-family: var(--font-display);
          margin: var(--space-4) 0;
        }
        .video-cta p {
          max-width: 480px;
          margin: 0 auto var(--space-6);
        }
      `}</style>
    </div>
  );
}
