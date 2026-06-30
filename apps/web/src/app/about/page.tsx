import { Atom, BookOpen, Braces, Code2, FileText, FolderGit2, GitBranch, Rocket, StickyNote } from 'lucide-react';

import { SiteShell } from '@/components/SiteShell';
import { loadPublicPageMetadata } from '@/lib/page-metadata';
import { loadSiteSettings } from '@/lib/settings-repository';

const contentSections = [
  {
    title: '文章和技术笔记',
    description: '把长一点的想法、教程和阶段复盘留成可以回看的文本。',
    Icon: BookOpen,
  },
  {
    title: '片刻、推荐和生活记录',
    description: '保存更轻的日常、链接和当下发现，不必每次都写成长文。',
    Icon: StickyNote,
  },
  {
    title: '项目过程与阶段复盘',
    description: '记录项目从想法到落地的过程，留下取舍、结果和后续线索。',
    Icon: FolderGit2,
  },
] as const;

const stackItems = [
  { label: 'Next.js', Icon: Code2 },
  { label: 'React', Icon: Atom },
  { label: 'TypeScript', Icon: Braces },
  { label: 'Markdown', Icon: FileText },
  { label: 'GitHub', Icon: GitBranch },
  { label: 'Vercel', Icon: Rocket },
] as const;

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
            {contentSections.map(({ title, description, Icon }) => (
              <li className="about-note__item" key={title}>
                <span className="about-note__item-icon" aria-hidden="true">
                  <Icon size={16} strokeWidth={1.8} />
                </span>
                <div>
                  <strong>{title}</strong>
                  <p>{description}</p>
                </div>
              </li>
            ))}
          </ul>
          <div className="about-note__meta">
            <h2>技术栈</h2>
            <ul className="about-stack" aria-label="技术栈">
              {stackItems.map(({ label, Icon }) => (
                <li key={label}>
                  <Icon className="about-stack__icon" size={13} strokeWidth={1.9} aria-hidden="true" />
                  {label}
                </li>
              ))}
            </ul>
          </div>
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
