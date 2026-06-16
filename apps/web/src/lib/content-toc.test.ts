import { describe, expect, test } from 'vitest';

import { buildContentTableOfContents } from './content-toc';

describe('buildContentTableOfContents', () => {
  test('returns linked heading entries when an article has enough sections', () => {
    const toc = buildContentTableOfContents(['## 开始', '', 'Intro', '', '### Details?', '', 'More'].join('\n'));

    expect(toc).toEqual([
      { depth: 2, text: '开始', slug: '开始' },
      { depth: 3, text: 'Details?', slug: 'details' },
    ]);
  });

  test('keeps a table of contents for single-section articles', () => {
    expect(buildContentTableOfContents('## Only one section')).toEqual([
      { depth: 2, text: 'Only one section', slug: 'only-one-section' },
    ]);
  });
});
