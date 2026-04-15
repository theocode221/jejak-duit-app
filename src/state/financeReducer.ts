import type { AppFinanceState, FinanceAction } from './appFinanceTypes';
import { newId } from '@/utils/id';
import { breakdownTotal, tripEventWithActualFromBreakdown } from '@/utils/eventHelpers';
import { basicHourlyFromMonthlySalary } from '@/utils/otPay';
import { kwspFromBasic } from '@/utils/salaryPeriodUtils';

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
      const salary = Math.max(0, action.salary);
      return {
        ...state,
        monthData: {
          ...state.monthData,
          [action.monthKey]: {
            ...cur,
            monthlySalary: salary,
            otHourlyBasic: basicHourlyFromMonthlySalary(salary),
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

    case 'salary/period/add': {
      const dep = action.period.depositDate.slice(0, 10);
      if (
        state.salaryPeriods.some((p) => p.depositDate.slice(0, 10) === dep)
      ) {
        return state;
      }
      return {
        ...state,
        salaryPeriods: [
          ...state.salaryPeriods,
          { ...action.period, depositDate: dep },
        ],
      };
    }

    case 'salary/period/patch': {
      return {
        ...state,
        salaryPeriods: state.salaryPeriods.map((p) => {
          if (p.id !== action.id) return p;
          const er = action.patch.earnings;
          const dd = action.patch.deductions;
          const nextEarnings = er ? { ...p.earnings, ...er } : p.earnings;
          let nextDeductions = dd
            ? { ...p.deductions, ...dd }
            : p.deductions;
          if (
            er &&
            typeof er.basic === 'number' &&
            (dd === undefined || dd.kwsp === undefined)
          ) {
            nextDeductions = {
              ...nextDeductions,
              kwsp: kwspFromBasic(nextEarnings.basic),
            };
          }
          return {
            ...p,
            ...(action.patch.label !== undefined
              ? { label: action.patch.label }
              : {}),
            ...(action.patch.depositDate !== undefined
              ? { depositDate: action.patch.depositDate.slice(0, 10) }
              : {}),
            earnings: nextEarnings,
            deductions: nextDeductions,
          };
        }),
      };
    }

    case 'salary/period/finalize': {
      return {
        ...state,
        salaryPeriods: state.salaryPeriods.map((p) =>
          p.id === action.id ? { ...p, status: 'finalized' as const } : p
        ),
      };
    }

    case 'salary/period/duplicateToNextDeposit': {
      const src = state.salaryPeriods.find((p) => p.id === action.fromId);
      if (!src) return state;
      const nextDep = action.nextDepositDate.slice(0, 10);
      if (state.salaryPeriods.some((p) => p.depositDate === nextDep)) {
        return state;
      }
      const copy: (typeof state)['salaryPeriods'][number] = {
        id: newId('salary'),
        label: action.nextLabel,
        depositDate: nextDep,
        status: 'forecast',
        earnings: { ...src.earnings },
        deductions: { ...src.deductions },
      };
      return {
        ...state,
        salaryPeriods: [...state.salaryPeriods, copy],
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
        events: state.events.map((e) => {
          if (e.id !== action.id) return e;
          const next = { ...e, ...action.patch };
          if (action.patch.breakdown !== undefined) {
            return {
              ...next,
              actualSpending: breakdownTotal(next.breakdown),
            };
          }
          return next;
        }),
      };
    case 'events/breakdown/set':
      return {
        ...state,
        events: state.events.map((e) => {
          if (e.id !== action.id) return e;
          const breakdown = { ...e.breakdown, [action.key]: action.value };
          return {
            ...e,
            breakdown,
            actualSpending: breakdownTotal(breakdown),
          };
        }),
      };
    case 'events/add':
      return {
        ...state,
        events: [...state.events, tripEventWithActualFromBreakdown(action.event)],
      };
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
