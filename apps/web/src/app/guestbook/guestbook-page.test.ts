import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, test } from 'vitest';

describe('guestbook page', () => {
  test('is disabled on the public site', () => {
    const source = readFileSync(join(process.cwd(), 'src/app/guestbook/page.tsx'), 'utf8');

    expect(source).toContain("import { notFound } from 'next/navigation';");
    expect(source).toContain('notFound();');
    expect(source).not.toContain('GuestbookForm');
    expect(source).not.toContain('loadApprovedGuestbookEntries');
    expect(source).not.toContain('className="page-main guestbook-page"');
  });
});
