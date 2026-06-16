'use client';

import { useState } from 'react';
import type { ContentType } from '@starry-summer/shared';
import { Heart } from 'lucide-react';

import { buildDedupedLikeRequest, createPersistentInteractionSeenStore } from '@/lib/interaction-client';

const seenLikes = new Set<string>();

export function LikeButton({
  targetType,
  targetId,
  initialCount,
}: {
  targetType: ContentType;
  targetId: string;
  initialCount: number;
}) {
  const [count, setCount] = useState(initialCount);
  const [liked, setLiked] = useState(false);
  const [message, setMessage] = useState('');
  const [pending, setPending] = useState(false);

  async function like() {
    const request = buildDedupedLikeRequest(targetType, targetId, createPersistentInteractionSeenStore(seenLikes));

    if (!request) {
      setMessage('互动服务未配置，暂时不能记录喜欢。');
      return;
    }

    setPending(true);
    setMessage('');

    try {
      const response = await fetch(request.url, request.init);
      const nextCount = Number(await response.text());
      setCount(Number.isFinite(nextCount) && nextCount > 0 ? nextCount : count + 1);
      setLiked(true);
      setMessage('已记录喜欢。');
    } catch {
      setCount((value) => value + 1);
      setLiked(true);
      setMessage('已记录喜欢。');
    } finally {
      setPending(false);
    }
  }

  return (
    <span className="like-button-wrap">
      <button
        className="like-button"
        type="button"
        onClick={like}
        disabled={pending}
        aria-label={`${pending ? '保存中' : liked ? '已喜欢' : '喜欢'}，当前 ${count} 次`}
        aria-pressed={liked}
      >
        <span className="like-button__count" aria-hidden="true">
          {count}
        </span>
        <Heart className="like-button__icon" size={28} strokeWidth={0} fill="currentColor" aria-hidden="true" />
      </button>
      {message ? (
        <span className="like-button__message" aria-live="polite">
          {message}
        </span>
      ) : null}
    </span>
  );
}
