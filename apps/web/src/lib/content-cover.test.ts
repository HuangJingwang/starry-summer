import { describe, expect, test } from 'vitest';

import { DEFAULT_POST_COVER, getContentCover } from './content-cover';

describe('content cover helpers', () => {
  test('uses the explicit cover before defaulting', () => {
    expect(
      getContentCover({
        type: 'post',
        title: '文章',
        coverImageUrl: ' /uploads/custom.png ',
        coverAltText: ' 自定义封面 ',
      }),
    ).toEqual({
      imageUrl: '/uploads/custom.png',
      altText: '自定义封面',
      isDefault: false,
    });
  });

  test('uses the generated default cover for posts without a cover', () => {
    expect(
      getContentCover({
        type: 'post',
        title: '没有封面的文章',
      }),
    ).toEqual({
      ...DEFAULT_POST_COVER,
      altText: '没有封面的文章 默认文章封面',
    });
  });

  test('does not add default article covers to non-post content', () => {
    expect(getContentCover({ type: 'note', title: '笔记' })).toBeNull();
    expect(getContentCover({ type: 'project', title: '项目' })).toBeNull();
  });
});
