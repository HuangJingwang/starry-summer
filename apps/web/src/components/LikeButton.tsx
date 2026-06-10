'use client';

import { useState } from 'react';
import type { ContentType } from '@starry-summer/shared';

import { buildLikeRequest } from '@/lib/interaction-client';

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
    setPending(true);
    const request = buildLikeRequest(targetType, targetId);

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
