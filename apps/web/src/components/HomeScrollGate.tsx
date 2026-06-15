'use client';

import { useEffect } from 'react';

const homeSelector = '.portfolio-home';
const homeAnchorSelector = 'a[href="#writing"], a[href="#work"], a[href="/#writing"], a[href="/#work"]';
const topLinkSelector = 'a[href="#top"], a[href="/#top"]';

function setHomeScrollLock(isLocked: boolean) {
  const home = document.querySelector<HTMLElement>(homeSelector);

  if (home) {
    home.dataset.scrollLocked = String(isLocked);
  }
}

function isHomeScrollLocked() {
  const home = document.querySelector<HTMLElement>(homeSelector);

  return home?.dataset.scrollLocked === 'true';
}

function scrollToTop() {
  if (!isHomeScrollLocked() || window.scrollY > 8) {
    setHomeScrollLock(false);
  }

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function scrollToSection(targetId: string) {
  const target = document.getElementById(targetId);

  if (!target) {
    return;
  }

  setHomeScrollLock(false);

  const header = document.querySelector<HTMLElement>('.site-header');
  const headerOffset = header?.getBoundingClientRect().height ?? 0;
  const top = target.getBoundingClientRect().top + window.scrollY - headerOffset + 1;

  target.dataset.anchorActive = 'true';
  window.setTimeout(() => {
    delete target.dataset.anchorActive;
  }, 900);

  window.scrollTo({ top, behavior: 'smooth' });
}

export function HomeScrollGate({ targetId }: { targetId: string }) {
  useEffect(() => {
    setHomeScrollLock(true);

    function handleHashChange() {
      if (window.location.hash === '#top') {
        scrollToTop();
      }
    }

    function handleTopLinkClick(event: MouseEvent) {
      const target = event.target instanceof Element ? event.target.closest<HTMLAnchorElement>(topLinkSelector) : null;

      if (target) {
        window.requestAnimationFrame(scrollToTop);
      }
    }

    function handleHomeAnchorClick(event: MouseEvent) {
      const target =
        event.target instanceof Element ? event.target.closest<HTMLAnchorElement>(homeAnchorSelector) : null;

      if (!target) {
        return;
      }

      const url = new URL(target.href);

      if (url.pathname !== window.location.pathname && url.pathname !== '/') {
        return;
      }

      const targetId = url.hash.slice(1);

      if (!targetId) {
        return;
      }

      event.preventDefault();
      window.history.pushState(null, '', `#${targetId}`);
      scrollToSection(targetId);
    }

    window.addEventListener('hashchange', handleHashChange);
    document.addEventListener('click', handleTopLinkClick);
    document.addEventListener('click', handleHomeAnchorClick);

    return () => {
      window.removeEventListener('hashchange', handleHashChange);
      document.removeEventListener('click', handleTopLinkClick);
      document.removeEventListener('click', handleHomeAnchorClick);
      setHomeScrollLock(false);
    };
  }, []);

  function enterHomeContent() {
    scrollToSection(targetId);
  }

  return (
    <button className="portfolio-hero__scroll" type="button" aria-label="进入下方内容" onClick={enterHomeContent}>
      <span className="portfolio-hero__scroll-orb" aria-hidden="true">
        <span className="portfolio-hero__scroll-star" />
      </span>
      <span className="portfolio-hero__scroll-tide" aria-hidden="true">
        <svg className="portfolio-hero__wave-svg" viewBox="0 0 1440 160" preserveAspectRatio="none" focusable="false">
          <defs>
            <path
              id="home-scroll-wave"
              d="M0 82 C 90 36 180 128 270 82 S 450 36 540 82 S 720 128 810 82 S 990 36 1080 82 S 1260 128 1350 82 S 1530 36 1620 82 S 1710 128 1800 82 V160 H0 Z"
            />
            <path
              id="home-scroll-foam"
              d="M0 80 C 92 52 178 108 270 80 S 448 52 540 80 S 718 108 810 80 S 988 52 1080 80 S 1258 108 1350 80 S 1528 52 1620 80 S 1708 108 1800 80"
            />
            <path
              id="home-scroll-swash"
              d="M0 104 C 130 66 230 88 360 68 C 505 46 650 102 800 78 C 965 52 1110 64 1260 88 C 1410 112 1585 74 1800 92 V160 H0 Z"
            />
            <path
              id="home-scroll-lace"
              d="M0 92 C 150 64 252 112 382 82 C 512 52 632 98 760 78 C 908 55 1052 73 1198 96 C 1368 123 1542 76 1800 88"
            />
          </defs>
          <g className="portfolio-hero__wave-layer portfolio-hero__wave-layer--back">
            <use href="#home-scroll-wave" x="-120" y="26" />
          </g>
          <g className="portfolio-hero__wave-layer portfolio-hero__wave-layer--mid">
            <use href="#home-scroll-wave" x="-160" y="42" />
          </g>
          <g className="portfolio-hero__wave-layer portfolio-hero__wave-layer--wash">
            <use href="#home-scroll-swash" x="-180" y="4" />
          </g>
          <g className="portfolio-hero__wave-layer portfolio-hero__wave-layer--front">
            <use href="#home-scroll-wave" x="-180" y="58" />
          </g>
          <g className="portfolio-hero__wave-layer portfolio-hero__wave-layer--foam">
            <use href="#home-scroll-foam" x="-120" y="43" />
          </g>
          <g className="portfolio-hero__wave-layer portfolio-hero__wave-layer--lace">
            <use href="#home-scroll-lace" x="-180" y="20" />
          </g>
        </svg>
        <span className="portfolio-hero__shore-surge portfolio-hero__shore-surge--wash" />
        <span className="portfolio-hero__shore-surge portfolio-hero__shore-surge--foam" />
      </span>
      <span className="portfolio-hero__scroll-label" aria-hidden="true">
        <span className="portfolio-hero__scroll-arrow portfolio-hero__scroll-arrow--one" />
        <span className="portfolio-hero__scroll-arrow portfolio-hero__scroll-arrow--two" />
        <span className="portfolio-hero__scroll-arrow portfolio-hero__scroll-arrow--three" />
      </span>
    </button>
  );
}
