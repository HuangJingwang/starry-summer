import Link from 'next/link';

import { ContentCard } from '@/components/ContentCard';
import { SiteShell } from '@/components/SiteShell';
import { getPublicContent } from '@/lib/content';
import { loadSiteContent } from '@/lib/public-content';
import { loadPublicStudyDashboard } from '@/lib/study';

export default async function LeetCodeArchivePage() {
  const apiBaseUrl = process.env.API_BASE_URL;
  const [{ dashboard }, content] = await Promise.all([
    loadPublicStudyDashboard({ apiBaseUrl }),
    loadSiteContent(),
  ]);
  const recentReviews = getPublicContent(content)
    .filter((item) => item.tags?.some((tag) => ['LeetCode', '算法'].includes(tag)))
    .slice(0, 3);
  const recentStudyNotes = dashboard.recentNotes.slice(0, 4);

  return (
    <SiteShell>
      <main className="page-main study-archive-page">
        <section className="study-hero">
          <p className="eyebrow">LeetCode Trace</p>
          <h1>学习档案</h1>
          <p>把刷题、复习和算法笔记沉淀成长期可回看的公开轨迹。</p>
        </section>

        <section className="study-summary-grid" aria-label="学习总览">
          <SummaryCard label="已开始" value={`${dashboard.summary.startedProblems}/${dashboard.summary.totalProblems}`} />
          <SummaryCard label="完成率" value={`${dashboard.summary.completionRate}%`} />
          <SummaryCard label="连续打卡" value={`${dashboard.summary.streak} 天`} />
          <SummaryCard label="累计学习" value={`${dashboard.summary.totalDays} 天`} />
        </section>

        <section className="study-panel">
          <div className="section-heading section-heading--row">
            <div>
              <p className="eyebrow">学习热力</p>
              <h2>最近 12 周</h2>
            </div>
            <span>{dashboard.summary.lastActivityDate || '持续构建中'}</span>
          </div>
          <div className="study-heatmap" aria-label="学习热力图">
            {dashboard.heatmap.map((day) => (
              <span
                key={day.date}
                title={`${day.date}：${day.count} 次`}
                data-level={Math.min(4, day.count)}
              />
            ))}
          </div>
        </section>

        <section className="study-panel">
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

        <section className="study-panel">
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

        <section className="content-section">
          <div className="section-heading">
            <p className="eyebrow">复盘笔记</p>
            <h2>最近复盘</h2>
          </div>
          {recentReviews.length > 0 ? (
            <div className="content-grid">
              {recentReviews.map((item) => <ContentCard key={item.id} item={item} />)}
            </div>
          ) : recentStudyNotes.length > 0 ? (
            <div className="study-note-list">
              {recentStudyNotes.map((problem) => (
                <article key={problem.slug}>
                  <span>{problem.difficulty} · {problem.category}</span>
                  <strong>{problem.number}. {problem.title}</strong>
                  <p>{problem.notes}</p>
                </article>
              ))}
            </div>
          ) : (
            <div className="content-empty-card">
              <span>暂无复盘</span>
              <strong>还没有公开算法复盘</strong>
              <p>后台可以把题目笔记生成草稿，发布后会出现在这里。</p>
            </div>
          )}
        </section>
      </main>
    </SiteShell>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="study-summary-card">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
