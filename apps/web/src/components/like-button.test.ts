import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, test } from 'vitest';

describe('LikeButton', () => {
  test('uses persistent seen interaction storage before sending a like', () => {
    const source = readFileSync(join(process.cwd(), 'src/components/LikeButton.tsx'), 'utf8');

    expect(source).toContain('createPersistentInteractionSeenStore(seenLikes)');
    expect(source).toContain('buildDedupedLikeRequest(targetType, targetId, createPersistentInteractionSeenStore(seenLikes))');
  });

  test('announces like feedback and handles an unconfigured interaction Worker', () => {
    const source = readFileSync(join(process.cwd(), 'src/components/LikeButton.tsx'), 'utf8');

    expect(source).toContain("const [liked, setLiked]");
    expect(source).toContain("import { Heart } from 'lucide-react';");
    expect(source).toContain('className="like-button__count"');
    expect(source).toContain('<Heart className="like-button__icon"');
    expect(source).toContain('size={28}');
    expect(source).toContain('strokeWidth={0}');
    expect(source).toContain('fill="currentColor"');
    expect(source).toContain("aria-label={`${pending ? '保存中' : liked ? '已喜欢' : '喜欢'}，当前 ${count} 次`}");
    expect(source).not.toContain("{pending ? '保存中' : liked ? '已喜欢' : '喜欢'} / {count}");
    expect(source).toContain("const [message, setMessage]");
    expect(source).toContain("setMessage('互动服务未配置，暂时不能记录喜欢。')");
    expect(source).toContain("setMessage('已记录喜欢。')");
    expect(source).toContain('aria-pressed={liked}');
    expect(source).toContain('aria-live="polite"');
    expect(source).toContain('like-button__message');
  });
});
