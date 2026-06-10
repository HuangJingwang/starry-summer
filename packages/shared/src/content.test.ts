import { describe, expect, test } from 'vitest';

import { canPublishContent, isPublicContent, isValidSlug } from './content';

describe('content visibility and publishing rules', () => {
  test('published public content is visible to readers', () => {
    expect(isPublicContent({ status: 'published', visibility: 'public' })).toBe(true);
  });

  test('draft content is not visible to readers', () => {
    expect(isPublicContent({ status: 'draft', visibility: 'public' })).toBe(false);
  });

  test('private content is not visible to readers even when published', () => {
    expect(isPublicContent({ status: 'published', visibility: 'private' })).toBe(false);
  });

  test('valid slugs use lowercase letters numbers and hyphens', () => {
    expect(isValidSlug('my-first-post-2026')).toBe(true);
    expect(isValidSlug('My First Post')).toBe(false);
    expect(isValidSlug('hello_world')).toBe(false);
  });

  test('content needs title slug and markdown body before publish', () => {
    expect(canPublishContent({ title: 'Hello', slug: 'hello', bodyMarkdown: '# Hello' })).toBe(true);
    expect(canPublishContent({ title: 'Hello', slug: 'bad slug', bodyMarkdown: '# Hello' })).toBe(false);
    expect(canPublishContent({ title: 'Hello', slug: 'hello', bodyMarkdown: '' })).toBe(false);
  });
});
