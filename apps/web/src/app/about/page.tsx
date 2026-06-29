import Link from 'next/link';

import { SiteShell } from '@/components/SiteShell';
import { loadPublicPageMetadata } from '@/lib/page-metadata';
import { loadSiteSettings } from '@/lib/settings-repository';

export function generateMetadata() {
  return loadPublicPageMetadata({
    title: '关于',
    description: '关于 Aster.H 和 Starry Summer 个人内容平台。',
    path: '/about',
  });
}

export default async function AboutPage() {
  const settings = await loadSiteSettings();

  return (
    <SiteShell>
      <main className="page-main narrow about-page">
        <div className="page-title">
          <p className="eyebrow">关于</p>
          <h1>{settings.profile.ownerName}</h1>
          <p>{settings.profile.description}</p>
        </div>
        {settings.profile.socialLinks.length > 0 ? (
          <section className="about-social" aria-label="社交链接">
            {settings.profile.socialLinks.map((link) => (
              <a key={`${link.label}-${link.href}`} href={link.href} target="_blank" rel="noreferrer">
                {link.label}
              </a>
            ))}
          </section>
        ) : null}

        <section className="about-section" aria-labelledby="about-site-title">
          <div>
            <p className="eyebrow">关于本站</p>
            <h2 id="about-site-title">关于本站</h2>
          </div>
          <p>
            Starry Summer 是 Aster.H 的个人内容平台，用来长期沉淀公开写作、笔记、日常、项目、留言和资料索引。
            这里按时间、主题和内容类型整理公开记录，方便持续回看、检索和更新。
          </p>
          <div className="about-site-grid" aria-label="站点定位">
            <article className="about-site-card">
              <span>档案</span>
              <h3>长期档案</h3>
              <p>公开内容按时间、主题、标签和系列重新组织，方便以后沿着线索回看。</p>
            </article>
            <article className="about-site-card">
              <span>写作</span>
              <h3>写作优先</h3>
              <p>长文、短笔记和日常片段都可以被留下来，不强行塞进单一博客格式。</p>
            </article>
            <article className="about-site-card">
              <span>静态</span>
              <h3>静态发布</h3>
              <p>内容和配置保留在仓库里，通过 Git 提交和部署流程发布到公开站点。</p>
            </article>
          </div>
        </section>

        <section className="about-section" aria-labelledby="about-content-title">
          <div>
            <p className="eyebrow">内容结构</p>
            <h2 id="about-content-title">内容结构</h2>
          </div>
          <p>这里的内容按不同阅读速度和维护方式分层：长内容沉淀观点，短内容记录现场，项目保留过程。</p>
        </section>

        <section className="about-list about-list--content" aria-label="内容入口">
          <Link className="about-list__item" href="/posts">
            <h2>写作</h2>
            <p>长文、教程、观点和阶段性复盘。</p>
          </Link>
          <Link className="about-list__item" href="/notes">
            <h2>笔记</h2>
            <p>读书摘录、技术片段和临时灵感。</p>
          </Link>
          <Link className="about-list__item" href="/moments">
            <h2>日常</h2>
            <p>推荐分享、现场记录和轻量更新。</p>
          </Link>
          <Link className="about-list__item" href="/projects">
            <h2>项目</h2>
            <p>开源项目、产品实验和阶段复盘。</p>
          </Link>
        </section>

        <section className="about-flow" aria-labelledby="about-flow-title">
          <div>
            <p className="eyebrow">维护</p>
            <h2 id="about-flow-title">运行方式</h2>
            <p>
              站点内容以仓库为中心维护，后台负责写作、整理和静态配置。公开页面保持轻量，部署后不依赖复杂的在线后台。
            </p>
          </div>
          <div className="about-flow__steps" aria-label="维护流程">
            <span>写作</span>
            <span>整理元数据</span>
            <span>提交仓库</span>
            <span>静态发布</span>
          </div>
        </section>

        <section className="about-section about-section--compact" aria-labelledby="about-reading-title">
          <div>
            <p className="eyebrow">阅读</p>
            <h2 id="about-reading-title">阅读路径</h2>
          </div>
          <p>
            如果只是随便逛，可以从文章、推荐分享或项目开始；如果想按线索回看，可以用搜索、归档、分类和标签慢慢翻。
          </p>
          <div className="about-reading-links" aria-label="阅读路径">
            <Link href="/search">搜索</Link>
            <Link href="/archives">归档</Link>
            <Link href="/categories">分类</Link>
            <Link href="/tags">标签</Link>
            <Link href="/guestbook">留言</Link>
          </div>
        </section>
      </main>
    </SiteShell>
  );
}
