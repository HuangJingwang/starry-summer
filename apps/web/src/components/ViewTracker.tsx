'use client';

import { useEffect } from 'react';
import type { ContentType } from '@starry-summer/shared';

import { buildDedupedViewRequest } from '@/lib/interaction-client';

const seenViews = new Set<string>();

export function ViewTracker({ targetType, targetId }: { targetType: ContentType; targetId: string }) {
  useEffect(() => {
    const request = buildDedupedViewRequest(targetType, targetId, seenViews);

    if (!request) {
      return;
    }

    void fetch(request.url, request.init).catch(() => undefined);
  }, [targetType, targetId]);

  return null;
}
