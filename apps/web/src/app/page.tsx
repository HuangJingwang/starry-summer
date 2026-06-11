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
      <main>
        <section className="hero">
          <HomeHeroBackground backgrounds={heroBackgrounds} />
          <div className="hero__overlay" />
          <div className="hero__content">
            <p className="eyebrow">个人内容平台</p>
            <h1>{profile.title}</h1>
            <p>{settings.hero.tagline}</p>
            <p className="hero__motto">{profile.motto}</p>
            <div className="hero__actions" aria-label="Primary actions">
              <a href="/posts">阅读文章</a>
              <a href="/projects">查看项目</a>
            </div>
          </div>
        </section>

        <section className="stats-band" aria-label="站点统计">
          <div>
            <strong>{formatNumber(stats.publicCount)}</strong>
            <span>已发布</span>
          </div>
          <div>
            <strong>{formatNumber(stats.totalViews)}</strong>
            <span>浏览</span>
          </div>
          <div>
            <strong>{formatNumber(stats.totalLikes)}</strong>
            <span>喜欢</span>
          </div>
          <div>
            <strong>{stats.lastPublishedAt || '即将更新'}</strong>
            <span>最近更新</span>
          </div>
        </section>

        <section className="home-dashboard" aria-label="个人概览">
          <div className="home-profile">
            <p className="eyebrow">个人资料</p>
            <h2>{profile.ownerName}</h2>
            <p>{profile.description}</p>
            {profile.motto ? <blockquote>{profile.motto}</blockquote> : null}
            <dl>
              <div>
                <dt>站点</dt>
                <dd>{profile.title}</dd>
              </div>
              <div>
                <dt>最新</dt>
                <dd>{profile.stats.lastPublishedAt || '即将更新'}</dd>
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

        <section className="content-section">
          <div className="section-heading">
            <p className="eyebrow">精选</p>
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
