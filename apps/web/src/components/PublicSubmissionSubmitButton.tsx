'use client';

import type { ReactNode } from 'react';

export function PublicSubmissionSubmitButton({
  children,
  disabled,
  isSubmitting,
}: {
  children: ReactNode;
  disabled: boolean;
  isSubmitting: boolean;
}) {
  return (
    <button type="submit" disabled={disabled} aria-disabled={disabled}>
      {isSubmitting ? '提交中' : children}
    </button>
  );
}
