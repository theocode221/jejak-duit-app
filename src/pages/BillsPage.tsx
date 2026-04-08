import { AppShell } from '@/components/layout/AppShell';
import { StatCard } from '@/components/common/StatCard';
import { PageSection } from '@/components/common/PageSection';
import { StatusBadge } from '@/components/common/StatusBadge';
import { useMonth } from '@/context/MonthContext';
import { useFinance } from '@/state/FinanceContext';
import { getBills } from '@/state/financeSelectors';
import { formatMYR } from '@/utils/format';
import type { BillStatus } from '@/types';
import { newId } from '@/utils/id';

function billVariant(
  s: BillStatus
): 'success' | 'warning' | 'danger' | 'neutral' {
  if (s === 'paid') return 'success';
  if (s === 'unpaid') return 'danger';
  return 'warning';
}

const STATUS_OPTS: BillStatus[] = ['paid', 'unpaid', 'upcoming'];

function parseMoney(v: string): number {
  const n = parseFloat(v.replace(/,/g, ''));
  return Number.isFinite(n) ? n : 0;
}

export function BillsPage() {
  const { month } = useMonth();
  const { state, dispatch } = useFinance();
  const bills = getBills(state, month);
  const paid = bills.filter((b) => b.status === 'paid').length;
  const unpaid = bills.filter((b) => b.status === 'unpaid').length;
  const upcoming = bills.filter((b) => b.status === 'upcoming').length;
  const totalDue = bills
    .filter((b) => b.status !== 'paid')
    .reduce((s, b) => s + b.amount, 0);

  const sorted = [...bills].sort((a, b) => a.dueDay - b.dueDay);

  return (
    <AppShell
      kicker="Obligations"
      title="Bills & due dates"
      subtitle="Each workbook month has its own bill list (seeded from sheet lines). Edit freely."
    >
      <PageSection
        kicker="Status"
        title="Payment posture"
        description="Counts and outstanding ringgit for anything not yet marked paid."
      >
      <div className="bills-stats">
        <StatCard label="Paid" value={String(paid)} hint="This cycle" />
        <StatCard label="Unpaid" value={String(unpaid)} hint="Action needed" />
        <StatCard
          label="Upcoming"
          value={String(upcoming)}
          hint="Within window"
        />
        <StatCard
          label="Outstanding amount"
          value={formatMYR(totalDue)}
          hint="Unpaid + upcoming"
        />
      </div>
      </PageSection>

      <PageSection
        kicker="Editor"
        title="Bill line items"
        description="Add rows, change amounts, due day, status, and reminders."
      >
        <div className="bills-edit-bar">
          <button
            type="button"
            className="btn-row"
            onClick={() =>
              dispatch({
                type: 'bills/add',
                monthKey: month,
                bill: {
                  id: newId('bill'),
                  name: 'New bill',
                  dueDay: 15,
                  amount: 0,
                  status: 'upcoming',
                  reminder: '',
                  category: 'Fixed',
                },
              })
            }
          >
            Add bill
          </button>
        </div>

      <div className="bills-layout">
        <section className="bills-list">
          <h2 className="bills-h2">All bills</h2>
          <ul>
            {sorted.map((b) => (
              <li key={b.id} className="bills-row bills-row--edit">
                <div className="bills-row__main">
                  <input
                    className="fld-input"
                    value={b.name}
                    onChange={(e) =>
                      dispatch({
                        type: 'bills/update',
                        monthKey: month,
                        id: b.id,
                        patch: { name: e.target.value },
                      })
                    }
                  />
                  <input
                    className="fld-input bills-row__cat-input"
                    value={b.category}
                    onChange={(e) =>
                      dispatch({
                        type: 'bills/update',
                        monthKey: month,
                        id: b.id,
                        patch: { category: e.target.value },
                      })
                    }
                  />
                </div>
                <div className="bills-row__meta">
                  <select
                    className="fld-input bills-row__select"
                    value={b.status}
                    onChange={(e) =>
                      dispatch({
                        type: 'bills/update',
                        monthKey: month,
                        id: b.id,
                        patch: {
                          status: e.target.value as BillStatus,
                        },
                      })
                    }
                  >
                    {STATUS_OPTS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                  <input
                    className="fld-num bills-row__due-input"
                    type="number"
                    min={1}
                    max={31}
                    value={b.dueDay}
                    onChange={(e) =>
                      dispatch({
                        type: 'bills/update',
                        monthKey: month,
                        id: b.id,
                        patch: {
                          dueDay: Math.min(
                            31,
                            Math.max(1, parseInt(e.target.value, 10) || 1)
                          ),
                        },
                      })
                    }
                  />
                  <input
                    className="fld-num bills-row__amt-input"
                    type="number"
                    step="0.01"
                    value={b.amount}
                    onChange={(e) =>
                      dispatch({
                        type: 'bills/update',
                        monthKey: month,
                        id: b.id,
                        patch: { amount: parseMoney(e.target.value) },
                      })
                    }
                  />
                </div>
                <input
                  className="fld-input bills-row__tag"
                  value={b.reminder}
                  placeholder="Reminder"
                  onChange={(e) =>
                    dispatch({
                      type: 'bills/update',
                      monthKey: month,
                      id: b.id,
                      patch: { reminder: e.target.value },
                    })
                  }
                />
                <button
                  type="button"
                  className="btn-row danger bills-row__del"
                  onClick={() =>
                    dispatch({
                      type: 'bills/remove',
                      monthKey: month,
                      id: b.id,
                    })
                  }
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        </section>

        <aside className="bills-timeline">
          <h2 className="bills-h2">Upcoming due</h2>
          <ol className="bills-tl">
            {sorted
              .filter((b) => b.status !== 'paid')
              .map((b) => (
                <li key={b.id} className="bills-tl__item">
                  <span className="bills-tl__dot" />
                  <div>
                    <div className="bills-tl__name">{b.name}</div>
                    <div className="bills-tl__sub">
                      Day {b.dueDay} · {formatMYR(b.amount)}
                    </div>
                  </div>
                  <StatusBadge variant={billVariant(b.status)}>
                    {b.status}
                  </StatusBadge>
                </li>
              ))}
          </ol>
        </aside>
      </div>
      </PageSection>

      <style>{`
        .bills-edit-bar {
          margin-bottom: 1rem;
        }
        .bills-stats {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 1rem;
        }
        @media (max-width: 900px) {
          .bills-stats {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }
        @media (max-width: 480px) {
          .bills-stats {
            grid-template-columns: 1fr;
          }
        }
        .bills-layout {
          display: grid;
          grid-template-columns: 1fr 320px;
          gap: 1.25rem;
          align-items: start;
        }
        @media (max-width: 1024px) {
          .bills-layout {
            grid-template-columns: 1fr;
          }
        }
        .bills-h2 {
          margin: 0 0 0.75rem;
          font-size: 0.9375rem;
          font-weight: 600;
        }
        .bills-list {
          background: var(--surface);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius);
          padding: 1.15rem 1.25rem;
          box-shadow: var(--shadow-card);
        }
        .bills-list ul {
          list-style: none;
          margin: 0;
          padding: 0;
        }
        .bills-row--edit {
          display: grid;
          grid-template-columns: 1fr auto;
          gap: 0.35rem 1rem;
          padding: 0.85rem 0;
          border-bottom: 1px solid var(--border);
        }
        .bills-row--edit:last-child {
          border-bottom: none;
        }
        .bills-row__cat-input {
          margin-top: 0.35rem;
          font-size: 0.8rem;
        }
        .bills-row__meta {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 0.35rem;
          min-width: 9rem;
        }
        .bills-row__select {
          width: 100%;
          font-size: 0.75rem;
        }
        .bills-row__due-input,
        .bills-row__amt-input {
          width: 100%;
          text-align: right;
        }
        .bills-row__tag {
          grid-column: 1 / -1;
          font-size: 0.8rem;
        }
        .bills-row__del {
          grid-column: 1 / -1;
          justify-self: start;
        }
        .bills-timeline {
          background: linear-gradient(
            165deg,
            #0c1222 0%,
            #111827 50%,
            #0f172a 100%
          );
          color: #e2e8f0;
          border-radius: var(--radius);
          padding: 1.15rem 1.25rem;
          box-shadow: var(--shadow-float);
          border: 1px solid rgba(148, 163, 184, 0.15);
        }
        .bills-timeline .bills-h2 {
          color: #f8fafc;
        }
        .bills-tl {
          list-style: none;
          margin: 0;
          padding: 0;
        }
        .bills-tl__item {
          display: grid;
          grid-template-columns: auto 1fr auto;
          gap: 0.65rem;
          align-items: center;
          padding: 0.65rem 0;
          border-bottom: 1px solid rgba(148, 163, 184, 0.2);
        }
        .bills-tl__item:last-child {
          border-bottom: none;
        }
        .bills-tl__dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: var(--accent);
          box-shadow: 0 0 0 3px rgba(45, 212, 191, 0.25);
        }
        .bills-tl__name {
          font-weight: 600;
          font-size: 0.8125rem;
        }
        .bills-tl__sub {
          font-size: 0.72rem;
          color: #94a3b8;
          margin-top: 0.1rem;
        }
      `}</style>
    </AppShell>
  );
}
