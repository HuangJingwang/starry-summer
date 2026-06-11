import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, test } from 'vitest';

describe('home page', () => {
  test('renders the configured site title in the hero heading', () => {
    const source = readFileSync(join(process.cwd(), 'src/app/page.tsx'), 'utf8');

    expect(source).toContain('<h1>{profile.title}</h1>');
    expect(source).not.toContain('<h1>Starry Summer</h1>');
  });
});
