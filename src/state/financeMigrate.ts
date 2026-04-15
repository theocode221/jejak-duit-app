import type {
  AppFinanceState,
  MonthFinanceData,
  SalaryPeriodState,
} from './appFinanceTypes';
import type {
  Bill,
  BillAmountSource,
  BillStatus,
  EventBreakdown,
  OTDayType,
  OTEntry,
  TripEvent,
} from '@/types';
import { breakdownTotal } from '@/utils/eventHelpers';
import { basicHourlyFromMonthlySalary } from '@/utils/otPay';
import { defaultSalaryDeductions } from '@/utils/salaryPeriodUtils';

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

  const monthlySalary =
    typeof m.monthlySalary === 'number' ? m.monthlySalary : 0;
  if (otHourlyBasic === undefined) {
    otHourlyBasic =
      monthlySalary > 0
        ? basicHourlyFromMonthlySalary(monthlySalary)
        : 13.14;
  }

  const otEntries: OTEntry[] = rawEntries.map((e) =>
    migrateOtEntry(e as Record<string, unknown>)
  );

  return {
    budgetCategories:
      (m.budgetCategories as MonthFinanceData['budgetCategories']) ?? [],
    otEntries,
    otHourlyBasic,
    monthlySalary,
    extraIncomeLines:
      (m.extraIncomeLines as MonthFinanceData['extraIncomeLines']) ?? [],
    bonusAllocation: (m.bonusAllocation as MonthFinanceData['bonusAllocation']) ?? {
      label: '',
      amount: 0,
      allocatedTo: '',
    },
  };
}

function normalizeEventBreakdown(raw: unknown): EventBreakdown {
  const empty: EventBreakdown = {
    transport: 0,
    hotel: 0,
    makan: 0,
    registration: 0,
    shopping: 0,
    others: 0,
  };
  if (!raw || typeof raw !== 'object') return empty;
  const b = raw as Record<string, unknown>;
  const num = (k: keyof EventBreakdown) =>
    typeof b[k] === 'number' ? (b[k] as number) : 0;
  const others =
    typeof b.others === 'number'
      ? b.others
      : typeof b.misc === 'number'
        ? (b.misc as number)
        : 0;
  return {
    transport: num('transport'),
    hotel: num('hotel'),
    makan: num('makan'),
    registration: num('registration'),
    shopping: num('shopping'),
    others,
  };
}

function migrateBill(raw: unknown): Bill {
  const b = raw as Record<string, unknown>;
  const st = b.status;
  const status: BillStatus = st === 'paid' ? 'paid' : 'unpaid';
  const as = b.amountSource;
  const amountSource: BillAmountSource | undefined =
    as === 'spaylater' || as === 'atome' || as === 'credit_card' || as === 'manual'
      ? as
      : undefined;
  const due =
    typeof b.dueDay === 'number' && b.dueDay >= 1 && b.dueDay <= 31
      ? Math.floor(b.dueDay)
      : 1;
  const bill: Bill = {
    id: String(b.id ?? ''),
    name: String(b.name ?? ''),
    dueDay: due,
    amount: typeof b.amount === 'number' ? b.amount : 0,
    status,
    reminder: String(b.reminder ?? ''),
    category: String(b.category ?? 'Fixed'),
  };
  if (amountSource && amountSource !== 'manual') {
    bill.amountSource = amountSource;
  }
  return bill;
}

function migrateBillsByMonth(
  raw: unknown
): Record<string, Bill[]> {
  if (!raw || typeof raw !== 'object') return {};
  const out: Record<string, Bill[]> = {};
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    if (!Array.isArray(v)) continue;
    out[k] = v.map((row) => migrateBill(row));
  }
  return out;
}

function migrateTripEvent(raw: unknown): TripEvent | null {
  if (!raw || typeof raw !== 'object') return null;
  const e = raw as Record<string, unknown>;
  const id = String(e.id ?? '');
  if (!id) return null;
  const breakdown = normalizeEventBreakdown(e.breakdown);
  return {
    id,
    name: String(e.name ?? ''),
    eventDate: String(e.eventDate ?? ''),
    plannedBudget:
      typeof e.plannedBudget === 'number' ? e.plannedBudget : 0,
    actualSpending: breakdownTotal(breakdown),
    breakdown,
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

  const salaryPeriods: SalaryPeriodState[] = Array.isArray(
    (p as Record<string, unknown>).salaryPeriods
  )
    ? migrateSalaryPeriods(
        (p as Record<string, unknown>).salaryPeriods as unknown[]
      )
    : [];

  return {
    monthData,
    billsByMonth: migrateBillsByMonth(p.billsByMonth),
    salaryPeriods,
    events: Array.isArray(p.events)
      ? (p.events as unknown[])
          .map(migrateTripEvent)
          .filter((ev): ev is TripEvent => ev !== null)
      : [],
    gear: Array.isArray(p.gear) ? (p.gear as AppFinanceState['gear']) : [],
    sideIncome: Array.isArray(p.sideIncome)
      ? (p.sideIncome as AppFinanceState['sideIncome'])
      : [],
    referenceDate:
      typeof p.referenceDate === 'string' ? p.referenceDate : '2026-04-06',
  };
}

function migrateSalaryPeriods(raw: unknown[]): SalaryPeriodState[] {
  const out: SalaryPeriodState[] = [];
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue;
    const r = item as Record<string, unknown>;
    const status = r.status === 'finalized' ? 'finalized' : 'forecast';
    const er = r.earnings as Record<string, unknown> | undefined;
    const dd = r.deductions as Record<string, unknown> | undefined;
    const earnings = {
      basic: typeof er?.basic === 'number' ? er.basic : 0,
      ot: typeof er?.ot === 'number' ? er.ot : 0,
      ioeAllowance:
        typeof er?.ioeAllowance === 'number' ? er.ioeAllowance : 0,
      medicalClaim:
        typeof er?.medicalClaim === 'number' ? er.medicalClaim : 0,
      miscClaim: typeof er?.miscClaim === 'number' ? er.miscClaim : 0,
      petrolClaim: typeof er?.petrolClaim === 'number' ? er.petrolClaim : 0,
    };
    const deductionsRaw = {
      kwsp: typeof dd?.kwsp === 'number' ? dd.kwsp : 0,
      ies: typeof dd?.ies === 'number' ? dd.ies : 0,
      socso: typeof dd?.socso === 'number' ? dd.socso : 0,
      hostel: typeof dd?.hostel === 'number' ? dd.hostel : 0,
      lateIn: typeof dd?.lateIn === 'number' ? dd.lateIn : 0,
    };
    const deductionsAllZero =
      deductionsRaw.kwsp === 0 &&
      deductionsRaw.ies === 0 &&
      deductionsRaw.socso === 0 &&
      deductionsRaw.hostel === 0 &&
      deductionsRaw.lateIn === 0;
    const deductions =
      status === 'forecast' && deductionsAllZero
        ? defaultSalaryDeductions(earnings.basic)
        : deductionsRaw;
    out.push({
      id: String(r.id ?? ''),
      label: String(r.label ?? ''),
      depositDate: String(r.depositDate ?? '').slice(0, 10),
      status,
      earnings,
      deductions,
    });
  }
  return out.filter((p) => p.id && p.depositDate.length >= 10);
}
