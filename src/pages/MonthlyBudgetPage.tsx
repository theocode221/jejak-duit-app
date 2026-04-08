import { AppShell } from '@/components/layout/AppShell';
import { StatCard } from '@/components/common/StatCard';
import { PageSection } from '@/components/common/PageSection';
import { ChartShell } from '@/components/common/ChartShell';
import { PlannedActualBars } from '@/components/charts/PlannedActualBars';
import { useMonth } from '@/context/MonthContext';
import { useFinance } from '@/state/FinanceContext';
import {
  getMonthlyBudget,
  getBudgetSummaryForMonth,
} from '@/state/financeSelectors';
import { formatMYR } from '@/utils/format';
import { categoryStatus, statusLabel } from '@/utils/budget';
import { StatusBadge } from '@/components/common/StatusBadge';
import type { BudgetStatus } from '@/types';
import { newId } from '@/utils/id';

function badgeVariant(s: BudgetStatus): 'success' | 'warning' | 'danger' | 'neutral' {
  if (s === 'under') return 'success';
  if (s === 'over') return 'danger';
  return 'neutral';
}

function parseMoney(v: string): number {
  const n = parseFloat(v.replace(/,/g, ''));
  return Number.isFinite(n) ? n : 0;
}

export function MonthlyBudgetPage() {
  const { month } = useMonth();
  const { state, dispatch } = useFinance();
  const budgetCategories = getMonthlyBudget(state, month);
  const { planned, actual, variance } = getBudgetSummaryForMonth(state, month);
  const chartData = budgetCategories.map((c) => ({
    name: c.name,
    label: c.chartLabel ?? c.name,
    planned: c.planned,
    actual: c.actual,
  }));

  return (
    <AppShell
      kicker="Envelopes"
      title="Monthly budget"
      subtitle="Edit categories, chart labels, and amounts — stored in this browser."
    >
      <PageSection
        kicker="Summary"
        title="Envelope roll-up"
        description="Planned ceiling versus spend to date. Variance is planned minus actual (positive means room left)."
      >
      <div className="budget-summary bajet-stat-grid">
        <StatCard
          label="Total planned"
          value={formatMYR(planned)}
          hint="All categories"
        />
        <StatCard
          label="Total actual"
          value={formatMYR(actual)}
          hint="Spend to date"
        />
        <StatCard
          label="Variance"
          value={formatMYR(Math.abs(variance))}
          hint={variance >= 0 ? 'Under plan (good)' : 'Over plan'}
          trend={{
            label: variance >= 0 ? 'Under budget' : 'Over budget',
            positive: variance >= 0,
          }}
        />
      </div>
      </PageSection>

      <ChartShell
        kicker="Visual"
        title="Planned vs actual"
        subtitle="Teal = actual, indigo = plan. Hover for full category names."
        minHeight={360}
      >
        <PlannedActualBars data={chartData} />
      </ChartShell>

      <PageSection
        kicker="Structure"
        title="Edit categories"
        description="Add or remove envelope lines. Chart label is optional (falls back to name)."
      >
        <div className="budget-edit-actions">
          <button
            type="button"
            className="btn-row"
            onClick={() =>
              dispatch({
                type: 'budget/add',
                monthKey: month,
                category: {
                  id: newId('cat'),
                  name: 'New category',
                  chartLabel: '',
                  planned: 0,
                  actual: 0,
                },
              })
            }
          >
            Add category
          </button>
        </div>

      <div className="budget-cards">
        {budgetCategories.map((c) => {
          const st = categoryStatus(c);
          const diff = c.planned - c.actual;
          return (
            <div key={c.id} className="budget-card">
              <div className="budget-card__head">
                <span className="budget-card__name">{c.name}</span>
                <StatusBadge variant={badgeVariant(st)}>
                  {statusLabel(st)}
                </StatusBadge>
              </div>
              <div className="budget-card__nums">
                <div>
                  <span className="budget-card__lbl">Planned</span>
                  <span className="budget-card__val">{formatMYR(c.planned)}</span>
                </div>
                <div>
                  <span className="budget-card__lbl">Actual</span>
                  <span className="budget-card__val">{formatMYR(c.actual)}</span>
                </div>
                <div>
                  <span className="budget-card__lbl">Diff</span>
                  <span
                    className={`budget-card__val ${
                      diff >= 0 ? 'is-pos' : 'is-neg'
                    }`}
                  >
                    {diff >= 0 ? '+' : ''}
                    {formatMYR(diff)}
                  </span>
                </div>
              </div>
              <div className="budget-card__bar">
                <div
                  className="budget-card__fill"
                  style={{
                    width: `${c.planned > 0 ? Math.min(100, (c.actual / c.planned) * 100) : 0}%`,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="budget-table-wrap bajet-panel">
        <table className="budget-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Chart label</th>
              <th>Planned</th>
              <th>Actual</th>
              <th>Variance</th>
              <th>Status</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {budgetCategories.map((c) => {
              const st = categoryStatus(c);
              const v = c.planned - c.actual;
              return (
                <tr key={c.id}>
                  <td>
                    <input
                      className="fld-input"
                      value={c.name}
                      onChange={(e) =>
                        dispatch({
                          type: 'budget/update',
                          monthKey: month,
                          id: c.id,
                          patch: { name: e.target.value },
                        })
                      }
                    />
                  </td>
                  <td>
                    <input
                      className="fld-input"
                      value={c.chartLabel ?? ''}
                      placeholder={c.name}
                      onChange={(e) =>
                        dispatch({
                          type: 'budget/update',
                          monthKey: month,
                          id: c.id,
                          patch: {
                            chartLabel: e.target.value || undefined,
                          },
                        })
                      }
                    />
                  </td>
                  <td>
                    <input
                      className="fld-num"
                      type="number"
                      step="0.01"
                      value={Number.isFinite(c.planned) ? c.planned : 0}
                      onChange={(e) =>
                        dispatch({
                          type: 'budget/update',
                          monthKey: month,
                          id: c.id,
                          patch: { planned: parseMoney(e.target.value) },
                        })
                      }
                    />
                  </td>
                  <td>
                    <input
                      className="fld-num"
                      type="number"
                      step="0.01"
                      value={Number.isFinite(c.actual) ? c.actual : 0}
                      onChange={(e) =>
                        dispatch({
                          type: 'budget/update',
                          monthKey: month,
                          id: c.id,
                          patch: { actual: parseMoney(e.target.value) },
                        })
                      }
                    />
                  </td>
                  <td className={v >= 0 ? 'is-pos' : 'is-neg'}>
                    {v >= 0 ? '+' : ''}
                    {formatMYR(v)}
                  </td>
                  <td>
                    <StatusBadge variant={badgeVariant(st)}>
                      {statusLabel(st)}
                    </StatusBadge>
                  </td>
                  <td>
                    <button
                      type="button"
                      className="btn-row danger"
                      onClick={() =>
                        dispatch({
                          type: 'budget/remove',
                          monthKey: month,
                          id: c.id,
                        })
                      }
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      </PageSection>

      <style>{`
        .budget-edit-actions {
          margin-bottom: 1rem;
        }
        .budget-summary.bajet-stat-grid {
          grid-template-columns: repeat(3, minmax(0, 1fr));
        }
        @media (max-width: 720px) {
          .budget-summary.bajet-stat-grid {
            grid-template-columns: 1fr;
          }
        }
        .budget-cards {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 1rem;
        }
        @media (max-width: 1100px) {
          .budget-cards {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }
        @media (max-width: 560px) {
          .budget-cards {
            grid-template-columns: 1fr;
          }
        }
        .budget-card {
          background: var(--surface);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius);
          padding: 1.05rem 1.15rem;
          box-shadow: var(--shadow-card);
        }
        .budget-card__head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 0.5rem;
          margin-bottom: 0.75rem;
        }
        .budget-card__name {
          font-weight: 600;
          font-size: 0.875rem;
        }
        .budget-card__nums {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 0.5rem;
          font-size: 0.75rem;
        }
        .budget-card__lbl {
          display: block;
          color: var(--text-muted);
          margin-bottom: 0.15rem;
        }
        .budget-card__val {
          font-family: var(--font-mono);
          font-weight: 600;
          font-size: 0.8125rem;
        }
        .budget-card__val.is-pos {
          color: var(--positive);
        }
        .budget-card__val.is-neg {
          color: var(--negative);
        }
        .budget-card__bar {
          margin-top: 0.75rem;
          height: 6px;
          border-radius: 999px;
          background: #f1f5f9;
          overflow: hidden;
        }
        .budget-card__fill {
          height: 100%;
          border-radius: 999px;
          background: linear-gradient(90deg, var(--accent), var(--accent-2));
          max-width: 100%;
        }
        .budget-table-wrap {
          overflow-x: auto;
        }
        .budget-table {
          font-size: 0.875rem;
          min-width: 720px;
        }
        .budget-table th,
        .budget-table td {
          text-align: left;
          padding: 0.75rem 1rem;
          border-bottom: 1px solid var(--border);
          vertical-align: middle;
        }
        .budget-table th {
          font-size: 0.7rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--text-muted);
          font-weight: 600;
        }
        .budget-table .is-pos {
          color: var(--positive);
          font-weight: 600;
          font-family: var(--font-mono);
        }
        .budget-table .is-neg {
          color: var(--negative);
          font-weight: 600;
          font-family: var(--font-mono);
        }
      `}</style>
    </AppShell>
  );
}
