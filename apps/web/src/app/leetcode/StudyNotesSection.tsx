import type { StudyDashboard } from '@starry-summer/shared';

import { PublicContentSection } from '@/components/PublicPageLayout';

import { StudyEmptyCard, StudyNoteCard } from './StudyCards';

export function StudyNotesSection({ dashboard }: { dashboard: StudyDashboard }) {
  return (
    <PublicContentSection
      ariaLabel="错因复盘"
      eyebrow="Mistake Notes"
      title="错因与知识点"
      headingRow
      meta={dashboard.recentNotes.length > 0 ? `${dashboard.recentNotes.length} 条摘记` : '等待沉淀'}
    >
      <div className="study-note-grid">
        {dashboard.recentNotes.length > 0 ? (
          dashboard.recentNotes.slice(0, 4).map((problem) => (
            <StudyNoteCard key={problem.slug} problem={problem} />
          ))
        ) : (
          <StudyEmptyCard
            title="暂无错因记录"
            body="在后台为题目补充错因、知识点和下一步动作后，这里会拆成可复盘的小卡片。"
          />
        )}
      </div>
    </PublicContentSection>
  );
}
