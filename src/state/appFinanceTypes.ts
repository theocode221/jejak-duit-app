import type {
  Bill,
  BudgetCategory,
  GearItem,
  OTEntry,
  SideIncomeTransaction,
  TripEvent,
} from '@/types';

export interface ExtraIncomeLine {
  id: string;
  label: string;
  amount: number;
}

export interface BonusAllocationState {
  label: string;
  amount: number;
  allocatedTo: string;
}

/** Earnings line items for a salary deposit period (payroll). */
export interface SalaryEarningsBreakdown {
  basic: number;
  ot: number;
  ioeAllowance: number;
  medicalClaim: number;
  miscClaim: number;
  petrolClaim: number;
}

/** Statutory / payroll deductions for a salary period. */
export interface SalaryDeductionsBreakdown {
  kwsp: number;
  ies: number;
  socso: number;
  hostel: number;
  lateIn: number;
}

/**
 * One salary cycle tied to a deposit date (e.g. 25th).
 * Totals are derived from earnings/deductions when persisting or displaying.
 */
export interface SalaryPeriodState {
  id: string;
  label: string;
  depositDate: string;
  status: 'forecast' | 'finalized';
  earnings: SalaryEarningsBreakdown;
  deductions: SalaryDeductionsBreakdown;
}

/** All finance fields scoped to a workbook month (selector month key). */
export interface MonthFinanceData {
  budgetCategories: BudgetCategory[];
  otEntries: OTEntry[];
  /** Basic hourly (monthly ÷ 26 ÷ 8). OT cash: regular ×1.5× this; public ×2/×3 on this base. */
  otHourlyBasic: number;
  monthlySalary: number;
  extraIncomeLines: ExtraIncomeLine[];
  bonusAllocation: BonusAllocationState;
}

export interface AppFinanceState {
  monthData: Record<string, MonthFinanceData>;
  /** Bills can differ per month (amounts tied to sheet lines in seed). */
  billsByMonth: Record<string, Bill[]>;
  /** Salary / payroll periods (forecast vs finalized), keyed by deposit date in UI. */
  salaryPeriods: SalaryPeriodState[];
  events: TripEvent[];
  gear: GearItem[];
  sideIncome: SideIncomeTransaction[];
  referenceDate: string;
}

export type FinanceAction =
  | { type: 'budget/update'; monthKey: string; id: string; patch: Partial<BudgetCategory> }
  | { type: 'budget/add'; monthKey: string; category: BudgetCategory }
  | { type: 'budget/remove'; monthKey: string; id: string }
  | { type: 'ot/update'; monthKey: string; id: string; patch: Partial<OTEntry> }
  | { type: 'ot/add'; monthKey: string; entry: OTEntry }
  | { type: 'ot/remove'; monthKey: string; id: string }
  | { type: 'income/setSalary'; monthKey: string; salary: number }
  | { type: 'income/setOtHourlyBasic'; monthKey: string; hourlyBasic: number }
  | { type: 'income/extra/update'; monthKey: string; id: string; patch: Partial<ExtraIncomeLine> }
  | { type: 'income/extra/add'; monthKey: string; line: ExtraIncomeLine }
  | { type: 'income/extra/remove'; monthKey: string; id: string }
  | { type: 'income/bonus/set'; monthKey: string; bonus: BonusAllocationState }
  | { type: 'salary/period/add'; period: SalaryPeriodState }
  | {
      type: 'salary/period/patch';
      id: string;
      patch: {
        label?: string;
        depositDate?: string;
        earnings?: Partial<SalaryEarningsBreakdown>;
        deductions?: Partial<SalaryDeductionsBreakdown>;
      };
    }
  | { type: 'salary/period/finalize'; id: string }
  | {
      type: 'salary/period/duplicateToNextDeposit';
      fromId: string;
      nextDepositDate: string;
      nextLabel: string;
    }
  | { type: 'bills/update'; monthKey: string; id: string; patch: Partial<Bill> }
  | { type: 'bills/add'; monthKey: string; bill: Bill }
  | { type: 'bills/remove'; monthKey: string; id: string }
  | { type: 'events/update'; id: string; patch: Partial<TripEvent> }
  | {
      type: 'events/breakdown/set';
      id: string;
      key: keyof TripEvent['breakdown'];
      value: number;
    }
  | { type: 'events/add'; event: TripEvent }
  | { type: 'events/remove'; id: string }
  | { type: 'gear/update'; id: string; patch: Partial<GearItem> }
  | { type: 'gear/add'; item: GearItem }
  | { type: 'gear/remove'; id: string }
  | { type: 'side/update'; id: string; patch: Partial<SideIncomeTransaction> }
  | { type: 'side/add'; tx: SideIncomeTransaction }
  | { type: 'side/remove'; id: string }
  | { type: 'meta/setReferenceDate'; isoDate: string }
  | { type: 'reset'; state: AppFinanceState };

export const FINANCE_STORAGE_KEY = 'bajet-finance-v2';
