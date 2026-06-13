import Link from 'next/link';

import { ContentCard } from '@/components/ContentCard';
import { HomeHeroBackground } from '@/components/HomeHeroBackground';
import { SiteShell } from '@/components/SiteShell';
import { StarrySkyCanvas } from '@/components/StarrySkyCanvas';
import { loadPublicAssets } from '@/lib/assets';
import { getContentHref, getFeaturedContent, getPopularContent } from '@/lib/content';
import { buildHomeProfileModel } from '@/lib/home-profile';
import { loadSiteContent } from '@/lib/public-content';
import { loadPublicSettings } from '@/lib/settings';

export default async function HomePage() {
  const apiBaseUrl = process.env.API_BASE_URL;
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
  const ownerPortrait = {
    url: '/images/aster-profile.png',
    alt: `${profile.ownerName} 的个人照片`,
  };

  return (
    <SiteShell>
      <main className="portfolio-home">
        <section className="portfolio-hero" id="about" aria-label="Starry Summer 首页">
          <HomeHeroBackground backgrounds={heroBackgrounds} />
          <StarrySkyCanvas className="portfolio-hero__canvas" />
          <div className="portfolio-hero__shade" />

          <div className="portfolio-hero__content cyber-home__container">
            <div className="portfolio-hero__copy">
              <p className="portfolio-hero__badge">个人内容平台</p>
              <div className="portfolio-hero__title">
                <h1 className="portfolio-hero__name">{profile.ownerName}</h1>
                <span className="portfolio-hero__outline" aria-hidden="true">
                  PORTFOLIO
                </span>
              </div>
              <p className="portfolio-hero__role">Content Builder</p>
              <p className="portfolio-hero__lead">{profile.description}</p>
              <p className="portfolio-hero__motto">{profile.motto || settings.hero.tagline}</p>

              <dl className="portfolio-hero__stats" aria-label="站点数据">
                <div>
                  <dt>内容资产</dt>
                  <dd>{formatNumber(stats.publicCount)}</dd>
                </div>
                <div>
                  <dt>累计浏览</dt>
                  <dd>{formatNumber(stats.totalViews)}</dd>
                </div>
                <div>
                  <dt>收到喜欢</dt>
                  <dd>{formatNumber(stats.totalLikes)}</dd>
                </div>
                <div>
                  <dt>最近更新</dt>
                  <dd>{stats.lastPublishedAt || '持续构建'}</dd>
                </div>
              </dl>

              <div className="portfolio-hero__actions" aria-label="首页快捷入口">
                <Link className="portfolio-hero__primary" href="/posts">
                  阅读文章
                </Link>
                <Link className="portfolio-hero__secondary" href="/archives">
                  浏览索引
                </Link>
                <a className="portfolio-hero__social" href="https://github.com/Aster-H">
                  <GitHubIcon />
                  GitHub
                </a>
                <a className="portfolio-hero__social" href="https://juejin.cn/user/959206842703773">
                  <JuejinIcon />
                  掘金
                </a>
              </div>
            </div>

            <figure className="portfolio-hero__portrait">
              <img src={ownerPortrait.url} alt={ownerPortrait.alt} />
              <figcaption>
                <span>站主</span>
                <strong>{profile.ownerName}</strong>
              </figcaption>
            </figure>
          </div>

          <span className="portfolio-hero__scroll" aria-hidden="true">
            SCROLL TO ENTER
          </span>
        </section>

        <section className="home-dashboard cyber-home__container" id="advantage" aria-label="个人优势">
          <div className="home-profile">
            <p className="eyebrow">Creative System</p>
            <h2>把生活、项目和知识长期整理成可回看的系统</h2>
            <p>{settings.hero.tagline}</p>
            {profile.motto ? <blockquote>{profile.motto}</blockquote> : null}
            <dl>
              <div>
                <dt>内容资产</dt>
                <dd>{formatNumber(stats.publicCount)}</dd>
              </div>
              <div>
                <dt>项目实践</dt>
                <dd>{formatNumber(projectCount)}</dd>
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

        <section className="content-section cyber-home__container" id="work">
          <div className="section-heading">
            <p className="eyebrow">Featured Notes</p>
            <h2>最近沉淀</h2>
          </div>
          {featured.length > 0 ? (
            <div className="content-grid">
              {featured.map((item) => (
                <ContentCard key={item.id} item={item} />
              ))}
            </div>
          ) : (
            <div className="content-empty-card">
              <span>EMPTY COLLECTION</span>
              <strong>还没有发布内容</strong>
              <p>去后台发布第一篇文章、笔记、日常或项目后，这里会自动变成首页内容卡片。</p>
              <Link href="/posts">查看内容库</Link>
            </div>
          )}
        </section>

        {popular.length > 0 ? (
          <section className="content-section content-section--subtle cyber-home__container">
            <div className="section-heading section-heading--row">
              <div>
                <p className="eyebrow">Popular Signals</p>
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

function GitHubIcon() {
  return (
    <svg className="portfolio-hero__social-icon" aria-hidden="true" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C6.48 2 2 6.58 2 12.26c0 4.52 2.87 8.35 6.84 9.71.5.1.68-.22.68-.49v-1.9c-2.78.62-3.37-1.22-3.37-1.22-.45-1.18-1.11-1.49-1.11-1.49-.91-.64.07-.63.07-.63 1 .07 1.53 1.06 1.53 1.06.89 1.56 2.34 1.11 2.91.85.09-.66.35-1.11.63-1.37-2.22-.26-4.55-1.14-4.55-5.06 0-1.12.39-2.03 1.03-2.75-.1-.26-.45-1.31.1-2.71 0 0 .84-.28 2.75 1.05A9.36 9.36 0 0 1 12 6.98c.85 0 1.7.12 2.5.34 1.9-1.33 2.74-1.05 2.74-1.05.55 1.4.2 2.45.1 2.71.64.72 1.03 1.63 1.03 2.75 0 3.93-2.34 4.79-4.57 5.04.36.32.68.94.68 1.9v2.81c0 .27.18.59.69.49A10.13 10.13 0 0 0 22 12.26C22 6.58 17.52 2 12 2Z" />
    </svg>
  );
}

function JuejinIcon() {
  return (
    <svg
      className="portfolio-hero__social-icon portfolio-hero__social-icon--juejin"
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="currentColor"
    >
      <path d="M12 3 3.5 8.16l2.03 1.22L12 5.45l6.47 3.93 2.03-1.22L12 3Zm0 5.1-8.5 5.16L12 18.42l8.5-5.16L12 8.1Zm-4.42 5.16L12 10.58l4.42 2.68L12 15.94l-4.42-2.68ZM3.5 15.84 12 21l8.5-5.16-2.03-1.22L12 18.55l-6.47-3.93-2.03 1.22Z" />
    </svg>
  );
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat('zh-CN', { notation: 'compact', maximumFractionDigits: 1 }).format(value);
}
