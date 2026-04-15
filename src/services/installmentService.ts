import { roundUpMoney2 } from '@/utils/format';
import { newId } from '@/utils/id';
import type {
  CategoryLimit,
  InstallmentEntry,
  InstallmentPaymentStatus,
  PaymentMethod,
} from '@/types/installments';
import { PAYMENT_METHOD_LABELS } from '@/types/installments';

/** Parse YYYY-MM → comparable number YYYYMM */
export function monthKeyToSortKey(ym: string): number {
  const [y, m] = ym.split('-').map(Number);
  if (!y || !m) return 0;
  return y * 100 + m;
}

export function addCalendarMonths(ym: string, add: number): string {
  const [ys, ms] = ym.split('-');
  const y0 = Number(ys);
  const m0 = Number(ms);
  if (!y0 || !m0) return ym;
  const d = new Date(y0, m0 - 1 + add, 1);
  const y = d.getFullYear();
  const m = d.getMonth() + 1;
  return `${y}-${String(m).padStart(2, '0')}`;
}

/** Inclusive list of billing months for an installment */
export function getInstallmentScheduleMonths(
  startMonth: string,
  durationMonths: number
): string[] {
  const out: string[] = [];
  for (let i = 0; i < durationMonths; i++) {
    out.push(addCalendarMonths(startMonth, i));
  }
  return out;
}

export function isInstallmentActiveInMonth(
  entry: InstallmentEntry,
  month: string
): boolean {
  return getInstallmentScheduleMonths(
    entry.startMonth,
    entry.durationMonths
  ).includes(month);
}

export function getPaymentStatus(
  statuses: InstallmentPaymentStatus[],
  installmentId: string,
  month: string
): boolean {
  return (
    statuses.find(
      (s) => s.installmentId === installmentId && s.month === month
    )?.isPaid ?? false
  );
}

export function upsertPaymentStatus(
  statuses: InstallmentPaymentStatus[],
  installmentId: string,
  month: string,
  isPaid: boolean
): InstallmentPaymentStatus[] {
  const i = statuses.findIndex(
    (s) => s.installmentId === installmentId && s.month === month
  );
  if (i >= 0) {
    return statuses.map((s, idx) =>
      idx === i ? { ...s, isPaid } : s
    );
  }
  return [
    ...statuses,
    {
      id: newId('bnpl-pay'),
      installmentId,
      month,
      isPaid,
    },
  ];
}

export function activeEntriesForMonth(
  entries: InstallmentEntry[],
  month: string
): InstallmentEntry[] {
  return entries.filter((e) => isInstallmentActiveInMonth(e, month));
}

export function totalDueForMonth(
  entries: InstallmentEntry[],
  month: string
): number {
  const raw = activeEntriesForMonth(entries, month).reduce(
    (s, e) => s + e.monthlyAmount,
    0
  );
  return roundUpMoney2(raw);
}

export function totalPaidForMonth(
  entries: InstallmentEntry[],
  statuses: InstallmentPaymentStatus[],
  month: string
): number {
  const raw = activeEntriesForMonth(entries, month)
    .filter((e) => getPaymentStatus(statuses, e.id, month))
    .reduce((s, e) => s + e.monthlyAmount, 0);
  return roundUpMoney2(raw);
}

export function totalUnpaidForMonth(
  entries: InstallmentEntry[],
  statuses: InstallmentPaymentStatus[],
  month: string
): number {
  const rawDue = activeEntriesForMonth(entries, month).reduce(
    (s, e) => s + e.monthlyAmount,
    0
  );
  const rawPaid = activeEntriesForMonth(entries, month)
    .filter((e) => getPaymentStatus(statuses, e.id, month))
    .reduce((s, e) => s + e.monthlyAmount, 0);
  return roundUpMoney2(rawDue - rawPaid);
}

export function activeInstallmentCount(
  entries: InstallmentEntry[],
  month: string
): number {
  return activeEntriesForMonth(entries, month).length;
}

export function categoryUsageMap(
  entries: InstallmentEntry[],
  month: string
): Map<string, number> {
  const map = new Map<string, number>();
  for (const e of activeEntriesForMonth(entries, month)) {
    map.set(e.categoryId, (map.get(e.categoryId) ?? 0) + e.monthlyAmount);
  }
  for (const [k, v] of map) {
    map.set(k, roundUpMoney2(v));
  }
  return map;
}

export type CategoryBalanceRow = CategoryLimit & {
  usage: number;
  remaining: number;
  /** 0–1+ (can exceed 1 if over limit) */
  usageRatio: number;
  status: 'ok' | 'warn' | 'over';
};

export function categoryBalanceRows(
  categories: CategoryLimit[],
  entries: InstallmentEntry[],
  month: string
): CategoryBalanceRow[] {
  const usage = categoryUsageMap(entries, month);
  return categories.map((cat) => {
    const u = usage.get(cat.id) ?? 0;
    const limit = Math.max(cat.monthlyLimit, 0);
    const remaining = roundUpMoney2(limit - u);
    const usageRatio = limit > 0 ? u / limit : 0;
    let status: CategoryBalanceRow['status'] = 'ok';
    if (u > limit) status = 'over';
    else if (usageRatio >= 0.85) status = 'warn';
    return { ...cat, usage: u, remaining, usageRatio, status };
  });
}

export type MethodSplitRow = {
  method: PaymentMethod;
  label: string;
  amount: number;
};

export function methodSplitForMonth(
  entries: InstallmentEntry[],
  month: string
): MethodSplitRow[] {
  const active = activeEntriesForMonth(entries, month);
  const map = new Map<PaymentMethod, number>();
  for (const e of active) {
    map.set(e.method, (map.get(e.method) ?? 0) + e.monthlyAmount);
  }
  return (['credit_card', 'spaylater', 'atome'] as const)
    .map((method) => ({
      method,
      label: PAYMENT_METHOD_LABELS[method],
      amount: roundUpMoney2(map.get(method) ?? 0),
    }))
    .filter((r) => r.amount > 0);
}

/** Sum of monthly amounts still unpaid for a payment method in a workbook month. */
export function unpaidAmountForMethod(
  entries: InstallmentEntry[],
  statuses: InstallmentPaymentStatus[],
  month: string,
  method: PaymentMethod
): number {
  const raw = activeEntriesForMonth(entries, month)
    .filter((e) => e.method === method)
    .filter((e) => !getPaymentStatus(statuses, e.id, month))
    .reduce((s, e) => s + e.monthlyAmount, 0);
  return roundUpMoney2(raw);
}

export type PaidUnpaidSlice = { name: string; value: number; fill: string };

export function paidUnpaidSlicesForMonth(
  entries: InstallmentEntry[],
  statuses: InstallmentPaymentStatus[],
  month: string
): PaidUnpaidSlice[] {
  const paid = totalPaidForMonth(entries, statuses, month);
  const unpaid = totalUnpaidForMonth(entries, statuses, month);
  const out: PaidUnpaidSlice[] = [];
  if (paid > 0) out.push({ name: 'Paid', value: paid, fill: '#059669' });
  if (unpaid > 0) out.push({ name: 'Unpaid', value: unpaid, fill: '#dc2626' });
  return out;
}

export type MonthlyTrendPoint = { month: string; label: string; totalDue: number };

export function monthlyDueTrend(
  entries: InstallmentEntry[],
  monthKeys: string[]
): MonthlyTrendPoint[] {
  return monthKeys.map((month) => ({
    month,
    label: formatMonthShort(month),
    totalDue: totalDueForMonth(entries, month),
  }));
}

function formatMonthShort(ym: string): string {
  const [y, m] = ym.split('-').map(Number);
  if (!y || !m) return ym;
  return new Intl.DateTimeFormat('en-MY', {
    month: 'short',
    year: '2-digit',
  }).format(new Date(y, m - 1, 1));
}

export function paidMonthsCountForEntry(
  entry: InstallmentEntry,
  statuses: InstallmentPaymentStatus[]
): number {
  const schedule = getInstallmentScheduleMonths(
    entry.startMonth,
    entry.durationMonths
  );
  return schedule.filter((m) =>
    getPaymentStatus(statuses, entry.id, m)
  ).length;
}

/** Split total into months, rounded up to 2 decimals (e.g. 13.66667 → 13.67). */
export function suggestedMonthlyPayment(
  totalAmount: number,
  durationMonths: number
): number {
  if (!durationMonths || durationMonths < 1) return 0;
  return roundUpMoney2(totalAmount / durationMonths);
}
