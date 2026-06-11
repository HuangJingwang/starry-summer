import { describe, expect, test } from 'vitest';

import { PUBLIC_SUBMISSION_LIMITS, isVisibleSubmission } from './interactions';

describe('interaction contracts', () => {
  test('defines public submission field limits shared by API and web clients', () => {
    expect(PUBLIC_SUBMISSION_LIMITS).toEqual({
      authorName: 80,
      body: 2000,
    });
  });

  test('only approved submissions are publicly visible', () => {
    expect(isVisibleSubmission({ status: 'approved', createdAt: '2026-06-10T00:00:00.000Z' })).toBe(true);
    expect(isVisibleSubmission({ status: 'pending', createdAt: '2026-06-10T00:00:00.000Z' })).toBe(false);
  });
});
