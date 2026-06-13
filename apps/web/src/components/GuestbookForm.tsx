'use client';

import { useId } from 'react';

import { buildGuestbookRequest } from '@/lib/interaction-client';
import type { AuthenticatedReaderSession } from '@/lib/reader-auth';
import { PublicGitHubLoginGate } from '@/components/PublicGitHubLoginGate';
import { PublicReaderIdentity } from '@/components/PublicReaderIdentity';
import { PublicSubmissionBodyField } from '@/components/PublicSubmissionBodyField';
import { PublicSubmissionSubmitButton } from '@/components/PublicSubmissionSubmitButton';
import { usePublicSubmissionForm } from '@/components/usePublicSubmissionForm';

export function GuestbookForm({ reader }: { reader: AuthenticatedReaderSession | null }) {
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
      buildGuestbookRequest({
        body: String(formData.get('body') ?? ''),
      }),
    failureMessage: '请先用 GitHub 登录后再留言。',
    successMessage: '留言已发布。',
  });

  if (!reader) {
    return (
      <PublicGitHubLoginGate actionLabel="GitHub 登录后留言" nextPath="/guestbook">
        为了避免匿名刷屏和垃圾留言，请先用 GitHub 登录。
      </PublicGitHubLoginGate>
    );
  }

  return (
    <form ref={formRef} className="guestbook-form" action={submit} aria-busy={isSubmitting}>
      <PublicReaderIdentity reader={reader} />
      <PublicSubmissionBodyField
        ariaLabel="留言内容"
        body={body}
        counterId={bodyCounterId}
        onBodyChange={setBody}
        placeholder="留下些什么"
        remainingBodyLength={remainingBodyLength}
        rows={5}
      />
      <PublicSubmissionSubmitButton disabled={isSubmitting || isBodyBlank} isSubmitting={isSubmitting}>
        提交留言
      </PublicSubmissionSubmitButton>
      {message ? <p {...statusProps}>{message}</p> : null}
    </form>
  );
}
