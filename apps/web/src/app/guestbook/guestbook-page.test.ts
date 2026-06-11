import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, test } from 'vitest';

describe('guestbook page', () => {
  test('uses a cyber glass layout instead of the default plain page', () => {
    const source = readFileSync(join(process.cwd(), 'src/app/guestbook/page.tsx'), 'utf8');

    expect(source).toContain('className="page-main guestbook-page"');
    expect(source).toContain('className="guestbook-layout"');
    expect(source).toContain('className="guestbook-copy-card"');
    expect(source).toContain('className="guestbook-panel"');
  });
});
