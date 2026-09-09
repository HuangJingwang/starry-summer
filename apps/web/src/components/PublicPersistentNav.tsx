'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { ArrowUpRight, Menu, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from 'framer-motion';
import { PreviewDock } from '@/app/creative-preview/PreviewDock';
import { usePreviewPause } from '@/app/creative-preview/use-preview-motion';
import type { NavigationItem } from '@/lib/navigation';

export function PublicPersistentNav({ title, navItems }: { title: string; navItems: NavigationItem[] }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [paused, togglePause] = usePreviewPause();
  const reduced = useReducedMotion();
  const toggle = useRef<HTMLButtonElement>(null);
  const menu = useRef<HTMLDivElement>(null);
  void navItems;
  useEffect(() => { setOpen(false); }, [pathname]);
  useEffect(() => {
    if (!open) return;
    menu.current?.querySelector<HTMLAnchorElement>('a')?.focus();
    function close(event: KeyboardEvent) {
      if (event.key === 'Escape') { setOpen(false); toggle.current?.focus(); }
    }
    function outside(event: PointerEvent) {
      if (!menu.current?.contains(event.target as Node) && !toggle.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener('keydown', close);
    document.addEventListener('pointerdown', outside);
    return () => { document.removeEventListener('keydown', close); document.removeEventListener('pointerdown', outside); };
  }, [open]);

  if (shouldHidePublicNav(pathname)) {
    return null;
  }

  return <div className="journal-chrome">
    <a className="journal-skip" href="#main-content">跳到页面内容</a>
    <header className="journal-header">
      <Link aria-label="Aster.H · 返回首页" className="journal-brand" href="/"><span aria-hidden="true">✳</span> Aster.H<span className="journal-brand__note">{title} / JOURNAL</span></Link>
      <nav className="journal-header__links" aria-label="主导航">
        {[['/posts', '文章'], ['/notes', '笔记'], ['/moments', '发现'], ['/projects', '项目'], ['/about', '关于']].map(([href, label]) => <Link key={href} href={href!} aria-current={pathname === href || pathname.startsWith(`${href}/`) ? 'page' : undefined}>{label}</Link>)}
      </nav>
      <button className="journal-menu-toggle" aria-label={open ? '关闭站点目录' : '打开站点目录'} aria-expanded={open} aria-controls="journal-directory" ref={toggle} type="button" onClick={() => setOpen(!open)}><span>目录</span>{open ? <X size={19} /> : <Menu size={19} />}</button>
    </header>
    <div className="journal-directory" id="journal-directory" ref={menu} hidden={!open}>
      <nav aria-label="站点目录"><p>EXPLORE THE JOURNAL</p><div>{[
        ['/posts', '文章'], ['/notes', '笔记'], ['/moments', '发现'], ['/projects', '项目'], ['/series', '系列'], ['/categories', '分类'], ['/tags', '标签'], ['/archives', '归档'], ['/about', '关于'], ['/leetcode', '刷题日记'],
      ].map(([href, label], index) => <Link href={href!} key={href} onClick={() => setOpen(false)}><small>{String(index + 1).padStart(2, '0')}</small>{label}<ArrowUpRight size={17} /></Link>)}</div></nav>
    </div>
    <PreviewDock hasGallery={false} paused={paused} quiet={paused || Boolean(reduced)} onPause={togglePause} sitePath={pathname} />
  </div>;
}

function shouldHidePublicNav(pathname: string) {
  return (
    pathname === '/' ||
    pathname === '/home' ||
    pathname.startsWith('/admin') ||
    pathname === '/fleet-flagship' ||
    pathname === '/creative-preview'
  );
}
