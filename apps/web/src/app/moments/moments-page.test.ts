import { existsSync, readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join } from 'node:path';

import { describe, expect, test } from 'vitest';

import { categoryOrder, recommendedShares } from '@/lib/recommended-shares';

function readSource(path: string) {
  return readFileSync(join(process.cwd(), path), 'utf8');
}

function readGlobalStyles() {
  return [
    'src/app/styles/base.css',
    'src/app/styles/public.css',
    'src/app/styles/home.css',
    'src/app/styles/content.css',
    'src/app/styles/leetcode.css',
    'src/app/styles/share.css',
    'src/app/styles/admin.css',
    'src/app/styles/responsive.css',
  ]
    .map((path) => readSource(path))
    .join('\n');
}

function readRule(source: string, selector: string) {
  const escapedSelector = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = source.match(new RegExp(`${escapedSelector} \\{([\\s\\S]*?)\\n\\}`, 'm'));

  return match?.[1] ?? '';
}

function fileSha256(path: string) {
  return createHash('sha256').update(readFileSync(path)).digest('hex');
}

describe('recommended share page', () => {
  test('turns the moments route into the recommended share resource page', () => {
    const page = readSource('src/app/moments/page.tsx');
    const grid = readSource('src/components/RecommendedShareGrid.tsx');
    const data = readSource('src/lib/recommended-shares.ts');

    expect(page).toContain("title: '推荐分享'");
    expect(page).toContain("description: '收藏常用工具、灵感网站、组件库和学习资源。'");
    expect(page).toContain('<RecommendedShareGrid resources={recommendedShares} />');
    expect(page).not.toContain('loadSiteContent');
    expect(page).not.toContain('<ContentCard');

    expect(grid).toContain('placeholder="搜索资源..."');
    expect(grid).toContain('全部');
    expect(grid).toContain('没有找到相关资源');
    expect(grid).toContain('share-page__stars');

    expect(categoryOrder).toEqual(['全部', '开源项目', 'AI Coding', '前端审美', '工程流程', 'AI 学习']);
    expect(recommendedShares.map((resource) => resource.name)).toEqual([
      'Taste Skill',
      'Trellis',
      'Superpowers',
      '小林面试笔记',
    ]);
    expect(recommendedShares.map((resource) => [resource.name, resource.avatarSrc, resource.avatarAlt])).toEqual([
      ['Taste Skill', '/images/recommended-shares/taste-skill-avatar.jpg', 'Taste Skill GitHub 项目图标'],
      ['Trellis', '/images/recommended-shares/trellis-avatar.jpg', 'Trellis GitHub 项目图标'],
      ['Superpowers', '/images/recommended-shares/superpowers-avatar.jpg', 'Superpowers GitHub 项目图标'],
      ['小林面试笔记', '/images/recommended-shares/xiaolinnote-logo.png', '小林面试笔记图标'],
    ]);
    for (const resource of recommendedShares) {
      expect(resource.avatarSrc).toBeTruthy();
      expect(existsSync(join(process.cwd(), 'public', resource.avatarSrc!.replace(/^\//, '')))).toBe(true);
    }
    expect(fileSha256(join(process.cwd(), 'public/images/recommended-shares/xiaolinnote-logo.png'))).toBe(
      '9d46bacbcd82a54266afc6e68d9ba6560c9bcdc5796bb75ebfa7c86a9a027476',
    );
    expect(recommendedShares.find((resource) => resource.name === '小林面试笔记')).toMatchObject({
      url: 'https://xiaolinnote.com/',
      logo: 'XL',
      avatarSrc: '/images/recommended-shares/xiaolinnote-logo.png',
      avatarAlt: '小林面试笔记图标',
      tags: ['AI 学习', 'AI Coding', '工程流程'],
      stars: 5,
    });
    expect(data).toContain("name: 'Taste Skill'");
    expect(data).toContain("name: 'Trellis'");
    expect(data).toContain("name: 'Superpowers'");
    expect(data).toContain("name: '小林面试笔记'");
    expect(data).not.toContain("name: 'iLoveIMG'");
    expect(data).not.toContain("name: 'TinyPNG'");
    expect(data).not.toContain("name: 'Magic UI'");
  });

  test('styles the share page with separate light and dark themes from the YYsuni reference layout', () => {
    const css = readGlobalStyles();
    const grid = readSource('src/components/RecommendedShareGrid.tsx');
    const responsiveCss = readSource('src/app/styles/responsive.css');

    expect(css).toContain('.share-page');
    expect(css).toContain('.share-page__filters');
    expect(css).toContain('.share-page__grid');
    expect(css).toContain('.share-page__card');
    expect(css).toContain('.share-page__logo');
    expect(grid).toContain('resource.avatarSrc ?');
    expect(grid).toContain('<img src={resource.avatarSrc} alt={resource.avatarAlt ?? `${resource.name} 图标`} />');
    expect(css).toContain(":root[data-theme='summer-day'] .share-page");
    expect(css).toContain(":root[data-theme='summer-night'] .share-page");
    expect(css).toContain(":root[data-theme='summer-day'] .share-page__card");
    expect(css).toContain(":root[data-theme='summer-night'] .share-page__card");
    expect(responsiveCss).toContain('.share-page__grid');
  });

  test('keeps filters and cards compact after search results shrink', () => {
    const css = readGlobalStyles();

    expect(readRule(css, '.share-page')).toContain('align-content: start;');
    expect(readRule(css, '.share-page')).toContain('background: transparent;');
    expect(readRule(css, '.share-page')).not.toContain('background: var(--share-bg);');
    expect(readRule(css, '.share-page__panel')).toContain('align-content: start;');
    expect(readRule(css, '.share-page__filters')).toContain('align-content: start;');
    expect(readRule(css, '.share-page__tag-list')).toContain('align-items: center;');
    expect(readRule(css, '.share-page__tag-list button')).toContain('height: 32px;');
    expect(readRule(css, '.share-page__grid')).toContain('align-items: start;');
    expect(readRule(css, '.share-page__card')).toContain('align-content: start;');
    expect(readRule(css, '.share-page__logo')).toContain('border-radius: 999px;');
    expect(readRule(css, '.share-page__logo img')).toContain('object-fit: cover;');
    expect(readRule(css, '.share-page__body')).toContain('align-content: start;');
  });
});
