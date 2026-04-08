import { RotateCcw } from 'lucide-react';
import { resetFinanceDispatch, useFinance } from '@/state/FinanceContext';

export function FinanceToolbar() {
  const { state, dispatch } = useFinance();

  return (
    <div className="finance-toolbar">
      <label className="finance-toolbar__ref">
        <span className="visually-hidden">Reference date</span>
        <span aria-hidden>Ref</span>
        <input
          type="date"
          className="finance-toolbar__date"
          value={state.referenceDate}
          onChange={(e) =>
            dispatch({
              type: 'meta/setReferenceDate',
              isoDate: e.target.value,
            })
          }
        />
      </label>
      <button
        type="button"
        className="finance-toolbar__reset"
        title="Reload defaults from bundled workbook export"
        onClick={() => {
          if (
            confirm(
              'Reset all data to the original import? Local edits will be lost.'
            )
          ) {
            resetFinanceDispatch(dispatch);
          }
        }}
      >
        <RotateCcw size={15} strokeWidth={2} aria-hidden />
        Reset
      </button>
      <span className="finance-toolbar__hint">Saved locally</span>
      <style>{`
        .finance-toolbar {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          flex-wrap: wrap;
        }
        .finance-toolbar__ref {
          display: flex;
          align-items: center;
          gap: 0.35rem;
          font-size: 0.7rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          color: var(--text-muted);
        }
        .finance-toolbar__date {
          padding: 0.35rem 0.5rem;
          border-radius: var(--radius-xs);
          border: 1px solid var(--border);
          background: var(--surface);
          font-family: var(--font-mono);
          font-size: 0.75rem;
          color: var(--text);
        }
        .finance-toolbar__reset {
          display: inline-flex;
          align-items: center;
          gap: 0.3rem;
          padding: 0.35rem 0.65rem;
          border-radius: var(--radius-pill);
          border: 1px solid var(--border);
          background: var(--surface);
          font-size: 0.75rem;
          font-weight: 600;
          color: var(--text-secondary);
          cursor: pointer;
          box-shadow: var(--shadow-sm);
        }
        .finance-toolbar__reset:hover {
          border-color: #cbd5e1;
          color: var(--text);
        }
        .finance-toolbar__hint {
          font-size: 0.68rem;
          color: var(--text-subtle);
          white-space: nowrap;
        }
        @media (max-width: 640px) {
          .finance-toolbar__hint {
            display: none;
          }
        }
      `}</style>
    </div>
  );
}
