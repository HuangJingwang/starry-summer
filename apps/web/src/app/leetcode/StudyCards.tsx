import type { StudyProblem, StudyReviewTask, StudyTask } from '@starry-summer/shared';

import { getDifficultyTone, getLeetCodeProblemUrl, normalizeDifficultyLabel } from './leetcode-view-model';

export function StudyTaskCard({ task }: { task: StudyTask }) {
  return (
    <a
      className="study-task-card study-task-card--new"
      href={getLeetCodeProblemUrl(task.slug)}
      target="_blank"
      rel="noreferrer"
    >
      <span className="study-task-card__round">R1</span>
      <span className="study-task-card__body">
        <strong>{task.title}</strong>
        <small>
          <span className={`study-difficulty study-difficulty--${getDifficultyTone(task.difficulty)}`}>
            {normalizeDifficultyLabel(task.difficulty)}
          </span>
          <span>{task.category}</span>
          <span>开始建档</span>
        </small>
      </span>
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
      <span className="study-task-card__round">{task.nextRound}</span>
      <span className="study-task-card__body">
        <strong>{task.title}</strong>
        <small>
          <span className={`study-difficulty study-difficulty--${getDifficultyTone(task.difficulty)}`}>
            {normalizeDifficultyLabel(task.difficulty)}
          </span>
          <span className="study-task-card__meta">{task.dueDate} 到期</span>
          <span
            className={
              task.forcedByMustRepeat ? 'study-task-card__meta' : 'study-task-card__meta study-task-card__meta--late'
            }
          >
            {task.forcedByMustRepeat ? '重点复刷' : `逾期 ${task.overdueDays} 天`}
          </span>
        </small>
      </span>
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
