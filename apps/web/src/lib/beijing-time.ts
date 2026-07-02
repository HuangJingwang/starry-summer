export const BEIJING_TIME_ZONE = 'Asia/Shanghai';

export function getBeijingClockParts(value: Date): { hours: string; minutes: string } {
  const parts = new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    hourCycle: 'h23',
    minute: '2-digit',
    timeZone: BEIJING_TIME_ZONE,
  }).formatToParts(value);

  return {
    hours: parts.find((part) => part.type === 'hour')?.value ?? '00',
    minutes: parts.find((part) => part.type === 'minute')?.value ?? '00',
  };
}

export function getBeijingDateParts(value: Date): { year: number; month: number; day: number } {
  const parts = new Intl.DateTimeFormat('en-US', {
    day: 'numeric',
    month: 'numeric',
    year: 'numeric',
    timeZone: BEIJING_TIME_ZONE,
  }).formatToParts(value);

  return {
    day: Number(parts.find((part) => part.type === 'day')?.value ?? '1'),
    month: Number(parts.find((part) => part.type === 'month')?.value ?? '1'),
    year: Number(parts.find((part) => part.type === 'year')?.value ?? '1970'),
  };
}

export function getBeijingHour(value: Date): number {
  const { hours } = getBeijingClockParts(value);

  return Number(hours);
}

export function formatBeijingHomeDate(value: Date | string): string {
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: BEIJING_TIME_ZONE,
  }).format(typeof value === 'string' ? new Date(value) : value);
}

export function formatBeijingHomeDateHeading(value: Date): string {
  const parts = getBeijingDateParts(value);

  return `${parts.year}/${parts.month}/${parts.day}`;
}

export function formatBeijingHomeWeekday(value: Date): string {
  return new Intl.DateTimeFormat('zh-CN', {
    weekday: 'short',
    timeZone: BEIJING_TIME_ZONE,
  }).format(value);
}
