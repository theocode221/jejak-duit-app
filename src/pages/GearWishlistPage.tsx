import { AppShell } from '@/components/layout/AppShell';
import { PageSection } from '@/components/common/PageSection';
import { StatusBadge } from '@/components/common/StatusBadge';
import { useFinance } from '@/state/FinanceContext';
import { getGearList, getGearWishlistTotals } from '@/state/financeSelectors';
import { formatMYR } from '@/utils/format';
import type { GearPriority, GearStatus } from '@/types';
import { newId } from '@/utils/id';

function statusVariant(
  s: GearStatus
): 'success' | 'warning' | 'danger' | 'neutral' | 'info' {
  if (s === 'bought') return 'success';
  if (s === 'kiv') return 'warning';
  return 'info';
}

function priorityVariant(
  p: GearPriority
): 'success' | 'warning' | 'danger' | 'neutral' | 'info' {
  if (p === 'high') return 'warning';
  if (p === 'medium') return 'info';
  return 'neutral';
}

const GEAR_STATUS: GearStatus[] = ['planned', 'bought', 'kiv'];
const GEAR_PRIORITY: GearPriority[] = ['high', 'medium', 'low'];

function parseMoney(v: string): number {
  const n = parseFloat(v.replace(/,/g, ''));
  return Number.isFinite(n) ? n : 0;
}

export function GearWishlistPage() {
  const { state, dispatch } = useFinance();
  const gearItems = getGearList(state);
  const { totalTarget, count } = getGearWishlistTotals(gearItems);

  return (
    <AppShell
      kicker="Wishlist"
      title="Gear & lifestyle"
      subtitle="Edit items, prices, status, and links — data persists in the browser."
    >
      <PageSection
        kicker="Commitments"
        title="Open list snapshot"
        description="Planned and KIV items only. Bought gear drops out of the cost roll-up."
      >
      <div className="gear-summary">
        <div className="gear-summary__card">
          <span className="gear-summary__lbl">Open wishlist (planned + KIV)</span>
          <span className="gear-summary__val">{count} items</span>
        </div>
        <div className="gear-summary__card">
          <span className="gear-summary__lbl">Total target cost</span>
          <span className="gear-summary__val">{formatMYR(totalTarget)}</span>
        </div>
      </div>
      </PageSection>

      <PageSection
        kicker="Catalogue"
        title="Items"
        description="Cards mirror the table; use the grid for bulk edits."
      >
        <div className="gear-edit-bar">
          <button
            type="button"
            className="btn-row"
            onClick={() =>
              dispatch({
                type: 'gear/add',
                item: {
                  id: newId('gear'),
                  name: 'New item',
                  category: 'General',
                  targetPrice: 0,
                  status: 'planned',
                  priority: 'medium',
                  linkedPurpose: '',
                },
              })
            }
          >
            Add item
          </button>
        </div>

      <div className="gear-grid">
        {gearItems.map((g) => (
          <article key={g.id} className="gear-card">
            <div className="gear-card__top">
              <h3 className="gear-card__name">{g.name}</h3>
              <StatusBadge variant={statusVariant(g.status)}>
                {g.status === 'kiv' ? 'KIV' : g.status}
              </StatusBadge>
            </div>
            <p className="gear-card__cat">{g.category}</p>
            <p className="gear-card__price">{formatMYR(g.targetPrice)}</p>
            <div className="gear-card__tags">
              <StatusBadge variant={priorityVariant(g.priority)}>
                {g.priority} priority
              </StatusBadge>
              <span className="gear-card__purpose">{g.linkedPurpose}</span>
            </div>
          </article>
        ))}
      </div>

      <div className="gear-table-wrap bajet-table-scroll">
        <table className="gear-table">
          <thead>
            <tr>
              <th>Item</th>
              <th>Category</th>
              <th>Target</th>
              <th>Status</th>
              <th>Priority</th>
              <th>Linked</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {gearItems.map((g) => (
              <tr key={g.id}>
                <td>
                  <input
                    className="fld-input gear-table__name"
                    value={g.name}
                    onChange={(e) =>
                      dispatch({
                        type: 'gear/update',
                        id: g.id,
                        patch: { name: e.target.value },
                      })
                    }
                  />
                </td>
                <td>
                  <input
                    className="fld-input"
                    value={g.category}
                    onChange={(e) =>
                      dispatch({
                        type: 'gear/update',
                        id: g.id,
                        patch: { category: e.target.value },
                      })
                    }
                  />
                </td>
                <td>
                  <input
                    className="fld-num"
                    type="number"
                    step="0.01"
                    value={g.targetPrice}
                    onChange={(e) =>
                      dispatch({
                        type: 'gear/update',
                        id: g.id,
                        patch: { targetPrice: parseMoney(e.target.value) },
                      })
                    }
                  />
                </td>
                <td>
                  <select
                    className="fld-input"
                    value={g.status}
                    onChange={(e) =>
                      dispatch({
                        type: 'gear/update',
                        id: g.id,
                        patch: { status: e.target.value as GearStatus },
                      })
                    }
                  >
                    {GEAR_STATUS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </td>
                <td>
                  <select
                    className="fld-input"
                    value={g.priority}
                    onChange={(e) =>
                      dispatch({
                        type: 'gear/update',
                        id: g.id,
                        patch: { priority: e.target.value as GearPriority },
                      })
                    }
                  >
                    {GEAR_PRIORITY.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </td>
                <td>
                  <input
                    className="fld-input"
                    value={g.linkedPurpose}
                    onChange={(e) =>
                      dispatch({
                        type: 'gear/update',
                        id: g.id,
                        patch: { linkedPurpose: e.target.value },
                      })
                    }
                  />
                </td>
                <td>
                  <button
                    type="button"
                    className="btn-row danger"
                    onClick={() =>
                      dispatch({ type: 'gear/remove', id: g.id })
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
        .gear-edit-bar {
          margin-bottom: 1rem;
        }
        .gear-summary {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 1rem;
        }
        @media (max-width: 560px) {
          .gear-summary {
            grid-template-columns: 1fr;
          }
        }
        .gear-summary__card {
          background: linear-gradient(
            145deg,
            #ffffff 0%,
            var(--surface-muted) 100%
          );
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius);
          padding: 1.15rem 1.25rem;
          box-shadow: var(--shadow-card);
        }
        .gear-summary__lbl {
          display: block;
          font-size: 0.75rem;
          color: var(--text-muted);
          margin-bottom: 0.35rem;
        }
        .gear-summary__val {
          font-family: var(--font-mono);
          font-size: 1.35rem;
          font-weight: 700;
          letter-spacing: -0.02em;
        }
        .gear-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 1rem;
        }
        @media (max-width: 1024px) {
          .gear-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }
        @media (max-width: 560px) {
          .gear-grid {
            grid-template-columns: 1fr;
          }
        }
        .gear-card {
          background: var(--surface);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius);
          padding: 1.05rem 1.15rem;
          box-shadow: var(--shadow-card);
        }
        .gear-card__top {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 0.5rem;
        }
        .gear-card__name {
          margin: 0;
          font-size: 0.9rem;
          font-weight: 600;
          line-height: 1.35;
        }
        .gear-card__cat {
          margin: 0.35rem 0 0;
          font-size: 0.75rem;
          color: var(--text-muted);
        }
        .gear-card__price {
          margin: 0.65rem 0 0;
          font-family: var(--font-mono);
          font-size: 1.1rem;
          font-weight: 700;
          color: var(--accent);
        }
        .gear-card__tags {
          margin-top: 0.75rem;
          display: flex;
          flex-wrap: wrap;
          gap: 0.4rem;
          align-items: center;
        }
        .gear-card__purpose {
          font-size: 0.72rem;
          color: var(--text-subtle);
        }
        .gear-table-wrap {
          background: var(--surface);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius);
          box-shadow: var(--shadow-card);
        }
        .gear-table {
          font-size: 0.875rem;
          min-width: 860px;
        }
        .gear-table th,
        .gear-table td {
          text-align: left;
          padding: 0.65rem 1rem;
          border-bottom: 1px solid var(--border);
          vertical-align: middle;
        }
        .gear-table th {
          font-size: 0.7rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--text-muted);
        }
        .gear-table__name {
          max-width: 200px;
        }
      `}</style>
    </AppShell>
  );
}
