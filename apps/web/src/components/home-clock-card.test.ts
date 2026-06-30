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
    expect(source).not.toContain('LOCAL TIME');
    expect(source).not.toContain('formatClockDate');
    expect(source).not.toContain('<small>');
    expect(source).toContain('function SevenSegmentDigit');
    expect(source).toContain('const segmentMap: Record<number, boolean[]>');
    expect(source).toContain('width="29" height="52" viewBox="0 0 29 52"');
    expect(source).toContain('className="portfolio-hero__clock-segment"');
    expect(source).toContain("data-active={segments[index] ? 'true' : undefined}");
    expect(source).not.toContain('<i key={index} data-segment={index}');
    expect(source).toContain('function ClockColon()');
  });
});
