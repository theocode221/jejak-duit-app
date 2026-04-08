export type BillStatus = 'paid' | 'unpaid' | 'upcoming';

export type BudgetStatus = 'under' | 'over' | 'on_track';

export interface BudgetCategory {
  id: string;
  name: string;
  /** Short label for dense charts (optional). */
  chartLabel?: string;
  planned: number;
  actual: number;
}

/** Full month envelope view (service-friendly shape). */
export interface MonthlyBudget {
  monthKey: string;
  monthLabel: string;
  categories: BudgetCategory[];
  plannedTotal: number;
  actualTotal: number;
  variance: number;
}

/** Workday type for OT multiplier rules. */
export type OTDayType = 'regular' | 'public';

export interface OTEntry {
  id: string;
  date: string;
  hours: number;
  description: string;
  dayType: OTDayType;
}

export interface Bill {
  id: string;
  name: string;
  dueDay: number;
  amount: number;
  status: BillStatus;
  reminder: string;
  category: string;
}

/** Alias for API / docs */
export type BillItem = Bill;

export type EventBreakdownKey =
  | 'transport'
  | 'hotel'
  | 'makan'
  | 'registration'
  | 'shopping'
  | 'misc';

export interface EventBreakdown {
  transport: number;
  hotel: number;
  makan: number;
  registration: number;
  shopping: number;
  misc: number;
}

export interface TripEvent {
  id: string;
  name: string;
  eventDate: string;
  plannedBudget: number;
  actualSpending: number;
  breakdown: EventBreakdown;
}

/** Alias for API / docs */
export type EventBudget = TripEvent;

export type GearStatus = 'planned' | 'bought' | 'kiv';

export type GearPriority = 'high' | 'medium' | 'low';

export interface GearItem {
  id: string;
  name: string;
  category: string;
  targetPrice: number;
  status: GearStatus;
  priority: GearPriority;
  linkedPurpose: string;
}

export type SideTransactionType = 'income' | 'expense';

export interface SideIncomeTransaction {
  id: string;
  name: string;
  type: SideTransactionType;
  amount: number;
  month: string;
  source: string;
}

/** Alias for API / docs */
export type SideIncomeEntry = SideIncomeTransaction;

export interface DashboardSummary {
  monthLabel: string;
  totalIncome: number;
  totalExpenses: number;
  remainingBalance: number;
  savingsAllocation: number;
  upcomingBillsCount: number;
  upcomingEventsCount: number;
  otEarnedThisMonth: number;
  sideIncomeThisMonth: number;
}

export interface ExpenseByCategory {
  category: string;
  amount: number;
}

export interface BillDueStatus {
  status: BillStatus;
  count: number;
}
