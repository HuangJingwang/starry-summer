import { renderMarkdown } from '@starry-summer/markdown';

import { getContentHref, type AdjacentContent, type SiteContentItem } from '@/lib/content';
import { buildContentTableOfContents } from '@/lib/content-toc';
import type { CommentTargetType } from '@/lib/interaction-client';
import { loadApprovedComments } from '@/lib/public-comments';
import { CommentForm } from './CommentForm';
import { LikeButton } from './LikeButton';
import { ViewTracker } from './ViewTracker';

function isCommentTargetType(type: SiteContentItem['type']): type is CommentTargetType {
  return type === 'post' || type === 'note' || type === 'project';
}

export async function ContentDetail({ item, adjacent }: { item: SiteContentItem; adjacent?: AdjacentContent }) {
  const markdown = item.bodyMarkdown || item.summary || '';
  const bodyHtml = await renderMarkdown(markdown);
  const tableOfContents = buildContentTableOfContents(markdown);
  const comments = isCommentTargetType(item.type) ? await loadApprovedComments(item.type, item.id) : [];
  const commentSection = isCommentTargetType(item.type) ? (
    <section className="detail-comments" aria-label="Comments">
      <h2>评论</h2>
      {comments.length > 0 ? (
        <ol className="detail-comments__list">
          {comments.map((comment) => (
            <li key={comment.id}>
              <div>
                <strong>{comment.authorName || '匿名读者'}</strong>
                {comment.createdAt ? <time dateTime={comment.createdAt}>{comment.createdAt.slice(0, 10)}</time> : null}
              </div>
              <p>{comment.body}</p>
            </li>
          ))}
        </ol>
      ) : (
        <p className="detail-comments__empty">暂无公开评论。</p>
      )}
      <CommentForm targetType={item.type} targetId={item.id} />
    </section>
  ) : null;

  return (
    <article className="detail">
      <ViewTracker targetType={item.type} targetId={item.id} />
      <p className="eyebrow">{item.type}</p>
      <h1>{item.title}</h1>
      <p className="detail__summary">{item.summary}</p>
      <div className="detail__meta">
        <time dateTime={item.publishedAt}>{item.publishedAt}</time>
        <span>{item.sourceType === 'repost' ? '转载' : '原创'}</span>
        {item.sourceType === 'repost' && item.sourceUrl ? (
          <a href={item.sourceUrl} target="_blank" rel="nofollow noopener noreferrer">
            原文
          </a>
        ) : null}
        <span>{item.viewCount ?? 0} views</span>
        <LikeButton targetType={item.type} targetId={item.id} initialCount={item.likeCount ?? 0} />
      </div>
      {tableOfContents.length > 0 ? (
        <nav className="detail-toc" aria-label="文章目录">
          <p className="eyebrow">目录</p>
          <ol>
            {tableOfContents.map((heading) => (
              <li key={heading.slug} className={`detail-toc__item detail-toc__item--depth-${heading.depth}`}>
                <a href={`#${heading.slug}`}>{heading.text}</a>
              </li>
            ))}
          </ol>
        </nav>
      ) : null}
      <div className="detail__body" dangerouslySetInnerHTML={{ __html: bodyHtml }} />
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
      {commentSection}
    </article>
  );
}
