import type { SiteContentItem } from '@/lib/content';

export function ContentCard({ item }: { item: SiteContentItem }) {
  return (
    <article className="content-card">
      <div className="content-card__meta">
        <span>{item.type}</span>
        <time dateTime={item.publishedAt}>{item.publishedAt}</time>
      </div>
      <h3>{item.title}</h3>
      <p>{item.summary}</p>
      <div className="content-card__footer">
        <span>{item.viewCount ?? 0} views</span>
        <span>{item.likeCount ?? 0} likes</span>
      </div>
    </article>
  );
}
