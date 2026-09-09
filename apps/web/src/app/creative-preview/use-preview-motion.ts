'use client';

import { useMotionValue, type MotionValue } from 'framer-motion';
import { useEffect, useState } from 'react';

const pauseKey = 'starry-summer-preview-paused';

export function usePreviewPause() {
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    try { setPaused(sessionStorage.getItem(pauseKey) === 'true'); } catch { /* Storage is optional. */ }
  }, []);

  function toggle() {
    const next = !paused;
    setPaused(next);
    try { sessionStorage.setItem(pauseKey, String(next)); } catch { /* Keep the control usable without storage. */ }
  }
  return [paused, toggle] as const;
}

// Preserve the current pose while paused; removing a transform resets it to its origin.
export function usePausableValue<T extends number | string>(source: MotionValue<T>, paused: boolean) {
  const value = useMotionValue(source.get());
  useEffect(() => {
    if (paused) return;
    value.set(source.get());
    return source.on('change', (next) => value.set(next));
  }, [source, value, paused]);
  return value;
}
