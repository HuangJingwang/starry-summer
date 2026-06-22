import type { LeetCodeArchiveViewModel } from './leetcode-view-model';

export function StudyOverviewSection({ viewModel }: { viewModel: LeetCodeArchiveViewModel }) {
  const { categoryCount, dashboard } = viewModel;

  return (
    <section className="content-section study-overview-section" aria-label="学习总览">
      <div className="study-mini-stat-row">
        <a href="#today-plan">
          今日 {dashboard.settings.dailyNew} 新题 / {dashboard.settings.dailyReview} 复习
        </a>
        <a href="#review-rhythm">{dashboard.settings.roundCount} 轮复习</a>
        <a href="#activity">最近活动 {dashboard.summary.lastActivityDate || '等待同步'}</a>
        <a href="#categories">{categoryCount} 个题型分类</a>
      </div>
    </section>
  );
}
