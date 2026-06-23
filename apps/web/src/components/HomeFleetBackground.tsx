'use client';

import { useEffect } from 'react';

import { getRandomHomeFleetDelaySeconds } from './home-fleet-delay';

export function HomeFleetBackground() {
  useEffect(() => {
    const delaySeconds = getRandomHomeFleetDelaySeconds();

    document.documentElement.style.setProperty('--home-fleet-delay', `${delaySeconds}s`);

    return () => {
      document.documentElement.style.removeProperty('--home-fleet-delay');
    };
  }, []);

  return (
    <img
      className="portfolio-hero__fleet-background"
      src="/images/fleet-flagship/ship-render-side.png"
      alt=""
      aria-hidden="true"
    />
  );
}
