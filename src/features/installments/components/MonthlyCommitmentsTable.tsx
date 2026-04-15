import type {
  InstallmentEntry,
  InstallmentPaymentStatus,
} from '@/types/installments';
import { PAYMENT_METHOD_LABELS } from '@/types/installments';
import { formatMYR2 } from '@/utils/format';
import { getPaymentStatus } from '@/services/installmentService';

type Props = {
  month: string;
  monthLabel: string;
  entries: InstallmentEntry[];
  statuses: InstallmentPaymentStatus[];
  categoryName: (id: string) => string;
  onTogglePaid: (installmentId: string, month: string, isPaid: boolean) => void;
};

export function MonthlyCommitmentsTable({
  month,
  monthLabel,
  entries,
  statuses,
  categoryName,
  onTogglePaid,
}: Props) {
  if (entries.length === 0) {
    return (
      <div className="bnpl-mc-root bnpl-mc-root--empty">
        <p className="bnpl-mc-empty">No active installments for {monthLabel}.</p>
      </div>
    );
  }

  return (
    <div className="bnpl-mc-root">
      <div className="bnpl-mc-vscroll bajet-table-scroll">
      <table className="bnpl-mc-table">
        <thead>
          <tr>
            <th>Paid</th>
            <th>Item</th>
            <th>Category</th>
            <th>Method</th>
            <th>Due</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((e) => {
            const paid = getPaymentStatus(statuses, e.id, month);
            return (
              <tr key={e.id} className={paid ? 'is-paid' : 'is-unpaid'}>
                <td>
                  <input
                    type="checkbox"
                    className="bnpl-mc-check"
                    checked={paid}
                    onChange={(ev) =>
                      onTogglePaid(e.id, month, ev.target.checked)
                    }
                    aria-label={`Mark ${e.title} as ${paid ? 'unpaid' : 'paid'} for ${monthLabel}`}
                  />
                </td>
                <td className="bnpl-mc-title">{e.title}</td>
                <td>{categoryName(e.categoryId)}</td>
                <td>{PAYMENT_METHOD_LABELS[e.method]}</td>
                <td className="bnpl-mc-num">{formatMYR2(e.monthlyAmount)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      </div>
      <style>{`
        .bnpl-mc-root {
          flex: 1;
          min-height: 0;
          display: flex;
          flex-direction: column;
        }
        .bnpl-mc-root--empty {
          justify-content: center;
        }
        .bnpl-mc-vscroll {
          flex: 1;
          min-height: 0;
          overflow-y: auto;
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
        }
        .bnpl-mc-empty {
          margin: 0;
          padding: 1.25rem;
          color: var(--text-muted);
          font-size: 0.9375rem;
        }
        .bnpl-mc-table {
          min-width: 520px;
          font-size: 0.875rem;
        }
        .bnpl-mc-table th {
          text-align: left;
          padding: 0.65rem 0.75rem;
          font-size: 0.65rem;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--text-muted);
          border-bottom: 1px solid var(--border);
          background: var(--surface-muted);
          position: sticky;
          top: 0;
          z-index: 2;
          box-shadow: 0 1px 0 var(--border);
        }
        .bnpl-mc-table td {
          padding: 0.7rem 0.75rem;
          border-bottom: 1px solid var(--border-subtle);
          vertical-align: middle;
        }
        .bnpl-mc-table tr.is-paid td {
          background: var(--positive-soft);
        }
        .bnpl-mc-table tr.is-unpaid td {
          background: transparent;
        }
        .bnpl-mc-title {
          font-weight: 600;
          color: var(--text);
        }
        .bnpl-mc-num {
          font-family: var(--font-mono);
          font-variant-numeric: tabular-nums;
          font-weight: 600;
        }
        .bnpl-mc-check {
          width: 1.1rem;
          height: 1.1rem;
          accent-color: var(--positive);
        }

        @media (max-width: 640px) {
          .bnpl-mc-table {
            font-size: 0.82rem;
          }
          .bnpl-mc-table td {
            padding: 0.62rem 0.52rem;
          }
          .bnpl-mc-table th {
            padding: 0.58rem 0.52rem;
            font-size: 0.6rem;
            letter-spacing: 0.06em;
          }
          .bnpl-mc-check {
            width: 1.22rem;
            height: 1.22rem;
          }
          .bnpl-mc-table td:first-child {
            padding: 0.55rem 0.65rem 0.55rem 0.72rem;
          }
          .bnpl-mc-title {
            line-height: 1.35;
          }
        }
      `}</style>
    </div>
  );
}
