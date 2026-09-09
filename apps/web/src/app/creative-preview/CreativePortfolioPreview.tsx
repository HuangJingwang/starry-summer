'use client';

import { ArrowDown, ArrowUpRight, BookOpenText, Clock3, FolderKanban, MessageCircleMore, NotebookPen, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

import { ThemeToggle } from '@/components/ThemeToggle';

import styles from './creative-preview.module.css';

export interface BlogPreviewEntry {
  cover?: {
    alt: string;
    src: string;
  };
  excerpt: string;
  href: string;
  id: string;
  publishedAt: string;
  title: string;
  type: 'moment' | 'note' | 'page' | 'post' | 'project';
}

interface BlogHomePreviewProps {
  description: string;
  featured?: BlogPreviewEntry;
  lastPublishedAt: string;
  motto: string;
  publicCount: number;
  recentEntries: BlogPreviewEntry[];
}

const contentRoutes = [
  { description: '长文、技术实践与阶段复盘。', href: '/posts', icon: BookOpenText, label: '文章', number: '01' },
  { description: '想法、资料和正在推敲的碎片。', href: '/notes', icon: NotebookPen, label: '笔记', number: '02' },
  { description: '轻一些的日常、链接与当下发现。', href: '/moments', icon: Sparkles, label: '片刻', number: '03' },
  { description: '从想法到落地，保留项目的上下文。', href: '/projects', icon: FolderKanban, label: '项目', number: '04' },
] as const;

export function BlogHomePreview({
  description,
  featured,
  lastPublishedAt,
  motto,
  publicCount,
  recentEntries,
}: BlogHomePreviewProps) {
  return (
    <main className={styles.preview} id="top">
      <Hero description={description} lastPublishedAt={lastPublishedAt} motto={motto} publicCount={publicCount} />
      {featured ? <FeaturedReading entry={featured} /> : null}
      <RecentUpdates entries={recentEntries} />
      <ContentRoutes />
      <ArchiveCallout />
    </main>
  );
}

function Hero({
  description,
  lastPublishedAt,
  motto,
  publicCount,
}: Pick<BlogHomePreviewProps, 'description' | 'lastPublishedAt' | 'motto' | 'publicCount'>) {
  return (
    <section className={styles.hero} aria-labelledby="blog-preview-title">
      <nav className={styles.nav} aria-label="博客预览导航">
        <a className={styles.brand} href="#top">
          <span className={styles.brandMark} aria-hidden="true">✦</span>
          Starry Summer
        </a>
        <div className={styles.navLinks}>
          <a href="#latest">最新</a>
          <a href="#routes">栏目</a>
          <a href="#archive">归档</a>
        </div>
        <div className={styles.themeControl}>
          <ThemeToggle />
        </div>
      </nav>

      <motion.div
        animate={{ opacity: 1, y: 0 }}
        className={styles.heroContent}
        initial={{ opacity: 0, y: 22 }}
        transition={{ duration: 0.72, ease: [0.25, 0.1, 0.25, 1] }}
      >
        <p className={styles.eyebrow}>Aster.H 的个人内容平台</p>
        <h1 id="blog-preview-title">
          把走过的路，<br />
          留成可以回看的文字。
        </h1>
        <p className={styles.heroDescription}>{description}</p>
        <div className={styles.heroActions}>
          <a className={styles.primaryAction} href="#latest">
            开始阅读 <ArrowDown aria-hidden="true" size={17} strokeWidth={1.8} />
          </a>
          <span className={styles.motto}>{motto}</span>
        </div>
      </motion.div>

      <dl className={styles.heroMeta}>
        <div>
          <dt>PUBLIC ENTRIES</dt>
          <dd>{publicCount}</dd>
        </div>
        <div>
          <dt>LAST UPDATE</dt>
          <dd>{formatDate(lastPublishedAt)}</dd>
        </div>
        <div>
          <dt>TIMEZONE</dt>
          <dd>ASIA/SHANGHAI</dd>
        </div>
      </dl>
    </section>
  );
}

function FeaturedReading({ entry }: { entry: BlogPreviewEntry }) {
  return (
    <section className={styles.feature} id="latest" aria-labelledby="featured-title">
      <SectionLabel index="01" label="精选阅读" />
      <motion.article
        className={styles.featureCard}
        initial={{ opacity: 0, y: 28 }}
        transition={{ duration: 0.66, ease: [0.25, 0.1, 0.25, 1] }}
        viewport={{ amount: 0.2, once: true }}
        whileInView={{ opacity: 1, y: 0 }}
      >
        <a className={styles.featureVisual} href={entry.href} aria-label={`阅读：${entry.title}`}>
          {entry.cover ? (
            <img alt={entry.cover.alt} src={entry.cover.src} />
          ) : (
            <span className={styles.coverFallback} aria-hidden="true">
              <BookOpenText size={38} strokeWidth={1.3} />
            </span>
          )}
        </a>
        <div className={styles.featureBody}>
          <p className={styles.entryMeta}>{formatType(entry.type)} · {formatDate(entry.publishedAt)}</p>
          <h2 id="featured-title"><a href={entry.href}>{entry.title}</a></h2>
          <p>{entry.excerpt}</p>
          <a className={styles.textAction} href={entry.href}>
            阅读全文 <ArrowUpRight aria-hidden="true" size={18} strokeWidth={1.8} />
          </a>
        </div>
      </motion.article>
    </section>
  );
}

function RecentUpdates({ entries }: { entries: BlogPreviewEntry[] }) {
  return (
    <section className={styles.updates} aria-labelledby="updates-title">
      <SectionLabel id="updates-title" index="02" label="最新更新" />
      <div className={styles.updateList}>
        {entries.map((entry, index) => (
          <motion.article
            className={styles.update}
            initial={{ opacity: 0, y: 18 }}
            key={entry.id}
            transition={{ delay: index * 0.055, duration: 0.44, ease: [0.25, 0.1, 0.25, 1] }}
            viewport={{ amount: 0.12, once: true }}
            whileInView={{ opacity: 1, y: 0 }}
          >
            <span className={styles.updateDate}>{formatShortDate(entry.publishedAt)}</span>
            <div className={styles.updateMain}>
              <p className={styles.entryMeta}>{formatType(entry.type)}</p>
              <h3><a href={entry.href}>{entry.title}</a></h3>
              <p>{entry.excerpt}</p>
            </div>
            <a className={styles.entryArrow} href={entry.href} aria-label={`阅读：${entry.title}`}>
              <ArrowUpRight aria-hidden="true" size={20} strokeWidth={1.7} />
            </a>
          </motion.article>
        ))}
      </div>
      <a className={styles.allEntries} href="/posts">
        查看全部文章 <ArrowUpRight aria-hidden="true" size={17} strokeWidth={1.8} />
      </a>
    </section>
  );
}

function ContentRoutes() {
  return (
    <section className={styles.routes} id="routes" aria-labelledby="routes-title">
      <SectionLabel index="03" label="内容地图" />
      <div className={styles.routeIntro}>
        <h2 id="routes-title">文章、笔记、片刻与项目，<br />在这里慢慢长成自己的索引。</h2>
      </div>
      <div className={styles.routeGrid}>
        {contentRoutes.map((route) => {
          const Icon = route.icon;

          return (
            <a className={styles.routeCard} href={route.href} key={route.href}>
              <span className={styles.routeNumber}>{route.number}</span>
              <Icon aria-hidden="true" className={styles.routeIcon} size={25} strokeWidth={1.45} />
              <h3>{route.label}</h3>
              <p>{route.description}</p>
              <ArrowUpRight aria-hidden="true" className={styles.routeArrow} size={18} strokeWidth={1.7} />
            </a>
          );
        })}
      </div>
    </section>
  );
}

function ArchiveCallout() {
  return (
    <section className={styles.archive} id="archive" aria-labelledby="archive-title">
      <div>
        <p className={styles.eyebrow}>Long-term archive</p>
        <h2 id="archive-title">让内容留下来，<br />也让以后有路可循。</h2>
        <p>所有公开内容按时间、标签、分类和系列整理。想从一个主题开始，或只是随意走走，都可以。</p>
      </div>
      <div className={styles.archiveActions}>
        <a className={styles.primaryAction} href="/archives">
          浏览归档 <Clock3 aria-hidden="true" size={17} strokeWidth={1.8} />
        </a>
        <a className={styles.secondaryAction} href="/guestbook">
          留言交流 <MessageCircleMore aria-hidden="true" size={17} strokeWidth={1.8} />
        </a>
      </div>
    </section>
  );
}

function SectionLabel({ id, index, label }: { id?: string; index: string; label: string }) {
  return <p className={styles.sectionLabel} id={id}><span>{index}</span>{label}</p>;
}

function formatType(type: BlogPreviewEntry['type']): string {
  const labels: Record<BlogPreviewEntry['type'], string> = {
    moment: '片刻',
    note: '笔记',
    page: '页面',
    post: '文章',
    project: '项目',
  };

  return labels[type];
}

function formatDate(value: string): string {
  return value ? value.replaceAll('-', '.') : '—';
}

function formatShortDate(value: string): string {
  return value ? value.slice(5).replace('-', '.') : '—';
}
