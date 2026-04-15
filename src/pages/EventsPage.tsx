import { useEffect, useMemo, useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { PageSection } from '@/components/common/PageSection';
import { ChartShell } from '@/components/common/ChartShell';
import { EventBreakdownChart } from '@/components/charts/EventBreakdownChart';
import { BreakdownDonut } from '@/components/charts/BreakdownDonut';
import { useFinance } from '@/state/FinanceContext';
import { getEvents } from '@/state/financeSelectors';
import { eventRemaining } from '@/utils/eventHelpers';
import { formatMYR, formatDate } from '@/utils/format';
import type { EventBreakdown, TripEvent } from '@/types';
import { newId } from '@/utils/id';

const BREAKDOWN_KEYS = [
  { key: 'transport', label: 'Transport' },
  { key: 'hotel', label: 'Hotel' },
  { key: 'makan', label: 'Makan' },
  { key: 'registration', label: 'Registration' },
  { key: 'shopping', label: 'Shopping' },
  { key: 'others', label: 'Others' },
] as const satisfies ReadonlyArray<{ key: keyof EventBreakdown; label: string }>;

function breakdownRows(b: TripEvent['breakdown']) {
  return BREAKDOWN_KEYS.map(({ key, label }) => ({
    name: label,
    value: b[key],
  }));
}

const emptyBreakdown = (): EventBreakdown => ({
  transport: 0,
  hotel: 0,
  makan: 0,
  registration: 0,
  shopping: 0,
  others: 0,
});

function parseMoney(v: string): number {
  const n = parseFloat(v.replace(/,/g, ''));
  return Number.isFinite(n) ? n : 0;
}

export function EventsPage() {
  const { state, dispatch } = useFinance();
  const tripEvents = useMemo(() => getEvents(state), [state.events]);
  const refDay = state.referenceDate.slice(0, 10);
  const eventsSortedByDate = useMemo(() => {
    const day = (e: TripEvent) => e.eventDate.slice(0, 10);
    const upcoming: TripEvent[] = [];
    const passed: TripEvent[] = [];
    for (const e of tripEvents) {
      (day(e) < refDay ? passed : upcoming).push(e);
    }
    const byDateAsc = (a: TripEvent, b: TripEvent) =>
      day(a).localeCompare(day(b));
    upcoming.sort(byDateAsc);
    passed.sort(byDateAsc);
    return [...upcoming, ...passed];
  }, [tripEvents, refDay]);
  const [selectedId, setSelectedId] = useState(tripEvents[0]?.id ?? '');

  useEffect(() => {
    if (eventsSortedByDate.length === 0) {
      setSelectedId('');
      return;
    }
    if (!eventsSortedByDate.some((e) => e.id === selectedId)) {
      setSelectedId(eventsSortedByDate[0].id);
    }
  }, [eventsSortedByDate, selectedId]);

  const selected = useMemo(
    () =>
      tripEvents.find((e) => e.id === selectedId) ?? eventsSortedByDate[0],
    [selectedId, tripEvents, eventsSortedByDate]
  );

  const pastEvents2026 = useMemo(() => {
    return tripEvents
      .filter((e) => {
        const d = e.eventDate.slice(0, 10);
        return d < refDay && d >= '2026-01-01' && d <= '2026-12-31';
      })
      .sort((a, b) => b.eventDate.localeCompare(a.eventDate));
  }, [tripEvents, refDay]);

  const totalPastSpending2026 = useMemo(
    () => pastEvents2026.reduce((sum, e) => sum + e.actualSpending, 0),
    [pastEvents2026]
  );

  if (!selected) {
    return (
      <AppShell title="Events">
        <PageSection title="No events yet">
          <div className="bajet-panel ev-empty">
            <button
              type="button"
              className="ev-empty__cta"
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
              Add your first event
            </button>
          </div>
        </PageSection>
        <style>{`
          .ev-empty {
            padding: 1.35rem 1.4rem 1.45rem;
            max-width: 36rem;
          }
          .ev-empty__cta {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            padding: 0.55rem 1.15rem;
            border-radius: var(--radius-pill);
            border: 1px solid var(--accent);
            background: var(--accent);
            color: #fff;
            font-size: 0.875rem;
            font-weight: 600;
            box-shadow: var(--shadow-sm);
          }
          .ev-empty__cta:hover {
            background: var(--accent-hover);
            border-color: var(--accent-hover);
          }
          .ev-empty__cta:focus-visible {
            outline: 2px solid var(--accent);
            outline-offset: 2px;
          }
          @media (max-width: 640px) {
            .ev-empty {
              padding: 1rem 1.05rem 1.1rem;
            }
            .ev-empty__cta {
              width: 100%;
              padding: 0.62rem 1rem;
            }
          }
        `}</style>
      </AppShell>
    );
  }

  const remain = eventRemaining(selected);

  return (
    <AppShell title="Events">
      <PageSection>
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
          {eventsSortedByDate.map((e) => {
            const r = eventRemaining(e);
            const active = e.id === selected.id;
            const d = e.eventDate.slice(0, 10);
            const isPassed = d < refDay;
            return (
              <div
                key={e.id}
                role="button"
                tabIndex={0}
                aria-pressed={active}
                aria-label={`${e.name}, ${formatDate(e.eventDate)}${
                  isPassed ? ', passed reference date' : ''
                }`}
                className={`ev-card ${active ? 'is-active' : ''} ${
                  isPassed ? 'is-passed' : ''
                }`}
                onClick={() => setSelectedId(e.id)}
                onKeyDown={(kev) => {
                  if (kev.key === 'Enter' || kev.key === ' ') {
                    kev.preventDefault();
                    setSelectedId(e.id);
                  }
                }}
              >
                {isPassed && (
                  <span className="ev-card__passed-badge">Passed</span>
                )}
                <div
                  className={
                    isPassed ? 'ev-card__body ev-card__body--passed' : 'ev-card__body'
                  }
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
                <span
                  className="ev-detail__num ev-detail__num--derived"
                  title="Sum of category spending (updated when you edit the table)"
                >
                  {formatMYR(selected.actualSpending)}
                </span>
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

          <div className="ev-charts">
            <ChartShell title="Spending composition" minHeight={280}>
              <BreakdownDonut data={breakdownRows(selected.breakdown)} />
            </ChartShell>
            <ChartShell title="Category breakdown" minHeight={280}>
              <EventBreakdownChart breakdown={selected.breakdown} />
            </ChartShell>
          </div>

          <div className="ev-table-wrap">
            <table className="ev-table">
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Spending</th>
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

          <div className="ev-past-panel bajet-panel">
            <div className="ev-past-panel__head">
              <h3 className="ev-past-panel__title">Past Events</h3>
              <p className="ev-past-panel__sub">
                2026 trips before your reference date ({formatDate(refDay)}).
              </p>
            </div>
            <div className="ev-past-table-wrap">
              <table className="ev-past-table">
                <thead>
                  <tr>
                    <th>Event</th>
                    <th>Date</th>
                    <th>Plan</th>
                    <th>Actual</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {pastEvents2026.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="ev-past-table__empty">
                        No past events in 2026 yet.
                      </td>
                    </tr>
                  ) : (
                    pastEvents2026.map((e) => {
                      const r = eventRemaining(e);
                      const status =
                        r < 0
                          ? 'Over budget'
                          : r > 0
                            ? 'Under budget'
                            : 'On budget';
                      const tone =
                        r < 0 ? 'is-over' : r > 0 ? 'is-under' : 'is-on';
                      return (
                        <tr key={e.id}>
                          <td className="ev-past-table__name">{e.name}</td>
                          <td>{formatDate(e.eventDate)}</td>
                          <td className="ev-past-table__num">
                            {formatMYR(e.plannedBudget)}
                          </td>
                          <td className="ev-past-table__num">
                            {formatMYR(e.actualSpending)}
                          </td>
                          <td>
                            <span
                              className={`ev-past-status ev-past-status--${tone}`}
                            >
                              {status}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
            <div className="ev-past-total" role="status">
              <span className="ev-past-total__lbl">
                Total spending events 2026
              </span>
              <span className="ev-past-total__eq">=</span>
              <span className="ev-past-total__val">
                {formatMYR(totalPastSpending2026)}
              </span>
            </div>
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
        @media (min-width: 1025px) {
          .ev-grid {
            grid-template-columns: minmax(280px, min(400px, 26vw)) minmax(0, 1fr);
            gap: clamp(1.25rem, 2vw, 1.75rem);
          }
          .ev-charts {
            gap: clamp(1rem, 1.75vw, 1.35rem);
          }
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
          position: relative;
          text-align: left;
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius);
          padding: 0.95rem 1.05rem;
          background: var(--surface);
          box-shadow: var(--shadow-card);
          cursor: pointer;
          transition: border-color 0.18s, box-shadow 0.18s, transform 0.18s,
            opacity 0.18s, filter 0.18s;
        }
        .ev-card:hover {
          border-color: #cbd5e1;
          transform: translateY(-1px);
        }
        .ev-card__body--passed {
          opacity: 0.78;
          filter: grayscale(0.38) blur(0.55px);
        }
        .ev-card.is-passed:hover .ev-card__body--passed {
          opacity: 0.88;
          filter: grayscale(0.3) blur(0.45px);
        }
        @media (prefers-reduced-motion: reduce) {
          .ev-card__body--passed,
          .ev-card.is-passed:hover .ev-card__body--passed {
            filter: grayscale(0.4);
          }
        }
        .ev-card__passed-badge {
          position: absolute;
          top: 0.5rem;
          right: 0.55rem;
          z-index: 2;
          padding: 0.2rem 0.5rem;
          border-radius: var(--radius-pill);
          font-size: 0.62rem;
          font-weight: 700;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: var(--text-secondary);
          background: rgba(255, 255, 255, 0.92);
          border: 1px solid var(--border);
          box-shadow: var(--shadow-sm);
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
        .ev-detail__num--derived {
          display: inline-block;
          font-family: var(--font-mono);
          font-size: 0.95rem;
          color: var(--text);
          padding: 0.35rem 0;
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
        .ev-past-panel {
          margin-top: 1rem;
          margin-bottom: 0;
          padding: 1.1rem 1.2rem 1.15rem;
          border-radius: var(--radius);
        }
        .ev-past-panel__head {
          margin-bottom: 0.85rem;
        }
        .ev-past-panel__title {
          margin: 0 0 0.35rem;
          font-size: 1rem;
          font-weight: 700;
          letter-spacing: -0.02em;
          color: var(--text);
        }
        .ev-past-panel__sub {
          margin: 0;
          font-size: 0.78rem;
          color: var(--text-muted);
          line-height: 1.45;
        }
        .ev-past-table-wrap {
          overflow-x: auto;
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-sm);
        }
        .ev-past-table {
          width: 100%;
          font-size: 0.8125rem;
          border-collapse: collapse;
        }
        .ev-past-table th,
        .ev-past-table td {
          padding: 0.55rem 0.75rem;
          text-align: left;
          border-bottom: 1px solid var(--border-subtle);
          vertical-align: middle;
        }
        .ev-past-table th {
          font-size: 0.65rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: var(--text-muted);
          background: var(--surface-muted);
        }
        .ev-past-table tr:last-child td {
          border-bottom: none;
        }
        .ev-past-table__name {
          font-weight: 600;
          color: var(--text);
          max-width: 11rem;
        }
        .ev-past-table__num {
          font-family: var(--font-mono);
          font-weight: 600;
          font-size: 0.78rem;
          white-space: nowrap;
        }
        .ev-past-table__empty {
          font-size: 0.8125rem;
          color: var(--text-muted);
          font-style: italic;
          padding: 0.85rem 0.75rem;
        }
        .ev-past-status {
          display: inline-block;
          padding: 0.22rem 0.55rem;
          border-radius: var(--radius-pill);
          font-size: 0.68rem;
          font-weight: 700;
          letter-spacing: 0.03em;
        }
        .ev-past-status--is-under {
          background: var(--positive-soft);
          color: var(--positive);
          border: 1px solid rgba(5, 150, 105, 0.2);
        }
        .ev-past-status--is-over {
          background: var(--negative-soft);
          color: var(--negative);
          border: 1px solid rgba(220, 38, 38, 0.15);
        }
        .ev-past-status--is-on {
          background: var(--surface-muted);
          color: var(--text-secondary);
          border: 1px solid var(--border);
        }
        .ev-past-total {
          display: flex;
          flex-wrap: wrap;
          align-items: baseline;
          justify-content: flex-end;
          gap: 0.35rem 0.6rem;
          margin-top: 1rem;
          padding-top: 0.85rem;
          border-top: 1px solid var(--border-subtle);
        }
        .ev-past-total__lbl {
          font-size: 0.8125rem;
          font-weight: 700;
          color: var(--text-secondary);
        }
        .ev-past-total__eq {
          font-size: 0.875rem;
          font-weight: 600;
          color: var(--text-muted);
        }
        .ev-past-total__val {
          font-family: var(--font-mono);
          font-size: 1.05rem;
          font-weight: 700;
          color: var(--accent-hover);
        }
        .ev-table-wrap {
          margin-top: 1.15rem;
          margin-bottom: 0;
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
        @media (max-width: 640px) {
          .ev-toolbar {
            margin-bottom: 0.75rem;
          }
          .ev-grid {
            gap: 1rem;
          }
          .ev-cards {
            gap: 0.5rem;
          }
          .ev-card {
            padding: 0.82rem 0.9rem;
            border-radius: var(--radius-sm);
          }
          .ev-card__name {
            font-size: 0.82rem;
          }
          .ev-detail {
            padding: 0.9rem 0.95rem;
            border-radius: var(--radius-sm);
          }
          .ev-detail__name {
            font-size: 0.92rem;
          }
          .ev-charts {
            gap: 0.75rem;
            margin-top: 0.9rem;
          }
          .ev-past-panel {
            padding: 0.9rem 0.85rem 1rem;
            margin-top: 0.95rem;
            margin-bottom: 0.85rem;
          }
          .ev-past-panel__title {
            font-size: 0.95rem;
          }
          .ev-past-table th,
          .ev-past-table td {
            padding: 0.45rem 0.55rem;
            font-size: 0.78rem;
          }
          .ev-past-total {
            margin-top: 0.85rem;
            padding-top: 0.75rem;
            justify-content: flex-start;
          }
          .ev-past-total__val {
            font-size: 0.98rem;
          }
          .ev-table th,
          .ev-table td {
            padding: 0.48rem 0.65rem;
            font-size: 0.8rem;
          }
        }
      `}</style>
    </AppShell>
  );
}
