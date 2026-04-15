import type {
  CategoryLimit,
  InstallmentEntry,
  InstallmentPaymentStatus,
} from '@/types/installments';

/** Initial categories — editable in UI */
export const SEED_CATEGORIES: CategoryLimit[] = [
  { id: 'cat-room', name: 'Room', monthlyLimit: 300 },
  { id: 'cat-car-acc', name: 'Car accessories', monthlyLimit: 250 },
  { id: 'cat-hike', name: 'Hiking / run', monthlyLimit: 200 },
  { id: 'cat-self', name: 'Self-care', monthlyLimit: 150 },
  { id: 'cat-car-maint', name: 'Car maintenance', monthlyLimit: 400 },
];

export const SEED_ENTRIES: InstallmentEntry[] = [
  {
    id: 'ins-desk',
    title: 'Standing desk',
    totalAmount: 1200,
    categoryId: 'cat-room',
    method: 'spaylater',
    startMonth: '2026-03',
    durationMonths: 4,
    monthlyAmount: 300,
    notes: 'Office upgrade',
  },
  {
    id: 'ins-rack',
    title: 'Roof rack',
    totalAmount: 800,
    categoryId: 'cat-car-acc',
    method: 'atome',
    startMonth: '2026-04',
    durationMonths: 4,
    monthlyAmount: 200,
  },
  {
    id: 'ins-shoes',
    title: 'Trail runners',
    totalAmount: 599,
    categoryId: 'cat-hike',
    method: 'credit_card',
    startMonth: '2026-04',
    durationMonths: 3,
    monthlyAmount: 199.67,
  },
  {
    id: 'ins-spa',
    title: 'Gym + spa bundle',
    totalAmount: 450,
    categoryId: 'cat-self',
    method: 'spaylater',
    startMonth: '2026-04',
    durationMonths: 3,
    monthlyAmount: 150,
  },
  {
    id: 'ins-service',
    title: 'Major service (60k)',
    totalAmount: 1200,
    categoryId: 'cat-car-maint',
    method: 'credit_card',
    startMonth: '2026-05',
    durationMonths: 6,
    monthlyAmount: 200,
  },
];

/** Some months pre-marked paid for demo */
export const SEED_STATUSES: InstallmentPaymentStatus[] = [
  { id: 'ps-1', installmentId: 'ins-desk', month: '2026-03', isPaid: true },
  { id: 'ps-2', installmentId: 'ins-desk', month: '2026-04', isPaid: false },
  { id: 'ps-3', installmentId: 'ins-rack', month: '2026-04', isPaid: false },
  { id: 'ps-4', installmentId: 'ins-shoes', month: '2026-04', isPaid: true },
  { id: 'ps-5', installmentId: 'ins-spa', month: '2026-04', isPaid: false },
];
