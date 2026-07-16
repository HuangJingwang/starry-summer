import { existsSync, readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join } from 'node:path';

import { describe, expect, test } from 'vitest';

import { categoryOrder, getRecommendedShareStars, recommendedShares } from '@/lib/recommended-shares';

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

    expect(categoryOrder).toEqual(['全部', '开源项目', 'AI Coding', '前端审美', '工程流程', 'AI 学习', '技术社区']);
    expect(recommendedShares.map((resource) => resource.name)).toEqual([
      'Superpowers',
      'Matt Pocock Skills',
      'Learn Claude Code',
      'Taste Skill',
      'Meetily',
      'Trellis',
      'Avoid AI Writing',
      '2025 Blog Public',
      'Deep Research Skills',
      'Minutes',
      'Conductor',
      'LINUX DO',
      '小林面试笔记',
    ]);
    expect(recommendedShares.map((resource) => [resource.name, resource.avatarSrc, resource.avatarAlt])).toEqual([
      ['Superpowers', '/images/recommended-shares/superpowers-avatar.jpg', 'Superpowers GitHub 项目图标'],
      ['Matt Pocock Skills', '/images/recommended-shares/mattpocock-skills-avatar.jpg', 'Matt Pocock Skills GitHub 项目图标'],
      ['Learn Claude Code', '/images/recommended-shares/learn-claude-code-avatar.jpg', 'Learn Claude Code GitHub 项目图标'],
      ['Taste Skill', '/images/recommended-shares/taste-skill-avatar.jpg', 'Taste Skill GitHub 项目图标'],
      ['Meetily', '/images/recommended-shares/meetily-avatar.jpg', 'Meetily GitHub 项目图标'],
      ['Trellis', '/images/recommended-shares/trellis-avatar.jpg', 'Trellis GitHub 项目图标'],
      ['Avoid AI Writing', undefined, undefined],
      [
        '2025 Blog Public',
        '/images/recommended-shares/yysuni-2025-blog-public-avatar.jpg',
        '2025 Blog Public GitHub 项目图标',
      ],
      [
        'Deep Research Skills',
        '/images/recommended-shares/deep-research-skills-avatar.jpg',
        'Deep Research Skills GitHub 项目图标',
      ],
      ['Minutes', undefined, undefined],
      ['Conductor', '/images/recommended-shares/conductor-avatar.jpg', 'Conductor GitHub 项目图标'],
      ['LINUX DO', '/images/recommended-shares/linux-do-logo.svg', 'LINUX DO 网站图标'],
      ['小林面试笔记', '/images/recommended-shares/xiaolinnote-logo.png', '小林面试笔记图标'],
    ]);
    expect(
      recommendedShares
        .filter((resource) => resource.githubStars !== undefined)
        .map((resource) => [resource.name, resource.githubStars, resource.stars]),
    ).toEqual([
      ['Superpowers', 247376, 5],
      ['Matt Pocock Skills', 161732, 5],
      ['Learn Claude Code', 70037, 5],
      ['Taste Skill', 58234, 5],
      ['Meetily', 18223, 5],
      ['Trellis', 11828, 5],
      ['Avoid AI Writing', 2360, 4],
      ['2025 Blog Public', 1576, 4],
      ['Deep Research Skills', 1528, 4],
      ['Minutes', 1291, 4],
      ['Conductor', 86, 3],
    ]);
    for (const resource of recommendedShares.filter((item) => item.githubStars !== undefined)) {
      expect(resource.stars).toBe(getRecommendedShareStars(resource.githubStars!));
      expect(resource.stars).toBeGreaterThanOrEqual(3);
    }
    for (const resource of recommendedShares.filter((item) => item.avatarSrc !== undefined)) {
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
    expect(recommendedShares.find((resource) => resource.name === '2025 Blog Public')).toMatchObject({
      url: 'https://github.com/YYsuni/2025-blog-public',
      logo: 'YY',
      avatarSrc: '/images/recommended-shares/yysuni-2025-blog-public-avatar.jpg',
      avatarAlt: '2025 Blog Public GitHub 项目图标',
      tags: ['开源项目', '前端审美', '工程流程'],
      githubStars: 1576,
      stars: 4,
    });
    expect(recommendedShares.find((resource) => resource.name === 'Avoid AI Writing')).toMatchObject({
      url: 'https://github.com/conorbronsdon/avoid-ai-writing',
      logo: 'AW',
      description: '面向 AI 文本的结构化审校与改写 skill，识别模板化措辞、空泛拔高和过度结构化，并用二次检查保留更自然的表达。',
      tags: ['开源项目', 'AI Coding', '工程流程'],
      githubStars: 2360,
      stars: 4,
    });
    expect(recommendedShares.find((resource) => resource.name === 'LINUX DO')).toMatchObject({
      url: 'https://linux.do/',
      logo: 'LD',
      avatarSrc: '/images/recommended-shares/linux-do-logo.svg',
      avatarAlt: 'LINUX DO 网站图标',
      tags: ['技术社区', 'AI 学习', 'AI Coding'],
      stars: 5,
    });
    expect(recommendedShares.find((resource) => resource.name === 'Conductor')).toMatchObject({
      url: 'https://github.com/zhengzizhe/conductor',
      logo: 'CO',
      avatarSrc: '/images/recommended-shares/conductor-avatar.jpg',
      avatarAlt: 'Conductor GitHub 项目图标',
      tags: ['开源项目', 'AI Coding', '工程流程'],
      githubStars: 86,
      stars: 3,
    });
    expect(recommendedShares.find((resource) => resource.name === 'Meetily')).toMatchObject({
      url: 'https://github.com/Zackriya-Solutions/meetily',
      logo: 'ME',
      avatarSrc: '/images/recommended-shares/meetily-avatar.jpg',
      avatarAlt: 'Meetily GitHub 项目图标',
      tags: ['开源项目', 'AI 学习', 'AI Coding'],
      githubStars: 18223,
      stars: 5,
    });
    expect(recommendedShares.find((resource) => resource.name === 'Deep Research Skills')).toMatchObject({
      url: 'https://github.com/Weizhena/Deep-Research-skills',
      logo: 'DR',
      avatarSrc: '/images/recommended-shares/deep-research-skills-avatar.jpg',
      avatarAlt: 'Deep Research Skills GitHub 项目图标',
      tags: ['开源项目', 'AI Coding', 'AI 学习'],
      githubStars: 1528,
      stars: 4,
    });
    expect(recommendedShares.find((resource) => resource.name === 'Minutes')).toMatchObject({
      url: 'https://github.com/silverstein/minutes',
      logo: 'MI',
      description: '本地优先的开源对话记忆工具，把会议、语音备忘和承诺整理成可搜索的 Markdown，并通过 MCP 接入 Codex 等 AI Agent。',
      tags: ['开源项目', 'AI Coding', '工程流程'],
      githubStars: 1291,
      stars: 4,
    });
    expect(recommendedShares.find((resource) => resource.name === 'Learn Claude Code')).toMatchObject({
      url: 'https://github.com/shareAI-lab/learn-claude-code',
      logo: 'LC',
      avatarSrc: '/images/recommended-shares/learn-claude-code-avatar.jpg',
      avatarAlt: 'Learn Claude Code GitHub 项目图标',
      tags: ['开源项目', 'AI Coding', 'AI 学习'],
      githubStars: 70037,
      stars: 5,
    });
    expect(recommendedShares.find((resource) => resource.name === 'Matt Pocock Skills')).toMatchObject({
      url: 'https://github.com/mattpocock/skills/tree/main/skills/productivity/grill-me',
      logo: 'MP',
      avatarSrc: '/images/recommended-shares/mattpocock-skills-avatar.jpg',
      avatarAlt: 'Matt Pocock Skills GitHub 项目图标',
      tags: ['开源项目', 'AI Coding', '工程流程'],
      githubStars: 161732,
      stars: 5,
    });
    expect(data).toContain("name: 'Taste Skill'");
    expect(data).toContain("name: 'Learn Claude Code'");
    expect(data).toContain("name: 'Trellis'");
    expect(data).toContain("name: 'Superpowers'");
    expect(data).toContain("name: 'Deep Research Skills'");
    expect(data).toContain("name: 'Minutes'");
    expect(data).toContain("name: 'Matt Pocock Skills'");
    expect(data).toContain("name: 'Conductor'");
    expect(data).toContain("name: 'Meetily'");
    expect(data).toContain("name: '2025 Blog Public'");
    expect(data).toContain("name: 'Avoid AI Writing'");
    expect(data).toContain("name: 'LINUX DO'");
    expect(data).toContain("name: '小林面试笔记'");
    expect(data).not.toContain("name: 'iLoveIMG'");
    expect(data).not.toContain("name: 'TinyPNG'");
    expect(data).not.toContain("name: 'Magic UI'");
  });

  test('converts GitHub repository stars into recommendation tiers with a three-star floor', () => {
    expect(getRecommendedShareStars(10000)).toBe(5);
    expect(getRecommendedShareStars(9999)).toBe(4);
    expect(getRecommendedShareStars(1000)).toBe(4);
    expect(getRecommendedShareStars(999)).toBe(3);
    expect(getRecommendedShareStars(0)).toBe(3);
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
