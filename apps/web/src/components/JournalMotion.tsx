'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useReducedMotion } from 'framer-motion';
import { usePreviewPause } from '@/app/creative-preview/use-preview-motion';

export function JournalMotion() {
  const pathname = usePathname();
  const reduced = useReducedMotion();
  const [paused] = usePreviewPause();
  useEffect(() => {
    const main = document.querySelector<HTMLElement>('.journal-shell > main');
    if (!main) return;
    if (reduced || paused || !('IntersectionObserver' in window)) return;
    const targets = main.querySelectorAll<HTMLElement>('.content-card, .project-showcase-card, .posts-archive-item, .archive-month, .share-page__card');
    const animations: Animation[] = [];
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          // Do not mutate React-owned attributes before a streamed Suspense boundary hydrates.
          if (typeof entry.target.animate === 'function') animations.push(entry.target.animate(
            [{ opacity: .25, transform: 'translateY(18px)' }, { opacity: 1, transform: 'none' }],
            { duration: 650, easing: 'cubic-bezier(.2,.7,.2,1)' },
          ));
          observer.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -35px 0px', threshold: 0.05 });
    targets.forEach((target) => {
      if (target.getBoundingClientRect().top > window.innerHeight) observer.observe(target);
    });
    return () => { observer.disconnect(); animations.forEach((animation) => animation.cancel()); };
  }, [pathname, reduced, paused]);
  return null;
}
