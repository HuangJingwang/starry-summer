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
      <main className="cyber-home">
        <div className="cyber-firefly-field" aria-hidden="true">
          <span className="cyber-firefly cyber-firefly--one" />
          <span className="cyber-firefly cyber-firefly--two" />
          <span className="cyber-firefly cyber-firefly--three" />
          <span className="cyber-firefly cyber-firefly--four" />
          <span className="cyber-firefly cyber-firefly--five" />
        </div>

        <section className="cyber-hero" id="about">
          <HomeHeroBackground backgrounds={heroBackgrounds} />
          <div className="cyber-hero__shade" />
          <div className="cyber-home__container cyber-hero__grid">
            <article className="author-bio-card">
              <p className="eyebrow">夏夜数字档案</p>
              <h1>Hi，我是 {profile.ownerName}</h1>
              <p className="author-bio-card__lead">{profile.description}</p>
              <p className="author-bio-card__motto">{profile.motto || settings.hero.tagline}</p>

              <div className="author-bio-card__meta">
                <div>
                  <span>站点</span>
                  <strong>{profile.title}</strong>
                </div>
                <div>
                  <span>方向</span>
                  <strong>写作 / 笔记 / 项目 / 日常</strong>
                </div>
                <div>
                  <span>最近更新</span>
                  <strong>{profile.stats.lastPublishedAt || '持续构建中'}</strong>
                </div>
              </div>

              <div className="author-bio-card__actions" aria-label="快捷入口">
                <Link href="/posts">阅读文章</Link>
                <Link href="/notes">翻看笔记</Link>
                <Link href="/guestbook">给我留言</Link>
              </div>
            </article>

            <aside
              className="author-profile-card"
              style={{ backgroundImage: `url("${heroBackgrounds[0]?.url}")` }}
              aria-label="站点概览"
            >
              <div className="author-profile-card__glass">
                <span className="author-profile-card__avatar">{profile.ownerName.slice(0, 1) || 'S'}</span>
                <div>
                  <p>{profile.title}</p>
                  <strong>{profile.ownerName}</strong>
                </div>
              </div>
              <dl className="author-profile-card__stats">
                <div>
                  <dt>Collection</dt>
                  <dd>{formatNumber(stats.publicCount)}</dd>
                </div>
                <div>
                  <dt>Total Views</dt>
                  <dd>{formatNumber(stats.totalViews)}</dd>
                </div>
                <div>
                  <dt>Likes</dt>
                  <dd>{formatNumber(stats.totalLikes)}</dd>
                </div>
              </dl>
            </aside>
          </div>
        </section>

        <nav className="content-filter-rail cyber-home__container" aria-label="内容索引">
          <span>内容索引</span>
          <Link href="/posts">文章</Link>
          <Link href="/notes">笔记</Link>
          <Link href="/moments">日常</Link>
          <Link href="/projects">项目</Link>
          <Link href="/series">专题</Link>
          <Link href="/search">搜索</Link>
        </nav>

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

function formatNumber(value: number): string {
  return new Intl.NumberFormat('zh-CN', { notation: 'compact', maximumFractionDigits: 1 }).format(value);
}
