import type { SiteContentItem } from '@/lib/content';
import type { CommentTargetType } from '@/lib/interaction-client';
import { CommentForm } from './CommentForm';
import { LikeButton } from './LikeButton';

function isCommentTargetType(type: SiteContentItem['type']): type is CommentTargetType {
  return type === 'post' || type === 'note' || type === 'project';
}

export function ContentDetail({ item }: { item: SiteContentItem }) {
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
      {commentForm}
    </article>
  );
}
