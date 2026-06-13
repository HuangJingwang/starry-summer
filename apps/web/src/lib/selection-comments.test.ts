import { describe, expect, test } from 'vitest';

import {
  createInlineCommentAnchor,
  findAnchorRange,
  hasCommentAnchor,
  splitAnchoredComments,
} from './selection-comments';

describe('selection comment helpers', () => {
  test('creates stable anchors from selected article text', () => {
    const anchor = createInlineCommentAnchor('Before selected passage after', 7, 23);

    expect(anchor).toEqual({
      text: 'selected passage',
      prefix: 'Before',
      suffix: 'after',
      start: 7,
      end: 23,
      hash: expect.stringMatching(/^[a-f0-9]{64}$/),
    });
  });

  test('finds anchors by exact offsets first', () => {
    const anchor = createInlineCommentAnchor('Before selected passage after', 7, 23);

    expect(findAnchorRange('Before selected passage after', anchor)).toEqual({
      start: 7,
      end: 23,
      mapped: true,
    });
  });

  test('falls back to selected text and context after small edits', () => {
    const anchor = createInlineCommentAnchor('Before selected passage after', 7, 23);

    expect(findAnchorRange('Intro. Before selected passage after.', anchor)).toEqual({
      start: 14,
      end: 30,
      mapped: true,
    });
  });

  test('returns an unmapped state when the selected text no longer exists', () => {
    const anchor = createInlineCommentAnchor('Before selected passage after', 7, 23);

    expect(findAnchorRange('The article was rewritten.', anchor)).toEqual({
      start: -1,
      end: -1,
      mapped: false,
    });
  });

  test('splits anchored and regular comments', () => {
    const anchored = {
      id: 'comment-1',
      anchor: createInlineCommentAnchor('Before selected passage after', 7, 23),
    };
    const regular = { id: 'comment-2' };

    expect(hasCommentAnchor(anchored)).toBe(true);
    expect(hasCommentAnchor(regular)).toBe(false);
    expect(splitAnchoredComments([anchored, regular])).toEqual({
      anchored: [anchored],
      regular: [regular],
    });
  });
});
