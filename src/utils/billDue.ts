import type { Bill, BillStatus } from '@/types';
import type {
  InstallmentEntry,
  InstallmentPaymentStatus,
  PaymentMethod,
} from '@/types/installments';
import { unpaidAmountForMethod } from '@/services/installmentService';

export function billAmountIsFromInstallments(
  bill: Bill
): bill is Bill & { amountSource: PaymentMethod } {
  const s = bill.amountSource;
  return s === 'spaylater' || s === 'atome' || s === 'credit_card';
}

export function resolveBillAmount(
  bill: Bill,
  monthKey: string,
  entries: InstallmentEntry[],
  statuses: InstallmentPaymentStatus[]
): number {
  if (billAmountIsFromInstallments(bill)) {
    return unpaidAmountForMethod(
      entries,
      statuses,
      monthKey,
      bill.amountSource
    );
  }
  return bill.amount;
}

/** YYYY-MM-DD for this bill in the given workbook month (day clamped to month length). */
export function billDueDateIso(monthKey: string, dueDay: number): string {
  const [ys, ms] = monthKey.split('-');
  const y = Number(ys);
  const m = Number(ms);
  if (!y || !m) return `${monthKey}-01`;
  const last = new Date(y, m, 0).getDate();
  const d = Math.min(Math.max(1, Math.floor(dueDay)), last);
  return `${monthKey}-${String(d).padStart(2, '0')}`;
}

export function formatBillDueDateLabel(
  monthKey: string,
  dueDay: number
): string {
  const [y, m] = monthKey.split('-').map(Number);
  const iso = billDueDateIso(monthKey, dueDay);
  const parts = iso.split('-').map(Number);
  const day = parts[2] ?? 1;
  if (!y || !m) return iso;
  return new Intl.DateTimeFormat('en-MY', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(y, m - 1, day));
}

/** Reference date is strictly after the bill’s due date in this month and the bill is not paid. */
export function isReferenceDateAfterBillDue(
  referenceDateIso: string,
  monthKey: string,
  dueDay: number,
  status: BillStatus
): boolean {
  if (status === 'paid') return false;
  const due = billDueDateIso(monthKey, dueDay);
  const ref = referenceDateIso.slice(0, 10);
  return ref > due;
}

/** Whole calendar days from reference date (YYYY-MM-DD) to due date. Negative = overdue. */
export function calendarDaysFromReferenceToDue(
  referenceDateIso: string,
  dueYmd: string
): number {
  const ref = referenceDateIso.slice(0, 10);
  const a = new Date(`${ref}T12:00:00`);
  const b = new Date(`${dueYmd.slice(0, 10)}T12:00:00`);
  return Math.round((b.getTime() - a.getTime()) / 86400000);
}

/** Human-readable countdown for the nearest-due stat card. */
export function formatDaysLeftPhrase(daysLeft: number): string {
  if (daysLeft > 1) return `${daysLeft} days left`;
  if (daysLeft === 1) return '1 day left';
  if (daysLeft === 0) return 'Due today';
  if (daysLeft === -1) return '1 day overdue';
  return `${Math.abs(daysLeft)} days overdue`;
}

/**
 * Among unpaid bills, the next due on or after the reference date (by calendar
 * date in this workbook month). If every due is before the reference date,
 * picks the most recent past due in the month (strongest overdue signal).
 */
export function nearestUnpaidBillByDue(
  bills: Bill[],
  monthKey: string,
  referenceDateIso: string
): { bill: Bill; daysLeft: number; dueIso: string } | null {
  const open = bills.filter((b) => b.status !== 'paid');
  if (open.length === 0) return null;
  const ref = referenceDateIso.slice(0, 10);
  const items = open.map((bill) => ({
    bill,
    dueIso: billDueDateIso(monthKey, bill.dueDay),
  }));
  const onOrAfter = items
    .filter((x) => x.dueIso >= ref)
    .sort((a, b) => a.dueIso.localeCompare(b.dueIso));
  const chosen =
    onOrAfter[0] ??
    [...items].sort((a, b) => b.dueIso.localeCompare(a.dueIso))[0];
  const daysLeft = calendarDaysFromReferenceToDue(ref, chosen.dueIso);
  return { bill: chosen.bill, daysLeft, dueIso: chosen.dueIso };
}
