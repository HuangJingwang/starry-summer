import type { StudyDashboard, StudyReportPeriod } from '@starry-summer/shared';

interface AdminStudyTaskPanelProps {
  dashboard: StudyDashboard;
  actionDisabled: boolean;
  createReportDraft: (period: StudyReportPeriod) => Promise<void>;
}

export function AdminStudyTaskPanel({ actionDisabled, createReportDraft, dashboard }: AdminStudyTaskPanelProps) {
  return (
    <section className="admin-study-section">
      <div className="admin-study-section__header">
        <div>
          <h2>今日任务</h2>
          <p>优先处理到期复习，再补充同分类新题。</p>
        </div>
        <div className="admin-study-actions">
          <button type="button" onClick={() => createReportDraft('week')} disabled={actionDisabled} aria-disabled={actionDisabled}>
            生成周报草稿
          </button>
          <button type="button" onClick={() => createReportDraft('month')} disabled={actionDisabled} aria-disabled={actionDisabled}>
            生成月报草稿
          </button>
        </div>
      </div>
      <div className="admin-study-task-grid">
        {dashboard.reviewDue.map((task) => (
          <article key={task.slug}>
            <span>{task.nextRound} / 逾期 {task.overdueDays} 天</span>
            <strong>{task.title}</strong>
            <small>{task.category} / {task.difficulty}</small>
          </article>
        ))}
        {dashboard.todayFocus.map((task) => (
          <article key={task.slug}>
            <span>新题</span>
            <strong>{task.title}</strong>
            <small>{task.category} / {task.difficulty}</small>
          </article>
        ))}
      </div>
    </section>
  );
}
