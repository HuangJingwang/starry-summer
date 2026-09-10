'use client';
import Link from 'next/link';
import { BookOpenText, FolderGit2, House, LibraryBig, Search, type LucideIcon } from 'lucide-react';
import { motion, useMotionValue, useReducedMotion, useSpring, useTransform, type MotionValue } from 'framer-motion';
import { useRef } from 'react';

const destinations = [
  { href: '/', label: '首页', icon: House },
  { href: '/posts', label: '文章', icon: BookOpenText },
  { href: '/projects', label: '项目', icon: FolderGit2 },
  { href: '/moments', label: '推荐分享', icon: LibraryBig },
  { href: '/search', label: '搜索', icon: Search },
];

export function EditorialDock({ pathname }: { pathname: string }) {
  const mouseX = useMotionValue(Infinity);
  const reduced = useReducedMotion();
  return <nav className="editorial-dock" aria-label="快捷导航"
    onPointerMove={event => { if (!reduced && event.pointerType === 'mouse') mouseX.set(event.clientX); }}
    onPointerLeave={() => mouseX.set(Infinity)}
    onKeyDown={event => {
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
      const links = Array.from(event.currentTarget.querySelectorAll('a'));
      const current = links.indexOf(document.activeElement as HTMLAnchorElement);
      const next = event.key === 'Home' ? 0 : event.key === 'End' ? links.length - 1 : (current + (event.key === 'ArrowRight' ? 1 : -1) + links.length) % links.length;
      event.preventDefault(); links[next]?.focus();
    }}>
    {destinations.map(item => <DockLink key={item.href} {...item} active={item.href === '/' ? pathname === '/' : pathname === item.href || pathname.startsWith(`${item.href}/`) || item.href === '/posts' && pathname.startsWith('/notes')} mouseX={mouseX} reduced={Boolean(reduced)} />)}
  </nav>;
}

function DockLink({ href, label, icon: Icon, active, mouseX, reduced }: { href: string; label: string; icon: LucideIcon; active: boolean; mouseX: MotionValue<number>; reduced: boolean }) {
  const ref = useRef<HTMLAnchorElement>(null);
  const proximity = useTransform(mouseX, x => {
    const box = ref.current?.getBoundingClientRect();
    return box ? Math.max(0, 1 - Math.abs(x - box.left - box.width / 2) / 100) : 0;
  });
  const spring = useSpring(proximity, { stiffness: 280, damping: 23 });
  const scale = useTransform(spring, [0, 1], [1, 1.3]);
  const y = useTransform(spring, [0, 1], [0, -8]);
  return <Link href={href} ref={ref} aria-label={label} aria-current={active ? 'page' : undefined}>
    <motion.span className="editorial-dock__icon" style={reduced ? undefined : { scale, y }}><Icon size={21} strokeWidth={1.7} aria-hidden="true" /></motion.span>
    <span>{label}</span>
  </Link>;
}
