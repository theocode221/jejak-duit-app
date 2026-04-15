import type {
  SalaryDeductionsBreakdown,
  SalaryEarningsBreakdown,
  SalaryPeriodState,
} from '@/state/appFinanceTypes';

export const emptySalaryEarnings = (): SalaryEarningsBreakdown => ({
  basic: 0,
  ot: 0,
  ioeAllowance: 0,
  medicalClaim: 0,
  miscClaim: 0,
  petrolClaim: 0,
});

export const emptySalaryDeductions = (): SalaryDeductionsBreakdown => ({
  kwsp: 0,
  ies: 0,
  socso: 0,
  hostel: 0,
  lateIn: 0,
});

/** Statutory / fixed defaults (MYR except KWSP, which is % of basic). */
export const KWSP_RATE_FROM_BASIC = 0.11;
export const DEFAULT_SALARY_IES = 6.7;
export const DEFAULT_SALARY_SOCSO = 16.75;
export const DEFAULT_SALARY_HOSTEL = 51;

export function kwspFromBasic(basic: number): number {
  return Math.round(basic * KWSP_RATE_FROM_BASIC * 100) / 100;
}

/** Deduction defaults for a new forecast row; KWSP follows basic (0 until basic is set). */
export function defaultSalaryDeductions(basic: number): SalaryDeductionsBreakdown {
  return {
    kwsp: kwspFromBasic(basic),
    ies: DEFAULT_SALARY_IES,
    socso: DEFAULT_SALARY_SOCSO,
    hostel: DEFAULT_SALARY_HOSTEL,
    lateIn: 0,
  };
}

export function grossFromEarnings(e: SalaryEarningsBreakdown): number {
  const sum =
    e.basic +
    e.ot +
    e.ioeAllowance +
    e.medicalClaim +
    e.miscClaim +
    e.petrolClaim;
  return Math.round(sum * 100) / 100;
}

export function totalDeductionsFrom(d: SalaryDeductionsBreakdown): number {
  const sum = d.kwsp + d.ies + d.socso + d.hostel + d.lateIn;
  return Math.round(sum * 100) / 100;
}

export function netSalary(
  earnings: SalaryEarningsBreakdown,
  deductions: SalaryDeductionsBreakdown
): number {
  const g = grossFromEarnings(earnings);
  const t = totalDeductionsFrom(deductions);
  return Math.round((g - t) * 100) / 100;
}

/** Local calendar date → YYYY-MM-DD (no UTC shift for noon anchor). */
export function toIsoDateLocal(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * Payroll deposit rule: 25th of the month.
 * Before the 25th → upcoming deposit is the 25th of the current month.
 * On or after the 25th → upcoming deposit is the 25th of the next month.
 */
export function getNextSalaryDepositDate(today: Date): Date {
  const y = today.getFullYear();
  const mo = today.getMonth();
  const day = today.getDate();
  if (day < 25) {
    return new Date(y, mo, 25);
  }
  return new Date(y, mo + 1, 25);
}

export function nextSalaryDepositIso(today: Date = new Date()): string {
  return toIsoDateLocal(getNextSalaryDepositDate(today));
}

/** Next calendar month, same 25th payroll anchor (YYYY-MM-DD). */
export function addOneMonthSameDay25(depositIso: string): string {
  const [ys, ms] = depositIso.split('-');
  const y = Number(ys);
  const m = Number(ms);
  if (!y || !m) return depositIso;
  const next = new Date(y, m - 1, 25);
  next.setMonth(next.getMonth() + 1);
  return toIsoDateLocal(next);
}

/**
 * Deposit date for the salary row the user should edit as "current forecast".
 * If the calendar next 25th is already finalized, walk forward to the next month
 * until we find a missing row or a forecast.
 */
export function resolveActiveForecastDeposit(
  periods: SalaryPeriodState[],
  today: Date = new Date()
): string {
  let d = nextSalaryDepositIso(today);
  for (let i = 0; i < 36; i++) {
    const row = periods.find((p) => p.depositDate === d);
    if (!row || row.status === 'forecast') return d;
    d = addOneMonthSameDay25(d);
  }
  return nextSalaryDepositIso(today);
}

export function monthKeyFromIso(isoDate: string): string {
  return isoDate.slice(0, 7);
}

/** "April 2026" style from deposit date */
export function periodMonthLabel(depositIso: string): string {
  const [y, m] = depositIso.split('-').map(Number);
  if (!y || !m) return depositIso;
  return new Intl.DateTimeFormat('en-MY', {
    month: 'long',
    year: 'numeric',
  }).format(new Date(y, m - 1, 1));
}

export type SalaryPeriodComputed = SalaryPeriodState & {
  grossSalary: number;
  totalDeductions: number;
  netSalary: number;
};

export function withComputedTotals(p: SalaryPeriodState): SalaryPeriodComputed {
  const grossSalary = grossFromEarnings(p.earnings);
  const totalDeductions = totalDeductionsFrom(p.deductions);
  const net = Math.round((grossSalary - totalDeductions) * 100) / 100;
  return { ...p, grossSalary, totalDeductions, netSalary: net };
}

export function latestFinalizedPeriod(
  periods: SalaryPeriodState[]
): SalaryPeriodComputed | null {
  const finalized = periods
    .filter((p) => p.status === 'finalized')
    .sort(
      (a, b) =>
        new Date(b.depositDate).getTime() - new Date(a.depositDate).getTime()
    );
  const top = finalized[0];
  return top ? withComputedTotals(top) : null;
}

export function sortPeriodsByDepositDesc(
  periods: SalaryPeriodState[]
): SalaryPeriodComputed[] {
  return [...periods]
    .sort(
      (a, b) =>
        new Date(b.depositDate).getTime() - new Date(a.depositDate).getTime()
    )
    .map(withComputedTotals);
}
