import Link from 'next/link';

import { SiteShell } from '@/components/SiteShell';
import { loadRepositoryStudyDashboard } from '@/lib/study-repository';

import { StudySnapshotHero } from './StudySnapshotHero';
import { buildLeetCodeArchiveViewModel } from './leetcode-view-model';

export default async function LeetCodeArchivePage() {
  const { dashboard } = await loadRepositoryStudyDashboard();
  const viewModel = buildLeetCodeArchiveViewModel(dashboard);

  return (
    <SiteShell>
      <main className="study-archive-page">
        <StudySnapshotHero viewModel={viewModel} />

        <p className="study-return-home">
          <Link href="/">返回首页</Link>
        </p>
      </main>
    </SiteShell>
  );
}
