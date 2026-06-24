import Link from 'next/link';

import { SiteShell } from '@/components/SiteShell';
import type { SiteContentItem } from '@/lib/content';
import { getContentCover } from '@/lib/content-cover';
import { loadPublicPageMetadata } from '@/lib/page-metadata';
import { loadSiteContent } from '@/lib/public-content';

export function generateMetadata() {
  return loadPublicPageMetadata({
    title: '项目',
    description: '开源项目、产品实验和作品集记录。',
    path: '/projects',
  });
}

export default async function ProjectsPage() {
  const projects = await loadSiteContent('project');

  return (
    <SiteShell>
      <main className="page-main projects-page">
        <h1 className="projects-page__sr-title">项目</h1>
        <div className="projects-page__grid">
          {projects.map((item) => (
            <ProjectShowcaseCard key={item.id} item={item} />
          ))}
        </div>
      </main>
    </SiteShell>
  );
}

function ProjectShowcaseCard({ item }: { item: SiteContentItem }) {
  const cover = getContentCover(item);
  const dayCoverImageUrl = getDayCoverImageUrl(cover?.imageUrl);
  const projectTags = getProjectTags(item);
  const projectLinks = getProjectLinks(item);
  const year = new Date(item.publishedAt).getFullYear();

  return (
    <article className="project-showcase-card">
      <div className="project-showcase-card__header">
        <div
          className={`project-showcase-card__thumbnail${cover ? '' : ' project-showcase-card__thumbnail--empty'}`}
        >
          {cover ? (
            <>
              <img
                className="project-showcase-card__avatar project-showcase-card__avatar--night"
                src={cover.imageUrl}
                alt={cover.altText}
              />
              <img
                className="project-showcase-card__avatar project-showcase-card__avatar--day"
                src={dayCoverImageUrl}
                alt=""
                aria-hidden="true"
              />
            </>
          ) : (
            <span>PROJECT</span>
          )}
        </div>

        <div className="project-showcase-card__intro">
          <div className="project-showcase-card__title-row">
            <h2>{item.title}</h2>
            <time dateTime={item.publishedAt}>{Number.isFinite(year) ? year : 'NOW'}</time>
          </div>

          {projectTags.length > 0 && (
            <div className="project-showcase-card__tags" aria-label="项目标签">
              {projectTags.map((tag) => (
                <span key={tag}>{tag}</span>
              ))}
            </div>
          )}
        </div>
      </div>

      {item.summary && <p className="project-showcase-card__description">{item.summary}</p>}

      <div className="project-showcase-card__links">
        {projectLinks.map((link) => (
          <Link
            key={`${link.label}-${link.href}`}
            href={link.href}
            rel={link.external ? 'noopener noreferrer' : undefined}
            target={link.external ? '_blank' : undefined}
          >
            {link.label}
          </Link>
        ))}
      </div>
    </article>
  );
}

function getProjectTags(item: SiteContentItem): string[] {
  const tags = item.project?.stack?.length
    ? item.project.stack
    : [...(item.tags ?? []), ...(item.categories ?? []), ...(item.series ?? [])];

  return [...new Set(tags.map((tag) => tag.trim()).filter(Boolean))].slice(0, 5);
}

function getProjectLinks(item: SiteContentItem): Array<{ label: string; href: string; external?: boolean }> {
  const links = item.project?.links;
  return [
    { label: 'GitHub', href: links?.repository },
  ]
    .filter((link): link is { label: string; href: string } => Boolean(link.href?.trim()))
    .map((link) => ({ ...link, external: true }));
}

function getDayCoverImageUrl(imageUrl: string | undefined): string {
  return imageUrl?.replace(/-avatar(\.[a-z0-9]+)$/i, '-avatar-day$1') ?? '';
}
