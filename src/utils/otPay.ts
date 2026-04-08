import type { OTDayType, OTEntry } from '@/types';

/** Regular day: hourly basic × 1.5 × hours. */
/** Public holiday: first 8h at ×2.0, remainder at ×3.0 (on hourly basic). */
export function computeOTPay(
  hours: number,
  dayType: OTDayType,
  hourlyBasic: number
): number {
  const h = Math.max(0, hours);
  const b = Math.max(0, hourlyBasic);
  if (dayType === 'public') {
    const h8 = Math.min(h, 8);
    const rem = Math.max(0, h - 8);
    return h8 * b * 2 + rem * b * 3;
  }
  return h * b * 1.5;
}

export function effectiveOTRatePerHour(
  hours: number,
  dayType: OTDayType,
  hourlyBasic: number
): number {
  if (hours <= 0) return 0;
  return computeOTPay(hours, dayType, hourlyBasic) / hours;
}

function getWeekNumber(d: Date): number {
  const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = t.getUTCDay() || 7;
  t.setUTCDate(t.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
  return Math.ceil(((t.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

export function otByWeekFromEntries(
  entries: OTEntry[],
  hourlyBasic: number
): { week: string; amount: number }[] {
  const map = new Map<string, number>();
  for (const e of entries) {
    const d = new Date(e.date + 'T12:00:00');
    const wk = `W${getWeekNumber(d)}`;
    const cash = computeOTPay(e.hours, e.dayType, hourlyBasic);
    map.set(wk, (map.get(wk) ?? 0) + cash);
  }
  const keys = [...map.keys()].sort();
  return keys.map((week) => ({
    week,
    amount: Math.round(map.get(week)! * 100) / 100,
  }));
}
