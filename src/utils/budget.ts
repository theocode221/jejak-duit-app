import type { BudgetCategory, BudgetStatus } from '@/types';

export function categoryStatus(cat: BudgetCategory): BudgetStatus {
  const variance = cat.planned - cat.actual;
  if (variance > 0) return 'under';
  if (variance < 0) return 'over';
  return 'on_track';
}

export function statusLabel(s: BudgetStatus): string {
  switch (s) {
    case 'under':
      return 'Under budget';
    case 'over':
      return 'Over budget';
    default:
      return 'On track';
  }
}
