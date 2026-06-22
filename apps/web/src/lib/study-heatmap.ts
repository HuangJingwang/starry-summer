import type { StudyHeatmapDay } from '@starry-summer/shared';

const heatmapWindowDays = 365;
const millisecondsPerDay = 24 * 60 * 60 * 1000;

export function buildStudyHeatmapWindow(days: StudyHeatmapDay[], endDate?: string): StudyHeatmapDay[] {
  const countsByDate = new Map(days.map((day) => [day.date, day.count]));
  const end = parseDate(endDate) ?? findLatestDate(days);

  if (!end) {
    return [];
  }

  const startTime = end.getTime() - (heatmapWindowDays - 1) * millisecondsPerDay;

  return Array.from({ length: heatmapWindowDays }, (_, index) => {
    const date = formatDate(new Date(startTime + index * millisecondsPerDay));

    return {
      date,
      count: countsByDate.get(date) ?? 0,
    };
  });
}

function findLatestDate(days: StudyHeatmapDay[]) {
  return days.reduce<Date | null>((latest, day) => {
    const date = parseDate(day.date);

    if (!date) {
      return latest;
    }

    if (!latest || date.getTime() > latest.getTime()) {
      return date;
    }

    return latest;
  }, null);
}

function parseDate(input?: string) {
  if (!input || !/^\d{4}-\d{2}-\d{2}$/.test(input)) {
    return null;
  }

  const date = new Date(`${input}T00:00:00.000Z`);

  return Number.isNaN(date.getTime()) ? null : date;
}

function formatDate(date: Date) {
  return date.toISOString().slice(0, 10);
}
