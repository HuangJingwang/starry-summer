import { describe, expect, test } from 'vitest';

import {
  buildCreateTaxonomyTermRequest,
  buildDeleteTaxonomyTermRequest,
  buildListTaxonomyTermsRequest,
  buildTaxonomyPayloadFromFormData,
  buildUpdateTaxonomyTermRequest,
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
    };

    expect(buildCreateTaxonomyTermRequest('tag', payload)).toEqual({
      url: '/api/admin/taxonomy/tag',
      init: {
        method: 'POST',
        credentials: 'include',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          name: 'Long Form',
          slug: 'long-form',
          description: 'Essays',
          sortOrder: 2,
        }),
      },
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

    expect(buildTaxonomyPayloadFromFormData(formData)).toEqual({
      name: 'Tech Notes',
      slug: 'tech-notes',
      description: 'Notes about code',
      sortOrder: 7,
    });
  });
});
