import Link from 'next/link';

import type { StudyDashboard, StudyProblem, StudyReviewTask, StudyTask } from '@starry-summer/shared';

import { SiteShell } from '@/components/SiteShell';
import { buildStudyHeatmapWindow } from '@/lib/study-heatmap';
import { loadRepositoryStudyDashboard } from '@/lib/study-repository';

export default async function LeetCodeArchivePage() {
  const { dashboard } = await loadRepositoryStudyDashboard();
  const roundTrack = buildRoundTrack(dashboard);
  const lastSyncLabel = dashboard.settings.updatedAt || dashboard.summary.lastActivityDate || '等待同步';
  const categoryCount = dashboard.categories.length;
  const heatmapDays = buildStudyHeatmapWindow(
    dashboard.heatmap,
    dashboard.summary.lastActivityDate || dashboard.settings.updatedAt,
  );

  return (
    <SiteShell>
      <main className="page-main study-archive-page">
        <div className="page-title-row study-title-row">
          <div className="page-title">
            <p className="eyebrow">LeetCode Trace</p>
            <h1>算法练习快照</h1>
            <p>Hot100、五轮复习和最近同步记录。公开页只保留进度、节奏和可继续查看的入口。</p>
          </div>
          <div className="posts-page-actions">
            <nav className="sort-tabs" aria-label="刷题日记导航">
              <a href="#today-plan">今日</a>
              <a href="#review-rhythm">复习</a>
              <Link href="/posts?tag=LeetCode">文章</Link>
            </nav>
          </div>
        </div>

        <section className="study-snapshot-hero" aria-label="LeetCode 学习快照">
          <div className="study-snapshot-hero__copy">
            <span>Repository snapshot</span>
            <strong>{dashboard.settings.activeListId.toUpperCase()}</strong>
            <p>
              最近同步 {lastSyncLabel}
              {dashboard.settings.leetcodeUsername ? ` · @${dashboard.settings.leetcodeUsername}` : ' · 仓库快照'}
            </p>
          </div>

          <a className="study-progress-link" href="#review-rhythm" aria-label="查看五轮复习轨道">
            <span>完成率</span>
            <strong>{dashboard.summary.completionRate}%</strong>
            <small>{dashboard.summary.doneRounds}/{dashboard.summary.totalRounds} 轮次完成 · 点击查看复习轨道</small>
          </a>

          <div className="study-snapshot-links" aria-label="学习数据入口">
            <a className="study-snapshot-link" href="#today-plan">
              <span>Today</span>
              <strong>{dashboard.settings.dailyNew} / {dashboard.settings.dailyReview}</strong>
              <small>新题 / 复习</small>
            </a>
            <a className="study-snapshot-link" href="#activity">
              <span>Streak</span>
              <strong>{dashboard.summary.streak} 天</strong>
              <small>累计 {dashboard.summary.totalDays} 天</small>
            </a>
            <a className="study-snapshot-link" href="#categories">
              <span>Types</span>
              <strong>{categoryCount} 类</strong>
              <small>{dashboard.summary.startedProblems}/{dashboard.summary.totalProblems} 已开始</small>
            </a>
          </div>

          <nav className="study-round-links" aria-label="五轮复习入口">
            {roundTrack.map((round) => (
              <a className="study-round-link" href="#review-rhythm" key={round.label}>
                <span>{round.label}</span>
                <strong>{round.rate}%</strong>
                <small>{round.note}</small>
              </a>
            ))}
          </nav>
        </section>

        <section className="content-section study-overview-section" aria-label="学习总览">
          <div className="study-mini-stat-row">
            <a href="#today-plan">今日 {dashboard.settings.dailyNew} 新题 / {dashboard.settings.dailyReview} 复习</a>
            <a href="#review-rhythm">{dashboard.settings.roundCount} 轮复习</a>
            <a href="#activity">最近活动 {dashboard.summary.lastActivityDate || '等待同步'}</a>
            <a href="#categories">{categoryCount} 个题型分类</a>
          </div>
        </section>

        <section className="content-section" id="today-plan" aria-label="今日刷题任务">
          <div className="section-heading section-heading--row">
            <div>
              <p className="eyebrow">今日任务</p>
              <h2>新题与复习</h2>
            </div>
            <span>{dashboard.settings.dailyNew} 新题 / {dashboard.settings.dailyReview} 复习</span>
          </div>
          <div className="study-task-grid">
            <div className="study-task-group">
              <h3>今日新题</h3>
              <div className="study-task-list">
                {dashboard.todayFocus.length > 0 ? dashboard.todayFocus.map((task) => (
                  <StudyTaskCard key={task.slug} task={task} />
                )) : <StudyEmptyCard title="今日新题队列为空" body="同步题单后，这里会按计划列出下一批 R1 题目。" />}
              </div>
            </div>
            <div className="study-task-group">
              <h3>到期复习</h3>
              <div className="study-task-list">
                {dashboard.reviewDue.length > 0 ? dashboard.reviewDue.map((task) => (
                  <ReviewTaskCard key={`${task.slug}-${task.nextRound}-${task.dueDate}`} task={task} />
                )) : <StudyEmptyCard title="暂无到期复习" body={`当前复习间隔：${dashboard.settings.reviewIntervals.join(' / ')} 天。`} />}
              </div>
            </div>
          </div>
        </section>

        <section className="content-section" aria-label="错因复盘">
          <div className="section-heading section-heading--row">
            <div>
              <p className="eyebrow">Mistake Notes</p>
              <h2>错因与知识点</h2>
            </div>
            <span>{dashboard.recentNotes.length > 0 ? `${dashboard.recentNotes.length} 条摘记` : '等待沉淀'}</span>
          </div>
          <div className="study-note-grid">
            {dashboard.recentNotes.length > 0 ? dashboard.recentNotes.slice(0, 4).map((problem) => (
              <StudyNoteCard key={problem.slug} problem={problem} />
            )) : (
              <StudyEmptyCard
                title="暂无错因记录"
                body="在后台为题目补充错因、知识点和下一步动作后，这里会拆成可复盘的小卡片。"
              />
            )}
          </div>
        </section>

        <section className="content-section study-round-track" id="review-rhythm">
          <div className="section-heading section-heading--row">
            <div>
              <p className="eyebrow">Review Rhythm</p>
              <h2>五轮复习轨道</h2>
            </div>
            <span>{dashboard.settings.deadline ? `目标 ${dashboard.settings.deadline}` : '1 / 3 / 7 / 14 天复习节奏'}</span>
          </div>
          <div className="study-round-grid">
            {roundTrack.map((round) => (
              <article key={round.label}>
                <span>{round.label}</span>
                <strong>{round.title}</strong>
                <progress max={100} value={round.rate} aria-label={`${round.label} ${round.rate}%`} />
                <small>{round.done}/{round.total} · {round.note}</small>
              </article>
            ))}
          </div>
        </section>

        <section className="content-section" id="categories">
          <div className="section-heading">
            <p className="eyebrow">题型分类</p>
            <h2>分类进度</h2>
          </div>
          <div className="study-category-grid">
            {dashboard.categories.map((category) => (
              <a className="study-category-chip" href={`#${buildCategoryAnchor(category.name)}`} id={buildCategoryAnchor(category.name)} key={category.name}>
                <div>
                  <strong>{category.name}</strong>
                  <span>{category.rate}%</span>
                </div>
                <progress max={100} value={category.rate} aria-label={`${category.name}进度 ${category.rate}%`} />
                <small>{category.started}/{category.total} 已开始</small>
              </a>
            ))}
          </div>
        </section>

        <section className="content-section" id="activity">
          <div className="section-heading section-heading--row">
            <div>
              <p className="eyebrow">Activity</p>
              <h2>热力与提交</h2>
            </div>
            <span>{dashboard.summary.lastActivityDate || '持续构建中'}</span>
          </div>
          <div className="study-activity-grid">
            <div className="study-heatmap" aria-label="学习热力图">
              {heatmapDays.map((day) => (
                <span
                  key={day.date}
                  title={`${day.date}：${day.count} 次`}
                  data-level={Math.min(4, day.count)}
                />
              ))}
            </div>
            <div className="leetcode-list">
              {dashboard.recentSubmissions.length > 0 ? dashboard.recentSubmissions.map((submission) => (
                <a className="leetcode-item" href={submission.problemUrl} key={`${submission.titleSlug}-${submission.submittedAt}`} target="_blank" rel="noreferrer">
                  <span>{submission.status}</span>
                  <strong>{submission.title}</strong>
                  <small>{submission.language} · {submission.submittedAtLabel}</small>
                </a>
              )) : <p className="content-empty-card">暂无同步记录，后台配置 LeetCode 用户名后会显示最近提交。</p>}
            </div>
          </div>
        </section>

        <p className="study-return-home"><Link href="/">返回首页</Link></p>
      </main>
    </SiteShell>
  );
}

function StudyTaskCard({ task }: { task: StudyTask }) {
  return (
    <a className="study-task-card" href={getLeetCodeProblemUrl(task.slug)} target="_blank" rel="noreferrer">
      <span className={`study-difficulty study-difficulty--${getDifficultyTone(task.difficulty)}`}>{normalizeDifficultyLabel(task.difficulty)}</span>
      <strong>{task.title}</strong>
      <small>{task.category} · 开始 R1</small>
    </a>
  );
}

function StudyEmptyCard({ title, body }: { title: string; body: string }) {
  return (
    <div className="study-task-empty">
      <strong>{title}</strong>
      <p>{body}</p>
    </div>
  );
}

function ReviewTaskCard({ task }: { task: StudyReviewTask }) {
  return (
    <a className="study-task-card study-task-card--review" href={getLeetCodeProblemUrl(task.slug)} target="_blank" rel="noreferrer">
      <span className={`study-difficulty study-difficulty--${getDifficultyTone(task.difficulty)}`}>{normalizeDifficultyLabel(task.difficulty)}</span>
      <strong>{task.title}</strong>
      <small>{task.nextRound} · {task.dueDate} 到期 · {task.forcedByMustRepeat ? '重点复刷' : `逾期 ${task.overdueDays} 天`}</small>
    </a>
  );
}

function StudyNoteCard({ problem }: { problem: StudyProblem }) {
  return (
    <article className="study-note-card">
      <span>{problem.category}</span>
      <strong>{problem.title}</strong>
      <p>{problem.notes}</p>
      <small>{problem.mustRepeat ? '重点复刷' : '复盘摘记'} · {problem.updatedAt || '等待同步'}</small>
    </article>
  );
}

function buildRoundTrack(dashboard: StudyDashboard) {
  const total = Math.max(1, dashboard.summary.totalProblems);
  const intervals = dashboard.settings.reviewIntervals;
  const problemRounds = dashboard.problems.length > 0
    ? Array.from({ length: dashboard.settings.roundCount }, (_, index) =>
        dashboard.problems.filter((problem) => Boolean(problem.rounds[index])).length,
      )
    : distributeDoneRounds(dashboard.summary.doneRounds, dashboard.settings.roundCount, total);

  return Array.from({ length: dashboard.settings.roundCount }, (_, index) => {
    const done = Math.min(total, problemRounds[index] ?? 0);
    const rate = Math.round((done / total) * 100);
    const interval = index === 0 ? '首次完成' : `+${intervals[index - 1] ?? '?'} 天`;

    return {
      label: `R${index + 1}`,
      title: index === 0 ? '新题建档' : '间隔复习',
      note: interval,
      done,
      total,
      rate,
    };
  });
}

function buildCategoryAnchor(name: string) {
  return `category-${name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'uncategorized'}`;
}

function distributeDoneRounds(doneRounds: number, roundCount: number, totalProblems: number) {
  let remaining = doneRounds;

  return Array.from({ length: roundCount }, () => {
    const done = Math.max(0, Math.min(totalProblems, remaining));
    remaining -= done;

    return done;
  });
}

export function getLeetCodeProblemUrl(slug: string) {
  return `https://leetcode.com/problems/${slug}/`;
}

function normalizeDifficultyLabel(difficulty: string) {
  return ['简单', '中等', '困难'].includes(difficulty) ? difficulty : '未标注';
}

function getDifficultyTone(difficulty: string) {
  if (difficulty === '中等') {
    return 'medium';
  }

  if (difficulty === '困难') {
    return 'hard';
  }

  return 'easy';
}
