import { useEffect, useMemo, useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { PageSection } from '@/components/common/PageSection';
import { ChartShell } from '@/components/common/ChartShell';
import { EventBreakdownChart } from '@/components/charts/EventBreakdownChart';
import { BreakdownDonut } from '@/components/charts/BreakdownDonut';
import { useFinance } from '@/state/FinanceContext';
import { getEvents } from '@/state/financeSelectors';
import { eventRemaining, breakdownTotal } from '@/utils/eventHelpers';
import { formatMYR, formatDate } from '@/utils/format';
import type { EventBreakdownKey, TripEvent } from '@/types';
import { newId } from '@/utils/id';

const BREAKDOWN_KEYS: { key: EventBreakdownKey; label: string }[] = [
  { key: 'transport', label: 'Transport' },
  { key: 'hotel', label: 'Hotel' },
  { key: 'makan', label: 'Makan' },
  { key: 'registration', label: 'Registration' },
  { key: 'shopping', label: 'Shopping' },
  { key: 'misc', label: 'Misc' },
];

function breakdownRows(b: TripEvent['breakdown']) {
  return BREAKDOWN_KEYS.map(({ key, label }) => ({
    name: label,
    value: b[key],
  }));
}

const emptyBreakdown = (): TripEvent['breakdown'] => ({
  transport: 0,
  hotel: 0,
  makan: 0,
  registration: 0,
  shopping: 0,
  misc: 0,
});

function parseMoney(v: string): number {
  const n = parseFloat(v.replace(/,/g, ''));
  return Number.isFinite(n) ? n : 0;
}

export function EventsPage() {
  const { state, dispatch } = useFinance();
  const tripEvents = useMemo(() => getEvents(state), [state.events]);
  const [selectedId, setSelectedId] = useState(tripEvents[0]?.id ?? '');

  useEffect(() => {
    if (tripEvents.length === 0) {
      setSelectedId('');
      return;
    }
    if (!tripEvents.some((e) => e.id === selectedId)) {
      setSelectedId(tripEvents[0].id);
    }
  }, [tripEvents, selectedId]);

  const selected = useMemo(
    () => tripEvents.find((e) => e.id === selectedId) ?? tripEvents[0],
    [selectedId, tripEvents]
  );

  if (!selected) {
    return (
      <AppShell
        kicker="Experiences"
        title="Events & trips"
        subtitle="No events yet — add one below."
      >
        <PageSection kicker="Planner" title="Events">
          <button
            type="button"
            className="btn-row"
            onClick={() => {
              const ev: TripEvent = {
                id: newId('evt'),
                name: 'New trip',
                eventDate: '2026-06-01',
                plannedBudget: 0,
                actualSpending: 0,
                breakdown: emptyBreakdown(),
              };
              dispatch({ type: 'events/add', event: ev });
              setSelectedId(ev.id);
            }}
          >
            Add event
          </button>
        </PageSection>
      </AppShell>
    );
  }

  const remain = eventRemaining(selected);
  const plannedBreakdownTotal = breakdownTotal(selected.breakdown);

  return (
    <AppShell
      kicker="Experiences"
      title="Events & trips"
      subtitle="Edit envelopes, dates, spend, and breakdown slices."
    >
      <PageSection
        kicker="Planner"
        title="Select an experience"
        description="Pick a card for detail — or add/remove trips."
      >
        <div className="ev-toolbar">
          <button
            type="button"
            className="btn-row"
            onClick={() => {
              const ev: TripEvent = {
                id: newId('evt'),
                name: 'New trip',
                eventDate: '2026-06-01',
                plannedBudget: 0,
                actualSpending: 0,
                breakdown: emptyBreakdown(),
              };
              dispatch({ type: 'events/add', event: ev });
              setSelectedId(ev.id);
            }}
          >
            Add event
          </button>
        </div>
      <div className="ev-grid">
        <div className="ev-cards">
          {tripEvents.map((e) => {
            const r = eventRemaining(e);
            const active = e.id === selected.id;
            return (
              <div
                key={e.id}
                role="button"
                tabIndex={0}
                className={`ev-card ${active ? 'is-active' : ''}`}
                onClick={() => setSelectedId(e.id)}
                onKeyDown={(kev) => {
                  if (kev.key === 'Enter' || kev.key === ' ') {
                    kev.preventDefault();
                    setSelectedId(e.id);
                  }
                }}
              >
                <span className="ev-card__name">{e.name}</span>
                <span className="ev-card__date">{formatDate(e.eventDate)}</span>
                <div className="ev-card__nums">
                  <span>
                    <small>Planned</small>
                    {formatMYR(e.plannedBudget)}
                  </span>
                  <span>
                    <small>Actual</small>
                    {formatMYR(e.actualSpending)}
                  </span>
                </div>
                <div
                  className={`ev-card__remain ${r >= 0 ? 'is-pos' : 'is-neg'}`}
                >
                  {r >= 0 ? 'Left' : 'Over'} · {formatMYR(Math.abs(r))}
                </div>
                <button
                  type="button"
                  className="btn-row danger ev-card__remove"
                  onClick={(ev) => {
                    ev.stopPropagation();
                    dispatch({ type: 'events/remove', id: e.id });
                  }}
                >
                  Remove
                </button>
              </div>
            );
          })}
        </div>

        <section className="ev-detail">
          <header className="ev-detail__head">
            <div className="ev-detail__fields">
              <input
                className="fld-input ev-detail__name"
                value={selected.name}
                onChange={(e) =>
                  dispatch({
                    type: 'events/update',
                    id: selected.id,
                    patch: { name: e.target.value },
                  })
                }
              />
              <input
                className="fld-input"
                type="date"
                value={
                  selected.eventDate.length >= 10
                    ? selected.eventDate.slice(0, 10)
                    : selected.eventDate
                }
                onChange={(e) =>
                  dispatch({
                    type: 'events/update',
                    id: selected.id,
                    patch: { eventDate: e.target.value },
                  })
                }
              />
            </div>
            <div className="ev-detail__pill">
              <div>
                <span className="ev-detail__lbl">Planned budget</span>
                <input
                  className="fld-num ev-detail__num"
                  type="number"
                  step="0.01"
                  value={selected.plannedBudget}
                  onChange={(e) =>
                    dispatch({
                      type: 'events/update',
                      id: selected.id,
                      patch: { plannedBudget: parseMoney(e.target.value) },
                    })
                  }
                />
              </div>
              <div>
                <span className="ev-detail__lbl">Actual</span>
                <input
                  className="fld-num ev-detail__num"
                  type="number"
                  step="0.01"
                  value={selected.actualSpending}
                  onChange={(e) =>
                    dispatch({
                      type: 'events/update',
                      id: selected.id,
                      patch: { actualSpending: parseMoney(e.target.value) },
                    })
                  }
                />
              </div>
              <div>
                <span className="ev-detail__lbl">Remaining</span>
                <span
                  className={`ev-detail__val ${
                    remain >= 0 ? 'is-pos' : 'is-neg'
                  }`}
                >
                  {formatMYR(remain)}
                </span>
              </div>
            </div>
          </header>

          <p className="ev-detail__note">
            Planned breakdown sum: {formatMYR(plannedBreakdownTotal)} (target
            envelope)
          </p>

          <div className="ev-charts">
            <ChartShell
              kicker="Mix"
              title="Spending composition"
              subtitle="Donut — non-zero slices only."
              minHeight={280}
            >
              <BreakdownDonut data={breakdownRows(selected.breakdown)} />
            </ChartShell>
            <ChartShell
              kicker="Detail"
              title="Category breakdown"
              subtitle="Same numbers as the table below."
              minHeight={280}
            >
              <EventBreakdownChart breakdown={selected.breakdown} />
            </ChartShell>
          </div>

          <div className="ev-table-wrap">
            <table className="ev-table">
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Planned slice</th>
                </tr>
              </thead>
              <tbody>
                {BREAKDOWN_KEYS.map(({ key, label }) => (
                  <tr key={key}>
                    <td>{label}</td>
                    <td>
                      <input
                        className="fld-num"
                        type="number"
                        step="0.01"
                        value={selected.breakdown[key]}
                        onChange={(e) =>
                          dispatch({
                            type: 'events/breakdown/set',
                            id: selected.id,
                            key,
                            value: parseMoney(e.target.value),
                          })
                        }
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
      </PageSection>

      <style>{`
        .ev-toolbar {
          margin-bottom: 1rem;
        }
        .ev-grid {
          display: grid;
          grid-template-columns: minmax(0, 280px) 1fr;
          gap: 1.25rem;
          align-items: start;
        }
        @media (max-width: 1024px) {
          .ev-grid {
            grid-template-columns: 1fr;
          }
        }
        .ev-cards {
          display: flex;
          flex-direction: column;
          gap: 0.65rem;
        }
        .ev-card {
          text-align: left;
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius);
          padding: 0.95rem 1.05rem;
          background: var(--surface);
          box-shadow: var(--shadow-card);
          cursor: pointer;
          transition: border-color 0.18s, box-shadow 0.18s, transform 0.18s;
        }
        .ev-card:hover {
          border-color: #cbd5e1;
          transform: translateY(-1px);
        }
        .ev-card.is-active {
          border-color: rgba(13, 148, 136, 0.45);
          box-shadow: 0 0 0 3px var(--accent-soft), var(--shadow-card);
        }
        .ev-card__name {
          display: block;
          font-weight: 600;
          font-size: 0.875rem;
        }
        .ev-card__date {
          font-size: 0.75rem;
          color: var(--text-muted);
        }
        .ev-card__nums {
          display: flex;
          gap: 1rem;
          margin-top: 0.65rem;
          font-family: var(--font-mono);
          font-size: 0.75rem;
          font-weight: 600;
        }
        .ev-card__nums small {
          display: block;
          font-family: var(--font);
          font-weight: 500;
          color: var(--text-muted);
          font-size: 0.65rem;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }
        .ev-card__remain {
          margin-top: 0.5rem;
          font-size: 0.75rem;
          font-weight: 600;
        }
        .ev-card__remain.is-pos {
          color: var(--positive);
        }
        .ev-card__remain.is-neg {
          color: var(--negative);
        }
        .ev-card__remove {
          margin-top: 0.5rem;
          width: 100%;
        }
        .ev-detail {
          background: var(--surface);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius);
          padding: 1.2rem 1.3rem;
          box-shadow: var(--shadow-card);
        }
        .ev-detail__head {
          display: flex;
          flex-wrap: wrap;
          justify-content: space-between;
          gap: 1rem;
        }
        .ev-detail__fields {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          min-width: min(100%, 280px);
        }
        .ev-detail__name {
          font-weight: 700;
          font-size: 1rem;
        }
        .ev-detail__pill {
          display: flex;
          gap: 1.25rem;
          flex-wrap: wrap;
        }
        .ev-detail__lbl {
          display: block;
          font-size: 0.65rem;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: var(--text-muted);
        }
        .ev-detail__num {
          min-width: 6rem;
          font-weight: 700;
        }
        .ev-detail__val {
          font-family: var(--font-mono);
          font-weight: 700;
          font-size: 0.95rem;
        }
        .ev-detail__val.is-pos {
          color: var(--positive);
        }
        .ev-detail__val.is-neg {
          color: var(--negative);
        }
        .ev-detail__note {
          margin: 1rem 0 0;
          font-size: 0.8125rem;
          color: var(--text-muted);
        }
        .ev-charts {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 1rem;
          margin-top: 1.15rem;
        }
        @media (max-width: 800px) {
          .ev-charts {
            grid-template-columns: 1fr;
          }
        }
        .ev-table-wrap {
          margin-top: 1rem;
          overflow-x: auto;
          border: 1px solid var(--border);
          border-radius: var(--radius-sm);
        }
        .ev-table {
          font-size: 0.875rem;
          width: 100%;
        }
        .ev-table th,
        .ev-table td {
          padding: 0.6rem 1rem;
          border-bottom: 1px solid var(--border);
          text-align: left;
          vertical-align: middle;
        }
        .ev-table th {
          font-size: 0.7rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--text-muted);
        }
      `}</style>
    </AppShell>
  );
}
