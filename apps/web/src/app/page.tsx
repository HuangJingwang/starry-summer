import Image from 'next/image';
import { FileText, Heart } from 'lucide-react';

import { BlurredBubblesCanvas } from '@/components/BlurredBubblesCanvas';
import { HomeCardNav } from '@/components/HomeCardNav';
import { HomeContactButton } from '@/components/HomeContactButton';
import { HomeFleetBackground } from '@/components/HomeFleetBackground';
import { SiteShell } from '@/components/SiteShell';
import { StarrySkyCanvas } from '@/components/StarrySkyCanvas';
import { getContentHref } from '@/lib/content';
import { getContentCover } from '@/lib/content-cover';
import { buildHomeProfileModel } from '@/lib/home-profile';
import { loadSiteContent } from '@/lib/public-content';
import { loadSiteSettings } from '@/lib/settings-repository';

const homeGitHubUrl = 'https://github.com/HuangJingwang/starry-summer';

export default async function HomePage() {
  const [content, settings] = await Promise.all([
    loadSiteContent(),
    loadSiteSettings(),
  ]);
  const profile = buildHomeProfileModel(settings, content);
  const stats = profile.stats;
  const heroLead = '这里主要存放技术文章、工程实践和一些偶尔出现的照片与思考。';
  const heroMotto = profile.motto || '写技术文章，也记录一些生活里的光。';
  const latestArticle = profile.latestArticle;
  const latestArticleCover = latestArticle ? getContentCover(latestArticle) : null;
  const juejinLink = settings.profile.socialLinks.find((link) => link.href.includes('juejin.cn'));
  const homeNow = new Date();
  const calendarDays = buildHomeCalendarDays(homeNow);

  return (
    <SiteShell hideHeader>
      <main className="portfolio-home">
        <section className="portfolio-hero" id="about" aria-label="Starry Summer 首页">
          <BlurredBubblesCanvas className="portfolio-hero__bubbles" />
          <StarrySkyCanvas className="portfolio-hero__canvas" />
          <div className="portfolio-hero__shade" />
          <HomeFleetBackground />

          <div className="portfolio-hero__content cyber-home__container">
            <div className="portfolio-hero__left-stack">
              <HomeCardNav />
              <aside className="portfolio-hero__latest-card" aria-label="最新文章">
                <span>最新文章</span>
                {latestArticle ? (
                  <a href={getContentHref(latestArticle)}>
                    {latestArticleCover ? (
                      <img src={latestArticleCover.imageUrl} alt={latestArticleCover.altText} />
                    ) : (
                      <span className="portfolio-hero__latest-cover" aria-hidden="true">
                        <FileText size={24} />
                      </span>
                    )}
                    <strong>{latestArticle.title}</strong>
                    <small>{latestArticle.summary}</small>
                    <time dateTime={latestArticle.publishedAt}>{formatHomeDate(latestArticle.publishedAt)}</time>
                  </a>
                ) : (
                  <p>正在整理新的文章。</p>
                )}
              </aside>
            </div>

              <aside className="portfolio-hero__sky-card" aria-label="Starry Summer atmosphere">
                <span>STARRY SUMMER</span>
                <strong>Daylight notes, open archive.</strong>
              </aside>

            <div className="portfolio-hero__center-stack">
              <div className="portfolio-hero__intro-card">
                <p className="portfolio-hero__badge">技术写作 / 笔记 / 推荐分享</p>
                <div className="portfolio-hero__title">
                  <h1 className="portfolio-hero__name">{profile.ownerName}</h1>
                  <span className="portfolio-hero__outline" aria-hidden="true">
                    WRITING
                  </span>
                </div>
                <p className="portfolio-hero__role">Technical Notes & Summer Moments</p>
                <p className="portfolio-hero__lead">{heroLead}</p>
                <p className="portfolio-hero__motto">{heroMotto}</p>
              </div>

              <div className="portfolio-hero__actions" aria-label="首页快捷入口">
                <div className="portfolio-hero__action-row portfolio-hero__action-row--primary">
                  <a
                    className="portfolio-hero__social portfolio-hero__social--github"
                    href={homeGitHubUrl}
                    target="_blank"
                    rel="noreferrer"
                    aria-label="打开 GitHub（新标签页）"
                  >
                    <GitHubIcon />
                    <span>Github</span>
                  </a>
                  {juejinLink ? (
                    <a
                      className="portfolio-hero__social portfolio-hero__social--juejin"
                      href={juejinLink.href}
                      target="_blank"
                      rel="noreferrer"
                      aria-label="打开掘金主页（新标签页）"
                    >
                      <JuejinIcon />
                      <span>稀土掘金</span>
                    </a>
                  ) : null}
                </div>
                <div className="portfolio-hero__action-row portfolio-hero__action-row--secondary">
                  <HomeContactButton
                    className="portfolio-hero__social portfolio-hero__social--guestbook"
                    href="/guestbook"
                    ariaLabel="打开留言板"
                  >
                    <EmailIcon />
                  </HomeContactButton>
                  <div className="portfolio-hero__like-row">
                    <div className="portfolio-hero__like-card" aria-label={`收到 ${formatNumber(stats.totalLikes)} 个喜欢`}>
                      <span>{formatNumber(stats.totalLikes)}</span>
                      <Heart size={28} fill="currentColor" strokeWidth={0} aria-hidden="true" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <aside className="portfolio-hero__clock-card" aria-label="Current archive time">
              <span>LOCAL TIME</span>
              <strong>{formatHomeClock(homeNow)}</strong>
            </aside>

            <aside className="portfolio-hero__calendar-card" aria-label="Calendar">
              <div>
                <span>{formatHomeDateHeading(homeNow)}</span>
                <strong>{formatHomeWeekday(homeNow)}</strong>
              </div>
              <ol>
                {homeCalendarWeekdays.map((weekday) => (
                  <li className="portfolio-hero__calendar-weekday" key={weekday}>
                    {weekday}
                  </li>
                ))}
                {calendarDays.map((day, index) => (
                  <li
                    key={`${day.empty ? 'empty' : day.label}-${index}`}
                    data-current={day.current ? 'true' : undefined}
                    data-empty={day.empty ? 'true' : undefined}
                  >
                    {day.label}
                  </li>
                ))}
              </ol>
            </aside>

            <div className="portfolio-hero__visual">
              <figure className="portfolio-hero__portrait">
                <Image
                  className="portfolio-hero__night-avatar"
                  src="/images/aster-profile.png"
                  alt="Aster.H 的夜晚头像"
                  width={1254}
                  height={1254}
                  priority
                />
                <Image
                  className="portfolio-hero__day-avatar"
                  src="/images/aster-day-profile-v2.png"
                  alt="Aster.H 的夏日头像"
                  width={1254}
                  height={1254}
                  priority
                />
                <div className="portfolio-hero__signal" aria-hidden="true">
                  <strong>Starry Summer</strong>
                  <span />
                  <span />
                  <span />
                </div>
              </figure>
            </div>

          </div>
        </section>
      </main>
    </SiteShell>
  );
}

function GitHubIcon() {
  return <img className="portfolio-hero__social-icon" src="/images/reference-social/github.svg" alt="" aria-hidden="true" />;
}

function JuejinIcon() {
  return (
    <img
      className="portfolio-hero__social-icon portfolio-hero__social-icon--juejin"
      src="/images/reference-social/juejin.svg"
      alt=""
      aria-hidden="true"
    />
  );
}

function EmailIcon() {
  return (
    <svg className="portfolio-hero__social-icon portfolio-hero__social-icon--email" viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <path
        d="M1.81799 11.0067V20.7854C1.81799 23.8347 4.24999 26.3934 7.43733 26.6807C13.1113 27.1934 18.824 27.1934 24.4973 26.6807C27.6853 26.3934 30.1167 23.8347 30.1167 20.7854V11.0067C30.1167 7.95735 27.6853 5.39869 24.498 5.11135C18.8226 4.59936 13.1127 4.59936 7.43733 5.11135C4.24999 5.39869 1.81799 7.95735 1.81799 11.0067Z"
        fill="var(--color-brand)"
        fillOpacity="0.8"
      />
      <path
        d="M28.4446 7.95602C28.704 7.67602 28.7086 7.23602 28.442 6.96336C27.3896 5.89595 25.9908 5.23922 24.4973 5.11136C18.824 4.59936 13.1113 4.59936 7.4373 5.11136C5.8153 5.25802 4.39197 5.99469 3.3833 7.08469C3.12197 7.36602 3.1433 7.80869 3.41463 8.08069L11.4766 16.1427C13.6333 18.2987 17.1613 18.3887 19.6186 16.338C22.7373 13.736 25.686 10.9347 28.4446 7.95602Z"
        fill="var(--color-border)"
        fillOpacity="0.8"
      />
    </svg>
  );
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat('zh-CN', { notation: 'compact', maximumFractionDigits: 1 }).format(value);
}

function formatHomeDate(value: string): string {
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(value));
}

function formatHomeClock(value: Date): string {
  return new Intl.DateTimeFormat('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'Asia/Shanghai',
  }).format(value);
}

function formatHomeDateHeading(value: Date): string {
  const parts = getHomeDateParts(value);

  return `${parts.year}/${parts.month}/${parts.day}`;
}

function formatHomeWeekday(value: Date): string {
  return new Intl.DateTimeFormat('zh-CN', {
    weekday: 'short',
    timeZone: 'Asia/Shanghai',
  }).format(value);
}

const homeCalendarWeekdays = ['一', '二', '三', '四', '五', '六', '日'];

function buildHomeCalendarDays(value: Date): Array<{ label: string; current: boolean; empty?: boolean }> {
  const parts = getHomeDateParts(value);
  const daysInMonth = new Date(parts.year, parts.month, 0).getDate();
  const firstWeekday = new Date(parts.year, parts.month - 1, 1).getDay();
  const mondayOffset = (firstWeekday + 6) % 7;
  const leadingDays = Array.from({ length: mondayOffset }, (_, index) => ({
    label: '',
    current: false,
    empty: true,
  }));

  const monthDays = Array.from({ length: daysInMonth }, (_, index) => {
    const day = index + 1;

    return {
      label: String(day),
      current: day === parts.day,
    };
  });

  return [...leadingDays, ...monthDays];
}

function getHomeDateParts(value: Date): { year: number; month: number; day: number } {
  const parts = new Intl.DateTimeFormat('en-US', {
    day: 'numeric',
    month: 'numeric',
    year: 'numeric',
    timeZone: 'Asia/Shanghai',
  }).formatToParts(value);

  return {
    day: Number(parts.find((part) => part.type === 'day')?.value ?? '1'),
    month: Number(parts.find((part) => part.type === 'month')?.value ?? '1'),
    year: Number(parts.find((part) => part.type === 'year')?.value ?? '1970'),
  };
}
