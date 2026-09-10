import { readFileSync } from 'node:fs';
import { renderToStaticMarkup } from 'react-dom/server';
import { expect, test } from 'vitest';
import { JournalFooter } from './JournalFooter';

test('footer GitHub destination matches the configured profile, not the display alias', () => {
  const settings = JSON.parse(readFileSync(new URL('../../content/site-settings.json', import.meta.url), 'utf8'));
  const github = settings.profile.socialLinks.find((link: { label: string }) => link.label === 'GitHub');
  const html = renderToStaticMarkup(<JournalFooter />);
  expect(github.href).toBe('https://github.com/HuangJingwang');
  expect(html).toContain(`href="${github.href}"`);
  expect(html).toContain('© Aster.H');
});
