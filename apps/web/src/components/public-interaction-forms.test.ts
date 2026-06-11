import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, test } from 'vitest';

describe('public interaction forms', () => {
  test('limits comment and guestbook field lengths before submission', () => {
    const commentForm = readFileSync(join(process.cwd(), 'src/components/CommentForm.tsx'), 'utf8');
    const guestbookForm = readFileSync(join(process.cwd(), 'src/components/GuestbookForm.tsx'), 'utf8');

    expect(commentForm).toContain('PUBLIC_SUBMISSION_LIMITS');
    expect(commentForm).toContain('maxLength={PUBLIC_SUBMISSION_LIMITS.authorName}');
    expect(commentForm).toContain('maxLength={PUBLIC_SUBMISSION_LIMITS.body}');
    expect(guestbookForm).toContain('PUBLIC_SUBMISSION_LIMITS');
    expect(guestbookForm).not.toContain('maxLength={PUBLIC_SUBMISSION_LIMITS.authorName}');
    expect(guestbookForm).toContain('maxLength={PUBLIC_SUBMISSION_LIMITS.body}');
  });

  test('requires GitHub reader login before showing the guestbook form', () => {
    const guestbookForm = readFileSync(join(process.cwd(), 'src/components/GuestbookForm.tsx'), 'utf8');
    const guestbookPage = readFileSync(join(process.cwd(), 'src/app/guestbook/page.tsx'), 'utf8');

    expect(guestbookPage).toContain('loadReaderSession');
    expect(guestbookPage).toContain('<GuestbookForm reader={readerSession.authenticated ? readerSession : null} />');
    expect(guestbookForm).toContain('reader: AuthenticatedReaderSession | null');
    expect(guestbookForm).toContain('href="/api/auth/github/login?next=/guestbook"');
    expect(guestbookForm).toContain('GitHub 登录后留言');
    expect(guestbookForm).not.toContain('name="authorName"');
  });
});
