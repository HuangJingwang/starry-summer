import { renderMarkdown } from '@starry-summer/markdown';
import Link from 'next/link';
import { cookies } from 'next/headers';

import { canShowComments, estimateReadingTime, formatPublicContentType, getContentHref, getContentTaxonomyLinkGroups, getSeriesHref, type AdjacentContent, type SiteContentItem } from '@/lib/content';
import { getContentCover } from '@/lib/content-cover';
import { buildContentTableOfContents } from '@/lib/content-toc';
import type { CommentTargetType } from '@/lib/interaction-client';
import { loadApprovedComments, type PublicComment } from '@/lib/public-comments';
import { loadReaderSession } from '@/lib/reader-auth';
import { splitAnchoredComments } from '@/lib/selection-comments';
import { CodeCopyEnhancer } from './CodeCopyEnhancer';
import { CommentForm } from './CommentForm';
import { InlineCommentLayer } from './InlineCommentLayer';
import { LikeButton } from './LikeButton';
import { ViewTracker } from './ViewTracker';

function isCommentTargetType(type: SiteContentItem['type']): type is CommentTargetType {
  return type === 'post' || type === 'note' || type === 'project';
}

export async function ContentDetail({ item, adjacent }: { item: SiteContentItem; adjacent?: AdjacentContent }) {
  const markdown = item.bodyMarkdown || item.summary || '';
  const bodyHtml = await renderMarkdown(markdown);
  const tableOfContents = buildContentTableOfContents(markdown);
  const readingTime = estimateReadingTime(markdown);
  const updatedAt = item.updatedAt && item.updatedAt !== item.publishedAt ? item.updatedAt : undefined;
  const taxonomyGroups = getContentTaxonomyLinkGroups(item);
  const cover = getContentCover(item);
  const apiBaseUrl = process.env.API_BASE_URL ?? 'http://127.0.0.1:4000';
  const cookieHeader = (await cookies()).toString();
  const readerSession = await loadReaderSession({ apiBaseUrl, cookieHeader });
  const approvedComments = isCommentTargetType(item.type) && canShowComments(item)
    ? await loadApprovedComments(item.type, item.id)
    : [];
  const { anchored: anchoredComments, regular: regularComments } = splitAnchoredComments(approvedComments);
  const commentSection = isCommentTargetType(item.type) && canShowComments(item) ? (
    <section className="detail-comments" aria-label="评论">
      <h2>评论</h2>
      <CommentList comments={regularComments} />
      <CommentForm
        targetType={item.type}
        targetId={item.id}
        reader={readerSession.authenticated ? readerSession : null}
        loginNextPath={`${getContentHref(item)}#comments`}
      />
    </section>
  ) : null;

  return (
    <article className="detail">
      <ViewTracker targetType={item.type} targetId={item.id} />
      <p className="eyebrow">{formatPublicContentType(item.type)}</p>
      <h1>{item.title}</h1>
      <p className="detail__summary">{item.summary}</p>
      {cover ? (
        <figure className="detail-cover">
          <img src={cover.imageUrl} alt={cover.altText} />
        </figure>
      ) : null}
      <div className="detail__meta">
        <time dateTime={item.publishedAt}>{item.publishedAt}</time>
        {updatedAt ? <time dateTime={updatedAt}>更新于 {updatedAt}</time> : null}
        <span>{readingTime}</span>
        <span>{item.sourceType === 'repost' ? '转载' : '原创'}</span>
        {item.sourceType === 'repost' && item.sourceUrl ? (
          <a href={item.sourceUrl} target="_blank" rel="nofollow noopener noreferrer">
            原文
          </a>
        ) : null}
        <span>{item.viewCount ?? 0} 次浏览</span>
        <LikeButton targetType={item.type} targetId={item.id} initialCount={item.likeCount ?? 0} />
      </div>
      {item.series && item.series.length > 0 ? (
        <div className="detail-taxonomy" aria-label="所属系列">
          <span>系列</span>
          {item.series.map((series) => (
            <Link key={series} href={getSeriesHref(series)}>
              {series}
            </Link>
          ))}
        </div>
      ) : null}
      {taxonomyGroups.map((group) => (
        <div key={group.ariaLabel} className="detail-taxonomy" aria-label={group.ariaLabel}>
          <span>{group.label}</span>
          {group.items.map((item) => (
            <Link key={item.href} href={item.href}>
              {item.label}
            </Link>
          ))}
        </div>
      ))}
      {item.type === 'project' && item.project ? <ProjectMeta item={item} /> : null}
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
      <CodeCopyEnhancer />
      <div className="detail__body" dangerouslySetInnerHTML={{ __html: bodyHtml }} />
      {isCommentTargetType(item.type) && canShowComments(item) ? (
        <InlineCommentLayer
          targetType={item.type}
          targetId={item.id}
          reader={readerSession.authenticated ? readerSession : null}
          loginNextPath={`${getContentHref(item)}#comments`}
          comments={anchoredComments}
        />
      ) : null}
      {adjacent ? (
        <nav className="adjacent-content" aria-label="相邻内容">
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

function ProjectMeta({ item }: { item: SiteContentItem }) {
  const project = item.project;

  if (!project) {
    return null;
  }

  const links = [
    ['官网', project.links?.website],
    ['代码仓库', project.links?.repository],
    ['演示', project.links?.demo],
    ['文章', project.links?.article],
  ].filter(([, href]) => Boolean(href)) as Array<[string, string]>;

  return (
    <section className="project-meta" aria-label="项目信息">
      <div>
        <span>状态</span>
        <strong>{formatProjectStatus(project.status)}</strong>
      </div>
      {project.stack && project.stack.length > 0 ? (
        <div>
          <span>技术栈</span>
          <ul>
            {project.stack.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      ) : null}
      {project.startedAt || project.endedAt ? (
        <div>
          <span>周期</span>
          <strong>
            {project.startedAt ?? '未知'} - {project.endedAt ?? '至今'}
          </strong>
        </div>
      ) : null}
      {links.length > 0 ? (
        <div>
          <span>链接</span>
          <p>
            {links.map(([label, href]) => (
              <a key={label} href={href} target="_blank" rel="nofollow noopener noreferrer">
                {label}
              </a>
            ))}
          </p>
        </div>
      ) : null}
    </section>
  );
}

function formatProjectStatus(status: NonNullable<SiteContentItem['project']>['status'] | undefined): string {
  const labels: Record<string, string> = {
    active: '进行中',
    paused: '暂停',
    completed: '已完成',
    archived: '已归档',
  };

  return labels[String(status ?? 'active')] ?? String(status ?? 'active');
}

function CommentList({ comments }: { comments: PublicComment[] }) {
  return comments.length > 0 ? (
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
  );
}
