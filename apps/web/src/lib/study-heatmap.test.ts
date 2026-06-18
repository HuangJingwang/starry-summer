import { describe, expect, test } from 'vitest';

import { buildStudyHeatmapWindow } from './study-heatmap';

describe('study heatmap window', () => {
  test('pads sparse repository heatmap data into a 12-week window', () => {
    const heatmap = buildStudyHeatmapWindow(
      [
        { date: '2026-06-11', count: 1 },
        { date: '2026-06-12', count: 2 },
        { date: '2026-06-14', count: 2 },
      ],
      '2026-06-14',
    );

    expect(heatmap).toHaveLength(84);
    expect(heatmap[0]).toEqual({ date: '2026-03-23', count: 0 });
    expect(heatmap.at(-1)).toEqual({ date: '2026-06-14', count: 2 });
    expect(heatmap.find((day) => day.date === '2026-06-11')).toEqual({ date: '2026-06-11', count: 1 });
    expect(heatmap.find((day) => day.date === '2026-06-13')).toEqual({ date: '2026-06-13', count: 0 });
  });
});
