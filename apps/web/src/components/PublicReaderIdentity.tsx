'use client';

import type { AuthenticatedReaderSession } from '@/lib/reader-auth';

export function PublicReaderIdentity({ reader }: { reader: AuthenticatedReaderSession }) {
  return (
    <div className="guestbook-reader" aria-label="GitHub 当前身份">
      <span>当前身份</span>
      <strong>{reader.displayName}</strong>
      <a href={reader.profileUrl} target="_blank" rel="noreferrer">
        @{reader.login}
      </a>
    </div>
  );
}
