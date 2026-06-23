'use client';

import { useEffect, useState } from 'react';

import { getRandomHomeFleetDelaySeconds } from './home-fleet-delay';

type SiteTheme = 'summer-day' | 'summer-night';

function getTheme(): SiteTheme {
  return document.documentElement.dataset.theme === 'summer-day' ? 'summer-day' : 'summer-night';
}

export function HomeFleetBackground() {
  const [theme, setTheme] = useState<SiteTheme | null>(null);

  useEffect(() => {
    const delaySeconds = getRandomHomeFleetDelaySeconds();

    document.documentElement.style.setProperty('--home-fleet-delay', `${delaySeconds}s`);

    return () => {
      document.documentElement.style.removeProperty('--home-fleet-delay');
    };
  }, []);

  useEffect(() => {
    setTheme(getTheme());

    const themeObserver = new MutationObserver(() => {
      setTheme(getTheme());
    });

    themeObserver.observe(document.documentElement, { attributeFilter: ['data-theme'], attributes: true });

    return () => {
      themeObserver.disconnect();
    };
  }, []);

  if (theme !== 'summer-night') {
    return null;
  }

  return (
    <img
      className="portfolio-hero__fleet-background"
      src="/images/fleet-flagship/ship-render-side.png"
      alt=""
      aria-hidden="true"
    />
  );
}
