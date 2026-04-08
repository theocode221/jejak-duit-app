import structuredJson from '@/data/ot_structured_data.json';
import type { StructuredFinanceRoot } from '@/types/structuredData';
import type { Bill, BudgetCategory } from '@/types';
import {
  MONTH_KEY_TO_SHEET,
  REFERENCE_DATE_ISO,
  getSheet,
  extractLineAmounts,
  extractOTSessions,
  extractSheetMetrics,
  lineMapToBudgetCategories,
  buildTripEvents,
  normalizeGear,
  normalizeSideIncome,
  buildBills,
  extractExtraIncomeLines,
  bonusAllocationFromExport,
} from '@/services/structuredFinance';
import type {
  AppFinanceState,
  ExtraIncomeLine,
  MonthFinanceData,
} from './appFinanceTypes';

const root = structuredJson as StructuredFinanceRoot;

function fallbackBudget(): BudgetCategory[] {
  return [
    {
      id: 'fb1',
      name: 'Envelope (no sheet)',
      planned: 0,
      actual: 0,
    },
  ];
}

function getMonthlyBudgetFromRoot(monthKey: string): BudgetCategory[] {
  const sheet = getSheet(root, monthKey);
  if (!sheet) return fallbackBudget();
  const lines = extractLineAmounts(sheet.entries);
  const totalRow = lines.get('total') ?? 0;
  const cats = lineMapToBudgetCategories(lines, totalRow);
  return cats.length ? cats : fallbackBudget();
}

function extraLinesWithIds(monthKey: string): ExtraIncomeLine[] {
  const raw = extractExtraIncomeLines(root);
  return raw.map((l, i) => ({
    id: `extra-${monthKey}-${i}`,
    label: l.label,
    amount: l.amount,
  }));
}

function seedOtHourlyBasic(
  metrics: ReturnType<typeof extractSheetMetrics>,
  isRollup: boolean,
  rollupHours: number
): number {
  if (isRollup && metrics.otCash > 0 && rollupHours > 0) {
    return (
      Math.round((metrics.otCash / (rollupHours * 1.5)) * 100) / 100
    );
  }
  if (metrics.basic > 0) {
    return Math.round((metrics.basic / 173) * 100) / 100;
  }
  return (
    Math.max(0.01, Math.round((metrics.impliedRate / 1.5) * 100) / 100)
  );
}

function buildOTSlice(monthKey: string): Pick<
  MonthFinanceData,
  | 'otEntries'
  | 'monthlySalary'
  | 'bonusAllocation'
  | 'otHourlyBasic'
> {
  const sheet = getSheet(root, monthKey);
  const bonus = bonusAllocationFromExport(root);
  if (!sheet) {
    return {
      otEntries: [],
      monthlySalary: 0,
      otHourlyBasic: 13.14,
      bonusAllocation: {
        label: bonus.label,
        amount: bonus.amount,
        allocatedTo: bonus.allocatedTo,
      },
    };
  }
  const metrics = extractSheetMetrics(sheet.entries);
  let { sessions } = extractOTSessions(sheet.entries);
  const rollupH = metrics.totalHourBlock > 0 ? metrics.totalHourBlock : 1;
  let isRollup = false;
  if (sessions.length === 0 && metrics.otCash > 0) {
    isRollup = true;
    sessions = [
      {
        id: `ot-rollup-${monthKey}`,
        date: `${monthKey}-18`,
        hours: rollupH,
        description: 'OT (rolled up from sheet totals)',
        dayType: 'regular',
      },
    ];
  }
  const otHourlyBasic = seedOtHourlyBasic(metrics, isRollup, rollupH);
  return {
    otEntries: sessions,
    monthlySalary: metrics.basic,
    otHourlyBasic,
    bonusAllocation: {
      label: bonus.label,
      amount: bonus.amount,
      allocatedTo: bonus.allocatedTo,
    },
  };
}

export function buildMonthFinanceDataFromRoot(monthKey: string): MonthFinanceData {
  const budgetCategories = getMonthlyBudgetFromRoot(monthKey);
  const ot = buildOTSlice(monthKey);
  return {
    budgetCategories,
    otEntries: ot.otEntries,
    otHourlyBasic: ot.otHourlyBasic,
    monthlySalary: ot.monthlySalary,
    extraIncomeLines: extraLinesWithIds(monthKey),
    bonusAllocation: ot.bonusAllocation,
  };
}

export function createInitialAppFinanceState(): AppFinanceState {
  const monthKeys = Object.keys(MONTH_KEY_TO_SHEET);
  const monthData: Record<string, MonthFinanceData> = {};
  const billsByMonth: Record<string, Bill[]> = {};
  for (const mk of monthKeys) {
    monthData[mk] = buildMonthFinanceDataFromRoot(mk);
    billsByMonth[mk] = buildBills(root, mk);
  }
  const events = buildTripEvents(root).sort(
    (a, b) =>
      new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime()
  );
  return {
    monthData,
    billsByMonth,
    events,
    gear: normalizeGear(root.gearWishlist ?? []),
    sideIncome: normalizeSideIncome(root.sideIncome ?? []),
    referenceDate: REFERENCE_DATE_ISO,
  };
}

/** Re-export root for reset / debug only */
export function getStructuredRoot(): StructuredFinanceRoot {
  return root;
}
