import type { StudyHeatmapDay } from '@starry-summer/shared';

const monthFormatter = new Intl.DateTimeFormat('en', { month: 'short', timeZone: 'UTC' });
const weekdayLabels = ['Mon', 'Wed', 'Fri'];

export function StudyContributionGraph({ heatmapDays }: { heatmapDays: StudyHeatmapDay[] }) {
  const totalSubmissions = heatmapDays.reduce((total, day) => total + day.count, 0);
  const monthLabels = buildMonthLabels(heatmapDays);

  return (
    <section className="study-contribution-panel" aria-label="LeetCode 提交热力图">
      <div className="study-contribution-panel__header">
        <strong>{totalSubmissions} submissions in the last year</strong>
        <span>LeetCode activity</span>
      </div>

      <div className="study-contribution-months" aria-hidden="true">
        {monthLabels.map((label) => (
          <span key={`${label.month}-${label.column}`} style={{ gridColumn: `${label.column + 1}` }}>
            {label.month}
          </span>
        ))}
      </div>

      <div className="study-contribution-body">
        <div className="study-contribution-weekdays" aria-hidden="true">
          {weekdayLabels.map((label) => (
            <span key={label}>{label}</span>
          ))}
        </div>
        <div className="study-contribution-grid">
          {heatmapDays.map((day) => (
            <span
              key={day.date}
              data-level={getContributionLevel(day.count)}
              title={`${day.date}: ${day.count} submissions`}
            />
          ))}
        </div>
      </div>

      <div className="study-contribution-legend" aria-hidden="true">
        <span>Less</span>
        {[0, 1, 2, 3, 4].map((level) => (
          <i data-level={level} key={level} />
        ))}
        <span>More</span>
      </div>
    </section>
  );
}

function buildMonthLabels(days: StudyHeatmapDay[]) {
  let previousMonth = '';
  let previousColumn = -Infinity;

  return days.flatMap((day, index) => {
    const date = new Date(`${day.date}T00:00:00.000Z`);

    if (Number.isNaN(date.getTime())) {
      return [];
    }

    const month = monthFormatter.format(date);
    const column = Math.floor(index / 7);

    if (month === previousMonth || column - previousColumn < 4) {
      return [];
    }

    previousMonth = month;
    previousColumn = column;

    return [{ month, column }];
  });
}

function getContributionLevel(count: number) {
  if (count <= 0) return 0;
  if (count === 1) return 1;
  if (count <= 3) return 2;
  if (count <= 6) return 3;

  return 4;
}
