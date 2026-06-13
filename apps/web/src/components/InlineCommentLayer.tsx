'use client';

import { useEffect, useId, useMemo, useRef, useState, type RefObject } from 'react';

import { buildCommentRequest, type CommentTargetType } from '@/lib/interaction-client';
import type { PublicComment } from '@/lib/public-comments';
import type { AuthenticatedReaderSession } from '@/lib/reader-auth';
import { PublicGitHubLoginGate } from '@/components/PublicGitHubLoginGate';
import { PublicReaderIdentity } from '@/components/PublicReaderIdentity';
import { PublicSubmissionBodyField } from '@/components/PublicSubmissionBodyField';
import { PublicSubmissionSubmitButton } from '@/components/PublicSubmissionSubmitButton';
import { usePublicSubmissionForm } from '@/components/usePublicSubmissionForm';
import {
  createInlineCommentAnchor,
  findAnchorRange,
  normalizeAnchorText,
  type InlineCommentAnchor,
} from '@/lib/selection-comments';

interface InlineCommentLayerProps {
  targetType: CommentTargetType;
  targetId: string;
  reader: AuthenticatedReaderSession | null;
  loginNextPath: string;
  comments: Array<PublicComment & { anchor: InlineCommentAnchor }>;
}

interface DraftSelection {
  anchor: InlineCommentAnchor;
  rect: {
    left: number;
    top: number;
  };
}

export function InlineCommentLayer({
  targetType,
  targetId,
  reader,
  loginNextPath,
  comments,
}: InlineCommentLayerProps) {
  const [selection, setSelection] = useState<DraftSelection | null>(null);
  const [activeHash, setActiveHash] = useState(comments[0]?.anchor.hash ?? '');
  const railRef = useRef<HTMLElement>(null);
  const {
    body,
    formRef,
    isBodyBlank,
    isSubmitting,
    message,
    remainingBodyLength,
    setBody,
    statusProps,
    submit,
  } = usePublicSubmissionForm({
    buildRequest: (formData) => {
      if (!selection) {
        throw new Error('Inline comment selection is missing.');
      }

      return buildCommentRequest({
        targetType,
        targetId,
        body: String(formData.get('body') ?? ''),
        anchor: selection.anchor,
      });
    },
    failureMessage: '提交失败，请稍后再试。',
    onSuccess: () => setSelection(null),
    successMessage: '划线评论已发布。',
  });

  const mappedComments = useMemo(() => {
    const articleText = getArticleBody()?.textContent ?? '';

    return comments.map((comment) => ({
      comment,
      range: findAnchorRange(articleText, comment.anchor),
    }));
  }, [comments]);

  useEffect(() => {
    function handleSelectionChange() {
      const body = getArticleBody();
      const currentSelection = window.getSelection();

      if (!body || !currentSelection || currentSelection.rangeCount === 0 || currentSelection.isCollapsed) {
        setSelection(null);
        return;
      }

      const range = currentSelection.getRangeAt(0);

      if (!body.contains(range.commonAncestorContainer)) {
        setSelection(null);
        return;
      }

      const selectedText = normalizeAnchorText(currentSelection.toString());

      if (!selectedText) {
        setSelection(null);
        return;
      }

      const offsets = getSelectionOffsets(body, range, selectedText.length);
      const rect = range.getBoundingClientRect();
      const anchor = createInlineCommentAnchor(body.textContent ?? '', offsets.start, offsets.end);

      setSelection({
        anchor,
        rect: {
          left: rect.left + rect.width / 2,
          top: rect.top + window.scrollY - 42,
        },
      });
    }

    document.addEventListener('selectionchange', handleSelectionChange);

    return () => document.removeEventListener('selectionchange', handleSelectionChange);
  }, []);

  useEffect(() => {
    const body = getArticleBody();

    if (!body) {
      return;
    }

    unwrapHighlights(body);
    applyHighlights(body, mappedComments, (hash) => {
      setActiveHash(hash);
      railRef.current?.scrollIntoView({ block: 'nearest' });
    });
  }, [mappedComments]);

  const hasRailContent = selection || comments.length > 0;

  if (!hasRailContent) {
    return null;
  }

  return (
    <div className="inline-comment-shell">
      {selection ? (
        <button
          className="inline-comment-action"
          type="button"
          style={{ left: selection.rect.left, top: selection.rect.top }}
          onClick={() => setActiveHash(selection.anchor.hash)}
        >
          评论
        </button>
      ) : null}

      <aside className="inline-comment-rail" ref={railRef} aria-label="划线评论">
        <InlineCommentComposer
          selection={selection}
          reader={reader}
          loginNextPath={loginNextPath}
          body={body}
          formRef={formRef}
          isBodyBlank={isBodyBlank}
          isSubmitting={isSubmitting}
          message={message}
          remainingBodyLength={remainingBodyLength}
          setBody={setBody}
          statusProps={statusProps}
          submit={submit}
        />
        <InlineCommentList
          items={mappedComments}
          activeHash={activeHash}
          onFocus={(hash) => setActiveHash(hash)}
        />
      </aside>

      <div className="inline-comment-drawer" aria-label="移动端划线评论">
        <InlineCommentComposer
          selection={selection}
          reader={reader}
          loginNextPath={loginNextPath}
          body={body}
          formRef={formRef}
          isBodyBlank={isBodyBlank}
          isSubmitting={isSubmitting}
          message={message}
          remainingBodyLength={remainingBodyLength}
          setBody={setBody}
          statusProps={statusProps}
          submit={submit}
        />
        <InlineCommentList
          items={mappedComments}
          activeHash={activeHash}
          onFocus={(hash) => setActiveHash(hash)}
        />
      </div>
    </div>
  );
}

function InlineCommentComposer({
  selection,
  reader,
  loginNextPath,
  body,
  formRef,
  isBodyBlank,
  isSubmitting,
  message,
  remainingBodyLength,
  setBody,
  statusProps,
  submit,
}: {
  selection: DraftSelection | null;
  reader: AuthenticatedReaderSession | null;
  loginNextPath: string;
  body: string;
  formRef: RefObject<HTMLFormElement | null>;
  isBodyBlank: boolean;
  isSubmitting: boolean;
  message: string;
  remainingBodyLength: number;
  setBody: (body: string) => void;
  statusProps: { readonly 'aria-live': 'polite'; readonly className: string };
  submit: (formData: FormData) => void;
}) {
  const bodyCounterId = useId();

  if (!selection) {
    return null;
  }

  if (!reader) {
    return (
      <PublicGitHubLoginGate actionLabel="GitHub 登录后评论" nextPath={loginNextPath}>
        登录后可以评论选中的文字。
      </PublicGitHubLoginGate>
    );
  }

  return (
    <form ref={formRef} className="inline-comment-composer" action={submit} aria-busy={isSubmitting}>
      <span>评论选区</span>
      <PublicReaderIdentity reader={reader} />
      <blockquote>{selection.anchor.text}</blockquote>
      <PublicSubmissionBodyField
        body={body}
        counterId={bodyCounterId}
        onBodyChange={setBody}
        placeholder="写下你对这段文字的想法"
        remainingBodyLength={remainingBodyLength}
        rows={4}
      />
      <PublicSubmissionSubmitButton disabled={isSubmitting || isBodyBlank} isSubmitting={isSubmitting}>
        提交划线评论
      </PublicSubmissionSubmitButton>
      {message ? <p {...statusProps}>{message}</p> : null}
    </form>
  );
}

function InlineCommentList({
  items,
  activeHash,
  onFocus,
}: {
  items: Array<{
    comment: PublicComment & { anchor: InlineCommentAnchor };
    range: { mapped: boolean };
  }>;
  activeHash: string;
  onFocus: (hash: string) => void;
}) {
  return items.length > 0 ? (
    <ol className="inline-comment-list">
      {items.map(({ comment, range }) => (
        <li
          className={comment.anchor.hash === activeHash ? 'inline-comment-card inline-comment-card--active' : 'inline-comment-card'}
          key={comment.id}
          onClick={() => onFocus(comment.anchor.hash)}
        >
          <span>{range.mapped ? '选区评论' : '原文已变更'}</span>
          <blockquote>{comment.anchor.text}</blockquote>
          <p>{comment.body}</p>
          <small>
            {comment.authorName || '匿名读者'}
            {comment.createdAt ? ` · ${comment.createdAt.slice(0, 10)}` : ''}
          </small>
        </li>
      ))}
    </ol>
  ) : null;
}

function getArticleBody(): HTMLElement | null {
  if (typeof document === 'undefined') {
    return null;
  }

  return document.querySelector<HTMLElement>('.detail__body');
}

function getSelectionOffsets(body: HTMLElement, range: Range, fallbackLength: number): { start: number; end: number } {
  const leadingRange = document.createRange();
  leadingRange.selectNodeContents(body);
  leadingRange.setEnd(range.startContainer, range.startOffset);
  const start = leadingRange.toString().length;
  const end = start + range.toString().length || start + fallbackLength;

  return { start, end };
}

function applyHighlights(
  body: HTMLElement,
  comments: Array<{
    comment: PublicComment & { anchor: InlineCommentAnchor };
    range: { start: number; end: number; mapped: boolean };
  }>,
  onFocus: (hash: string) => void,
) {
  const ranges = comments
    .filter((item) => item.range.mapped)
    .sort((a, b) => b.range.start - a.range.start);

  for (const item of ranges) {
    wrapTextRange(body, item.range.start, item.range.end, item.comment.anchor.hash, onFocus);
  }
}

function wrapTextRange(
  root: HTMLElement,
  start: number,
  end: number,
  hash: string,
  onFocus: (hash: string) => void,
) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let offset = 0;
  let node = walker.nextNode() as Text | null;

  while (node) {
    const nodeStart = offset;
    const nodeEnd = offset + node.data.length;

    if (start >= nodeStart && end <= nodeEnd) {
      const range = document.createRange();
      range.setStart(node, start - nodeStart);
      range.setEnd(node, end - nodeStart);
      const span = document.createElement('span');
      span.className = 'inline-comment-highlight';
      span.dataset.anchorHash = hash;
      span.addEventListener('click', () => onFocus(hash));
      range.surroundContents(span);
      return;
    }

    offset = nodeEnd;
    node = walker.nextNode() as Text | null;
  }
}

function unwrapHighlights(root: HTMLElement) {
  for (const highlight of root.querySelectorAll('.inline-comment-highlight')) {
    const parent = highlight.parentNode;

    while (highlight.firstChild) {
      parent?.insertBefore(highlight.firstChild, highlight);
    }

    highlight.remove();
    parent?.normalize();
  }
}
