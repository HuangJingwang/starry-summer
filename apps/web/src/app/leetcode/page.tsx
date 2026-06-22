import Link from 'next/link';

import type { StudyDashboard, StudyProblem, StudyReviewTask, StudyTask } from '@starry-summer/shared';

import { SiteShell } from '@/components/SiteShell';
import { buildStudyHeatmapWindow } from '@/lib/study-heatmap';
import { loadRepositoryStudyDashboard } from '@/lib/study-repository';

export default async function LeetCodeArchivePage() {
  const { dashboard } = await loadRepositoryStudyDashboard();
  const roundTrack = buildRoundTrack(dashboard);
  const lastSyncLabel = dashboard.settings.updatedAt || dashboard.summary.lastActivityDate || '等待同步';
  const heatmapDays = buildStudyHeatmapWindow(
    dashboard.heatmap,
    dashboard.summary.lastActivityDate || dashboard.settings.updatedAt,
  );

  return (
    <SiteShell>
      <main className="page-main study-archive-page">
        <div className="page-title-row">
          <div className="page-title">
            <p className="eyebrow">LeetCode Trace</p>
            <h1>刷题日记</h1>
            <p>把每日练习、间隔复习和算法复盘留在同一条长期学习轨迹里。</p>
          </div>
          <div className="posts-page-actions">
            <nav className="sort-tabs" aria-label="刷题日记导航">
              <a href="#today-plan">今日</a>
              <a href="#review-rhythm">复习</a>
              <Link href="/posts?tag=LeetCode">文章</Link>
            </nav>
          </div>
        </div>

        <section className="content-section study-overview-section" aria-label="学习总览">
          <div className="study-metric-grid">
            <SummaryCard label="完成率" value={`${dashboard.summary.completionRate}%`} hint={`${dashboard.summary.doneRounds}/${dashboard.summary.totalRounds} 轮次`} />
            <SummaryCard label="已开始" value={`${dashboard.summary.startedProblems}/${dashboard.summary.totalProblems}`} hint="题单覆盖" />
            <SummaryCard label="连续打卡" value={`${dashboard.summary.streak} 天`} hint={`累计 ${dashboard.summary.totalDays} 天`} />
            <SummaryCard label="最近同步" value={lastSyncLabel} hint={dashboard.settings.leetcodeUsername ? `@${dashboard.settings.leetcodeUsername}` : '仓库快照'} />
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

        <section className="content-section">
          <div className="section-heading section-heading--row">
            <div>
              <p className="eyebrow">学习热力</p>
              <h2>最近 12 周</h2>
            </div>
            <span>{dashboard.summary.lastActivityDate || '持续构建中'}</span>
          </div>
          <div className="study-heatmap" aria-label="学习热力图">
            {heatmapDays.map((day) => (
              <span
                key={day.date}
                title={`${day.date}：${day.count} 次`}
                data-level={Math.min(4, day.count)}
              />
            ))}
          </div>
        </section>

        <section className="content-section">
          <div className="section-heading">
            <p className="eyebrow">题型分类</p>
            <h2>分类进度</h2>
          </div>
          <div className="study-category-grid">
            {dashboard.categories.map((category) => (
              <article key={category.name}>
                <div>
                  <strong>{category.name}</strong>
                  <span>{category.rate}%</span>
                </div>
                <progress max={100} value={category.rate} aria-label={`${category.name}进度 ${category.rate}%`} />
                <small>{category.started}/{category.total} 已开始</small>
              </article>
            ))}
          </div>
        </section>

        <section className="content-section">
          <div className="section-heading section-heading--row">
            <div>
              <p className="eyebrow">提交记录</p>
              <h2>最近提交</h2>
            </div>
            <Link href="/">返回首页</Link>
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
        </section>
      </main>
    </SiteShell>
  );
}

function SummaryCard({ label, value, hint }: { label: string; value: string; hint: string }) {
  const className = value.length > 7 ? 'study-metric-card study-metric-card--compact' : 'study-metric-card';

  return (
    <div className={className}>
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{hint}</small>
    </div>
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
