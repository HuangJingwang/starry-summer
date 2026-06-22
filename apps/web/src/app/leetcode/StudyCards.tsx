import type { StudyProblem, StudyReviewTask, StudyTask } from '@starry-summer/shared';

import { getDifficultyTone, getLeetCodeProblemUrl, normalizeDifficultyLabel } from './leetcode-view-model';

export function StudyTaskCard({ task }: { task: StudyTask }) {
  return (
    <a className="study-task-card" href={getLeetCodeProblemUrl(task.slug)} target="_blank" rel="noreferrer">
      <span className={`study-difficulty study-difficulty--${getDifficultyTone(task.difficulty)}`}>
        {normalizeDifficultyLabel(task.difficulty)}
      </span>
      <strong>{task.title}</strong>
      <small>{task.category} · 开始 R1</small>
    </a>
  );
}

export function ReviewTaskCard({ task }: { task: StudyReviewTask }) {
  return (
    <a
      className="study-task-card study-task-card--review"
      href={getLeetCodeProblemUrl(task.slug)}
      target="_blank"
      rel="noreferrer"
    >
      <span className={`study-difficulty study-difficulty--${getDifficultyTone(task.difficulty)}`}>
        {normalizeDifficultyLabel(task.difficulty)}
      </span>
      <strong>{task.title}</strong>
      <small>
        {task.nextRound} · {task.dueDate} 到期 · {task.forcedByMustRepeat ? '重点复刷' : `逾期 ${task.overdueDays} 天`}
      </small>
    </a>
  );
}

export function StudyEmptyCard({ title, body }: { title: string; body: string }) {
  return (
    <div className="study-task-empty">
      <strong>{title}</strong>
      <p>{body}</p>
    </div>
  );
}

export function StudyNoteCard({ problem }: { problem: StudyProblem }) {
  return (
    <article className="study-note-card">
      <span>{problem.category}</span>
      <strong>{problem.title}</strong>
      <p>{problem.notes}</p>
      <small>{problem.mustRepeat ? '重点复刷' : '复盘摘记'} · {problem.updatedAt || '等待同步'}</small>
    </article>
  );
}
