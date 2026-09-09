'use client';

import { useEffect, useRef } from 'react';

import styles from './creative-preview.module.css';

export function OrbitalScene({ paused }: { paused: boolean }) {
  const host = useRef<HTMLDivElement>(null);
  const controls = useRef<Awaited<ReturnType<typeof import('./orbital-renderer').createOrbitalScene>> | null>(null);
  const pausedRef = useRef(paused);

  useEffect(() => {
    pausedRef.current = paused;
    controls.current?.setPaused(paused);
  }, [paused]);

  useEffect(() => {
    let alive = true;
    const element = host.current;
    if (!element) return;

    void import('./orbital-renderer').then(({ createOrbitalScene }) => {
      if (!alive) return;
      try {
        controls.current = createOrbitalScene(element);
        controls.current.setPaused(pausedRef.current);
      } catch {
        // The CSS sculpture remains visible when WebGL is unavailable.
        element.dataset.ready = 'false';
      }
    }).catch(() => { element.dataset.ready = 'false'; });

    return () => { alive = false; controls.current?.destroy(); controls.current = null; };
  }, []);

  return <div aria-hidden="true" className={styles.scene} ref={host}>
    <div className={styles.sceneFallback}><span /><i /><b>✦</b></div>
  </div>;
}
