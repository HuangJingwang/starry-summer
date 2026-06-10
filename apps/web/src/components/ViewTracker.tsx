'use client';

import { useEffect } from 'react';
import type { ContentType } from '@starry-summer/shared';

import { buildViewRequest } from '@/lib/interaction-client';

export function ViewTracker({ targetType, targetId }: { targetType: ContentType; targetId: string }) {
  useEffect(() => {
    const request = buildViewRequest(targetType, targetId);

    void fetch(request.url, request.init).catch(() => undefined);
  }, [targetType, targetId]);

  return null;
}
