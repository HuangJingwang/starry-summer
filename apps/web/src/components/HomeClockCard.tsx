'use client';

import { useEffect, useState } from 'react';

export function HomeClockCard() {
  const [time, setTime] = useState(() => new Date());
  const hours = getClockPart(time.getHours());
  const minutes = getClockPart(time.getMinutes());

  useEffect(() => {
    const timer = window.setInterval(() => setTime(new Date()), 1000 * 5);

    return () => window.clearInterval(timer);
  }, []);

  return (
    <aside className="portfolio-hero__clock-card" aria-label={`当前时间 ${hours}:${minutes}`}>
      <span>LOCAL TIME</span>
      <div className="portfolio-hero__clock-digits" aria-hidden="true">
        <SevenSegmentDigit value={Number(hours[0])} />
        <SevenSegmentDigit value={Number(hours[1])} />
        <ClockColon />
        <SevenSegmentDigit value={Number(minutes[0])} />
        <SevenSegmentDigit value={Number(minutes[1])} />
      </div>
      <small>{formatClockDate(time)}</small>
    </aside>
  );
}

function getClockPart(value: number) {
  return String(value).padStart(2, '0');
}

function formatClockDate(value: Date) {
  return new Intl.DateTimeFormat('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    weekday: 'short',
  }).format(value);
}

function SevenSegmentDigit({ value }: { value: number }) {
  const fallbackSegments = [true, true, true, true, true, true, false];
  const segmentMap: Record<number, boolean[]> = {
    0: fallbackSegments,
    1: [false, true, true, false, false, false, false],
    2: [true, true, false, true, true, false, true],
    3: [true, true, true, true, false, false, true],
    4: [false, true, true, false, false, true, true],
    5: [true, false, true, true, false, true, true],
    6: [true, false, true, true, true, true, true],
    7: [true, true, true, false, false, false, false],
    8: [true, true, true, true, true, true, true],
    9: [true, true, true, true, false, true, true],
  };
  const segments = segmentMap[value] ?? fallbackSegments;

  return (
    <span className="portfolio-hero__clock-digit" aria-hidden="true">
      {segments.map((active, index) => (
        <i key={index} data-segment={index} data-active={active ? 'true' : undefined} />
      ))}
    </span>
  );
}

function ClockColon() {
  return (
    <span className="portfolio-hero__clock-colon" aria-hidden="true">
      <i />
      <i />
    </span>
  );
}
