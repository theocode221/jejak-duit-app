import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  SEED_CATEGORIES,
  SEED_ENTRIES,
  SEED_STATUSES,
} from '@/data/installmentsSeed';
import * as svc from '@/services/installmentService';
import type {
  CategoryLimit,
  InstallmentEntry,
  InstallmentPaymentStatus,
} from '@/types/installments';
import { newId } from '@/utils/id';

type InstallmentsBase = {
  categories: CategoryLimit[];
  entries: InstallmentEntry[];
  statuses: InstallmentPaymentStatus[];
  togglePaid: (installmentId: string, month: string, isPaid: boolean) => void;
  addCategory: (name: string, monthlyLimit: number) => void;
  updateCategory: (
    id: string,
    patch: Partial<Pick<CategoryLimit, 'name' | 'monthlyLimit'>>
  ) => void;
  deleteCategory: (id: string) => boolean;
  addEntry: (entry: Omit<InstallmentEntry, 'id'>) => void;
  updateEntry: (
    id: string,
    data: Omit<InstallmentEntry, 'id'>
  ) => void;
  removeEntry: (id: string) => void;
};

const InstallmentsBaseContext = createContext<InstallmentsBase | null>(null);

export function InstallmentsProvider({ children }: { children: ReactNode }) {
  const [categories, setCategories] = useState<CategoryLimit[]>(() => [
    ...SEED_CATEGORIES,
  ]);
  const [entries, setEntries] = useState<InstallmentEntry[]>(() => [
    ...SEED_ENTRIES,
  ]);
  const [statuses, setStatuses] = useState<InstallmentPaymentStatus[]>(() => [
    ...SEED_STATUSES,
  ]);

  const togglePaid = useCallback(
    (installmentId: string, month: string, isPaid: boolean) => {
      setStatuses((prev) =>
        svc.upsertPaymentStatus(prev, installmentId, month, isPaid)
      );
    },
    []
  );

  const addCategory = useCallback((name: string, monthlyLimit: number) => {
    const id = newId('cat');
    setCategories((c) => [
      ...c,
      { id, name: name.trim() || 'New category', monthlyLimit },
    ]);
  }, []);

  const updateCategory = useCallback(
    (
      id: string,
      patch: Partial<Pick<CategoryLimit, 'name' | 'monthlyLimit'>>
    ) => {
      setCategories((c) =>
        c.map((row) => (row.id === id ? { ...row, ...patch } : row))
      );
    },
    []
  );

  const deleteCategory = useCallback((id: string) => {
    if (entries.some((e) => e.categoryId === id)) return false;
    setCategories((c) => c.filter((row) => row.id !== id));
    return true;
  }, [entries]);

  const addEntry = useCallback((entry: Omit<InstallmentEntry, 'id'>) => {
    const id = newId('ins');
    setEntries((e) => [...e, { ...entry, id }]);
  }, []);

  const updateEntry = useCallback(
    (id: string, data: Omit<InstallmentEntry, 'id'>) => {
      setEntries((list) =>
        list.map((row) => (row.id === id ? { ...data, id } : row))
      );
    },
    []
  );

  const removeEntry = useCallback((id: string) => {
    setEntries((e) => e.filter((x) => x.id !== id));
    setStatuses((s) => s.filter((x) => x.installmentId !== id));
  }, []);

  const value = useMemo(
    () => ({
      categories,
      entries,
      statuses,
      togglePaid,
      addCategory,
      updateCategory,
      deleteCategory,
      addEntry,
      updateEntry,
      removeEntry,
    }),
    [
      categories,
      entries,
      statuses,
      togglePaid,
      addCategory,
      updateCategory,
      deleteCategory,
      addEntry,
      updateEntry,
      removeEntry,
    ]
  );

  return (
    <InstallmentsBaseContext.Provider value={value}>
      {children}
    </InstallmentsBaseContext.Provider>
  );
}

function useInstallmentsBase(): InstallmentsBase {
  const v = useContext(InstallmentsBaseContext);
  if (!v) {
    throw new Error(
      'useInstallmentsStore requires InstallmentsProvider (wrap App).'
    );
  }
  return v;
}

/** Shared installment model + month-scoped summaries (same data as Installments page). */
export function useInstallmentsStore(selectedMonth: string) {
  const base = useInstallmentsBase();

  const summary = useMemo(
    () => ({
      totalDue: svc.totalDueForMonth(base.entries, selectedMonth),
      totalPaid: svc.totalPaidForMonth(
        base.entries,
        base.statuses,
        selectedMonth
      ),
      totalUnpaid: svc.totalUnpaidForMonth(
        base.entries,
        base.statuses,
        selectedMonth
      ),
      activeCount: svc.activeInstallmentCount(base.entries, selectedMonth),
    }),
    [base.entries, base.statuses, selectedMonth]
  );

  const categoryBalances = useMemo(
    () =>
      svc.categoryBalanceRows(
        base.categories,
        base.entries,
        selectedMonth
      ),
    [base.categories, base.entries, selectedMonth]
  );

  const methodSplit = useMemo(
    () => svc.methodSplitForMonth(base.entries, selectedMonth),
    [base.entries, selectedMonth]
  );

  const paidUnpaidSlices = useMemo(
    () =>
      svc.paidUnpaidSlicesForMonth(
        base.entries,
        base.statuses,
        selectedMonth
      ),
    [base.entries, base.statuses, selectedMonth]
  );

  const trendMonths = useMemo(
    () => [
      '2026-02',
      '2026-03',
      '2026-04',
      '2026-05',
      '2026-06',
      '2026-07',
      '2026-08',
    ],
    []
  );

  const monthlyTrend = useMemo(
    () => svc.monthlyDueTrend(base.entries, trendMonths),
    [base.entries, trendMonths]
  );

  return {
    ...base,
    summary,
    categoryBalances,
    methodSplit,
    paidUnpaidSlices,
    monthlyTrend,
  };
}
