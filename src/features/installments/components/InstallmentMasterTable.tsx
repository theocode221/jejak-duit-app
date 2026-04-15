import { useMemo, useState } from 'react';
import {
  getInstallmentScheduleMonths,
  getPaymentStatus,
  isInstallmentActiveInMonth,
  paidMonthsCountForEntry,
} from '@/services/installmentService';
import type {
  InstallmentEntry,
  InstallmentPaymentStatus,
  PaymentMethod,
} from '@/types/installments';
import { PAYMENT_METHOD_LABELS } from '@/types/installments';
import { formatMYR2 } from '@/utils/format';

type Props = {
  entries: InstallmentEntry[];
  statuses: InstallmentPaymentStatus[];
  categories: { id: string; name: string }[];
  contextMonth: string;
  monthOptions: { value: string; label: string }[];
  onRemove: (id: string) => void;
  onEdit: (id: string) => void;
};

const METHODS: PaymentMethod[] = ['credit_card', 'spaylater', 'atome'];

export function InstallmentMasterTable({
  entries,
  statuses,
  categories,
  contextMonth,
  monthOptions,
  onRemove,
  onEdit,
}: Props) {
  const [catFilter, setCatFilter] = useState<string>('all');
  const [methodFilter, setMethodFilter] = useState<string>('all');
  const [monthFilter, setMonthFilter] = useState<string>('all');
  const [paidFilter, setPaidFilter] = useState<'all' | 'paid' | 'unpaid'>('all');

  const catName = useMemo(() => {
    const m = new Map(categories.map((c) => [c.id, c.name]));
    return (id: string) => m.get(id) ?? id;
  }, [categories]);

  const filtered = useMemo(() => {
    const paidMonth =
      monthFilter === 'all' ? contextMonth : monthFilter;

    return entries.filter((e) => {
      if (catFilter !== 'all' && e.categoryId !== catFilter) return false;
      if (methodFilter !== 'all' && e.method !== methodFilter) return false;
      if (monthFilter !== 'all' && !isInstallmentActiveInMonth(e, monthFilter))
        return false;
      if (paidFilter !== 'all') {
        if (!isInstallmentActiveInMonth(e, paidMonth)) return false;
        const p = getPaymentStatus(statuses, e.id, paidMonth);
        if (paidFilter === 'paid' && !p) return false;
        if (paidFilter === 'unpaid' && p) return false;
      }
      return true;
    });
  }, [
    entries,
    statuses,
    catFilter,
    methodFilter,
    monthFilter,
    paidFilter,
    contextMonth,
  ]);

  return (
    <div className="bnpl-master">
      <div className="bnpl-master__filters">
        <label className="bnpl-master__f">
          <span>Category</span>
          <select
            className="fld-input"
            value={catFilter}
            onChange={(e) => setCatFilter(e.target.value)}
          >
            <option value="all">All</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <label className="bnpl-master__f">
          <span>Method</span>
          <select
            className="fld-input"
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value)}
          >
            <option value="all">All</option>
            {METHODS.map((m) => (
              <option key={m} value={m}>
                {PAYMENT_METHOD_LABELS[m]}
              </option>
            ))}
          </select>
        </label>
        <label className="bnpl-master__f">
          <span>Month (active)</span>
          <select
            className="fld-input"
            value={monthFilter}
            onChange={(e) => setMonthFilter(e.target.value)}
          >
            <option value="all">All months</option>
            {monthOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
        <label className="bnpl-master__f">
          <span>Paid status</span>
          <select
            className="fld-input"
            value={paidFilter}
            onChange={(e) =>
              setPaidFilter(e.target.value as 'all' | 'paid' | 'unpaid')
            }
          >
            <option value="all">All</option>
            <option value="paid">Paid (for month)</option>
            <option value="unpaid">Unpaid (for month)</option>
          </select>
        </label>
      </div>

      <div className="bajet-table-scroll">
        <table className="bnpl-master__table">
          <thead>
            <tr>
              <th>Item</th>
              <th>Category</th>
              <th>Method</th>
              <th>Start</th>
              <th>Months</th>
              <th>Monthly</th>
              <th>Status</th>
              <th>Progress</th>
              <th className="bnpl-master__actions-th">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((e) => {
              const paidN = paidMonthsCountForEntry(e, statuses);
              const sched = getInstallmentScheduleMonths(
                e.startMonth,
                e.durationMonths
              );
              const activeNow = sched.includes(contextMonth);
              return (
                <tr key={e.id}>
                  <td className="bnpl-master__title">{e.title}</td>
                  <td>{catName(e.categoryId)}</td>
                  <td>{PAYMENT_METHOD_LABELS[e.method]}</td>
                  <td className="bnpl-master__mono">{e.startMonth}</td>
                  <td>{e.durationMonths}</td>
                  <td className="bnpl-master__mono">{formatMYR2(e.monthlyAmount)}</td>
                  <td>
                    <span
                      className={`bnpl-pill ${activeNow ? 'bnpl-pill--on' : 'bnpl-pill--off'}`}
                    >
                      {activeNow ? 'Billing' : 'Idle'}
                    </span>
                  </td>
                  <td className="bnpl-master__mono">
                    {paidN} / {e.durationMonths} paid
                  </td>
                  <td>
                    <div className="bnpl-master__actions">
                      <button
                        type="button"
                        className="btn-row bnpl-master__edit"
                        onClick={() => onEdit(e.id)}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="btn-row danger bnpl-master__rm"
                        onClick={() => onRemove(e.id)}
                      >
                        Remove
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {filtered.length === 0 && (
        <p className="bnpl-master__empty">No rows match these filters.</p>
      )}

      <style>{`
        .bnpl-master__filters {
          display: flex;
          flex-wrap: wrap;
          gap: 0.75rem 1rem;
          margin-bottom: 1rem;
          align-items: flex-end;
        }
        .bnpl-master__f {
          display: flex;
          flex-direction: column;
          gap: 0.3rem;
          font-size: 0.65rem;
          font-weight: 700;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: var(--text-muted);
        }
        .bnpl-master__f .fld-input {
          min-width: 9.5rem;
          font-weight: 500;
        }
        .bnpl-master__table {
          min-width: 720px;
          font-size: 0.875rem;
        }
        .bnpl-master__table th {
          text-align: left;
          padding: 0.6rem 0.65rem;
          font-size: 0.65rem;
          font-weight: 700;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: var(--text-muted);
          border-bottom: 1px solid var(--border);
          background: var(--surface-muted);
        }
        .bnpl-master__table td {
          padding: 0.65rem;
          border-bottom: 1px solid var(--border-subtle);
          vertical-align: middle;
        }
        .bnpl-master__title {
          font-weight: 600;
          max-width: 14rem;
        }
        .bnpl-master__mono {
          font-family: var(--font-mono);
          font-variant-numeric: tabular-nums;
        }
        .bnpl-pill {
          display: inline-block;
          padding: 0.2rem 0.5rem;
          border-radius: var(--radius-pill);
          font-size: 0.6875rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }
        .bnpl-pill--on {
          background: var(--accent-soft);
          color: var(--accent-hover);
        }
        .bnpl-pill--off {
          background: var(--surface-muted);
          color: var(--text-muted);
        }
        .bnpl-master__actions-th {
          min-width: 9.5rem;
        }
        .bnpl-master__actions {
          display: flex;
          flex-wrap: wrap;
          gap: 0.4rem;
        }
        .bnpl-master__edit {
          padding: 0.35rem 0.55rem !important;
          font-size: 0.75rem !important;
        }
        .bnpl-master__rm {
          padding: 0.35rem 0.55rem !important;
          font-size: 0.75rem !important;
        }
        .bnpl-master__empty {
          margin: 0.75rem 0 0;
          font-size: 0.875rem;
          color: var(--text-muted);
        }

        @media (max-width: 640px) {
          .bnpl-master__filters {
            flex-direction: column;
            align-items: stretch;
            gap: 0.85rem;
            margin-bottom: 1.1rem;
          }
          .bnpl-master__f {
            gap: 0.4rem;
          }
          .bnpl-master__f span {
            font-size: 0.6rem;
            letter-spacing: 0.05em;
          }
          .bnpl-master__f .fld-input {
            min-width: 0;
            width: 100%;
            min-height: 2.45rem;
            font-size: 0.94rem;
          }
          .bnpl-master__edit,
          .bnpl-master__rm {
            min-height: 2.45rem;
            padding: 0.42rem 0.72rem !important;
            font-size: 0.78rem !important;
          }
          .bnpl-master__table td {
            padding: 0.55rem 0.45rem;
            font-size: 0.82rem;
          }
          .bnpl-master__table th {
            padding: 0.52rem 0.45rem;
            font-size: 0.6rem;
          }
        }
      `}</style>
    </div>
  );
}
