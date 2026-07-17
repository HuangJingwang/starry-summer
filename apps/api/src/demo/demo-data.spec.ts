import { describe, expect, test } from 'vitest';

import { createDemoContentRecords } from './demo-data';

describe('demo data', () => {
  test('uses approved article covers instead of the home workspace image for seeded covers', () => {
    const contentWithCovers = createDemoContentRecords().filter((item) => item.coverImageUrl);
    const introPost = createDemoContentRecords().find((item) => item.id === 'demo-post-summer-archive');

    expect(introPost?.coverImageUrl).toBe('/images/starry-summer-night.png');
    expect(
      contentWithCovers
        .filter((item) => item.id !== 'demo-post-summer-archive')
        .map((item) => item.coverImageUrl),
    ).toEqual(contentWithCovers.filter((item) => item.id !== 'demo-post-summer-archive').map(() => '/images/default-post-cover.png'));
    expect(contentWithCovers.some((item) => item.coverImageUrl === '/hero-workspace.png')).toBe(false);
  });

  test('describes the Starry Summer article with facts instead of lyrical copy', () => {
    const introPost = createDemoContentRecords().find((item) => item.id === 'demo-post-summer-archive');

    expect(introPost?.summary).toBe(
      'Starry Summer 的名字来自童年夏夜；网站则源于一次大学时期的建站尝试，现在用于集中保存和发布个人内容。',
    );
    expect(introPost?.bodyMarkdown).toContain('## 第一版网站为什么停了');
    expect(introPost?.bodyMarkdown).toContain('## 现在的用途');
    expect(introPost?.bodyMarkdown).not.toContain('不用急着解释');
  });

  test('keeps seeded public copy aligned with GitHub direct publishing', () => {
    const publicCopy = createDemoContentRecords()
      .map((item) => [item.title, item.summary, item.bodyMarkdown, ...item.tags].join('\n'))
      .join('\n');

    expect(publicCopy).toContain('GitHub 登录后直接显示');
    expect(publicCopy).not.toContain('审核');
    expect(publicCopy).not.toContain('审核队列');
    expect(publicCopy).not.toContain('后台再做审核');
  });
});
