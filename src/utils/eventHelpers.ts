import type { TripEvent } from '@/types';

export function eventRemaining(e: TripEvent) {
  return e.plannedBudget - e.actualSpending;
}

export function breakdownTotal(b: TripEvent['breakdown']) {
  return (
    b.transport +
    b.hotel +
    b.makan +
    b.registration +
    b.shopping +
    b.others
  );
}

/** Keep `actualSpending` aligned with the sum of category spending. */
export function tripEventWithActualFromBreakdown(e: TripEvent): TripEvent {
  return { ...e, actualSpending: breakdownTotal(e.breakdown) };
}
