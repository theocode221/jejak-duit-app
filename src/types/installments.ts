export type PaymentMethod = 'credit_card' | 'spaylater' | 'atome';

export type CategoryLimit = {
  id: string;
  name: string;
  monthlyLimit: number;
};

export type InstallmentEntry = {
  id: string;
  title: string;
  totalAmount: number;
  categoryId: string;
  method: PaymentMethod;
  /** First billing month (YYYY-MM) */
  startMonth: string;
  durationMonths: number;
  monthlyAmount: number;
  notes?: string;
};

export type InstallmentPaymentStatus = {
  id: string;
  installmentId: string;
  month: string;
  isPaid: boolean;
};

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  credit_card: 'Credit card',
  spaylater: 'SPayLater',
  atome: 'Atome',
};
