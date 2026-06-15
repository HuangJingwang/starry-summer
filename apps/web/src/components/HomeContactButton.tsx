'use client';

import { useRouter } from 'next/navigation';
import type { ReactNode } from 'react';
import { useEffect, useRef, useState } from 'react';

type HomeContactButtonProps = {
  ariaLabel: string;
  children: ReactNode;
  className: string;
  href: string;
};

export function HomeContactButton({ ariaLabel, children, className, href }: HomeContactButtonProps) {
  const router = useRouter();
  const [clicked, setClicked] = useState(false);
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <a
      aria-label={ariaLabel}
      className={className}
      data-clicked={clicked ? 'true' : undefined}
      href={href}
      onClick={(event) => {
        if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) {
          return;
        }

        event.preventDefault();
        setClicked(true);
        timeoutRef.current = window.setTimeout(() => {
          router.push(href);
        }, 220);
      }}
    >
      {children}
    </a>
  );
}
