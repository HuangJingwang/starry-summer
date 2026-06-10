import Link from 'next/link';

import { ContentCard } from '@/components/ContentCard';
import { SiteShell } from '@/components/SiteShell';
import { loadRandomAsset } from '@/lib/assets';
import { getContentHref, getFeaturedContent, getPopularContent } from '@/lib/content';
import { buildHomeProfileModel } from '@/lib/home-profile';
import { loadSiteContent } from '@/lib/public-content';
import { loadPublicSettings } from '@/lib/settings';

export default async function HomePage() {
  const apiBaseUrl = process.env.API_BASE_URL ?? 'http://127.0.0.1:4000';
  const [content, settings, backgroundAsset] = await Promise.all([
    loadSiteContent(),
    loadPublicSettings(undefined, { apiBaseUrl }),
    loadRandomAsset({ usage: 'background', apiBaseUrl }),
  ]);
  const featured = getFeaturedContent(content).slice(0, 3);
  const popular = getPopularContent(content, {
    excludeIds: featured.map((item) => item.id),
    limit: 3,
  });
  const profile = buildHomeProfileModel(settings, content);
  const stats = profile.stats;
  const heroBackground = backgroundAsset?.publicUrl || settings.hero.backgroundImageUrl;

  return (
    <SiteShell>
      <main>
        <section className="hero">
          <div
            className="hero__image"
            role="img"
            aria-label="A calm visual backdrop for writing and personal notes"
            style={{ backgroundImage: `url("${heroBackground}")` }}
          />
          <div className="hero__overlay" />
          <div className="hero__content">
            <p className="eyebrow">Personal content platform</p>
            <h1>Starry Summer</h1>
            <p>{settings.hero.tagline}</p>
            <div className="hero__actions" aria-label="Primary actions">
              <a href="/posts">Read writing</a>
              <a href="/projects">View projects</a>
            </div>
          </div>
        </section>

        <section className="stats-band" aria-label="Site statistics">
          <div>
            <strong>{formatNumber(stats.publicCount)}</strong>
            <span>Published</span>
          </div>
          <div>
            <strong>{formatNumber(stats.totalViews)}</strong>
            <span>Views</span>
          </div>
          <div>
            <strong>{formatNumber(stats.totalLikes)}</strong>
            <span>Likes</span>
          </div>
          <div>
            <strong>{stats.lastPublishedAt || 'Soon'}</strong>
            <span>Updated</span>
          </div>
        </section>

        <section className="home-dashboard" aria-label="Personal overview">
          <div className="home-profile">
            <p className="eyebrow">Profile</p>
            <h2>{profile.ownerName}</h2>
            <p>{profile.description}</p>
            <dl>
              <div>
                <dt>Site</dt>
                <dd>{profile.title}</dd>
              </div>
              <div>
                <dt>Latest</dt>
                <dd>{profile.stats.lastPublishedAt || 'Soon'}</dd>
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
            <p className="eyebrow">Featured</p>
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
                <p className="eyebrow">Popular</p>
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
  return new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(value);
}
