import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, test } from 'vitest';

describe('inline comment layer source integration', () => {
  test('implements a selectable inline comment rail and submission flow', () => {
    const source = readFileSync(join(process.cwd(), 'src/components/InlineCommentLayer.tsx'), 'utf8');

    expect(source).toContain('buildCommentRequest');
    expect(source).toContain('createInlineCommentAnchor');
    expect(source).toContain('className="inline-comment-rail"');
    expect(source).toContain('inline-comment-highlight');
    expect(source).toContain('inline-comment-drawer');
    expect(source).toContain('原文已变更');
  });

  test('mounts inline comments from content detail', () => {
    const source = readFileSync(join(process.cwd(), 'src/components/ContentDetail.tsx'), 'utf8');

    expect(source).toContain('InlineCommentLayer');
    expect(source).toContain('splitAnchoredComments');
    expect(source).toContain('anchoredComments');
    expect(source).toContain('regularComments');
  });

  test('shows selected passage context in moderation cards', () => {
    const source = readFileSync(join(process.cwd(), 'src/components/ModerationManager.tsx'), 'utf8');

    expect(source).toContain('moderation-anchor');
    expect(source).toContain('record.anchor.text');
  });
});
