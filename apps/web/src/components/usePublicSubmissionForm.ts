'use client';

import { useRef, useState } from 'react';

import { PUBLIC_SUBMISSION_LIMITS, readInteractionErrorMessage } from '@/lib/interaction-client';

type PublicSubmissionRequest = {
  init: RequestInit;
  url: string;
};

export function usePublicSubmissionForm({
  buildRequest,
  failureMessage,
  onSuccess,
  successMessage,
}: {
  buildRequest: (formData: FormData) => PublicSubmissionRequest | null;
  failureMessage: string;
  onSuccess?: () => void;
  successMessage: string;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [body, setBody] = useState('');
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const isBodyBlank = body.trim().length === 0;
  const remainingBodyLength = PUBLIC_SUBMISSION_LIMITS.body - body.length;
  const statusProps = {
    'aria-live': 'polite',
    role: 'status',
    className: `form-message form-message--${status}`,
  } as const;

  async function submit(formData: FormData) {
    setIsSubmitting(true);
    setMessage('');
    setStatus('idle');

    try {
      const request = buildRequest(formData);

      if (!request) {
        setStatus('error');
        setMessage('互动服务未配置，暂时不能提交。');
        return;
      }

      const response = await fetch(request.url, request.init);
      if (response.ok) {
        formRef.current?.reset();
        setBody('');
        setStatus('success');
        setMessage(successMessage);
        onSuccess?.();
      } else {
        const errorMessage = await readInteractionErrorMessage(response, failureMessage);
        setStatus('error');
        setMessage(errorMessage);
      }
    } catch {
      setStatus('error');
      setMessage('互动服务暂不可用，稍后再试。');
    } finally {
      setIsSubmitting(false);
    }
  }

  return {
    body,
    formRef,
    isBodyBlank,
    isSubmitting,
    message,
    remainingBodyLength,
    setBody,
    statusProps,
    submit,
  };
}
