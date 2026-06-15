import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, test } from 'vitest';

describe('next config', () => {
  test('keeps the local development indicator out of public page previews', () => {
    const source = readFileSync(join(process.cwd(), 'next.config.ts'), 'utf8');

    expect(source).toContain('devIndicators: false');
  });

  test('does not proxy web api routes to the old backend api', () => {
    const source = readFileSync(join(process.cwd(), 'next.config.ts'), 'utf8');

    expect(source).not.toContain('async rewrites()');
    expect(source).not.toContain('API_BASE_URL');
    expect(source).not.toContain('http://127.0.0.1:4000');
  });
});
