import {
  createContext,
  useContext,
  useEffect,
  useReducer,
  type ReactNode,
} from 'react';
import { financeReducer } from './financeReducer';
import { migrateAppFinanceState } from './financeMigrate';
import { createInitialAppFinanceState } from './jsonFinanceBridge';
import {
  FINANCE_STORAGE_KEY,
  type AppFinanceState,
  type FinanceAction,
} from './appFinanceTypes';

type FinanceContextValue = {
  state: AppFinanceState;
  dispatch: React.Dispatch<FinanceAction>;
};

const FinanceContext = createContext<FinanceContextValue | null>(null);

function loadState(): AppFinanceState {
  try {
    const raw = localStorage.getItem(FINANCE_STORAGE_KEY);
    if (raw) {
      const p = JSON.parse(raw) as unknown;
      const migrated = migrateAppFinanceState(p);
      if (migrated) return migrated;
    }
  } catch {
    /* ignore corrupt storage */
  }
  return createInitialAppFinanceState();
}

export function FinanceProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(financeReducer, undefined, loadState);

  useEffect(() => {
    localStorage.setItem(FINANCE_STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  return (
    <FinanceContext.Provider value={{ state, dispatch }}>
      {children}
    </FinanceContext.Provider>
  );
}

export function useFinance() {
  const ctx = useContext(FinanceContext);
  if (!ctx) throw new Error('useFinance must be used within FinanceProvider');
  return ctx;
}

export function resetFinanceDispatch(
  dispatch: React.Dispatch<FinanceAction>
) {
  dispatch({
    type: 'reset',
    state: createInitialAppFinanceState(),
  });
}
