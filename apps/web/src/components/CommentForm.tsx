'use client';

import { useId } from 'react';

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
      <PublicGitHubLoginGate actionLabel="GitHub 登录后评论" nextPath={loginNextPath}>
        为了避免匿名刷屏和垃圾评论，请先用 GitHub 登录。
      </PublicGitHubLoginGate>
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
