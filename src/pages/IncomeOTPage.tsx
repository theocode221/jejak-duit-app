import { AppShell } from '@/components/layout/AppShell';
import { StatCard } from '@/components/common/StatCard';
import { PageSection } from '@/components/common/PageSection';
import { ChartShell } from '@/components/common/ChartShell';
import { OTWeekBar } from '@/components/charts/OTWeekBar';
import { useMonth } from '@/context/MonthContext';
import { useFinance } from '@/state/FinanceContext';
import { getOTData } from '@/state/financeSelectors';
import { formatMYR } from '@/utils/format';
import { computeOTPay } from '@/utils/otPay';
import { newId } from '@/utils/id';
import type { OTDayType } from '@/types';

function parseMoney(v: string): number {
  const n = parseFloat(v.replace(/,/g, ''));
  return Number.isFinite(n) ? n : 0;
}

export function IncomeOTPage() {
  const { month } = useMonth();
  const { state, dispatch } = useFinance();
  const {
    otEntries,
    otByWeek,
    monthlySalary,
    otCashTotal,
    otHourlyBasic,
    extraIncomeLines,
    bonusAllocation,
  } = getOTData(state, month);
  const extraTotal = extraIncomeLines.reduce((s, e) => s + e.amount, 0);
  const gross = monthlySalary + otCashTotal + extraTotal;

  return (
    <AppShell
      kicker="Inflow"
      title="Income & OT"
      subtitle="OT uses hourly basic: regular day ×1.5; public holiday first 8h ×2, then ×3."
    >
      <PageSection
        kicker="Stack"
        title="What hit the account"
        description="Set monthly salary and hourly basic for OT. Session rows choose regular vs public; amounts are calculated automatically."
      >
      <div className="inc-cards">
        <div className="inc-salary-field">
          <label className="inc-salary-field__lbl">Monthly salary</label>
          <input
            className="fld-num inc-salary-field__input"
            type="number"
            step="0.01"
            value={monthlySalary}
            onChange={(e) =>
              dispatch({
                type: 'income/setSalary',
                monthKey: month,
                salary: parseMoney(e.target.value),
              })
            }
          />
        </div>
        <div className="inc-salary-field">
          <label className="inc-salary-field__lbl">Hourly basic (OT)</label>
          <input
            className="fld-num inc-salary-field__input"
            type="number"
            step="0.01"
            min={0}
            value={otHourlyBasic}
            onChange={(e) =>
              dispatch({
                type: 'income/setOtHourlyBasic',
                monthKey: month,
                hourlyBasic: parseMoney(e.target.value),
              })
            }
          />
        </div>
        <StatCard
          label="OT total"
          value={formatMYR(otCashTotal)}
          hint="From rules × hourly basic"
        />
        <StatCard
          label="Extra income"
          value={formatMYR(extraTotal)}
          hint="Freelance + misc lines"
        />
        <StatCard
          label="Gross inflow"
          value={formatMYR(gross)}
          hint="Salary + OT + extras"
          trend={{ label: 'Before budget buckets', positive: true }}
        />
      </div>
      </PageSection>

      <div className="inc-bonus">
        <div>
          <h3 className="inc-bonus__title">Bonus allocation</h3>
          <input
            className="fld-input inc-bonus__line"
            value={bonusAllocation.label}
            onChange={(e) =>
              dispatch({
                type: 'income/bonus/set',
                monthKey: month,
                bonus: { ...bonusAllocation, label: e.target.value },
              })
            }
          />
        </div>
        <input
          className="fld-num inc-bonus__amt-input"
          type="number"
          step="0.01"
          value={bonusAllocation.amount}
          onChange={(e) =>
            dispatch({
              type: 'income/bonus/set',
              monthKey: month,
              bonus: {
                ...bonusAllocation,
                amount: parseMoney(e.target.value),
              },
            })
          }
        />
        <input
          className="fld-input inc-bonus__note-input"
          value={bonusAllocation.allocatedTo}
          onChange={(e) =>
            dispatch({
              type: 'income/bonus/set',
              monthKey: month,
              bonus: { ...bonusAllocation, allocatedTo: e.target.value },
            })
          }
        />
      </div>

      <ChartShell
        kicker="Rhythm"
        title="OT by week"
        subtitle="Derived from OT entry dates and amounts."
        minHeight={280}
      >
        <OTWeekBar data={otByWeek} />
      </ChartShell>

      <PageSection
        kicker="Extras"
        title="Extra income lines"
        description="One-off inflows (resale, bonus pool movements, etc.)."
      >
        <div className="inc-extra-actions">
          <button
            type="button"
            className="btn-row"
            onClick={() =>
              dispatch({
                type: 'income/extra/add',
                monthKey: month,
                line: {
                  id: newId('extra'),
                  label: 'New line',
                  amount: 0,
                },
              })
            }
          >
            Add line
          </button>
        </div>
        <div className="inc-extra bajet-panel">
        <ul>
          {extraIncomeLines.map((e) => (
            <li key={e.id}>
              <input
                className="fld-input"
                value={e.label}
                onChange={(ev) =>
                  dispatch({
                    type: 'income/extra/update',
                    monthKey: month,
                    id: e.id,
                    patch: { label: ev.target.value },
                  })
                }
              />
              <input
                className="fld-num inc-extra__amt"
                type="number"
                step="0.01"
                value={e.amount}
                onChange={(ev) =>
                  dispatch({
                    type: 'income/extra/update',
                    monthKey: month,
                    id: e.id,
                    patch: { amount: parseMoney(ev.target.value) },
                  })
                }
              />
              <button
                type="button"
                className="btn-row danger"
                onClick={() =>
                  dispatch({
                    type: 'income/extra/remove',
                    monthKey: month,
                    id: e.id,
                  })
                }
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
        </div>
      </PageSection>

      <PageSection
        kicker="Sessions"
        title="OT entries"
        description="Regular: pay = hours × hourly basic × 1.5. Public holiday: first 8 hours × basic × 2, each additional hour × basic × 3."
      >
      <div className="inc-table-wrap">
        <div className="inc-table-head">
          <h3 className="inc-table__title">Sessions</h3>
          <button
            type="button"
            className="btn-row"
            onClick={() =>
              dispatch({
                type: 'ot/add',
                monthKey: month,
                entry: {
                  id: newId('ot'),
                  date: `${month}-15`,
                  hours: 1,
                  description: 'OT session',
                  dayType: 'regular',
                },
              })
            }
          >
            Add session
          </button>
        </div>
        <table className="inc-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Day type</th>
              <th>Description</th>
              <th>Hours</th>
              <th>Amount</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {otEntries.map((o) => (
              <tr key={o.id}>
                <td>
                  <input
                    className="fld-input"
                    type="date"
                    value={o.date.length >= 10 ? o.date.slice(0, 10) : o.date}
                    onChange={(e) =>
                      dispatch({
                        type: 'ot/update',
                        monthKey: month,
                        id: o.id,
                        patch: { date: e.target.value },
                      })
                    }
                  />
                </td>
                <td>
                  <select
                    className="fld-input inc-table__select"
                    value={o.dayType}
                    onChange={(e) =>
                      dispatch({
                        type: 'ot/update',
                        monthKey: month,
                        id: o.id,
                        patch: {
                          dayType: e.target.value as OTDayType,
                        },
                      })
                    }
                  >
                    <option value="regular">Regular (×1.5)</option>
                    <option value="public">Public (8h×2, rest×3)</option>
                  </select>
                </td>
                <td>
                  <input
                    className="fld-input"
                    value={o.description}
                    onChange={(e) =>
                      dispatch({
                        type: 'ot/update',
                        monthKey: month,
                        id: o.id,
                        patch: { description: e.target.value },
                      })
                    }
                  />
                </td>
                <td>
                  <input
                    className="fld-num"
                    type="number"
                    step="0.01"
                    value={o.hours}
                    onChange={(e) =>
                      dispatch({
                        type: 'ot/update',
                        monthKey: month,
                        id: o.id,
                        patch: { hours: parseMoney(e.target.value) },
                      })
                    }
                  />
                </td>
                <td className="inc-table__strong">
                  {formatMYR(
                    computeOTPay(o.hours, o.dayType, otHourlyBasic)
                  )}
                </td>
                <td>
                  <button
                    type="button"
                    className="btn-row danger"
                    onClick={() =>
                      dispatch({
                        type: 'ot/remove',
                        monthKey: month,
                        id: o.id,
                      })
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
      </PageSection>

      <style>{`
        .inc-cards {
          display: grid;
          grid-template-columns: repeat(5, minmax(0, 1fr));
          gap: 1rem;
          align-items: stretch;
        }
        @media (max-width: 1200px) {
          .inc-cards {
            grid-template-columns: repeat(3, minmax(0, 1fr));
          }
        }
        @media (max-width: 720px) {
          .inc-cards {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }
        @media (max-width: 520px) {
          .inc-cards {
            grid-template-columns: 1fr;
          }
        }
        .inc-salary-field {
          background: var(--surface);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius);
          padding: 1rem 1.1rem;
          box-shadow: var(--shadow-card);
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        .inc-salary-field__lbl {
          font-size: 0.6875rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: var(--text-muted);
        }
        .inc-salary-field__input {
          font-size: 1rem;
          font-weight: 700;
        }
        .inc-bonus {
          display: grid;
          grid-template-columns: 1fr auto;
          gap: 0.5rem 1.5rem;
          align-items: center;
          background: linear-gradient(
            125deg,
            rgba(13, 148, 136, 0.14),
            rgba(79, 70, 229, 0.08)
          );
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius);
          padding: 1.15rem 1.3rem;
          box-shadow: var(--shadow-card);
        }
        .inc-bonus__title {
          margin: 0 0 0.35rem;
          font-size: 0.9375rem;
          font-weight: 600;
        }
        .inc-bonus__line {
          width: 100%;
        }
        .inc-bonus__amt-input {
          min-width: 7rem;
          font-size: 1.15rem;
          font-weight: 700;
          grid-row: span 2;
        }
        .inc-bonus__note-input {
          grid-column: 1 / -1;
        }
        @media (max-width: 640px) {
          .inc-bonus {
            grid-template-columns: 1fr;
          }
          .inc-bonus__amt-input {
            grid-row: auto;
          }
        }
        .inc-extra-actions {
          margin-bottom: 0.65rem;
        }
        .inc-extra {
          padding: 1.05rem 1.2rem;
        }
        .inc-extra ul {
          list-style: none;
          margin: 0;
          padding: 0;
        }
        .inc-extra li {
          display: grid;
          grid-template-columns: 1fr 7rem auto;
          gap: 0.5rem;
          align-items: center;
          padding: 0.45rem 0;
          border-bottom: 1px solid var(--border);
          font-size: 0.875rem;
        }
        .inc-extra li:last-child {
          border-bottom: none;
        }
        @media (max-width: 640px) {
          .inc-extra li {
            grid-template-columns: 1fr;
          }
        }
        .inc-table-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
          flex-wrap: wrap;
          padding: 1rem 1.15rem 0;
        }
        .inc-table-wrap {
          background: var(--surface);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius);
          overflow: hidden;
          box-shadow: var(--shadow-card);
        }
        .inc-table__title {
          margin: 0;
          font-size: 0.9375rem;
          font-weight: 600;
        }
        .inc-table {
          width: 100%;
          font-size: 0.875rem;
        }
        .inc-table th,
        .inc-table td {
          text-align: left;
          padding: 0.65rem 1.15rem;
          border-bottom: 1px solid var(--border);
          vertical-align: middle;
        }
        .inc-table th {
          font-size: 0.7rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--text-muted);
        }
        .inc-table__strong {
          font-family: var(--font-mono);
          font-weight: 700;
        }
        .inc-table__select {
          min-width: 10rem;
          font-size: 0.75rem;
        }
      `}</style>
    </AppShell>
  );
}
