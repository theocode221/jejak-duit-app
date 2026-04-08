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
    b.misc
  );
}
