'use client';

import { useId, useState } from 'react';

import { buildCommentRequest, type CommentTargetType } from '@/lib/interaction-client';
import type { AuthenticatedReaderSession } from '@/lib/reader-auth';
import { PublicGitHubLoginGate } from '@/components/PublicGitHubLoginGate';
import { PublicReaderIdentity } from '@/components/PublicReaderIdentity';
import { PublicSubmissionBodyField } from '@/components/PublicSubmissionBodyField';
import { PublicSubmissionSubmitButton } from '@/components/PublicSubmissionSubmitButton';
import { usePublicSubmissionForm } from '@/components/usePublicSubmissionForm';

export function CommentForm({
  targetType,
  targetId,
  reader,
  loginNextPath,
}: {
  targetType: CommentTargetType;
  targetId: string;
  reader: AuthenticatedReaderSession | null;
  loginNextPath: string;
}) {
  const bodyCounterId = useId();
  const [loginGateOpen, setLoginGateOpen] = useState(false);
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
    buildRequest: (formData) =>
      buildCommentRequest({
        targetType,
        targetId,
        body: String(formData.get('body') ?? ''),
      }),
    failureMessage: '提交失败，请稍后再试。',
    successMessage: '评论已发布。',
  });

  if (!reader) {
    return (
      <div className="comment-login-entry">
        <button
          type="button"
          className="comment-login-entry__button"
          aria-haspopup="dialog"
          aria-expanded={loginGateOpen}
          onClick={() => setLoginGateOpen(true)}
        >
          写评论
        </button>
        {loginGateOpen ? (
          <div className="comment-login-modal" role="dialog" aria-modal="true" aria-label="GitHub 登录后评论">
            <button
              type="button"
              className="comment-login-modal__backdrop"
              aria-label="关闭登录提示"
              onClick={() => setLoginGateOpen(false)}
            />
            <div className="comment-login-modal__panel">
              <button
                type="button"
                className="comment-login-modal__close"
                aria-label="关闭登录提示"
                onClick={() => setLoginGateOpen(false)}
              >
                ×
              </button>
              <PublicGitHubLoginGate actionLabel="GitHub 登录后评论" nextPath={loginNextPath}>
                为了避免匿名刷屏和垃圾评论，请先用 GitHub 登录。
              </PublicGitHubLoginGate>
            </div>
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <form ref={formRef} className="interaction-form" action={submit} aria-busy={isSubmitting}>
      <h2>评论</h2>
      <PublicReaderIdentity reader={reader} />
      <PublicSubmissionBodyField
        body={body}
        counterId={bodyCounterId}
        onBodyChange={setBody}
        placeholder="写下你的想法"
        remainingBodyLength={remainingBodyLength}
        rows={4}
      />
      <PublicSubmissionSubmitButton disabled={isSubmitting || isBodyBlank} isSubmitting={isSubmitting}>
        提交评论
      </PublicSubmissionSubmitButton>
      {message ? <p {...statusProps}>{message}</p> : null}
    </form>
  );
}
