import { getContentHref, type AdjacentContent, type SiteContentItem } from '@/lib/content';
import type { CommentTargetType } from '@/lib/interaction-client';
import { CommentForm } from './CommentForm';
import { LikeButton } from './LikeButton';

function isCommentTargetType(type: SiteContentItem['type']): type is CommentTargetType {
  return type === 'post' || type === 'note' || type === 'project';
}

export function ContentDetail({ item, adjacent }: { item: SiteContentItem; adjacent?: AdjacentContent }) {
  const commentForm = isCommentTargetType(item.type) ? (
    <CommentForm targetType={item.type} targetId={item.id} />
  ) : null;

  return (
    <article className="detail">
      <p className="eyebrow">{item.type}</p>
      <h1>{item.title}</h1>
      <p className="detail__summary">{item.summary}</p>
      <div className="detail__meta">
        <time dateTime={item.publishedAt}>{item.publishedAt}</time>
        <span>{item.viewCount ?? 0} views</span>
        <LikeButton targetType={item.type} targetId={item.id} initialCount={item.likeCount ?? 0} />
      </div>
      <div className="detail__body">
        <p>
          这是当前内容详情页的基础形态。后续会接入 API 中的 Markdown 渲染结果，并展示目录、代码高亮、评论和点赞。
        </p>
      </div>
      {adjacent ? (
        <nav className="adjacent-content" aria-label="Adjacent content">
          {adjacent.previous ? (
            <a href={getContentHref(adjacent.previous)}>
              <span>上一篇</span>
              <strong>{adjacent.previous.title}</strong>
            </a>
          ) : (
            <span className="adjacent-content__empty">没有更早内容</span>
          )}
          {adjacent.next ? (
            <a href={getContentHref(adjacent.next)}>
              <span>下一篇</span>
              <strong>{adjacent.next.title}</strong>
            </a>
          ) : (
            <span className="adjacent-content__empty">没有更新内容</span>
          )}
        </nav>
      ) : null}
      {commentForm}
    </article>
  );
}
