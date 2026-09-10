'use client';

import { motion, useReducedMotion, useScroll, useSpring, useTransform } from 'framer-motion';
import { useRef, type ReactNode } from 'react';

// Progressive enhancement: content is never hidden before hydration or without JavaScript.
export function ReaderReveal({ children, className = '', index = 0, as = 'div' }: {
  children: ReactNode; className?: string; index?: number; as?: 'div' | 'li';
}) {
  const reduced = useReducedMotion();
  const Element = as === 'li' ? motion.li : motion.div;
  return <Element className={`reader-reveal ${className}`} initial={reduced ? false : { y: 28 }}
    whileInView={reduced ? undefined : { y: 0 }} viewport={{ once: true, amount: .12 }}
    transition={{ duration: .6, delay: Math.min(index * .07, .21), ease: [.2, .75, .2, 1] }}>
    {children}
  </Element>;
}

export function AboutPortraitMotion({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const offset = useTransform(scrollYProgress, [0, 1], [18, -18]);
  const y = useSpring(offset, { stiffness: 90, damping: 24 });
  return <motion.div ref={ref} className="about-portrait-motion" style={reduced ? undefined : { y }}>{children}</motion.div>;
}
