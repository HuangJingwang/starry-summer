'use client';

import { useEffect, useState } from 'react';

export function MobileBackToTop() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    function updateVisibility() {
      setIsVisible(window.scrollY > 160);
    }

    updateVisibility();
    window.addEventListener('scroll', updateVisibility, { passive: true });

    return () => window.removeEventListener('scroll', updateVisibility);
  }, []);

  function returnToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  return (
    <button
      type="button"
      className="mobile-back-to-top"
      data-visible={isVisible ? 'true' : undefined}
      aria-label="回到顶部"
      onClick={returnToTop}
    >
      <span className="mobile-back-to-top__icon" aria-hidden="true" />
    </button>
  );
}
