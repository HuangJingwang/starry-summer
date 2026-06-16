'use client';

import { ArrowUp } from 'lucide-react';
import { useEffect, useState } from 'react';

export function MobileBackToTop() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    function updateVisibility() {
      setIsVisible(window.scrollY > 24);
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
      <ArrowUp size={20} strokeWidth={2.4} aria-hidden="true" />
    </button>
  );
}
