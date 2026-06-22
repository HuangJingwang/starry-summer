import type { StudyDashboard, StudyHeatmapDay } from '@starry-summer/shared';

import { PublicContentSection } from '@/components/PublicPageLayout';

export function StudyActivityPanel({
  dashboard,
  heatmapDays,
}: {
  dashboard: StudyDashboard;
  heatmapDays: StudyHeatmapDay[];
}) {
  return (
    <PublicContentSection
      id="activity"
      eyebrow="Activity"
      title="热力与提交"
      headingRow
      meta={dashboard.summary.lastActivityDate || '持续构建中'}
    >
      <div className="study-activity-grid">
        <div className="study-heatmap" aria-label="学习热力图">
          {heatmapDays.map((day) => (
            <span key={day.date} title={`${day.date}：${day.count} 次`} data-level={Math.min(4, day.count)} />
          ))}
        </div>
        <div className="leetcode-list">
          {dashboard.recentSubmissions.length > 0 ? (
            dashboard.recentSubmissions.map((submission) => (
              <a
                className="leetcode-item"
                href={submission.problemUrl}
                key={`${submission.titleSlug}-${submission.submittedAt}`}
                target="_blank"
                rel="noreferrer"
              >
                <span>{submission.status}</span>
                <strong>{submission.title}</strong>
                <small>
                  {submission.language} · {submission.submittedAtLabel}
                </small>
              </a>
            ))
          ) : (
            <p className="content-empty-card">暂无同步记录，后台配置 LeetCode 用户名后会显示最近提交。</p>
          )}
        </div>
      </div>
    </PublicContentSection>
  );
}
