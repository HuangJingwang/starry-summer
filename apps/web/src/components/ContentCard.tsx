import Link from 'next/link';

import type { SiteContentItem } from '@/lib/content';
import { getContentHref } from '@/lib/content';

export function ContentCard({ item }: { item: SiteContentItem }) {
  return (
    <article className="content-card">
      {item.coverImageUrl ? (
        <Link className="content-card__cover" href={getContentHref(item)}>
          <img src={item.coverImageUrl} alt={item.coverAltText || item.title} />
        </Link>
      ) : null}
      <div className="content-card__meta">
        <span>
          {item.pinned ? <span className="content-card__pin">置顶</span> : null}
          {item.type}
        </span>
        <time dateTime={item.publishedAt}>{item.publishedAt}</time>
      </div>
      <h3>
        <Link href={getContentHref(item)}>{item.title}</Link>
      </h3>
      <p>{item.summary}</p>
      <div className="content-card__footer">
        <span>{item.viewCount ?? 0} views</span>
        <span>{item.likeCount ?? 0} likes</span>
      </div>
    </article>
  );
}
