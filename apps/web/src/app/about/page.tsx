import { SiteShell } from '@/components/SiteShell';
import { loadPublicPageMetadata } from '@/lib/page-metadata';
import { loadSiteSettings } from '@/lib/settings-repository';

export function generateMetadata() {
  return loadPublicPageMetadata({
    title: '关于',
    description: '个人资料、社交链接和站点介绍。',
    path: '/about',
  });
}

export default async function AboutPage() {
  const settings = await loadSiteSettings();

  return (
    <SiteShell>
      <main className="page-main narrow">
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
        <section className="about-list">
          <div className="about-list__item">
            <h2>写作</h2>
            <p>长文、教程、观点和阶段性复盘。</p>
          </div>
          <div className="about-list__item">
            <h2>笔记</h2>
            <p>读书摘录、技术片段和临时灵感。</p>
          </div>
          <div className="about-list__item">
            <h2>项目</h2>
            <p>开源项目、产品实验和作品集记录。</p>
          </div>
        </section>
      </main>
    </SiteShell>
  );
}
