'use client';

import { ArrowLeft, ArrowRight, ArrowUpRight } from 'lucide-react';
import { useScroll, type MotionValue } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';

import type { BlogPreviewEntry } from './preview-content';
import styles from './creative-preview.module.css';

export function CoverMarquee({ entries, quiet }: { entries: BlogPreviewEntry[]; quiet: boolean }) {
  const section = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: section, offset: ['start end', 'end start'] });
  const midpoint = Math.ceil(entries.length / 2);
  const rows = [entries.slice(0, midpoint), entries.slice(midpoint)].filter((row) => row.length);

  return <section aria-label="内容切片，滚动浏览文章封面" className={styles.filmSection} id="fragments" ref={section} tabIndex={-1}>
    <div className={styles.filmHeading}><span className={styles.eyebrow}>FRAGMENTS OF MY WORLD</span><span>最近的切片 <span aria-hidden="true">↙</span></span></div>
    <div className={styles.filmRows}>
      {rows.map((row, index) => <FilmRow entries={row} index={index} key={index} progress={scrollYProgress} quiet={quiet} />)}
    </div>
    <p className={styles.filmHint}>沿着切片，发现一篇想读的故事。<span>左右滑动 / 点击阅读</span></p>
  </section>;
}

function FilmRow({ entries, index, progress, quiet }: { entries: BlogPreviewEntry[]; index: number; progress: MotionValue<number>; quiet: boolean }) {
  const viewport = useRef<HTMLDivElement>(null);
  const manual = useRef(false);
  const restored = useRef(false);
  const hovered = useRef(false);
  const storageKey = `starry-summer-preview-gallery-${index}`;
  const entryKey = entries.map((entry) => entry.id).join('|');
  const [edges, setEdges] = useState({ start: true, end: false });
  const label = index === 0 ? '第一排' : '第二排';

  function updateEdges() {
    const node = viewport.current;
    if (node) {
      setEdges({ start: node.scrollLeft <= 2, end: node.scrollLeft >= node.scrollWidth - node.clientWidth - 2 });
      if (manual.current) {
        try { sessionStorage.setItem(storageKey, JSON.stringify({ entries: entryKey, left: node.scrollLeft })); } catch { /* Browsing does not require storage. */ }
      }
    }
  }
  useEffect(() => {
    const node = viewport.current;
    if (!node) return;
    if (!restored.current) {
      restored.current = true;
      try {
        const saved = JSON.parse(sessionStorage.getItem(storageKey) ?? 'null');
        if (saved?.entries === entryKey && typeof saved.left === 'number' && Number.isFinite(saved.left) && saved.left >= 0) {
          manual.current = true;
          node.scrollLeft = saved.left;
        }
      } catch { /* Ignore stale or unavailable session data. */ }
    }
    function sync() {
      if (!node || quiet || manual.current || hovered.current || !matchMedia('(hover: hover) and (pointer: fine)').matches) return;
      const travel = Math.max(0, node.scrollWidth - node.clientWidth);
      node.scrollLeft = travel * (index ? 1 - progress.get() : progress.get());
      updateEdges();
    }
    const unsubscribe = progress.on('change', sync);
    const observer = new ResizeObserver(() => { sync(); updateEdges(); });
    observer.observe(node);
    sync();
    updateEdges();
    return () => { unsubscribe(); observer.disconnect(); };
  }, [index, progress, quiet, storageKey, entryKey]);

  function browse(direction: number) {
    manual.current = true;
    const node = viewport.current;
    node?.scrollBy({ left: direction * node.clientWidth * 0.75, behavior: quiet ? 'instant' : 'smooth' });
  }
  return <div className={styles.filmRow}>
    <div aria-label={`${label}内容切片`} className={styles.filmViewport} ref={viewport}
      onPointerEnter={(event) => { if (event.pointerType === 'mouse') hovered.current = true; }}
      onPointerLeave={() => { hovered.current = false; }}
      onPointerDown={() => { manual.current = true; }} onFocusCapture={() => { manual.current = true; }}
      onWheel={(event) => { if (event.deltaX !== 0 || event.shiftKey) manual.current = true; }}
      onClickCapture={() => { manual.current = true; updateEdges(); }} onScroll={updateEdges}>
      <div className={styles.filmTrack}>
        {entries.map((entry) => <a className={styles.filmTile} href={entry.href} key={entry.id} draggable={false}>
          {entry.cover && <img alt="" draggable={false} loading="lazy" src={entry.cover.src} />}
          <span className={styles.filmCaption}><span>{entry.title}</span><ArrowUpRight aria-hidden="true" size={16} /></span>
        </a>)}
      </div>
    </div>
    <div className={styles.filmControls}>
      <span>{String(index + 1).padStart(2, '0')} / {entries.length} STORIES</span>
      <button aria-label={`${label}向左浏览`} disabled={edges.start} onClick={() => browse(-1)} type="button"><ArrowLeft size={17} /></button>
      <button aria-label={`${label}向右浏览`} disabled={edges.end} onClick={() => browse(1)} type="button"><ArrowRight size={17} /></button>
    </div>
  </div>;
}
