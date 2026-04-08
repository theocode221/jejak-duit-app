import type { AppFinanceState, MonthFinanceData } from './appFinanceTypes';
import type { OTDayType, OTEntry } from '@/types';

function migrateOtEntry(e: Record<string, unknown>): OTEntry {
  const day = e.dayType;
  const dayType: OTDayType = day === 'public' ? 'public' : 'regular';
  return {
    id: String(e.id ?? ''),
    date: String(e.date ?? ''),
    hours: typeof e.hours === 'number' ? e.hours : 0,
    description: String(e.description ?? ''),
    dayType,
  };
}

function migrateMonthData(raw: unknown): MonthFinanceData | null {
  if (!raw || typeof raw !== 'object') return null;
  const m = raw as Record<string, unknown>;
  const rawEntries = Array.isArray(m.otEntries) ? m.otEntries : [];

  let otHourlyBasic: number | undefined =
    typeof m.otHourlyBasic === 'number' && m.otHourlyBasic >= 0
      ? m.otHourlyBasic
      : undefined;

  const legacy = rawEntries.find(
    (x) =>
      x &&
      typeof x === 'object' &&
      typeof (x as Record<string, unknown>).ratePerHour === 'number'
  ) as Record<string, unknown> | undefined;

  if (otHourlyBasic === undefined && legacy?.ratePerHour) {
    otHourlyBasic =
      Math.round(((legacy.ratePerHour as number) / 1.5) * 100) / 100;
  }
  if (otHourlyBasic === undefined) otHourlyBasic = 13.14;

  const otEntries: OTEntry[] = rawEntries.map((e) =>
    migrateOtEntry(e as Record<string, unknown>)
  );

  return {
    budgetCategories:
      (m.budgetCategories as MonthFinanceData['budgetCategories']) ?? [],
    otEntries,
    otHourlyBasic,
    monthlySalary:
      typeof m.monthlySalary === 'number' ? m.monthlySalary : 0,
    extraIncomeLines:
      (m.extraIncomeLines as MonthFinanceData['extraIncomeLines']) ?? [],
    bonusAllocation: (m.bonusAllocation as MonthFinanceData['bonusAllocation']) ?? {
      label: '',
      amount: 0,
      allocatedTo: '',
    },
  };
}

/** Normalize persisted state (e.g. legacy `ratePerHour` on OT rows). */
export function migrateAppFinanceState(raw: unknown): AppFinanceState | null {
  if (!raw || typeof raw !== 'object') return null;
  const p = raw as Record<string, unknown>;
  if (!p.monthData || typeof p.monthData !== 'object') return null;
  if (!p.billsByMonth || typeof p.billsByMonth !== 'object') return null;

  const monthData: Record<string, MonthFinanceData> = {};
  for (const [k, v] of Object.entries(
    p.monthData as Record<string, unknown>
  )) {
    const md = migrateMonthData(v);
    if (!md) return null;
    monthData[k] = md;
  }

  return {
    monthData,
    billsByMonth: p.billsByMonth as AppFinanceState['billsByMonth'],
    events: Array.isArray(p.events)
      ? (p.events as AppFinanceState['events'])
      : [],
    gear: Array.isArray(p.gear) ? (p.gear as AppFinanceState['gear']) : [],
    sideIncome: Array.isArray(p.sideIncome)
      ? (p.sideIncome as AppFinanceState['sideIncome'])
      : [],
    referenceDate:
      typeof p.referenceDate === 'string' ? p.referenceDate : '2026-04-06',
  };
}
