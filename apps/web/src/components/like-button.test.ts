import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, test } from 'vitest';

describe('LikeButton', () => {
  test('uses persistent seen interaction storage before sending a like', () => {
    const source = readFileSync(join(process.cwd(), 'src/components/LikeButton.tsx'), 'utf8');

    expect(source).toContain('createPersistentInteractionSeenStore(seenLikes)');
    expect(source).toContain('buildDedupedLikeRequest(targetType, targetId, createPersistentInteractionSeenStore(seenLikes))');
  });

  test('announces like feedback and makes repeated likes understandable', () => {
    const source = readFileSync(join(process.cwd(), 'src/components/LikeButton.tsx'), 'utf8');

    expect(source).toContain("const [liked, setLiked]");
    expect(source).toContain("const [message, setMessage]");
    expect(source).toContain("setMessage('已经记录过喜欢。')");
    expect(source).toContain("setMessage('已记录喜欢。')");
    expect(source).toContain('aria-pressed={liked}');
    expect(source).toContain('aria-live="polite"');
    expect(source).toContain('like-button__message');
  });
});
