import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
import { StatCard } from '@/components/common/StatCard';
import { PageSection } from '@/components/common/PageSection';
import { StatusBadge } from '@/components/common/StatusBadge';
import { useMonth } from '@/context/MonthContext';
import { useInstallmentsStore } from '@/features/installments/useInstallmentsStore';
import { useFinance } from '@/state/FinanceContext';
import { getBills } from '@/state/financeSelectors';
import {
  billAmountIsFromInstallments,
  formatBillDueDateLabel,
  formatDaysLeftPhrase,
  isReferenceDateAfterBillDue,
  nearestUnpaidBillByDue,
  resolveBillAmount,
} from '@/utils/billDue';
import { formatMYR2 } from '@/utils/format';
import type { Bill, BillAmountSource, BillStatus } from '@/types';
import { newId } from '@/utils/id';

function billVariant(
  s: BillStatus
): 'success' | 'warning' | 'danger' | 'neutral' {
  if (s === 'paid') return 'success';
  return 'danger';
}

const STATUS_TICKS: {
  value: BillStatus;
  label: string;
  title: string;
}[] = [
  { value: 'paid', label: 'Paid', title: 'Settled for this workbook month' },
  { value: 'unpaid', label: 'Unpaid', title: 'Not yet paid for this month' },
];

const AMOUNT_SOURCE_OPTS: { value: BillAmountSource; label: string }[] = [
  { value: 'manual', label: 'Set amount (fixed bill)' },
  { value: 'spaylater', label: 'SPayLater (from Installments)' },
  { value: 'atome', label: 'Atome (from Installments)' },
  { value: 'credit_card', label: 'Credit card (from Installments)' },
];

function parseMoney(v: string): number {
  const n = parseFloat(v.replace(/,/g, ''));
  return Number.isFinite(n) ? n : 0;
}

export function BillsPage() {
  const { month } = useMonth();
  const { state, dispatch } = useFinance();
  const installments = useInstallmentsStore(month);
  const bills = getBills(state, month);
  const paid = bills.filter((b) => b.status === 'paid').length;
  const unpaid = bills.filter((b) => b.status === 'unpaid').length;
  const amountFor = (b: Bill) =>
    resolveBillAmount(b, month, installments.entries, installments.statuses);
  const totalDue = bills
    .filter((b) => b.status !== 'paid')
    .reduce((s, b) => s + amountFor(b), 0);
  const totalBillAmount = bills.reduce((s, b) => s + amountFor(b), 0);

  const sorted = [...bills].sort((a, b) => a.dueDay - b.dueDay);
  const upcomingDue = sorted.filter((b) => b.status !== 'paid');

  const nearestDue = useMemo(
    () => nearestUnpaidBillByDue(bills, month, state.referenceDate),
    [bills, month, state.referenceDate]
  );

  return (
    <AppShell title="Bills">
      <PageSection>
        <div className="bills-stats">
          {nearestDue ? (
            <StatCard
              variant="hero"
              label="Nearest due"
              lead={nearestDue.bill.name}
              value={formatDaysLeftPhrase(nearestDue.daysLeft)}
            />
          ) : (
            <StatCard
              variant="hero"
              label="Nearest due"
              value="—"
            />
          )}
          <StatCard label="Paid" value={String(paid)} />
          <StatCard label="Unpaid" value={String(unpaid)} />
          <StatCard label="Outstanding amount" value={formatMYR2(totalDue)} />
          <StatCard
            label="Total bill amount"
            value={formatMYR2(totalBillAmount)}
          />
        </div>
      </PageSection>

      <PageSection title="Upcoming due">
        <aside className="bills-timeline bills-timeline--hero">
          {upcomingDue.length === 0 ? (
            <p className="bills-timeline--hero__empty">All paid this month.</p>
          ) : (
            <ol className="bills-tl">
              {upcomingDue.map((b) => {
                const showPay = isReferenceDateAfterBillDue(
                  state.referenceDate,
                  month,
                  b.dueDay,
                  b.status
                );
                const amt = amountFor(b);
                return (
                  <li key={b.id} className="bills-tl__item">
                    <span className="bills-tl__dot" />
                    <div className="bills-tl__mid">
                      <div className="bills-tl__name">{b.name}</div>
                      <div className="bills-tl__sub">
                        Due {formatBillDueDateLabel(month, b.dueDay)} ·{' '}
                        {formatMYR2(amt)}
                        {billAmountIsFromInstallments(b) && (
                          <span className="bills-tl__src">
                            {' '}
                            (from Installments)
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="bills-tl__badges">
                      {showPay && (
                        <span className="bills-tl__pay">Pay now</span>
                      )}
                      <StatusBadge variant={billVariant(b.status)}>
                        {b.status}
                      </StatusBadge>
                    </div>
                  </li>
                );
              })}
            </ol>
          )}
        </aside>
      </PageSection>

      <PageSection title="Bill line items">
        <div className="bills-editor-compact">
          <div className="bills-edit-bar">
            <button
              type="button"
              className="btn-row bills-editor-compact__add"
              onClick={() =>
                dispatch({
                  type: 'bills/add',
                  monthKey: month,
                  bill: {
                    id: newId('bill'),
                    name: 'New bill',
                    dueDay: 15,
                    amount: 0,
                    status: 'unpaid',
                    reminder: '',
                    category: 'Fixed',
                  },
                })
              }
            >
              Add bill
            </button>
          </div>

          <section className="bills-list bills-list--compact">
            <h2 className="bills-h2">All bills</h2>
            <ul className="bills-line-list">
              {sorted.map((b) => {
                const rowPay = isReferenceDateAfterBillDue(
                  state.referenceDate,
                  month,
                  b.dueDay,
                  b.status
                );
                const linked = billAmountIsFromInstallments(b);
                const rowAmt = amountFor(b);
                return (
                  <li
                    key={b.id}
                    className={`bills-line${rowPay ? ' bills-line--alert' : ''}`}
                  >
                    {rowPay && (
                      <p className="bills-line__banner" role="status">
                        Due date passed — mark <strong>Paid</strong> when settled.
                      </p>
                    )}
                    <div className="bills-line__grid">
                      <div className="bills-line__block bills-line__block--who">
                        <span className="bills-line__legend">Bill name</span>
                        <input
                          className="fld-input bills-line__field"
                          value={b.name}
                          aria-label="Bill name"
                          onChange={(e) =>
                            dispatch({
                              type: 'bills/update',
                              monthKey: month,
                              id: b.id,
                              patch: { name: e.target.value },
                            })
                          }
                        />
                      </div>
                      <div className="bills-line__block bills-line__block--due">
                        <span className="bills-line__legend">Due each month</span>
                        <div className="bills-line__due-wrap">
                          <span className="bills-line__due-prefix">Day</span>
                          <input
                            className="fld-num bills-line__due-num"
                            type="number"
                            min={1}
                            max={31}
                            aria-label="Due day of month"
                            value={b.dueDay}
                            onChange={(e) =>
                              dispatch({
                                type: 'bills/update',
                                monthKey: month,
                                id: b.id,
                                patch: {
                                  dueDay: Math.min(
                                    31,
                                    Math.max(
                                      1,
                                      parseInt(e.target.value, 10) || 1
                                    )
                                  ),
                                },
                              })
                            }
                          />
                        </div>
                        <p className="bills-line__due-hint">
                          {formatBillDueDateLabel(month, b.dueDay)}
                        </p>
                      </div>
                      <div className="bills-line__block bills-line__block--money">
                        <span className="bills-line__legend">Amount</span>
                        <select
                          className="fld-input bills-line__field"
                          aria-label="Amount source"
                          value={b.amountSource ?? 'manual'}
                          onChange={(e) => {
                            const v = e.target.value as BillAmountSource;
                            if (v === 'manual') {
                              const resolved = linked ? rowAmt : b.amount;
                              dispatch({
                                type: 'bills/update',
                                monthKey: month,
                                id: b.id,
                                patch: {
                                  amountSource: undefined,
                                  amount: resolved,
                                },
                              });
                            } else {
                              dispatch({
                                type: 'bills/update',
                                monthKey: month,
                                id: b.id,
                                patch: { amountSource: v },
                              });
                            }
                          }}
                        >
                          {AMOUNT_SOURCE_OPTS.map((o) => (
                            <option key={o.value} value={o.value}>
                              {o.label}
                            </option>
                          ))}
                        </select>
                        {linked ? (
                          <div className="bills-line__amt-read">
                            <span className="bills-line__amt-val">
                              {formatMYR2(rowAmt)}
                            </span>
                            <span className="bills-line__amt-note">
                              Unpaid on{' '}
                              <Link to="/installments">Installments</Link>
                            </span>
                          </div>
                        ) : (
                          <input
                            className="fld-num bills-line__field"
                            type="number"
                            step="0.01"
                            aria-label="Amount in MYR"
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
                        )}
                      </div>
                      <div className="bills-line__block bills-line__block--status">
                        <span className="bills-line__legend" id={`pay-${b.id}`}>
                          Payment
                        </span>
                        <div
                          className="bills-line__ticks"
                          role="group"
                          aria-labelledby={`pay-${b.id}`}
                        >
                          {STATUS_TICKS.map(({ value, label, title }) => (
                            <button
                              key={value}
                              type="button"
                              className={`bills-line__tick bills-line__tick--${value}${
                                b.status === value ? ' is-active' : ''
                              }`}
                              aria-pressed={b.status === value}
                              title={title}
                              onClick={() =>
                                dispatch({
                                  type: 'bills/update',
                                  monthKey: month,
                                  id: b.id,
                                  patch: { status: value },
                                })
                              }
                            >
                              <span
                                className="bills-line__tick-icon"
                                aria-hidden
                              >
                                ✓
                              </span>
                              <span>{label}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="bills-line__block bills-line__block--actions">
                        <button
                          type="button"
                          className="bills-line__remove"
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
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        </div>
      </PageSection>

      <style>{`
        .bills-edit-bar {
          margin-bottom: 0.65rem;
        }
        .bills-editor-compact {
          max-width: min(52rem, 100%);
          margin: 0 auto;
        }
        .bills-editor-compact__add {
          font-size: 0.8125rem;
          padding: 0.42rem 0.85rem;
        }
        .bills-timeline--hero__empty {
          margin: 0;
          font-size: clamp(0.95rem, 2vw, 1.05rem);
          color: #94a3b8;
          line-height: 1.5;
          text-align: center;
          max-width: 28rem;
          margin-inline: auto;
        }
        .bills-list--compact {
          padding: 0.85rem 1rem;
        }
        .bills-list--compact .bills-h2 {
          font-size: 0.8125rem;
          margin-bottom: 0.65rem;
        }
        .bills-list--compact .bills-line {
          padding: 0.75rem 0.85rem;
        }
        .bills-list--compact .fld-input,
        .bills-list--compact .fld-num {
          font-size: 0.8125rem;
          padding: 0.38rem 0.5rem;
        }
        .bills-stats {
          display: grid;
          grid-template-columns: repeat(5, minmax(0, 1fr));
          gap: 1rem;
        }
        @media (max-width: 1200px) {
          .bills-stats {
            grid-template-columns: repeat(3, minmax(0, 1fr));
          }
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
        .bills-list ul,
        .bills-line-list {
          list-style: none;
          margin: 0;
          padding: 0;
        }
        .bills-line-list {
          display: flex;
          flex-direction: column;
          gap: 0.65rem;
        }
        .bills-line {
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius);
          background: var(--surface);
          padding: 0.95rem 1.05rem;
          box-shadow: var(--shadow-sm);
        }
        .bills-line--alert {
          border-color: rgba(220, 38, 38, 0.38);
          box-shadow: 0 0 0 1px rgba(220, 38, 38, 0.08);
        }
        .bills-line__banner {
          margin: 0 0 0.65rem;
          padding: 0.45rem 0.55rem;
          font-size: 0.78rem;
          line-height: 1.45;
          color: #991b1b;
          background: rgba(254, 226, 226, 0.75);
          border-radius: var(--radius-xs);
          border: 1px solid rgba(248, 113, 113, 0.35);
        }
        .bills-line__grid {
          display: grid;
          grid-template-columns: minmax(0, 1.25fr) 9.25rem minmax(0, 1fr) auto auto;
          gap: 0.85rem 1.1rem;
          align-items: start;
        }
        .bills-line__legend {
          display: block;
          font-size: 0.65rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.055em;
          color: var(--text-muted);
          margin-bottom: 0.32rem;
        }
        .bills-line__block {
          display: flex;
          flex-direction: column;
          gap: 0.35rem;
          min-width: 0;
        }
        .bills-line__block--who {
          gap: 0.4rem;
        }
        .bills-line__field {
          width: 100%;
        }
        .bills-line__due-wrap {
          display: flex;
          align-items: center;
          gap: 0.4rem;
        }
        .bills-line__due-prefix {
          font-size: 0.78rem;
          font-weight: 600;
          color: var(--text-muted);
        }
        .bills-line__due-num {
          width: 3.5rem;
          text-align: center;
        }
        .bills-line__due-hint {
          margin: 0;
          font-size: 0.7rem;
          color: var(--text-subtle);
          line-height: 1.35;
        }
        .bills-line__amt-read {
          display: flex;
          flex-direction: column;
          gap: 0.2rem;
        }
        .bills-line__amt-val {
          font-family: var(--font-mono);
          font-size: 0.9rem;
          font-weight: 700;
          color: var(--text);
        }
        .bills-line__amt-note {
          font-size: 0.7rem;
          color: var(--text-muted);
          line-height: 1.35;
        }
        .bills-line__amt-note a {
          color: var(--accent);
          font-weight: 600;
          text-decoration: none;
        }
        .bills-line__amt-note a:hover {
          text-decoration: underline;
        }
        .bills-line__ticks {
          display: flex;
          flex-wrap: wrap;
          gap: 0.4rem;
        }
        .bills-line__tick {
          display: inline-flex;
          align-items: center;
          gap: 0.38rem;
          padding: 0.4rem 0.72rem;
          border-radius: var(--radius-pill);
          border: 1px solid var(--border);
          background: var(--surface);
          font-size: 0.78rem;
          font-weight: 600;
          color: var(--text-muted);
          cursor: pointer;
          font-family: inherit;
          transition:
            border-color 0.12s ease,
            background 0.12s ease,
            color 0.12s ease;
        }
        .bills-line__tick:hover {
          border-color: #94a3b8;
          color: var(--text-secondary);
        }
        .bills-line__tick:focus-visible {
          outline: 2px solid var(--accent);
          outline-offset: 2px;
        }
        .bills-line__tick-icon {
          width: 1.125rem;
          height: 1.125rem;
          border-radius: 50%;
          border: 2px solid currentColor;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 0;
          font-weight: 800;
          line-height: 1;
          opacity: 0.45;
          flex-shrink: 0;
        }
        .bills-line__tick.is-active {
          color: var(--text);
        }
        .bills-line__tick.is-active .bills-line__tick-icon {
          opacity: 1;
          border-width: 0;
          font-size: 0.58rem;
          color: #fff;
        }
        .bills-line__tick--paid.is-active {
          border-color: rgba(5, 150, 105, 0.55);
          background: rgba(5, 150, 105, 0.1);
          color: #047857;
        }
        .bills-line__tick--paid.is-active .bills-line__tick-icon {
          background: #059669;
        }
        .bills-line__tick--unpaid.is-active {
          border-color: rgba(220, 38, 38, 0.45);
          background: rgba(254, 226, 226, 0.45);
          color: #b91c1c;
        }
        .bills-line__tick--unpaid.is-active .bills-line__tick-icon {
          background: #dc2626;
        }
        .bills-line__block--actions {
          justify-self: end;
          align-self: start;
        }
        .bills-line__remove {
          font-size: 0.75rem;
          font-weight: 600;
          padding: 0.38rem 0.72rem;
          border-radius: var(--radius-pill);
          border: 1px solid rgba(220, 38, 38, 0.35);
          background: transparent;
          color: #b91c1c;
          cursor: pointer;
          font-family: inherit;
        }
        .bills-line__remove:hover {
          background: rgba(254, 226, 226, 0.65);
        }
        @media (max-width: 960px) {
          .bills-line__grid {
            grid-template-columns: 1fr 1fr;
          }
          .bills-line__block--status {
            grid-column: 1 / -1;
          }
          .bills-line__block--actions {
            grid-column: 1 / -1;
            justify-self: end;
          }
        }
        @media (max-width: 560px) {
          .bills-line__grid {
            grid-template-columns: 1fr;
          }
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
        .bills-timeline--hero {
          width: 100%;
          padding: clamp(1.35rem, 3vw, 2rem) clamp(1.35rem, 3.5vw, 2.35rem);
          border-radius: var(--radius-lg, 14px);
          min-height: min(22rem, 52vh);
          display: flex;
          flex-direction: column;
          justify-content: center;
        }
        .bills-timeline--hero .bills-tl {
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }
        .bills-tl {
          list-style: none;
          margin: 0;
          padding: 0;
        }
        .bills-tl__mid {
          min-width: 0;
        }
        .bills-tl__badges {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 0.35rem;
        }
        .bills-tl__pay {
          font-size: 0.68rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          color: #fecaca;
          background: rgba(220, 38, 38, 0.35);
          border: 1px solid rgba(248, 113, 113, 0.45);
          padding: 0.2rem 0.45rem;
          border-radius: var(--radius-pill);
          white-space: nowrap;
        }
        .bills-tl__src {
          font-weight: 500;
          color: #cbd5e1;
        }
        .bills-tl__item {
          display: grid;
          grid-template-columns: auto 1fr auto;
          gap: 0.65rem;
          align-items: center;
          padding: 0.65rem 0;
          border-bottom: 1px solid rgba(148, 163, 184, 0.2);
        }
        .bills-timeline--hero .bills-tl__item {
          gap: clamp(0.75rem, 2vw, 1.1rem);
          padding: clamp(0.75rem, 2vw, 1.05rem) 0;
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
        .bills-timeline--hero .bills-tl__dot {
          width: 11px;
          height: 11px;
          box-shadow: 0 0 0 4px rgba(45, 212, 191, 0.28);
        }
        .bills-tl__name {
          font-weight: 600;
          font-size: 0.8125rem;
        }
        .bills-timeline--hero .bills-tl__name {
          font-size: clamp(0.95rem, 2.1vw, 1.15rem);
        }
        .bills-tl__sub {
          font-size: 0.72rem;
          color: #94a3b8;
          margin-top: 0.1rem;
        }
        .bills-timeline--hero .bills-tl__sub {
          font-size: clamp(0.8rem, 1.6vw, 0.9rem);
          margin-top: 0.2rem;
        }
        @media (max-width: 640px) {
          .bills-stats {
            gap: 0.75rem;
          }
          .bills-edit-bar {
            margin-bottom: 0.75rem;
          }
          .bills-list--compact {
            padding: 0.75rem 0.85rem;
          }
          .bills-list {
            padding: 0.85rem 0.9rem;
            border-radius: var(--radius-sm);
          }
          .bills-timeline--hero {
            min-height: auto;
            padding: 1.05rem 1.1rem;
          }
          .bills-line__ticks {
            gap: 0.32rem;
          }
          .bills-line__tick {
            padding: 0.36rem 0.58rem;
            font-size: 0.74rem;
          }
          .bills-timeline {
            padding: 0.9rem 0.95rem;
            border-radius: var(--radius-sm);
          }
          .bills-tl__item {
            padding: 0.55rem 0;
            gap: 0.5rem;
          }
          .bills-h2 {
            font-size: 0.875rem;
            margin-bottom: 0.6rem;
          }
        }
      `}</style>
    </AppShell>
  );
}
