'use client';

import { BookOpenText, Compass, Images, Orbit, Pause, Play, Search } from 'lucide-react';
import { motion, useMotionValue, useSpring, useTransform, type MotionStyle, type MotionValue } from 'framer-motion';
import { useEffect, useRef, useState, type ReactNode } from 'react';

import { ThemeToggle } from '@/components/ThemeToggle';

import styles from './creative-preview.module.css';

const destinations = [
  { id: 'top', label: '首页', icon: Orbit },
  { id: 'latest', label: '阅读', icon: BookOpenText },
  { id: 'fragments', label: '切片', icon: Images },
  { id: 'routes', label: '探索', icon: Compass },
];

export function PreviewDock({ hasGallery, paused, quiet, onPause }: { hasGallery: boolean; paused: boolean; quiet: boolean; onPause: () => void }) {
  const mouseX = useMotionValue(Infinity);
  const [active, setActive] = useState('top');

  useEffect(() => {
    // DOM order, rather than Dock order, determines the current reading section.
    const ids = ['top', ...(hasGallery ? ['fragments'] : []), 'latest', 'routes'];
    let frame = 0;
    function update() {
      frame = 0;
      let current = 'top';
      for (const id of ids) {
        const element = document.getElementById(id);
        if (element && element.getBoundingClientRect().top <= window.innerHeight * 0.38) current = id;
      }
      setActive(current);
    }
    function schedule() { if (!frame) frame = requestAnimationFrame(update); }
    update();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    return () => { cancelAnimationFrame(frame); window.removeEventListener('scroll', schedule); window.removeEventListener('resize', schedule); };
  }, [hasGallery]);

  return <div className={styles.dockPosition}>
    <nav aria-label="快捷导航" className={styles.dock}
      onPointerMove={(event) => { if (!quiet && event.pointerType === 'mouse') mouseX.set(event.clientX); }}
      onKeyDown={(event) => {
        if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
        const controls = [...event.currentTarget.querySelectorAll<HTMLAnchorElement | HTMLButtonElement>('a, button')];
        const index = controls.indexOf(document.activeElement as HTMLAnchorElement | HTMLButtonElement);
        const next = event.key === 'Home' ? 0 : event.key === 'End' ? controls.length - 1 : (index + (event.key === 'ArrowRight' ? 1 : -1) + controls.length) % controls.length;
        event.preventDefault();
        controls[next]?.focus();
      }}
      onPointerLeave={() => mouseX.set(Infinity)}>
      {destinations.filter((item) => hasGallery || item.id !== 'fragments').map(({ id, label, icon: Icon }) =>
        <DockItem label={label} mouseX={mouseX} quiet={quiet} key={id}>
          <a aria-label={label} aria-current={active === id ? 'location' : undefined} href={`#${id}`}><Icon aria-hidden="true" size={21} /><span className={styles.dockMobileLabel}>{label}</span></a>
        </DockItem>)}
      <DockItem label="搜索文章" mouseX={mouseX} quiet={quiet}><a aria-label="搜索文章" href="/search"><Search aria-hidden="true" size={20} /></a></DockItem>
      <span aria-hidden="true" className={styles.dockDivider} />
      <DockItem label={paused ? '继续动态效果' : '暂停动态效果'} mouseX={mouseX} quiet={quiet}>
        <button aria-label={paused ? '继续动态效果' : '暂停动态效果'} aria-pressed={paused} onClick={onPause} type="button">{paused ? <Play aria-hidden="true" size={18} /> : <Pause aria-hidden="true" size={18} />}</button>
      </DockItem>
      <DockItem label="切换昼夜" mouseX={mouseX} quiet={quiet}><ThemeToggle /></DockItem>
    </nav>
  </div>;
}

function DockItem({ children, label, mouseX, quiet }: { children: ReactNode; label: string; mouseX: MotionValue<number>; quiet: boolean }) {
  const slot = useRef<HTMLDivElement>(null);
  const [focused, setFocused] = useState(false);
  // The hit area never moves. Only its visual face responds to pointer proximity.
  const proximity = useTransform(mouseX, (x) => {
    const rect = slot.current?.getBoundingClientRect();
    return rect ? Math.max(0, 1 - Math.abs(x - rect.left - rect.width / 2) / 110) : 0;
  });
  const spring = useSpring(proximity, { stiffness: 260, damping: 22, mass: 0.4 });
  const scale = useTransform(spring, [0, 1], [1, 1.28]);
  const y = useTransform(spring, [0, 1], [0, -11]);
  return <div className={styles.dockSlot} ref={slot} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}>
    <motion.div aria-hidden="true" className={styles.dockFace} style={quiet ? undefined : { scale, y }} />
    <motion.div className={styles.dockControl} style={quiet ? undefined : { '--dock-icon-scale': scale, '--dock-icon-y': y } as MotionStyle}>{children}</motion.div>
    <span aria-hidden="true" className={styles.dockTooltip} data-focused={focused}>{label}</span>
  </div>;
}
