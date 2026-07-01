'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';

import { getHomeGreeting } from '@/lib/home-greeting';

type HomeIntroCardProps = {
  ownerName: string;
};

export function HomeIntroCard({ ownerName }: HomeIntroCardProps) {
  const [greeting, setGreeting] = useState(() => getHomeGreeting());

  useEffect(() => {
    function syncGreeting() {
      setGreeting(getHomeGreeting());
    }

    syncGreeting();
    const timer = window.setInterval(syncGreeting, 60 * 1000);

    return () => window.clearInterval(timer);
  }, []);

  return (
    <div className="portfolio-hero__intro-card">
      <div className="portfolio-hero__hi-avatar" aria-hidden="true">
        <Image
          className="portfolio-hero__hi-avatar-image"
          src="/images/aster-day-profile.png"
          alt=""
          width={1254}
          height={1254}
          priority
        />
      </div>
      <h1 className="portfolio-hero__hi-greeting">
        <span className="portfolio-hero__hi-line" suppressHydrationWarning>
          {greeting}
        </span>
        <span className="portfolio-hero__hi-line">
          I&apos;m <strong className="portfolio-hero__hi-name">{ownerName}</strong>,
        </span>
        <span className="portfolio-hero__hi-line portfolio-hero__hi-line--meet">Nice to meet you!</span>
      </h1>
    </div>
  );
}
