import type { StudyDashboard } from '@starry-summer/shared';
import type { CSSProperties } from 'react';

import { PublicContentSection } from '@/components/PublicPageLayout';

import { ReviewTaskCard, StudyEmptyCard, StudyTaskCard } from './StudyCards';

export function StudyTodaySection({ dashboard }: { dashboard: StudyDashboard }) {
  const todayCount = dashboard.todayFocus.length;
  const reviewCount = dashboard.reviewDue.length;
  const rhythmLabel = `${dashboard.settings.dailyNew}+${dashboard.settings.dailyReview}`;
  const rhythmStyle = {
    '--study-new-share': `${Math.max(1, dashboard.settings.dailyNew)}fr`,
    '--study-review-share': `${Math.max(1, dashboard.settings.dailyReview)}fr`,
  } as CSSProperties;

  return (
    <PublicContentSection
      id="today-plan"
      ariaLabel="今日刷题任务"
      eyebrow="今日任务"
      title="新题与复习"
      className="study-today-section"
      headingRow
      meta={`${dashboard.settings.dailyNew} 新题 / ${dashboard.settings.dailyReview} 复习`}
    >
      <div className="study-today-summary" aria-label="今日任务摘要">
        <div className="study-today-summary__stats">
          <div className="study-today-summary__card">
            <span>今日新题</span>
            <strong>{todayCount}</strong>
            <small>按计划开始 R1</small>
          </div>
          <div className="study-today-summary__card">
            <span>到期复习</span>
            <strong>{reviewCount}</strong>
            <small>先清理逾期轮次</small>
          </div>
        </div>
        <div className="study-rhythm-panel">
          <div>
            <span>每日节奏</span>
            <strong>{rhythmLabel}</strong>
            <small>新题和复习的今日比例</small>
          </div>
          <div className="study-rhythm-track" style={rhythmStyle} aria-label={`今日节奏：${rhythmLabel}`}>
            <span className="study-rhythm-track__new">新题</span>
            <span className="study-rhythm-track__review">复习</span>
          </div>
        </div>
      </div>
      <div className="study-task-grid">
        <div className="study-task-group study-task-group--new">
          <div className="study-task-group__heading">
            <h3>今日新题</h3>
            <span>{todayCount} 题</span>
          </div>
          <div className="study-task-list">
            {todayCount > 0 ? (
              dashboard.todayFocus.map((task) => <StudyTaskCard key={task.slug} task={task} />)
            ) : (
              <StudyEmptyCard title="今日新题队列为空" body="同步题单后，这里会按计划列出下一批 R1 题目。" />
            )}
          </div>
        </div>
        <div className="study-task-group study-task-group--review">
          <div className="study-task-group__heading">
            <h3>到期复习</h3>
            <span>{reviewCount} 题</span>
          </div>
          <div className="study-task-list">
            {reviewCount > 0 ? (
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
