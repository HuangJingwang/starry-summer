'use client';

import { ArrowDown, ArrowUpRight, BookOpenText, Code2, MoonStar, Sparkles } from 'lucide-react';
import { MotionConfig, motion, useMotionValue, useReducedMotion, useScroll, useSpring, useTransform, type MotionStyle, type MotionValue } from 'framer-motion';
import { useRef, type PointerEvent, type ReactNode } from 'react';

import { OrbitalScene } from './OrbitalScene';
import { CoverMarquee } from './CoverMarquee';
import { PreviewDock } from './PreviewDock';
import { usePausableValue, usePreviewPause } from './use-preview-motion';
import type { BlogPreviewEntry, selectPreviewContent } from './preview-content';
import styles from './creative-preview.module.css';

type BlogHomePreviewProps = ReturnType<typeof selectPreviewContent> & { description: string };

const contentRoutes = [
  { description: '技术实践、原理探索与复盘。', href: '/posts', icon: BookOpenText, label: '文章', english: 'WRITING', number: '01' },
  { description: '还没写成长文的想法。', href: '/notes', icon: Code2, label: '笔记', english: 'FIELD NOTES', number: '02' },
  { description: '日常里，值得记住的小事。', href: '/moments', icon: MoonStar, label: '片刻', english: 'MOMENTS', number: '03' },
  { description: '把想法做出来的过程。', href: '/projects', icon: Sparkles, label: '项目', english: 'SIDE PROJECTS', number: '04' },
] as const;

export function BlogHomePreview(props: BlogHomePreviewProps) {
  const prefersReducedMotion = useReducedMotion();
  const [paused, togglePause] = usePreviewPause();
  const quiet = Boolean(prefersReducedMotion) || paused;
  const { scrollYProgress } = useScroll();

  return (
    <MotionConfig reducedMotion={prefersReducedMotion ? 'always' : 'never'}>
      <main className={styles.preview} data-motion={prefersReducedMotion ? 'reduced' : 'full'} data-paused={paused} id="top" tabIndex={-1}>
        <motion.div aria-hidden="true" className={styles.readingProgress} style={{ scaleX: scrollYProgress }} />
        <a className={styles.skipLink} href="#latest">跳到精选文章</a>
        <Hero {...props} quiet={quiet} />
        {props.galleryEntries.length > 0 && <CoverMarquee entries={props.galleryEntries} quiet={quiet} />}
        <JournalIntro description={props.description} quiet={quiet} />
        <FeaturedReading entries={props.featuredEntries} quiet={quiet} />
        <RecentUpdates entries={props.recentEntries} />
        <ContentRoutes />
        <ArchiveCallout quiet={quiet} />
        <PreviewDock hasGallery={props.galleryEntries.length > 0} paused={paused} quiet={quiet} onPause={togglePause} />
      </main>
    </MotionConfig>
  );
}

function Hero({ publicCount, lastPublishedAt, featuredEntries, galleryEntries, quiet }: BlogHomePreviewProps & { quiet: boolean }) {
  const hero = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: hero, offset: ['start start', 'end start'] });
  const titleY = usePausableValue(useTransform(scrollYProgress, [0, 1], [0, 110]), quiet);
  const orbitY = usePausableValue(useTransform(scrollYProgress, [0, 1], [0, -85]), quiet);
  const latest = featuredEntries[0];

  return (
    <section aria-labelledby="blog-preview-title" className={styles.hero} ref={hero}>
      <nav aria-label="首页导航" className={styles.nav}>
        <a className={styles.brand} href="#top"><span aria-hidden="true">✳</span> Aster.H</a>
        <div className={styles.navLinks}>
          <a href="#latest">阅读<span>01</span></a><a href="#routes">探索<span>02</span></a><a href="/about">关于<span>03</span></a>
        </div>
      </nav>
      <div className={styles.heroTopline}><span>AN OPEN-ENDED PERSONAL JOURNAL</span><span className={styles.liveLabel}><i /> 持续记录中</span></div>
      <motion.div className={styles.heroType} style={{ y: titleY }}>
        <h1 id="blog-preview-title"><span>STARRY</span><span>SUMMER<span className={styles.titlePeriod}>.</span></span></h1>
      </motion.div>
      <motion.div className={styles.orbitalStage} style={{ y: orbitY }}>
        <div aria-hidden="true" className={styles.orbitGlow} />
        <OrbitalScene paused={quiet} />
        <span aria-hidden="true" className={styles.orbitCoordinate}>SS—01 / EXPLORING</span>
        <span aria-hidden="true" className={styles.orbitCross}>+</span>
      </motion.div>
      <div className={styles.heroIntro}>
        <p className={styles.eyebrow}>你好，我是 Aster.H</p>
        <h2>记录探索，<br />也收藏日常。</h2>
        <p>文章、笔记、片刻与项目。<br />一些走过的路，和沿途的发现。</p>
        <MagneticLink className={styles.primaryAction} href="#latest" quiet={quiet}>开始阅读 <ArrowUpRight size={18} /></MagneticLink>
      </div>
      {latest && <a className={styles.floatingNote} href={latest.href}>
        <span className={styles.noteLabel}><i /> LATEST TRANSMISSION <ArrowUpRight size={14} /></span>
        <span className={styles.noteContent}>{latest.cover && <img alt="" src={latest.cover.src} />}<strong>{latest.title}</strong></span>
        <span className={styles.noteDate}>{formatDate(latest.publishedAt)} / 阅读最新一篇</span>
      </a>}
      <div className={styles.heroFooter}>
        <p><strong>{String(publicCount).padStart(2, '0')}</strong> 篇公开记录 <span className={styles.footerDivider}>/</span> <span>更新于 {formatDate(lastPublishedAt)}</span></p>
        <a className={styles.scrollCue} href={galleryEntries.length ? '#fragments' : '#latest'}><span>SCROLL TO EXPLORE</span><ArrowDown size={16} /></a>
      </div>
    </section>
  );
}

function MagneticLink({ children, className, href, quiet }: { children: ReactNode; className: string | undefined; href: string; quiet: boolean }) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 180, damping: 16 });
  const springY = useSpring(y, { stiffness: 180, damping: 16 });
  function follow(event: PointerEvent<HTMLAnchorElement>) {
    if (quiet || event.pointerType !== 'mouse') return;
    const rect = event.currentTarget.getBoundingClientRect();
    x.set((event.clientX - rect.left - rect.width / 2) * 0.16);
    y.set((event.clientY - rect.top - rect.height / 2) * 0.2);
  }
  return <a className={className} href={href} onPointerMove={follow} onPointerLeave={() => { x.set(0); y.set(0); }}><motion.span className={styles.magneticContents} style={quiet ? undefined : { x: springX, y: springY }}>{children}</motion.span></a>;
}

function JournalIntro({ description, quiet }: { description: string; quiet: boolean }) {
  const section = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: section, offset: ['start 85%', 'center 45%'] });
  const words = ['保持好奇，', '把问题弄明白。', '认真生活，', '把故事留下来。'];
  return <section className={styles.journalIntro} ref={section} aria-labelledby="journal-title">
    <span aria-hidden="true" className={styles.introStar}>✳</span>
    <p className={styles.eyebrow}>A SMALL CORNER OF THE INTERNET</p>
    <h2 aria-label={words.join('')} id="journal-title">{words.map((word, index) => <RevealPhrase index={index} key={word} progress={scrollYProgress} quiet={quiet}>{word}</RevealPhrase>)}</h2>
    <p className={styles.journalDescription}>{description}</p>
    <a className={styles.textAction} href="/about">关于这个小站 <ArrowUpRight size={16} /></a>
  </section>;
}

function RevealPhrase({ children, index, progress, quiet }: { children: ReactNode; index: number; progress: MotionValue<number>; quiet: boolean }) {
  const opacity = useTransform(progress, [index * 0.2, index * 0.2 + 0.35], [0.28, 1]);
  return <motion.span aria-hidden="true" style={quiet ? undefined : { opacity }}>{children}</motion.span>;
}

function FeaturedReading({ entries, quiet }: { entries: BlogPreviewEntry[]; quiet: boolean }) {
  return <section className={styles.feature} id="latest" aria-labelledby="featured-title" tabIndex={-1}>
    <SectionHeading english="SELECTED STORIES" id="featured-title" index="01" title="值得展开读读。" />
    <div className={styles.stackDeck}>
      {entries.map((entry, index) => <StackedStory entry={entry} index={index} key={entry.id} quiet={quiet} total={entries.length} />)}
      {!entries.length && <p className={styles.emptyState}>第一篇故事正在路上。</p>}
    </div>
  </section>;
}

function StackedStory({ entry, index, quiet, total }: { entry: BlogPreviewEntry; index: number; quiet: boolean; total: number }) {
  const card = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: card, offset: ['start 12%', 'end 12%'] });
  const scale = usePausableValue(useTransform(scrollYProgress, [0, 1], [1, 1 - (total - 1 - index) * 0.035]), quiet);
  return <motion.article className={styles.featureCard} ref={card} style={{ '--card-offset': `${index * 22}px`, '--card-index': index, scale } as MotionStyle}>
    <div className={styles.featureBody}>
      <div className={styles.featureTop}><span className={styles.storyNumber}>{String(index + 1).padStart(2, '0')}</span><span className={styles.eyebrow}>{formatType(entry.type)} / {formatDate(entry.publishedAt)}</span><ArrowUpRight size={22} /></div>
      <h3><a href={entry.href}>{entry.title}</a></h3>
      <p className={styles.featureExcerpt}>{entry.excerpt}</p>
      {entry.tags.length > 0 && <div className={styles.tags}>{entry.tags.map((tag) => <span key={tag}>{tag}</span>)}</div>}
      <a className={styles.storyRead} href={entry.href}>展开这篇文章 <span><ArrowUpRight size={19} /></span></a>
    </div>
    <a aria-label={`阅读：${entry.title}`} className={styles.featureVisual} href={entry.href}>
      {entry.cover ? <img alt={entry.cover.alt} loading="lazy" src={entry.cover.src} /> : <div className={styles.coverFallback}><BookOpenText size={74} strokeWidth={1} /><span>STARRY SUMMER / JOURNAL</span></div>}
      <span className={styles.imageCorner}>ASTER.H — READING COLLECTION</span>
    </a>
  </motion.article>;
}

function RecentUpdates({ entries }: { entries: BlogPreviewEntry[] }) {
  return <section aria-labelledby="updates-title" className={styles.updates}>
    <div className={styles.updatesIntro}><p className={styles.eyebrow}>02 / THE JOURNAL</p><h2 id="updates-title">最新更新<span>Always in progress.</span></h2><a className={styles.textAction} href="/archives">完整时间线 <ArrowUpRight size={16} /></a></div>
    <div className={styles.updateList}>{entries.map((entry) => <a className={styles.update} href={entry.href} key={entry.id}>
      <span className={styles.updateMeta}><time dateTime={entry.publishedAt}>{formatDate(entry.publishedAt)}</time><span>{formatType(entry.type)}</span></span>
      <h3>{entry.title}</h3><ArrowUpRight className={styles.updateArrow} size={21} />
      <p>{entry.excerpt}</p>
    </a>)}</div>
  </section>;
}

function ContentRoutes() {
  return <section aria-labelledby="routes-title" className={styles.routes} id="routes" tabIndex={-1}>
    <SectionHeading english="FIND YOUR ORBIT" id="routes-title" index="03" title="从这里，随意逛逛。" />
    <div className={styles.routeGrid}>{contentRoutes.map((route) => {
      const Icon = route.icon;
      return <a className={styles.routeCard} href={route.href} key={route.href}>
        <span className={styles.routeTop}>{route.number}<ArrowUpRight size={20} /></span>
        <div aria-hidden="true" className={styles.routeSculpture}><span /><span /><span /><Icon size={42} strokeWidth={1.1} /></div>
        <p className={styles.eyebrow}>{route.english}</p><h3>{route.label}</h3><p className={styles.routeDescription}>{route.description}</p>
      </a>;
    })}</div>
  </section>;
}

function ArchiveCallout({ quiet }: { quiet: boolean }) {
  return <footer className={styles.archive} id="archive">
    <div className={styles.archiveTop}><div><p className={styles.eyebrow}>UNTIL OUR NEXT ORBIT</p><h2>很高兴，在这里遇见你。</h2><p>更多关于我，以及能找到我的地方。</p></div><MagneticLink className={styles.footerAction} href="/about" quiet={quiet}>关于与联系 <ArrowUpRight size={23} /></MagneticLink></div>
    <a className={styles.footerWordmark} href="#top" aria-label="回到顶部">STAY CURIOUS<span aria-hidden="true">↗</span></a>
    <div className={styles.footerMeta}><span>© STARRY SUMMER · ASTER.H</span><div><a href="/archives">归档</a><a href="/tags">标签</a><a href="/rss.xml">RSS <ArrowUpRight size={12} /></a></div><span>记录仍在继续 <i /></span></div>
  </footer>;
}

function SectionHeading({ english, id, index, title }: { english: string; id: string; index: string; title: string }) {
  return <div className={styles.sectionHeading}><p className={styles.eyebrow}>{index} / {english}</p><h2 id={id}>{title}</h2><ArrowDown aria-hidden="true" size={28} strokeWidth={1} /></div>;
}

function formatType(type: BlogPreviewEntry['type']) {
  return { moment: '片刻', note: '笔记', page: '页面', post: '文章', project: '项目' }[type];
}

function formatDate(value: string) {
  return value ? value.slice(0, 10).replaceAll('-', '.') : '—';
}
