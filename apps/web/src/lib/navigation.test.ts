import { describe, expect, test } from 'vitest';

import { buildAdminNavigation, buildPublicNavigation } from './navigation';

describe('public navigation helpers', () => {
  test('always keeps home and maps configured navigation keys', () => {
    expect(buildPublicNavigation(['posts', 'projects', 'series', 'tags', 'guestbook'])).toEqual([
      { href: '/', label: '首页' },
      { href: '/posts', label: '文章' },
      { href: '/projects', label: '项目' },
      { href: '/series', label: '专题' },
      { href: '/tags', label: '标签' },
      { href: '/guestbook', label: '留言' },
    ]);
  });

  test('ignores unknown duplicate and blank navigation keys', () => {
    expect(buildPublicNavigation([' posts ', 'unknown', 'posts', '', 'search', 'about'])).toEqual([
      { href: '/', label: '首页' },
      { href: '/posts', label: '文章' },
      { href: '/search', label: '搜索' },
      { href: '/about', label: '关于' },
    ]);
  });
});

describe('admin navigation helpers', () => {
  test('includes project management alongside core admin sections', () => {
    expect(buildAdminNavigation()).toEqual([
      { href: '/admin', label: '概览' },
      { href: '/admin/content', label: '内容管理' },
      { href: '/admin/projects', label: '项目管理' },
      { href: '/admin/content/new', label: '新建内容' },
      { href: '/admin/comments', label: '评论管理' },
      { href: '/admin/guestbook', label: '留言审核' },
      { href: '/admin/taxonomy', label: '分类标签' },
      { href: '/admin/assets', label: '素材管理' },
      { href: '/admin/export', label: '导入导出' },
      { href: '/admin/settings', label: '站点设置' },
    ]);
  });
});
