import { useEffect, useState } from 'react';
import type { CategoryLimit, InstallmentEntry, PaymentMethod } from '@/types/installments';
import { PAYMENT_METHOD_LABELS } from '@/types/installments';
import { suggestedMonthlyPayment } from '@/services/installmentService';
import { formatMYR2, roundUpMoney2 } from '@/utils/format';

type Props = {
  categories: CategoryLimit[];
  defaultStartMonth: string;
  editingEntry: InstallmentEntry | null;
  onAdd: (entry: Omit<InstallmentEntry, 'id'>) => void;
  onUpdate: (id: string, entry: Omit<InstallmentEntry, 'id'>) => void;
  onCancelEdit: () => void;
};

const METHODS: PaymentMethod[] = ['credit_card', 'spaylater', 'atome'];

function parseMoney(v: string): number {
  const n = parseFloat(v.replace(/,/g, ''));
  return Number.isFinite(n) ? n : 0;
}

export function InstallmentForm({
  categories,
  defaultStartMonth,
  editingEntry,
  onAdd,
  onUpdate,
  onCancelEdit,
}: Props) {
  const [title, setTitle] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [categoryId, setCategoryId] = useState(
    () => categories[0]?.id ?? ''
  );
  const [method, setMethod] = useState<PaymentMethod>('spaylater');
  const [startMonth, setStartMonth] = useState(defaultStartMonth);
  const [durationMonths, setDurationMonths] = useState('3');
  const [monthlyManual, setMonthlyManual] = useState(false);
  const [monthlyAmount, setMonthlyAmount] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (editingEntry) {
      setTitle(editingEntry.title);
      setTotalAmount(String(editingEntry.totalAmount));
      setCategoryId(editingEntry.categoryId);
      setMethod(editingEntry.method);
      setStartMonth(editingEntry.startMonth);
      setDurationMonths(String(editingEntry.durationMonths));
      setNotes(editingEntry.notes ?? '');
      setMonthlyAmount(String(editingEntry.monthlyAmount));
      const auto = suggestedMonthlyPayment(
        editingEntry.totalAmount,
        editingEntry.durationMonths
      );
      setMonthlyManual(
        Math.abs(editingEntry.monthlyAmount - auto) > 1e-12
      );
    } else {
      setTitle('');
      setTotalAmount('');
      setDurationMonths('3');
      setMonthlyManual(false);
      setMonthlyAmount('');
      setNotes('');
      setStartMonth(defaultStartMonth);
      setMethod('spaylater');
      if (categories[0]) setCategoryId(categories[0].id);
    }
  }, [editingEntry, defaultStartMonth, categories]);

  const totalN = parseMoney(totalAmount);
  const durN = Math.max(1, Math.floor(parseFloat(durationMonths) || 1));
  const autoMonthly = suggestedMonthlyPayment(totalN, durN);

  useEffect(() => {
    if (!monthlyManual && totalN > 0 && durN >= 1) {
      setMonthlyAmount(String(autoMonthly));
    }
  }, [totalN, durN, autoMonthly, monthlyManual]);

  const resetAddForm = () => {
    setTitle('');
    setTotalAmount('');
    setDurationMonths('3');
    setMonthlyManual(false);
    setMonthlyAmount('');
    setNotes('');
    setStartMonth(defaultStartMonth);
    if (categories[0]) setCategoryId(categories[0].id);
    setMethod('spaylater');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !categoryId) return;
    const monthly = monthlyManual ? parseMoney(monthlyAmount) : autoMonthly;
    const payload: Omit<InstallmentEntry, 'id'> = {
      title: title.trim(),
      totalAmount: roundUpMoney2(Math.max(0, totalN)),
      categoryId,
      method,
      startMonth,
      durationMonths: durN,
      monthlyAmount: roundUpMoney2(Math.max(0, monthly)),
      notes: notes.trim() || undefined,
    };

    if (editingEntry) {
      onUpdate(editingEntry.id, payload);
      return;
    }

    onAdd(payload);
    resetAddForm();
  };

  const isEditing = Boolean(editingEntry);

  return (
    <form className="bnpl-form" onSubmit={handleSubmit}>
      {editingEntry && (
        <p className="bnpl-form__banner" role="status">
          Editing <strong>{editingEntry.title}</strong>
          <button type="button" className="bnpl-form__banner-cancel" onClick={onCancelEdit}>
            Cancel
          </button>
        </p>
      )}
      <div className="bnpl-form__grid">
        <label className="bnpl-form__field">
          <span className="bnpl-form__lbl">Item / title</span>
          <input
            className="fld-input"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Phone on installment"
          />
        </label>
        <label className="bnpl-form__field">
          <span className="bnpl-form__lbl">Total amount (RM)</span>
          <input
            className="fld-num"
            type="number"
            min={0}
            step="any"
            required
            value={totalAmount}
            onChange={(e) => setTotalAmount(e.target.value)}
          />
        </label>
        <label className="bnpl-form__field">
          <span className="bnpl-form__lbl">Category</span>
          <select
            className="fld-input"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <label className="bnpl-form__field">
          <span className="bnpl-form__lbl">Method</span>
          <select
            className="fld-input"
            value={method}
            onChange={(e) => setMethod(e.target.value as PaymentMethod)}
          >
            {METHODS.map((m) => (
              <option key={m} value={m}>
                {PAYMENT_METHOD_LABELS[m]}
              </option>
            ))}
          </select>
        </label>
        <label className="bnpl-form__field">
          <span className="bnpl-form__lbl">Start month</span>
          <input
            className="fld-input"
            type="month"
            value={startMonth}
            onChange={(e) => setStartMonth(e.target.value)}
          />
        </label>
        <label className="bnpl-form__field">
          <span className="bnpl-form__lbl">Number of months</span>
          <input
            className="fld-num"
            type="number"
            min={1}
            max={120}
            required
            value={durationMonths}
            onChange={(e) => setDurationMonths(e.target.value)}
          />
        </label>
        <label className="bnpl-form__field bnpl-form__field--span">
          <span className="bnpl-form__lbl">Monthly payment (RM)</span>
          <div className="bnpl-form__monthly-row">
            <input
              className="fld-num"
              type="number"
              min={0}
              step="any"
              value={monthlyAmount}
              onChange={(e) => setMonthlyAmount(e.target.value)}
              disabled={!monthlyManual && totalN > 0}
            />
            <label className="bnpl-form__check">
              <input
                type="checkbox"
                checked={monthlyManual}
                onChange={(e) => {
                  setMonthlyManual(e.target.checked);
                  if (!e.target.checked)
                    setMonthlyAmount(String(autoMonthly));
                }}
              />
              <span>Set manually</span>
            </label>
          </div>
          {!monthlyManual && totalN > 0 && (
            <span className="bnpl-form__hint">
              Auto: total ÷ months ({durN}) = {formatMYR2(autoMonthly)}
            </span>
          )}
        </label>
        <label className="bnpl-form__field bnpl-form__field--span">
          <span className="bnpl-form__lbl">Notes (optional)</span>
          <input
            className="fld-input"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Reference, store, etc."
          />
        </label>
      </div>
      <div className="bnpl-form__actions">
        <button type="submit" className="btn-row bnpl-form__submit">
          {isEditing ? 'Save changes' : 'Add installment / BNPL'}
        </button>
        {isEditing && (
          <button type="button" className="btn-row bnpl-form__ghost" onClick={onCancelEdit}>
            Discard edits
          </button>
        )}
      </div>

      <style>{`
        .bnpl-form__banner {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          justify-content: space-between;
          gap: 0.5rem;
          margin: 0 0 1rem;
          padding: 0.55rem 0.75rem;
          border-radius: var(--radius-sm);
          background: var(--accent-2-soft);
          border: 1px solid rgba(79, 70, 229, 0.2);
          font-size: 0.875rem;
          color: var(--text-secondary);
        }
        .bnpl-form__banner-cancel {
          margin-left: auto;
          padding: 0.3rem 0.65rem;
          font-size: 0.8125rem;
          font-weight: 600;
          border: none;
          border-radius: var(--radius-xs);
          background: var(--surface);
          color: var(--accent-2);
          cursor: pointer;
          box-shadow: var(--shadow-sm);
        }
        .bnpl-form__banner-cancel:hover {
          background: var(--surface-muted);
        }
        .bnpl-form__grid {
          display: grid;
          gap: 1rem 1.25rem;
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }
        @media (max-width: 720px) {
          .bnpl-form__grid {
            grid-template-columns: 1fr;
          }
        }
        .bnpl-form__field {
          display: flex;
          flex-direction: column;
          gap: 0.35rem;
          min-width: 0;
        }
        .bnpl-form__field--span {
          grid-column: 1 / -1;
        }
        .bnpl-form__lbl {
          font-size: 0.65rem;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--text-muted);
        }
        .bnpl-form__monthly-row {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 0.75rem;
        }
        .bnpl-form__monthly-row .fld-num {
          flex: 1 1 8rem;
          min-width: 0;
        }
        .bnpl-form__check {
          display: inline-flex;
          align-items: center;
          gap: 0.45rem;
          font-size: 0.875rem;
          color: var(--text-secondary);
          cursor: pointer;
          user-select: none;
        }
        .bnpl-form__hint {
          font-size: 0.75rem;
          color: var(--text-subtle);
        }
        .bnpl-form__actions {
          display: flex;
          flex-wrap: wrap;
          gap: 0.65rem;
          margin-top: 1.1rem;
          align-items: center;
        }
        .bnpl-form__submit {
          margin-top: 0;
        }
        .bnpl-form__ghost {
          margin-top: 0;
          background: transparent;
          border: 1px solid var(--border);
          color: var(--text-muted);
        }
        .bnpl-form__ghost:hover {
          background: var(--surface-muted);
          color: var(--text);
        }

        @media (max-width: 640px) {
          .bnpl-form__grid {
            gap: 0.85rem 0.95rem;
          }
          .bnpl-form__lbl {
            font-size: 0.6rem;
            letter-spacing: 0.06em;
          }
          .bnpl-form__actions {
            flex-direction: column;
            align-items: stretch;
            gap: 0.75rem;
            margin-top: 0.95rem;
          }
          .bnpl-form__submit,
          .bnpl-form__ghost {
            width: 100%;
            min-height: 2.55rem;
            justify-content: center;
            touch-action: manipulation;
            font-size: 0.84rem !important;
          }
          .bnpl-form__banner {
            flex-direction: column;
            align-items: stretch;
            gap: 0.55rem;
            padding: 0.48rem 0.65rem;
            font-size: 0.82rem;
            line-height: 1.45;
          }
          .bnpl-form__banner-cancel {
            margin-left: 0;
            align-self: flex-end;
            min-height: 2.25rem;
            padding: 0.32rem 0.72rem;
            font-size: 0.78rem;
          }
          .bnpl-form__field .fld-input,
          .bnpl-form__field .fld-num {
            min-height: 2.45rem;
            font-size: 0.94rem;
          }
          .bnpl-form__check {
            min-height: 2.25rem;
            align-items: center;
            font-size: 0.82rem;
          }
          .bnpl-form__hint {
            font-size: 0.7rem;
            line-height: 1.45;
          }
          .bnpl-form__monthly-row {
            gap: 0.55rem;
          }
        }
      `}</style>
    </form>
  );
}
