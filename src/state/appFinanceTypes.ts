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

/** All finance fields scoped to a workbook month (selector month key). */
export interface MonthFinanceData {
  budgetCategories: BudgetCategory[];
  otEntries: OTEntry[];
  /** Hourly basic pay — OT uses ×1.5 (regular) or ×2/×3 tiers (public holiday). */
  otHourlyBasic: number;
  monthlySalary: number;
  extraIncomeLines: ExtraIncomeLine[];
  bonusAllocation: BonusAllocationState;
}

export interface AppFinanceState {
  monthData: Record<string, MonthFinanceData>;
  /** Bills can differ per month (amounts tied to sheet lines in seed). */
  billsByMonth: Record<string, Bill[]>;
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
