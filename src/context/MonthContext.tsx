import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

const MONTHS = [
  { value: '2026-03', label: 'March 2026' },
  { value: '2026-04', label: 'April 2026' },
  { value: '2026-05', label: 'May 2026' },
] as const;

type MonthValue = (typeof MONTHS)[number]['value'];

type MonthContextValue = {
  month: MonthValue;
  monthLabel: string;
  setMonth: (v: MonthValue) => void;
  options: typeof MONTHS;
};

const MonthContext = createContext<MonthContextValue | null>(null);

export function MonthProvider({ children }: { children: ReactNode }) {
  const [month, setMonthState] = useState<MonthValue>('2026-04');
  const setMonth = useCallback((v: MonthValue) => setMonthState(v), []);

  const value = useMemo(() => {
    const opt = MONTHS.find((m) => m.value === month);
    return {
      month,
      monthLabel: opt?.label ?? month,
      setMonth,
      options: MONTHS,
    };
  }, [month, setMonth]);

  return (
    <MonthContext.Provider value={value}>{children}</MonthContext.Provider>
  );
}

export function useMonth() {
  const ctx = useContext(MonthContext);
  if (!ctx) throw new Error('useMonth must be used within MonthProvider');
  return ctx;
}
