import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, test } from 'vitest';

describe('public interaction forms', () => {
  test('limits comment and guestbook field lengths before submission', () => {
    const commentForm = readFileSync(join(process.cwd(), 'src/components/CommentForm.tsx'), 'utf8');
    const guestbookForm = readFileSync(join(process.cwd(), 'src/components/GuestbookForm.tsx'), 'utf8');

    for (const source of [commentForm, guestbookForm]) {
      expect(source).toContain('PUBLIC_SUBMISSION_LIMITS');
      expect(source).toContain('maxLength={PUBLIC_SUBMISSION_LIMITS.authorName}');
      expect(source).toContain('maxLength={PUBLIC_SUBMISSION_LIMITS.body}');
    }
  });
});
