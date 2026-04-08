/**
 * Raw shapes from `ot_structured_data.json` (Excel export).
 * Kept permissive — normalization happens in services.
 */

export type JsonScalar = string | number | boolean | null;

export interface StructuredOTEntry {
  date: string | null;
  hour: number | string | null;
  double?: number | string | null;
}

export interface StructuredMonthlyOT {
  sheet: string;
  month: string;
  rateFormula: string | null;
  ratePerHourFormula: string | null;
  entries: StructuredOTEntry[];
  plannedEntries: StructuredOTEntry[];
}

export interface StructuredPerHeadItem {
  item: string | null;
  amount: number | null;
}

export interface StructuredStayRow {
  item: string | null;
  estimated: number;
  actual: number;
}

export interface StructuredEventBudget {
  event: string;
  perHeadItems: StructuredPerHeadItem[];
  stayBreakdown: StructuredStayRow[];
  totals: {
    estimatedStayTotal?: number;
    actualStayTotal?: number;
    actualPerHeadTotal?: number;
    otherActuals?: JsonScalar[];
  };
}

export interface StructuredMoneyPlanRow {
  item: string | null;
  expenses: number | string | null;
  month: number | string | null;
}

export interface StructuredMoneyPlans2026 {
  plans: StructuredMoneyPlanRow[];
  twincity?: { item?: string | null; amount?: number | string | null }[];
  sultra?: { item?: string | null; amount?: number | string | null }[];
  raya?: { item?: string | null; amount?: number | string | null }[];
  bonus2026?: { amount?: number | string | null; item?: string | null; note?: string | null }[];
  sellFonLaptop?: { amount?: number | string | null; item?: string | null }[];
  customBilik?: { amount?: number | string | null; item?: string | null }[];
}

export interface StructuredGearRow {
  item: string | number | null;
  amount: number | null;
  extra?: string | number | null;
}

export interface StructuredSideIncomeRow {
  amount: number | string | null;
  description: string | null;
  incomeOrBalance: number | string | null;
}

export interface StructuredEvent2026 {
  event: string;
  date: string;
}

export interface StructuredDueDate {
  bill: string;
  dueDate: string;
}

export interface StructuredFinanceRoot {
  sourceWorkbook: string;
  monthlyOT: StructuredMonthlyOT[];
  eventBudgets: StructuredEventBudget[];
  moneyPlans2025: unknown;
  moneyPlans2026: StructuredMoneyPlans2026;
  gearWishlist: StructuredGearRow[];
  sideIncome: StructuredSideIncomeRow[];
  events2026: StructuredEvent2026[];
  dueDates: StructuredDueDate[];
}
