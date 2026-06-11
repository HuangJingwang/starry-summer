'use client';

import { useEffect, useState } from 'react';

export interface HomeHeroBackgroundItem {
  url: string;
  alt: string;
}

export function HomeHeroBackground({ backgrounds }: { backgrounds: HomeHeroBackgroundItem[] }) {
  const validBackgrounds = backgrounds.filter((item) => item.url.trim().length > 0);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (validBackgrounds.length <= 1) {
      return undefined;
    }

    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % validBackgrounds.length);
    }, 7000);

    return () => window.clearInterval(timer);
  }, [validBackgrounds.length]);

  if (validBackgrounds.length === 0) {
    return null;
  }

  return (
    <div className="hero__background" role="img" aria-label={validBackgrounds[activeIndex]?.alt || '首页背景图'}>
      {validBackgrounds.map((item, index) => (
        <div
          key={`${item.url}-${index}`}
          className={`hero__image${index === activeIndex ? ' is-active' : ''}`}
          style={{ backgroundImage: `url("${item.url}")` }}
        />
      ))}
    </div>
  );
}
