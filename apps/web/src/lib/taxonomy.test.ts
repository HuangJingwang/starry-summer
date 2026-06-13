import { describe, expect, test } from 'vitest';

import {
  buildCreateTaxonomyTermRequest,
  buildDeleteTaxonomyTermRequest,
  buildListTaxonomyTermsRequest,
  buildTaxonomyPayloadFromFormData,
  buildUpdateTaxonomyTermRequest,
  groupTaxonomyTermsByType,
  normalizeTaxonomyTerm,
  readTaxonomyErrorMessage,
} from './taxonomy';

describe('taxonomy client helpers', () => {
  test('builds taxonomy list request', () => {
    expect(buildListTaxonomyTermsRequest('category')).toEqual({
      url: '/api/admin/taxonomy/category',
      init: {
        method: 'GET',
        credentials: 'include',
      },
    });
  });

  test('builds normalized create and update requests', () => {
    const payload = {
      name: ' Long Form ',
      slug: 'Long Form',
      description: ' Essays ',
      sortOrder: 2,
      parentId: 'category-parent',
    };

    const createRequest = buildCreateTaxonomyTermRequest('category', payload);

    expect(createRequest).toEqual({
      url: '/api/admin/taxonomy/category',
      init: {
        method: 'POST',
        credentials: 'include',
        headers: {
          'content-type': 'application/json',
        },
        body: expect.any(String),
      },
    });
    expect(JSON.parse(String(createRequest.init.body))).toEqual({
      name: 'Long Form',
      slug: 'long-form',
      description: 'Essays',
      sortOrder: 2,
      parentId: 'category-parent',
    });
    expect(buildUpdateTaxonomyTermRequest('series', 'term-1', payload).url).toBe('/api/admin/taxonomy/series/term-1');
  });

  test('builds delete requests', () => {
    expect(buildDeleteTaxonomyTermRequest('category', 'term-1')).toEqual({
      url: '/api/admin/taxonomy/category/term-1',
      init: {
        method: 'DELETE',
        credentials: 'include',
      },
    });
  });

  test('reads taxonomy API JSON error messages', async () => {
    const response = new Response(JSON.stringify({ message: 'Slug 已存在' }), {
      status: 409,
      headers: { 'content-type': 'application/json' },
    });

    await expect(readTaxonomyErrorMessage(response, '保存失败')).resolves.toBe('Slug 已存在');
  });

  test('joins taxonomy API validation error arrays', async () => {
    const response = new Response(JSON.stringify({ message: ['名称不能为空', 'Slug 格式不正确'] }), {
      status: 400,
      headers: { 'content-type': 'application/json; charset=utf-8' },
    });

    await expect(readTaxonomyErrorMessage(response, '保存失败')).resolves.toBe('名称不能为空；Slug 格式不正确');
  });

  test('falls back when taxonomy API error body is empty', async () => {
    const response = new Response('', { status: 500 });

    await expect(readTaxonomyErrorMessage(response, '请求失败')).resolves.toBe('请求失败');
  });

  test('reads taxonomy form data', () => {
    const formData = new FormData();
    formData.set('name', ' Tech Notes ');
    formData.set('slug', 'Tech Notes');
    formData.set('description', ' Notes about code ');
    formData.set('sortOrder', '7');
    formData.set('parentId', ' category-parent ');

    expect(buildTaxonomyPayloadFromFormData(formData)).toEqual({
      name: 'Tech Notes',
      slug: 'tech-notes',
      description: 'Notes about code',
      sortOrder: 7,
      parentId: 'category-parent',
    });
  });

  test('normalizes taxonomy terms from API data', () => {
    expect(
      normalizeTaxonomyTerm({
        id: 'term-1',
        type: 'tag',
        name: 'Markdown',
        slug: 'markdown',
        description: null,
        parentId: 'parent-1',
        sortOrder: undefined,
        createdAt: '2026-06-10T00:00:00.000Z',
        updatedAt: '2026-06-10T00:00:00.000Z',
      }),
    ).toEqual({
      id: 'term-1',
      type: 'tag',
      name: 'Markdown',
      slug: 'markdown',
      description: '',
      parentId: 'parent-1',
      sortOrder: 0,
      createdAt: '2026-06-10T00:00:00.000Z',
      updatedAt: '2026-06-10T00:00:00.000Z',
    });
  });

  test('groups taxonomy terms by type', () => {
    expect(
      groupTaxonomyTermsByType([
        { id: '1', type: 'tag', name: 'Markdown', slug: 'markdown', description: '', sortOrder: 0, createdAt: '', updatedAt: '' },
        { id: '2', type: 'category', name: 'Writing', slug: 'writing', description: '', sortOrder: 0, createdAt: '', updatedAt: '' },
      ]),
    ).toEqual({
      category: [expect.objectContaining({ id: '2' })],
      tag: [expect.objectContaining({ id: '1' })],
      series: [],
    });
  });
});
