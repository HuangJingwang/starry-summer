import Link from 'next/link';

import { ContentCard } from '@/components/ContentCard';
import { HomeHeroBackground } from '@/components/HomeHeroBackground';
import { SiteShell } from '@/components/SiteShell';
import { loadPublicAssets } from '@/lib/assets';
import { getContentHref, getFeaturedContent, getPopularContent } from '@/lib/content';
import { buildHomeProfileModel } from '@/lib/home-profile';
import { loadSiteContent } from '@/lib/public-content';
import { loadPublicSettings } from '@/lib/settings';

export default async function HomePage() {
  const apiBaseUrl = process.env.API_BASE_URL ?? 'http://127.0.0.1:4000';
  const [content, settings, backgroundAssets] = await Promise.all([
    loadSiteContent(),
    loadPublicSettings(undefined, { apiBaseUrl }),
    loadPublicAssets({ usage: 'background', apiBaseUrl }),
  ]);
  const featured = getFeaturedContent(content).slice(0, 3);
  const popular = getPopularContent(content, {
    excludeIds: featured.map((item) => item.id),
    limit: 3,
  });
  const projectCount = content.filter((item) => item.type === 'project').length;
  const profile = buildHomeProfileModel(settings, content);
  const stats = profile.stats;
  const heroBackgrounds =
    backgroundAssets.length > 0
      ? backgroundAssets.map((asset) => ({
          url: asset.publicUrl,
          alt: asset.altText || '首页轮换背景图',
        }))
      : [
          {
            url: settings.hero.backgroundImageUrl,
            alt: '首页默认背景图',
          },
        ];

  return (
    <SiteShell>
      <main className="portfolio-home">
        <section className="portfolio-hero" id="about">
          <HomeHeroBackground backgrounds={heroBackgrounds} />
          <div className="portfolio-hero__shade" />
          <div className="portfolio-hero__canvas-word" aria-hidden="true">
            ABOUT
          </div>
          <div className="portfolio-hero__inner">
            <p className="portfolio-section-label">个人介绍</p>
            <div className="portfolio-hero__grid">
              <div
                className="portfolio-portrait-card"
                style={{ backgroundImage: `url("${heroBackgrounds[0]?.url}")` }}
              >
                <div className="portfolio-portrait-card__glass">
                  <span>{profile.title}</span>
                  <strong>{profile.ownerName.slice(0, 1) || 'S'}</strong>
                </div>
              </div>

              <div className="portfolio-about-panel">
                <p className="eyebrow">ABOUT ME</p>
                <h1>Hi，我是 {profile.ownerName}</h1>
                <p className="portfolio-about-panel__lead">{profile.description}</p>
                <p className="portfolio-about-panel__motto">{profile.motto || settings.hero.tagline}</p>

                <div className="portfolio-info-grid">
                  <div>
                    <span>我擅长</span>
                    <strong>设计与写作 / 内容系统 / AI 工作流</strong>
                  </div>
                  <div>
                    <span>服务领域</span>
                    <strong>个人博客 / 项目记录 / 知识沉淀</strong>
                  </div>
                  <div>
                    <span>站点</span>
                    <strong>{profile.title}</strong>
                  </div>
                  <div>
                    <span>最近更新</span>
                    <strong>{profile.stats.lastPublishedAt || '持续构建中'}</strong>
                  </div>
                </div>

                <div className="portfolio-stat-row" aria-label="站点数据">
                  <div>
                    <strong>{formatNumber(stats.publicCount)}+</strong>
                    <span>内容资产</span>
                  </div>
                  <div>
                    <strong>{formatNumber(projectCount)}+</strong>
                    <span>项目实践</span>
                  </div>
                  <div>
                    <strong>{formatNumber(stats.totalLikes)}+</strong>
                    <span>收到喜欢</span>
                  </div>
                </div>

                <div className="portfolio-now">
                  <p>NOW BUILDING · 进行中</p>
                  <div>
                    <Link href="/posts">博客内容库</Link>
                    <Link href="/projects">个人项目集</Link>
                    <Link href="/guestbook">访客留言板</Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="home-dashboard" id="advantage" aria-label="个人优势">
          <div className="home-profile">
            <p className="eyebrow">个人优势</p>
            <h2>把生活、项目和知识长期整理成可回看的系统</h2>
            <p>{settings.hero.tagline}</p>
            {profile.motto ? <blockquote>{profile.motto}</blockquote> : null}
            <dl>
              <div>
                <dt>内容资产</dt>
                <dd>{formatNumber(stats.publicCount)}</dd>
              </div>
              <div>
                <dt>浏览</dt>
                <dd>{formatNumber(stats.totalViews)}</dd>
              </div>
            </dl>
          </div>
          <div className="home-focus">
            {profile.latestProject ? (
              <Link href={getContentHref(profile.latestProject)}>
                <span>最近项目</span>
                <strong>{profile.latestProject.title}</strong>
                <small>{profile.latestProject.summary}</small>
              </Link>
            ) : null}
            {profile.latestMoment ? (
              <Link href={getContentHref(profile.latestMoment)}>
                <span>最近日常</span>
                <strong>{profile.latestMoment.title}</strong>
                <small>{profile.latestMoment.summary}</small>
              </Link>
            ) : null}
          </div>
        </section>

        <section className="content-section" id="work">
          <div className="section-heading">
            <p className="eyebrow">作品内容</p>
            <h2>最近沉淀</h2>
          </div>
          <div className="content-grid">
            {featured.map((item) => (
              <ContentCard key={item.id} item={item} />
            ))}
          </div>
        </section>

        {popular.length > 0 ? (
          <section className="content-section content-section--subtle">
            <div className="section-heading section-heading--row">
              <div>
                <p className="eyebrow">热门</p>
                <h2>热门内容</h2>
              </div>
              <Link href="/posts?sort=popular">查看热门文章</Link>
            </div>
            <div className="content-grid">
              {popular.map((item) => (
                <ContentCard key={item.id} item={item} />
              ))}
            </div>
          </section>
        ) : null}
      </main>
    </SiteShell>
  );
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat('zh-CN', { notation: 'compact', maximumFractionDigits: 1 }).format(value);
}
