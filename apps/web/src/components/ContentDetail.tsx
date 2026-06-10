import type { SiteContentItem } from '@/lib/content';

export function ContentDetail({ item }: { item: SiteContentItem }) {
  return (
    <article className="detail">
      <p className="eyebrow">{item.type}</p>
      <h1>{item.title}</h1>
      <p className="detail__summary">{item.summary}</p>
      <div className="detail__meta">
        <time dateTime={item.publishedAt}>{item.publishedAt}</time>
        <span>{item.viewCount ?? 0} views</span>
        <span>{item.likeCount ?? 0} likes</span>
      </div>
      <div className="detail__body">
        <p>
          这是当前内容详情页的基础形态。后续会接入 API 中的 Markdown 渲染结果，并展示目录、代码高亮、评论和点赞。
        </p>
      </div>
    </article>
  );
}
