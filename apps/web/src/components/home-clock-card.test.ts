import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, test } from 'vitest';

describe('HomeClockCard', () => {
  test('renders a YYsuni-inspired segmented clock that refreshes on the client', () => {
    const source = readFileSync(join(process.cwd(), 'src/components/HomeClockCard.tsx'), 'utf8');

    expect(source).toContain("'use client';");
    expect(source).toContain('export function HomeClockCard()');
    expect(source).toContain('const [time, setTime] = useState(() => new Date());');
    expect(source).toContain('window.setInterval(() => setTime(new Date()), 1000 * 5);');
    expect(source).toContain('const hours = getClockPart(time.getHours());');
    expect(source).toContain('const minutes = getClockPart(time.getMinutes());');
    expect(source).toContain('aria-label={`当前时间 ${hours}:${minutes}`}');
    expect(source).toContain("className=\"portfolio-hero__clock-digits\"");
    expect(source).toContain('<SevenSegmentDigit value={Number(hours[0])} />');
    expect(source).toContain('<ClockColon />');
    expect(source).toContain('function SevenSegmentDigit');
    expect(source).toContain('const segmentMap: Record<number, boolean[]>');
    expect(source).toContain('data-active={active ?');
    expect(source).toContain('function ClockColon()');
  });
});
