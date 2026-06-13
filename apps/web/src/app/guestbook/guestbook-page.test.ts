import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, test } from 'vitest';

describe('guestbook page', () => {
  test('renders a disabled public page instead of a 404', () => {
    const source = readFileSync(join(process.cwd(), 'src/app/guestbook/page.tsx'), 'utf8');

    expect(source).toContain("import { SiteShell } from '@/components/SiteShell';");
    expect(source).toContain('className="page-main guestbook-page guestbook-page--disabled"');
    expect(source).toContain('留言功能已关闭');
    expect(source).not.toContain("import { notFound } from 'next/navigation';");
    expect(source).not.toContain('notFound();');
    expect(source).not.toContain('404');
    expect(source).not.toContain('GuestbookForm');
    expect(source).not.toContain('loadApprovedGuestbookEntries');
  });
});
