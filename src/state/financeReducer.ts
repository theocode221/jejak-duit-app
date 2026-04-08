import type { AppFinanceState, FinanceAction } from './appFinanceTypes';

export function financeReducer(
  state: AppFinanceState,
  action: FinanceAction
): AppFinanceState {
  switch (action.type) {
    case 'reset':
      return action.state;

    case 'budget/update': {
      const cur = state.monthData[action.monthKey];
      if (!cur) return state;
      return {
        ...state,
        monthData: {
          ...state.monthData,
          [action.monthKey]: {
            ...cur,
            budgetCategories: cur.budgetCategories.map((c) =>
              c.id === action.id ? { ...c, ...action.patch } : c
            ),
          },
        },
      };
    }
    case 'budget/add': {
      const cur = state.monthData[action.monthKey];
      if (!cur) return state;
      return {
        ...state,
        monthData: {
          ...state.monthData,
          [action.monthKey]: {
            ...cur,
            budgetCategories: [...cur.budgetCategories, action.category],
          },
        },
      };
    }
    case 'budget/remove': {
      const cur = state.monthData[action.monthKey];
      if (!cur) return state;
      return {
        ...state,
        monthData: {
          ...state.monthData,
          [action.monthKey]: {
            ...cur,
            budgetCategories: cur.budgetCategories.filter(
              (c) => c.id !== action.id
            ),
          },
        },
      };
    }

    case 'ot/update': {
      const cur = state.monthData[action.monthKey];
      if (!cur) return state;
      return {
        ...state,
        monthData: {
          ...state.monthData,
          [action.monthKey]: {
            ...cur,
            otEntries: cur.otEntries.map((e) =>
              e.id === action.id ? { ...e, ...action.patch } : e
            ),
          },
        },
      };
    }
    case 'ot/add': {
      const cur = state.monthData[action.monthKey];
      if (!cur) return state;
      return {
        ...state,
        monthData: {
          ...state.monthData,
          [action.monthKey]: {
            ...cur,
            otEntries: [...cur.otEntries, action.entry],
          },
        },
      };
    }
    case 'ot/remove': {
      const cur = state.monthData[action.monthKey];
      if (!cur) return state;
      return {
        ...state,
        monthData: {
          ...state.monthData,
          [action.monthKey]: {
            ...cur,
            otEntries: cur.otEntries.filter((e) => e.id !== action.id),
          },
        },
      };
    }

    case 'income/setSalary': {
      const cur = state.monthData[action.monthKey];
      if (!cur) return state;
      return {
        ...state,
        monthData: {
          ...state.monthData,
          [action.monthKey]: {
            ...cur,
            monthlySalary: action.salary,
          },
        },
      };
    }
    case 'income/setOtHourlyBasic': {
      const cur = state.monthData[action.monthKey];
      if (!cur) return state;
      const v = Math.max(0, action.hourlyBasic);
      return {
        ...state,
        monthData: {
          ...state.monthData,
          [action.monthKey]: {
            ...cur,
            otHourlyBasic: v,
          },
        },
      };
    }
    case 'income/extra/update': {
      const cur = state.monthData[action.monthKey];
      if (!cur) return state;
      return {
        ...state,
        monthData: {
          ...state.monthData,
          [action.monthKey]: {
            ...cur,
            extraIncomeLines: cur.extraIncomeLines.map((l) =>
              l.id === action.id ? { ...l, ...action.patch } : l
            ),
          },
        },
      };
    }
    case 'income/extra/add': {
      const cur = state.monthData[action.monthKey];
      if (!cur) return state;
      return {
        ...state,
        monthData: {
          ...state.monthData,
          [action.monthKey]: {
            ...cur,
            extraIncomeLines: [...cur.extraIncomeLines, action.line],
          },
        },
      };
    }
    case 'income/extra/remove': {
      const cur = state.monthData[action.monthKey];
      if (!cur) return state;
      return {
        ...state,
        monthData: {
          ...state.monthData,
          [action.monthKey]: {
            ...cur,
            extraIncomeLines: cur.extraIncomeLines.filter(
              (l) => l.id !== action.id
            ),
          },
        },
      };
    }
    case 'income/bonus/set': {
      const cur = state.monthData[action.monthKey];
      if (!cur) return state;
      return {
        ...state,
        monthData: {
          ...state.monthData,
          [action.monthKey]: {
            ...cur,
            bonusAllocation: action.bonus,
          },
        },
      };
    }

    case 'bills/update': {
      const list = state.billsByMonth[action.monthKey] ?? [];
      return {
        ...state,
        billsByMonth: {
          ...state.billsByMonth,
          [action.monthKey]: list.map((b) =>
            b.id === action.id ? { ...b, ...action.patch } : b
          ),
        },
      };
    }
    case 'bills/add': {
      const list = state.billsByMonth[action.monthKey] ?? [];
      return {
        ...state,
        billsByMonth: {
          ...state.billsByMonth,
          [action.monthKey]: [...list, action.bill],
        },
      };
    }
    case 'bills/remove': {
      const list = state.billsByMonth[action.monthKey] ?? [];
      return {
        ...state,
        billsByMonth: {
          ...state.billsByMonth,
          [action.monthKey]: list.filter((b) => b.id !== action.id),
        },
      };
    }

    case 'events/update':
      return {
        ...state,
        events: state.events.map((e) =>
          e.id === action.id ? { ...e, ...action.patch } : e
        ),
      };
    case 'events/breakdown/set':
      return {
        ...state,
        events: state.events.map((e) =>
          e.id === action.id
            ? {
                ...e,
                breakdown: { ...e.breakdown, [action.key]: action.value },
              }
            : e
        ),
      };
    case 'events/add':
      return { ...state, events: [...state.events, action.event] };
    case 'events/remove':
      return {
        ...state,
        events: state.events.filter((e) => e.id !== action.id),
      };

    case 'gear/update':
      return {
        ...state,
        gear: state.gear.map((g) =>
          g.id === action.id ? { ...g, ...action.patch } : g
        ),
      };
    case 'gear/add':
      return { ...state, gear: [...state.gear, action.item] };
    case 'gear/remove':
      return {
        ...state,
        gear: state.gear.filter((g) => g.id !== action.id),
      };

    case 'side/update':
      return {
        ...state,
        sideIncome: state.sideIncome.map((t) =>
          t.id === action.id ? { ...t, ...action.patch } : t
        ),
      };
    case 'side/add':
      return { ...state, sideIncome: [...state.sideIncome, action.tx] };
    case 'side/remove':
      return {
        ...state,
        sideIncome: state.sideIncome.filter((t) => t.id !== action.id),
      };

    case 'meta/setReferenceDate':
      return { ...state, referenceDate: action.isoDate };

    default:
      return state;
  }
}
