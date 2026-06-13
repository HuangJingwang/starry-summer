'use client';

import type { ReactNode } from 'react';

export function PublicGitHubLoginGate({
  actionLabel,
  children,
  nextPath,
}: {
  actionLabel: string;
  children: ReactNode;
  nextPath: string;
}) {
  return (
    <div className="guestbook-login-gate" aria-label="GitHub 登录提示">
      <p>{children}</p>
      <small>发布后会直接显示，不进入审核队列。</small>
      <a href={`/api/auth/github/login?next=${encodeURIComponent(nextPath)}`}>{actionLabel}</a>
    </div>
  );
}
