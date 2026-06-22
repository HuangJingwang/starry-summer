import type { StudyDashboard, StudyReviewTask, StudyTask } from '@starry-summer/shared';

import { getDifficultyTone, getLeetCodeProblemUrl, normalizeDifficultyLabel } from './leetcode-view-model';

export function StudyDailyCards({ dashboard }: { dashboard: StudyDashboard }) {
  const todayTask = dashboard.todayFocus[0];
  const reviewTask = dashboard.reviewDue[0];

  return (
    <div className="study-daily-card-grid" aria-label="今日 LeetCode 入口">
      {todayTask ? (
        <DailyProblemCard label="今日推荐题目" task={todayTask} meta={`${todayTask.category} · 开始 R1`} />
      ) : (
        <DailyEmptyCard label="今日推荐题目" body="新题队列暂时为空" />
      )}

      {reviewTask ? (
        <DailyProblemCard label="今日复习题目" task={reviewTask} meta={formatReviewMeta(reviewTask)} />
      ) : (
        <DailyEmptyCard label="今日复习题目" body="暂无到期复习" />
      )}
    </div>
  );
}

function DailyProblemCard({ label, meta, task }: { label: string; meta: string; task: StudyTask }) {
  return (
    <a
      className={`study-daily-card study-daily-card--${getDifficultyTone(task.difficulty)}`}
      href={getLeetCodeProblemUrl(task.slug)}
      target="_blank"
      rel="noreferrer"
    >
      <span>{label}</span>
      <strong>{task.title}</strong>
      <small>
        {normalizeDifficultyLabel(task.difficulty)} · {meta}
      </small>
    </a>
  );
}

function DailyEmptyCard({ body, label }: { body: string; label: string }) {
  return (
    <div className="study-daily-card study-daily-card--empty">
      <span>{label}</span>
      <strong>{body}</strong>
      <small>等待下一次同步</small>
    </div>
  );
}

function formatReviewMeta(task: StudyReviewTask) {
  return `${task.nextRound} · ${task.dueDate} 到期 · ${
    task.forcedByMustRepeat ? '重点复刷' : `逾期 ${task.overdueDays} 天`
  }`;
}
