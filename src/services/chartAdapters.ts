import type { Bill, BillDueStatus, BillStatus, BudgetCategory } from '@/types';

/** Pie / donut: expense by category */
export function toExpenseByCategoryChart(categories: BudgetCategory[]) {
  return categories.map((c) => ({
    category: c.name,
    amount: c.actual,
  }));
}

/** Grouped bar: planned vs actual */
export function toBudgetPlanActualChart(categories: BudgetCategory[]) {
  return categories.map((c) => ({
    name: c.name,
    label: c.chartLabel ?? c.name,
    planned: c.planned,
    actual: c.actual,
  }));
}

/** Income vs spent bar */
export function toIncomeVsExpenseChart(income: number, spent: number) {
  return [
    { name: 'Income', amount: income },
    { name: 'Spent', amount: spent },
  ];
}

export function toBillDueStatusChart(bills: Bill[]): BillDueStatus[] {
  const map = new Map<BillStatus, number>();
  for (const b of bills) {
    map.set(b.status, (map.get(b.status) ?? 0) + 1);
  }
  return (['paid', 'unpaid', 'upcoming'] as const).map((status) => ({
    status,
    count: map.get(status) ?? 0,
  }));
}
