import type { StudyDashboard } from '@starry-summer/shared';

import { PublicContentSection } from '@/components/PublicPageLayout';

import type { StudyRoundTrackItem } from './leetcode-view-model';

export function StudyRoundTrack({
  dashboard,
  roundTrack,
}: {
  dashboard: StudyDashboard;
  roundTrack: StudyRoundTrackItem[];
}) {
  return (
    <PublicContentSection
      id="review-rhythm"
      className="study-round-track"
      eyebrow="Review Rhythm"
      title="五轮复习轨道"
      headingRow
      meta={dashboard.settings.deadline ? `目标 ${dashboard.settings.deadline}` : '1 / 3 / 7 / 14 天复习节奏'}
    >
      <div className="study-round-grid">
        {roundTrack.map((round) => (
          <article key={round.label}>
            <span>{round.label}</span>
            <strong>{round.title}</strong>
            <progress max={100} value={round.rate} aria-label={`${round.label} ${round.rate}%`} />
            <small>
              {round.done}/{round.total} · {round.note}
            </small>
          </article>
        ))}
      </div>
    </PublicContentSection>
  );
}
