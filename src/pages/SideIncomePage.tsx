import { AppShell } from '@/components/layout/AppShell';
import { StatCard } from '@/components/common/StatCard';
import { PageSection } from '@/components/common/PageSection';
import { ChartShell } from '@/components/common/ChartShell';
import { SideIncomeBar } from '@/components/charts/SideIncomeBar';
import { getSideIncomeForMonth } from '@/state/financeSelectors';
import { useMonth } from '@/context/MonthContext';
import { useFinance } from '@/state/FinanceContext';
import { formatMYR } from '@/utils/format';
import type { SideTransactionType } from '@/types';
import { newId } from '@/utils/id';

const TX_TYPES: SideTransactionType[] = ['income', 'expense'];

function parseMoney(v: string): number {
  const n = parseFloat(v.replace(/,/g, ''));
  return Number.isFinite(n) ? n : 0;
}

export function SideIncomePage() {
  const { month, monthLabel } = useMonth();
  const { state, dispatch } = useFinance();
  const { income, expense, net, items } = getSideIncomeForMonth(state, month);

  const chartData = [{ name: monthLabel, income, expense }];

  return (
    <AppShell title="Side Income">
      <PageSection title={`${monthLabel} performance`}>
      <div className="side-cards">
        <StatCard label="Side income" value={formatMYR(income)} />
        <StatCard label="Side expenses" value={formatMYR(expense)} />
        <StatCard label="Net" value={formatMYR(net)} />
      </div>
      </PageSection>

      <ChartShell title="Income vs expense" minHeight={260}>
        <SideIncomeBar data={chartData} />
      </ChartShell>

      <PageSection title="All side transactions">
        <div className="side-edit-bar">
          <button
            type="button"
            className="btn-row"
            onClick={() =>
              dispatch({
                type: 'side/add',
                tx: {
                  id: newId('side'),
                  name: 'New entry',
                  type: 'income',
                  amount: 0,
                  month,
                  source: '',
                },
              })
            }
          >
            Add row
          </button>
        </div>

      <div className="side-table-wrap">
        <h2 className="side-h2">Transactions</h2>
        {state.sideIncome.length === 0 ? (
          <p className="side-empty">No side transactions — add a row.</p>
        ) : (
          <div className="bajet-table-scroll">
          <table className="side-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Type</th>
                <th>Month</th>
                <th>Source</th>
                <th>Amount</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {state.sideIncome.map((t) => (
                <tr key={t.id}>
                  <td>
                    <input
                      className="fld-input side-table__strong"
                      value={t.name}
                      onChange={(e) =>
                        dispatch({
                          type: 'side/update',
                          id: t.id,
                          patch: { name: e.target.value },
                        })
                      }
                    />
                  </td>
                  <td>
                    <select
                      className="fld-input"
                      value={t.type}
                      onChange={(e) =>
                        dispatch({
                          type: 'side/update',
                          id: t.id,
                          patch: {
                            type: e.target.value as SideTransactionType,
                          },
                        })
                      }
                    >
                      {TX_TYPES.map((x) => (
                        <option key={x} value={x}>
                          {x}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <input
                      className="fld-input side-table__month"
                      value={t.month}
                      placeholder="2026-04"
                      onChange={(e) =>
                        dispatch({
                          type: 'side/update',
                          id: t.id,
                          patch: { month: e.target.value },
                        })
                      }
                    />
                  </td>
                  <td>
                    <input
                      className="fld-input"
                      value={t.source}
                      onChange={(e) =>
                        dispatch({
                          type: 'side/update',
                          id: t.id,
                          patch: { source: e.target.value },
                        })
                      }
                    />
                  </td>
                  <td>
                    <input
                      className="fld-num"
                      type="number"
                      step="0.01"
                      value={t.amount}
                      onChange={(e) =>
                        dispatch({
                          type: 'side/update',
                          id: t.id,
                          patch: { amount: parseMoney(e.target.value) },
                        })
                      }
                    />
                  </td>
                  <td>
                    <button
                      type="button"
                      className="btn-row danger"
                      onClick={() =>
                        dispatch({ type: 'side/remove', id: t.id })
                      }
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}
        <p className="side-filter-note">
          Rows matching <strong>{month}</strong> in the table feed the stats and
          chart above ({items.length} row{items.length === 1 ? '' : 's'}).
        </p>
      </div>
      </PageSection>

      <style>{`
        .side-edit-bar {
          margin-bottom: 0.75rem;
        }
        .side-cards {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 1rem;
        }
        @media (max-width: 720px) {
          .side-cards {
            grid-template-columns: 1fr;
          }
        }
        .side-table-wrap {
          background: var(--surface);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius);
          padding: 1.1rem 1.2rem;
          box-shadow: var(--shadow-card);
        }
        .side-h2 {
          margin: 0 0 0.75rem;
          font-size: 0.9375rem;
          font-weight: 600;
        }
        .side-empty {
          margin: 0;
          font-size: 0.875rem;
          color: var(--text-muted);
        }
        .side-table {
          width: 100%;
          font-size: 0.875rem;
        }
        .side-table th,
        .side-table td {
          text-align: left;
          padding: 0.65rem 0.5rem;
          border-bottom: 1px solid var(--border);
          vertical-align: middle;
        }
        .side-table th {
          font-size: 0.7rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--text-muted);
        }
        .side-table__strong {
          font-weight: 600;
          min-width: 8rem;
        }
        .side-table__month {
          min-width: 6.5rem;
          font-family: var(--font-mono);
          font-size: 0.75rem;
        }
        .side-filter-note {
          margin: 1rem 0 0;
          font-size: 0.8125rem;
          color: var(--text-muted);
        }
        @media (max-width: 640px) {
          .side-cards {
            gap: 0.75rem;
          }
          .side-table-wrap {
            padding: 0.85rem 0.9rem;
          }
          .side-h2 {
            font-size: 0.875rem;
            margin-bottom: 0.6rem;
          }
          .side-table {
            font-size: 0.8rem;
          }
          .side-table th,
          .side-table td {
            padding: 0.5rem 0.4rem;
          }
          .side-table th {
            font-size: 0.62rem;
          }
          .side-filter-note {
            font-size: 0.76rem;
            margin-top: 0.75rem;
            line-height: 1.45;
          }
        }
      `}</style>
    </AppShell>
  );
}
