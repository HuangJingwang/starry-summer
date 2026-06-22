import type { LeetCodeArchiveViewModel } from './leetcode-view-model';
import { StudyContributionGraph } from './StudyContributionGraph';
import { StudyDailyCards } from './StudyDailyCards';

export function StudySnapshotHero({ viewModel }: { viewModel: LeetCodeArchiveViewModel }) {
  const { categoryCount, dashboard, lastSyncLabel, roundTrack } = viewModel;
  const visibleCategories = dashboard.categories.slice(0, 6);

  return (
    <section className="study-snapshot-hero" aria-label="LeetCode 学习进度">
      <div className="study-snapshot-hero__ambient" aria-hidden="true" />

      <div className="study-snapshot-hero__copy">
        <span>LeetCode Trace</span>
        <strong>Hot100 / Review Log</strong>
        <p>
          Hot100 的公开学习记录，只展示进度、节奏和继续查看的入口。最近同步 {lastSyncLabel}
          {dashboard.settings.leetcodeUsername ? ` · @${dashboard.settings.leetcodeUsername}` : ' · 仓库快照'}。
        </p>
      </div>

      <div className="study-snapshot-metrics" aria-label="核心学习数据">
        <a href="#review-rhythm">
          <span>进度</span>
          <strong>{dashboard.summary.completionRate}%</strong>
        </a>
        <a href="#review-rhythm">
          <span>复习</span>
          <strong>{dashboard.settings.roundCount} 轮</strong>
        </a>
        <a href="#categories">
          <span>分类</span>
          <strong>{categoryCount} 类</strong>
        </a>
        <a href="/posts?tag=LeetCode">
          <span>文章</span>
          <strong>笔记</strong>
        </a>
      </div>

      <StudyDailyCards dashboard={dashboard} />

      <StudyContributionGraph heatmapDays={viewModel.heatmapDays} />

      <details className="study-snapshot-detail" id="review-rhythm">
        <summary>
          <span>复习轮次</span>
          <strong>R1 - R{dashboard.settings.roundCount}</strong>
        </summary>
        <div className="study-snapshot-detail__body" aria-label="复习轮次入口">
          {roundTrack.map((round) => (
            <a className="study-round-link" href="#review-rhythm" key={round.label}>
              <span>{round.label}</span>
              <strong>{round.rate}%</strong>
            </a>
          ))}
        </div>
      </details>

      <details className="study-snapshot-detail study-snapshot-detail--categories" id="categories">
        <summary>
          <span>题型分类</span>
          <strong>{categoryCount} 类</strong>
        </summary>
        <div className="study-snapshot-detail__body" aria-label="题型分类入口">
          {visibleCategories.map((category) => (
            <a className="study-category-chip" href="/posts?tag=LeetCode" key={category.name}>
              <strong>{category.name}</strong>
              <span>{category.rate}%</span>
            </a>
          ))}
        </div>
      </details>
    </section>
  );
}
