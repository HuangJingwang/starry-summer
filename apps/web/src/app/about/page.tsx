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
          <h1>关于本站</h1>
          <p>Starry Summer 是 Aster.H 的个人内容平台。</p>
        </div>

        <section className="about-note" aria-label="关于 Starry Summer">
          <p>
            这里长期保存公开写作、笔记、日常和项目。内容尽量跟着仓库走，方便以后迁移、回看和继续整理。
          </p>
          <ul className="about-note__list" aria-label="站点内容">
            <li>文章和技术笔记</li>
            <li>片刻、推荐和生活记录</li>
            <li>项目过程与阶段复盘</li>
          </ul>
        </section>

        {settings.profile.socialLinks.length > 0 ? (
          <section className="about-social" aria-label="社交链接">
            {settings.profile.socialLinks.map((link) => (
              <a key={`${link.label}-${link.href}`} href={link.href} target="_blank" rel="noreferrer">
                {link.label}
              </a>
            ))}
          </section>
        ) : null}
      </main>
    </SiteShell>
  );
}
