import { useState } from 'react';
import type { CategoryBalanceRow } from '@/services/installmentService';
import { formatMYR2 } from '@/utils/format';

type Props = {
  rows: CategoryBalanceRow[];
  onUpdate: (id: string, patch: { name?: string; monthlyLimit?: number }) => void;
  onDelete: (id: string) => boolean;
  onAdd: (name: string, monthlyLimit: number) => void;
};

export function CategoryLimitSection({
  rows,
  onUpdate,
  onDelete,
  onAdd,
}: Props) {
  const [newName, setNewName] = useState('');
  const [newLimit, setNewLimit] = useState('200');
  const [deleteHint, setDeleteHint] = useState<string | null>(null);

  return (
    <div className="bnpl-cat">
      <div className="bnpl-cat__grid">
        {rows.map((row) => (
          <div
            key={row.id}
            className={`bnpl-cat__card bnpl-cat__card--${row.status}`}
          >
            <div className="bnpl-cat__card-head">
              <input
                className="fld-input bnpl-cat__name"
                aria-label={`Category name ${row.name}`}
                value={row.name}
                onChange={(e) => onUpdate(row.id, { name: e.target.value })}
              />
              <button
                type="button"
                className="btn-row bnpl-cat__del danger"
                title="Remove category"
                onClick={() => {
                  const ok = onDelete(row.id);
                  if (!ok)
                    setDeleteHint(
                      'Remove or reassign installments using this category first.'
                    );
                  else setDeleteHint(null);
                }}
              >
                Remove
              </button>
            </div>
            <label className="bnpl-cat__lbl">Monthly limit</label>
            <input
              className="fld-num bnpl-cat__limit"
              type="number"
              min={0}
              step="1"
              value={row.monthlyLimit}
              onChange={(e) =>
                onUpdate(row.id, {
                  monthlyLimit: Math.max(0, Number(e.target.value) || 0),
                })
              }
            />
            <div className="bnpl-cat__meta">
              <span>
                This month: <strong>{formatMYR2(row.usage)}</strong>
              </span>
              <span
                className={
                  row.remaining < 0
                    ? 'is-over'
                    : row.status === 'warn'
                      ? 'is-warn'
                      : 'is-ok'
                }
              >
                Left: {formatMYR2(row.remaining)}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="bnpl-cat__add">
        <input
          className="fld-input"
          placeholder="New category name"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          aria-label="New category name"
        />
        <input
          className="fld-num"
          type="number"
          min={0}
          placeholder="Limit"
          value={newLimit}
          onChange={(e) => setNewLimit(e.target.value)}
          aria-label="Monthly limit for new category"
        />
        <button
          type="button"
          className="btn-row"
          onClick={() => {
            const lim = Math.max(0, parseFloat(newLimit) || 0);
            onAdd(newName.trim() || 'New category', lim);
            setNewName('');
            setNewLimit('200');
          }}
        >
          Add category
        </button>
      </div>
      {deleteHint && <p className="bnpl-cat__hint">{deleteHint}</p>}

      <style>{`
        .bnpl-cat__grid {
          display: grid;
          gap: 1rem;
          grid-template-columns: repeat(auto-fill, minmax(15rem, 1fr));
        }
        .bnpl-cat__card {
          background: var(--surface);
          border-radius: var(--radius);
          border: 1px solid var(--border-subtle);
          box-shadow: var(--shadow-card);
          padding: 1rem 1.1rem;
          min-width: 0;
        }
        .bnpl-cat__card--ok {
          border-top: 3px solid var(--positive);
        }
        .bnpl-cat__card--warn {
          border-top: 3px solid var(--warning);
        }
        .bnpl-cat__card--over {
          border-top: 3px solid var(--negative);
        }
        .bnpl-cat__card-head {
          display: flex;
          gap: 0.5rem;
          align-items: flex-start;
          margin-bottom: 0.65rem;
        }
        .bnpl-cat__name {
          flex: 1;
          min-width: 0;
          font-weight: 600;
        }
        .bnpl-cat__del {
          flex-shrink: 0;
          padding: 0.35rem 0.55rem !important;
          font-size: 0.75rem !important;
        }
        .bnpl-cat__lbl {
          display: block;
          font-size: 0.65rem;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--text-muted);
          margin-bottom: 0.25rem;
        }
        .bnpl-cat__limit {
          width: 100%;
          margin-bottom: 0.65rem;
        }
        .bnpl-cat__meta {
          display: flex;
          flex-direction: column;
          gap: 0.2rem;
          font-size: 0.8125rem;
          color: var(--text-muted);
        }
        .bnpl-cat__meta .is-ok {
          color: var(--positive);
          font-weight: 600;
        }
        .bnpl-cat__meta .is-warn {
          color: var(--warning);
          font-weight: 600;
        }
        .bnpl-cat__meta .is-over {
          color: var(--negative);
          font-weight: 600;
        }
        .bnpl-cat__add {
          display: flex;
          flex-wrap: wrap;
          gap: 0.65rem;
          align-items: center;
          margin-top: 1.15rem;
          padding-top: 1rem;
          border-top: 1px solid var(--border-subtle);
        }
        .bnpl-cat__add .fld-input {
          flex: 1 1 10rem;
          min-width: 0;
        }
        .bnpl-cat__add .fld-num {
          width: 7rem;
        }
        .bnpl-cat__hint {
          margin: 0.65rem 0 0;
          font-size: 0.8125rem;
          color: var(--negative);
        }

        @media (max-width: 640px) {
          .bnpl-cat__grid {
            gap: 0.85rem;
          }
          .bnpl-cat__meta {
            gap: 0.35rem;
            line-height: 1.45;
            font-size: 0.78rem;
          }
          .bnpl-cat__add {
            flex-direction: column;
            align-items: stretch;
            gap: 0.75rem;
            margin-top: 1rem;
            padding-top: 0.9rem;
          }
          .bnpl-cat__add .fld-num {
            width: 100%;
            min-height: 2.45rem;
            font-size: 0.94rem;
          }
          .bnpl-cat__add .fld-input {
            min-height: 2.45rem;
            font-size: 0.94rem;
          }
          .bnpl-cat__add .btn-row {
            min-height: 2.45rem;
            justify-content: center;
            font-size: 0.82rem !important;
          }
          .bnpl-cat__del {
            min-height: 2.25rem;
            font-size: 0.72rem !important;
          }
          .bnpl-cat__limit {
            min-height: 2.45rem;
            font-size: 0.94rem;
          }
          .bnpl-cat__lbl {
            font-size: 0.6rem;
          }
        }
      `}</style>
    </div>
  );
}
