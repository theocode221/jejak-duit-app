import type { AppFinanceState } from './appFinanceTypes';
import type {
  Bill,
  BudgetCategory,
  DashboardSummary,
  GearItem,
  MonthlyBudget,
  OTEntry,
  SideIncomeTransaction,
  TripEvent,
} from '@/types';
import {
  MONTH_KEY_TO_SHEET,
  MONTH_LABEL,
  budgetSummary,
  sideTotalsForMonth,
} from '@/services/structuredFinance';
import { computeOTPay, otByWeekFromEntries } from '@/utils/otPay';
import {
  toExpenseByCategoryChart,
  toBudgetPlanActualChart,
  toIncomeVsExpenseChart,
  toBillDueStatusChart,
} from '@/services/chartAdapters';
import { getStructuredRoot } from './jsonFinanceBridge';

function monthLabel(monthKey: string): string {
  return MONTH_LABEL[monthKey] ?? monthKey;
}

export function getMonthlyBudget(
  state: AppFinanceState,
  monthKey: string
): BudgetCategory[] {
  return state.monthData[monthKey]?.budgetCategories ?? [];
}

export function getBudgetSummaryForMonth(
  state: AppFinanceState,
  monthKey: string
) {
  return budgetSummary(getMonthlyBudget(state, monthKey));
}

export function getMonthlyBudgetData(
  state: AppFinanceState,
  monthKey: string
): MonthlyBudget {
  const categories = getMonthlyBudget(state, monthKey);
  const { planned, actual, variance } = budgetSummary(categories);
  return {
    monthKey,
    monthLabel: monthLabel(monthKey),
    categories,
    plannedTotal: planned,
    actualTotal: actual,
    variance,
  };
}

export function getOTData(state: AppFinanceState, monthKey: string) {
  const m = state.monthData[monthKey];
  if (!m) {
    return {
      otEntries: [] as OTEntry[],
      otByWeek: [] as { week: string; amount: number }[],
      monthlySalary: 0,
      otCashTotal: 0,
      otHourlyBasic: 0,
      extraIncomeLines: [],
      bonusAllocation: {
        label: 'Bonus',
        amount: 0,
        allocatedTo: '',
      },
    };
  }
  const sessions = m.otEntries;
  const b = Math.max(0, m.otHourlyBasic ?? 0);
  const otCashTotal =
    Math.round(
      sessions.reduce(
        (s, e) => s + computeOTPay(e.hours, e.dayType, b),
        0
      ) * 100
    ) / 100;
  let otByWeek =
    sessions.length > 0 ? otByWeekFromEntries(sessions, b) : [];
  if (otByWeek.length === 0 && otCashTotal > 0) {
    const q = Math.round(otCashTotal * 0.25 * 100) / 100;
    otByWeek = [
      { week: 'Week 1', amount: q },
      { week: 'Week 2', amount: q },
      { week: 'Week 3', amount: q },
      {
        week: 'Week 4',
        amount: Math.max(0, Math.round((otCashTotal - q * 3) * 100) / 100),
      },
    ];
  }
  return {
    otEntries: sessions,
    otByWeek,
    monthlySalary: m.monthlySalary,
    otCashTotal,
    otHourlyBasic: b,
    extraIncomeLines: m.extraIncomeLines,
    bonusAllocation: m.bonusAllocation,
  };
}

export function getBills(
  state: AppFinanceState,
  monthKey: string
): Bill[] {
  return state.billsByMonth[monthKey] ?? [];
}

export function getEvents(state: AppFinanceState): TripEvent[] {
  return state.events;
}

export function getGearList(state: AppFinanceState): GearItem[] {
  return state.gear;
}

export function getGearWishlistTotals(items: GearItem[]) {
  const open = items.filter((i) => i.status === 'planned' || i.status === 'kiv');
  return {
    totalTarget: open.reduce((s, i) => s + i.targetPrice, 0),
    count: open.length,
  };
}

export function getSideIncome(
  state: AppFinanceState
): SideIncomeTransaction[] {
  return state.sideIncome;
}

export function getSideIncomeForMonth(
  state: AppFinanceState,
  monthKey: string
) {
  return sideTotalsForMonth(getSideIncome(state), monthKey);
}

export function getReferenceDate(state: AppFinanceState): string {
  return state.referenceDate;
}

export function getDashboardSummary(
  state: AppFinanceState,
  monthKey: string
): DashboardSummary {
  const budget = getMonthlyBudget(state, monthKey);
  const { actual: totalExpenses } = budgetSummary(budget);
  const ot = getOTData(state, monthKey);
  const side = getSideIncomeForMonth(state, monthKey);
  const extraTotal = ot.extraIncomeLines.reduce((s, l) => s + l.amount, 0);
  const totalIncome =
    ot.monthlySalary +
    ot.otCashTotal +
    side.income +
    Math.min(extraTotal, ot.monthlySalary * 0.15);

  const savingsAllocation =
    budget.find((c) => c.name === 'Savings')?.actual ?? 0;
  const bills = getBills(state, monthKey);
  const events = getEvents(state);
  const ref = new Date(state.referenceDate + 'T12:00:00');

  return {
    monthLabel: monthLabel(monthKey),
    totalIncome: Math.round(totalIncome * 100) / 100,
    totalExpenses: Math.round(totalExpenses * 100) / 100,
    remainingBalance:
      Math.round((totalIncome - totalExpenses) * 100) / 100,
    savingsAllocation,
    upcomingBillsCount: bills.filter((b) => b.status !== 'paid').length,
    upcomingEventsCount: events.filter(
      (e) => new Date(e.eventDate) >= ref
    ).length,
    otEarnedThisMonth: Math.round(ot.otCashTotal * 100) / 100,
    sideIncomeThisMonth: Math.round(side.income * 100) / 100,
  };
}

export function getChartExpenseByCategory(
  state: AppFinanceState,
  monthKey: string
) {
  return toExpenseByCategoryChart(getMonthlyBudget(state, monthKey));
}

export function getChartIncomeVsExpense(
  state: AppFinanceState,
  monthKey: string
) {
  const sum = getDashboardSummary(state, monthKey);
  return toIncomeVsExpenseChart(sum.totalIncome, sum.totalExpenses);
}

export function getChartBudgetPlanActual(
  state: AppFinanceState,
  monthKey: string
) {
  return toBudgetPlanActualChart(getMonthlyBudget(state, monthKey));
}

export function getChartBillStatus(
  state: AppFinanceState,
  monthKey: string
) {
  return toBillDueStatusChart(getBills(state, monthKey));
}

export function getDataSourceInfo() {
  const root = getStructuredRoot();
  return {
    workbook: root.sourceWorkbook,
    sheets: root.monthlyOT.map((m) => m.sheet),
    monthKeys: Object.keys(MONTH_KEY_TO_SHEET),
  };
}
