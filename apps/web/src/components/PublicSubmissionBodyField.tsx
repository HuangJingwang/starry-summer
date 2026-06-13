'use client';

import { PUBLIC_SUBMISSION_LIMITS } from '@/lib/interaction-client';

export function PublicSubmissionBodyField({
  ariaLabel,
  body,
  counterId,
  onBodyChange,
  placeholder,
  remainingBodyLength,
  rows,
}: {
  ariaLabel?: string;
  body: string;
  counterId: string;
  onBodyChange: (body: string) => void;
  placeholder: string;
  remainingBodyLength: number;
  rows: number;
}) {
  return (
    <>
      <textarea
        name="body"
        aria-label={ariaLabel}
        aria-describedby={counterId}
        placeholder={placeholder}
        rows={rows}
        maxLength={PUBLIC_SUBMISSION_LIMITS.body}
        value={body}
        onChange={(event) => onBodyChange(event.target.value)}
        required
      />
      <p id={counterId} className={`interaction-form__counter${remainingBodyLength <= 80 ? ' interaction-form__counter--warning' : ''}`}>
        剩余 {remainingBodyLength} 字
      </p>
    </>
  );
}
