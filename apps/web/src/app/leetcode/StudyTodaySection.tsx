import type { StudyDashboard } from '@starry-summer/shared';

import { PublicContentSection } from '@/components/PublicPageLayout';

import { ReviewTaskCard, StudyEmptyCard, StudyTaskCard } from './StudyCards';

export function StudyTodaySection({ dashboard }: { dashboard: StudyDashboard }) {
  return (
    <PublicContentSection
      id="today-plan"
      ariaLabel="今日刷题任务"
      eyebrow="今日任务"
      title="新题与复习"
      headingRow
      meta={`${dashboard.settings.dailyNew} 新题 / ${dashboard.settings.dailyReview} 复习`}
    >
      <div className="study-task-grid">
        <div className="study-task-group">
          <h3>今日新题</h3>
          <div className="study-task-list">
            {dashboard.todayFocus.length > 0 ? (
              dashboard.todayFocus.map((task) => <StudyTaskCard key={task.slug} task={task} />)
            ) : (
              <StudyEmptyCard title="今日新题队列为空" body="同步题单后，这里会按计划列出下一批 R1 题目。" />
            )}
          </div>
        </div>
        <div className="study-task-group">
          <h3>到期复习</h3>
          <div className="study-task-list">
            {dashboard.reviewDue.length > 0 ? (
              dashboard.reviewDue.map((task) => (
                <ReviewTaskCard key={`${task.slug}-${task.nextRound}-${task.dueDate}`} task={task} />
              ))
            ) : (
              <StudyEmptyCard
                title="暂无到期复习"
                body={`当前复习间隔：${dashboard.settings.reviewIntervals.join(' / ')} 天。`}
              />
            )}
          </div>
        </div>
      </div>
    </PublicContentSection>
  );
}
