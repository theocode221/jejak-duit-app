export function formatMYR(value: number, compact = false): string {
  if (compact && Math.abs(value) >= 1000) {
    return new Intl.NumberFormat('en-MY', {
      style: 'currency',
      currency: 'MYR',
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(value);
  }
  return new Intl.NumberFormat('en-MY', {
    style: 'currency',
    currency: 'MYR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

/** MYR with fractional sen — avoids rounding installment splits to whole ringgit */
export function formatMYRExact(value: number): string {
  return new Intl.NumberFormat('en-MY', {
    style: 'currency',
    currency: 'MYR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 8,
  }).format(value);
}

/** Round toward +∞ to 2 decimal places (e.g. 13.66667 → 13.67). */
export function roundUpMoney2(n: number): number {
  return Math.ceil(n * 100 - 1e-9) / 100;
}

/** MYR fixed to 2 sen (after round-up amounts). */
export function formatMYR2(value: number): string {
  return new Intl.NumberFormat('en-MY', {
    style: 'currency',
    currency: 'MYR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatDate(iso: string): string {
  return new Intl.DateTimeFormat('en-MY', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(iso.slice(0, 10) + 'T12:00:00'));
}

/** e.g. 25 May 2026 — noon anchor avoids TZ drift on date-only strings. */
export function formatDepositLong(iso: string): string {
  return new Intl.DateTimeFormat('en-MY', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(iso.slice(0, 10) + 'T12:00:00'));
}

export function formatDay(day: number): string {
  return `Day ${day}`;
}
