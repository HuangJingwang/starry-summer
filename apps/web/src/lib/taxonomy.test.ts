import { describe, expect, test } from 'vitest';

import {
  buildCreateTaxonomyTermRequest,
  buildDeleteTaxonomyTermRequest,
  buildListTaxonomyTermsRequest,
  buildTaxonomyPayloadFromFormData,
  buildUpdateTaxonomyTermRequest,
  groupTaxonomyTermsByType,
  normalizeTaxonomyTerm,
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
