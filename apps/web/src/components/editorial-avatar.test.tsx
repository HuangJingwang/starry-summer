import { existsSync } from 'node:fs';
import { renderToStaticMarkup } from 'react-dom/server';
import { expect, test } from 'vitest';
import { HeroCharacter } from './EditorialMotion';

test('shared homepage and about avatar uses the approved cutout at every responsive size', () => {
  const html = renderToStaticMarkup(<HeroCharacter />);
  for (const suffix of ['', '-640', '-960']) {
    const filename = `aster-avatar${suffix}.webp`;
    expect(html).toContain(`/images/${filename}`);
    expect(existsSync(new URL(`../../public/images/${filename}`, import.meta.url))).toBe(true);
  }
  expect(html).toContain('黑色短发');
  expect(html).toContain('坐在方块上');
  expect(html).toContain('width="1254" height="1254"');
  expect(html).not.toContain('editorial-writer');
  expect(html).not.toContain('戴眼镜');
});
