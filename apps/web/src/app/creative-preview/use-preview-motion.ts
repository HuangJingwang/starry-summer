'use client';

import { useMotionValue, type MotionValue } from 'framer-motion';
import { useEffect, useState } from 'react';

const pauseKey = 'starry-summer-preview-paused';
const pauseEvent = 'starry-summer-motion-change';

export function usePreviewPause() {
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    function sync(event?: Event) {
      let value = document.documentElement.dataset.motionPaused === 'true';
      if (event instanceof CustomEvent) value = event.detail === true;
      else try { value = sessionStorage.getItem(pauseKey) === 'true'; } catch { /* Storage is optional. */ }
      document.documentElement.dataset.motionPaused = String(value);
      setPaused(value);
    }
    sync();
    window.addEventListener(pauseEvent, sync);
    return () => window.removeEventListener(pauseEvent, sync);
  }, []);

  function toggle() {
    const next = !paused;
    setPaused(next);
    try { sessionStorage.setItem(pauseKey, String(next)); } catch { /* Keep the control usable without storage. */ }
    window.dispatchEvent(new CustomEvent(pauseEvent, { detail: next }));
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
