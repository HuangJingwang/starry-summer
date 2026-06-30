import Image from 'next/image';
import { Braces, FileText, Heart, Mail } from 'lucide-react';

import { BlurredBubblesCanvas } from '@/components/BlurredBubblesCanvas';
import { HomeCardNav } from '@/components/HomeCardNav';
import { HomeClockCard } from '@/components/HomeClockCard';
import { HomeAdminControl } from '@/components/HomeAdminControl';
import { HomeContactButton } from '@/components/HomeContactButton';
import { HomeFleetBackground } from '@/components/HomeFleetBackground';
import { HomeIntroCard } from '@/components/HomeIntroCard';
import { SiteShell } from '@/components/SiteShell';
import { StarrySkyCanvas } from '@/components/StarrySkyCanvas';
import { getContentHref } from '@/lib/content';
import { getContentCover } from '@/lib/content-cover';
import { buildHomeLeetCodeRecommendation, type HomeLeetCodeRecommendation } from '@/lib/home-leetcode-recommendation';
import { buildHomeProfileModel } from '@/lib/home-profile';
import { loadSiteContent } from '@/lib/public-content';
import { loadSiteSettings } from '@/lib/settings-repository';
import { loadRepositoryStudyDashboard } from '@/lib/study-repository';

const homeGitHubUrl = 'https://github.com/HuangJingwang/starry-summer';

export default async function HomePage() {
  const [content, settings, study] = await Promise.all([
    loadSiteContent(),
    loadSiteSettings(),
    loadRepositoryStudyDashboard(),
  ]);
  const profile = buildHomeProfileModel(settings, content);
  const stats = profile.stats;
  const heroLead = '在这里记录技术文章、工程实践和一些生活里的光。';
  const latestArticle = profile.latestArticle;
  const latestArticleCover = latestArticle ? getContentCover(latestArticle) : null;
  const juejinLink = settings.profile.socialLinks.find((link) => link.href.includes('juejin.cn'));
  const studyDashboard = study.dashboard;
  const recommendedProblem = buildHomeLeetCodeRecommendation(studyDashboard);
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
              <img
                className="portfolio-hero__sky-image portfolio-hero__sky-image--night"
                src="/images/starry-night-atmosphere.webp"
                alt="Starry Summer night atmosphere"
              />
              <img
                className="portfolio-hero__sky-image portfolio-hero__sky-image--day"
                src="/images/yysuni-atmosphere.jpg"
                alt="YYsuni reference atmosphere"
              />
            </aside>

            <div className="portfolio-hero__center-stack">
              <HomeIntroCard ownerName={profile.ownerName} lead={heroLead} />

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
                  <HomeAdminControl />
                  <HomeContactButton
                    className="portfolio-hero__social portfolio-hero__social--guestbook"
                    href="/guestbook"
                    ariaLabel="打开留言板"
                  >
                    <Mail className="portfolio-hero__social-icon portfolio-hero__social-icon--email" strokeWidth={1.8} aria-hidden="true" />
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

            <HomeLeetCodeCard recommendation={recommendedProblem} />

            <HomeClockCard />

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

function HomeLeetCodeCard({ recommendation }: { recommendation: HomeLeetCodeRecommendation | null }) {
  return (
    <aside className="portfolio-hero__leetcode-card" aria-label="今日推荐 LeetCode 题目">
      <div className="portfolio-hero__leetcode-head">
        <span className="portfolio-hero__leetcode-icon" aria-hidden="true">
          <Braces size={22} strokeWidth={1.8} />
        </span>
        <span>今日推荐</span>
      </div>
      {recommendation ? (
        <a href={recommendation.href} target="_blank" rel="noreferrer">
          <span className="portfolio-hero__leetcode-meta">
            <strong>{recommendation.label}</strong>
            <small>{recommendation.difficulty} · {recommendation.category}</small>
          </span>
          <b>{recommendation.title}</b>
          <span className="portfolio-hero__leetcode-description-label">题目描述</span>
          <p>{recommendation.description}</p>
        </a>
      ) : (
        <p>题目描述：同步刷题数据后，这里会推荐未刷过的新题或到期复习题。</p>
      )}
    </aside>
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
