'use client';

import { useState } from 'react';
import type { ContentType } from '@starry-summer/shared';

import { buildDedupedLikeRequest } from '@/lib/interaction-client';

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
  const [pending, setPending] = useState(false);

  async function like() {
    const request = buildDedupedLikeRequest(targetType, targetId, seenLikes);

    if (!request) {
      return;
    }

    setPending(true);

    try {
      const response = await fetch(request.url, request.init);
      const nextCount = Number(await response.text());
      setCount(Number.isFinite(nextCount) && nextCount > 0 ? nextCount : count + 1);
    } catch {
      setCount((value) => value + 1);
    } finally {
      setPending(false);
    }
  }

  return (
    <button className="like-button" type="button" onClick={like} disabled={pending}>
      {pending ? 'Saving' : 'Like'} · {count}
    </button>
  );
}
