import Link from 'next/link';

import { SiteShell } from '@/components/SiteShell';
import { loadRepositoryStudyDashboard } from '@/lib/study-repository';

import { StudyTodaySection } from '../StudyTodaySection';

export default async function LeetCodeTodayPage() {
  const { dashboard } = await loadRepositoryStudyDashboard();

  return (
    <SiteShell>
      <main className="study-archive-page">
        <header className="page-title"><p className="eyebrow">TODAY / PRACTICE LOG</p><h1>今日练习</h1><p>从一道题开始，继续昨天的思路。</p></header>
        <StudyTodaySection dashboard={dashboard} />

        <p className="study-return-home">
          <Link href="/leetcode">返回刷题日记</Link>
        </p>
      </main>
    </SiteShell>
  );
}
