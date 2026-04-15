import { useEffect, useMemo, useRef, useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { PageSection } from '@/components/common/PageSection';
import { ChartShell } from '@/components/common/ChartShell';
import { OTWeekBar } from '@/components/charts/OTWeekBar';
import { SalaryHistoryNetLine } from '@/components/charts/SalaryHistoryNetLine';
import { CHART_HEX } from '@/components/charts/chartTheme';
import { useMonth } from '@/context/MonthContext';
import { useFinance } from '@/state/FinanceContext';
import { getOTData } from '@/state/financeSelectors';
import type { SalaryPeriodState } from '@/state/appFinanceTypes';
import { formatMYR, formatDepositLong } from '@/utils/format';
import { computeOTPay } from '@/utils/otPay';
import { newId } from '@/utils/id';
import type { OTDayType } from '@/types';
import {
  addOneMonthSameDay25,
  defaultSalaryDeductions,
  emptySalaryEarnings,
  latestFinalizedPeriod,
  monthKeyFromIso,
  periodMonthLabel,
  resolveActiveForecastDeposit,
  sortPeriodsByDepositDesc,
  withComputedTotals,
} from '@/utils/salaryPeriodUtils';

function parseMoney(v: string): number {
  const n = parseFloat(v.replace(/,/g, ''));
  return Number.isFinite(n) ? n : 0;
}

/** Two-decimal string for controlled number inputs so defaults show in the field. */
function moneyInputDisplay(n: number): string {
  if (!Number.isFinite(n)) return '';
  return (Math.round(n * 100) / 100).toFixed(2);
}

const EARN_FIELDS: {
  key: keyof SalaryPeriodState['earnings'];
  label: string;
}[] = [
  { key: 'basic', label: 'Basic' },
  { key: 'ot', label: 'OT' },
  { key: 'ioeAllowance', label: 'IOE allowance' },
  { key: 'medicalClaim', label: 'Medical claim' },
  { key: 'miscClaim', label: 'Misc claim' },
  { key: 'petrolClaim', label: 'Petrol claim' },
];

const DED_FIELDS: {
  key: keyof SalaryPeriodState['deductions'];
  label: string;
}[] = [
  { key: 'kwsp', label: 'KWSP' },
  { key: 'ies', label: 'EIS' },
  { key: 'socso', label: 'SOCSO' },
  { key: 'hostel', label: 'Hostel' },
  { key: 'lateIn', label: 'Late in' },
];

function formatSignedMyr(n: number): string {
  if (n === 0) return formatMYR(0);
  if (n < 0) return `-${formatMYR(Math.abs(n))}`;
  return `+${formatMYR(n)}`;
}

type BreakdownPanelProps = {
  title: string;
  badge: string;
  depositIso: string;
  period: SalaryPeriodState | null;
  computed: ReturnType<typeof withComputedTotals> | null;
  readOnly: boolean;
  /** Primary = main forecast workspace; reference = supporting last-paid panel */
  variant: 'primary' | 'reference';
  onPatch?: (
    patch: {
      earnings?: Partial<SalaryPeriodState['earnings']>;
      deductions?: Partial<SalaryPeriodState['deductions']>;
    }
  ) => void;
  /** Earning lines that are display-only (e.g. OT synced from sessions). */
  readOnlyEarningKeys?: (keyof SalaryPeriodState['earnings'])[];
};

function BreakdownPanel({
  title,
  badge,
  depositIso,
  period,
  computed,
  readOnly,
  variant,
  onPatch,
  readOnlyEarningKeys = [],
}: BreakdownPanelProps) {
  const isPrimary = variant === 'primary';

  if (!period || !computed) {
    return (
      <div
        className={`sal-panel sal-panel--empty ${
          isPrimary ? 'sal-panel--primary' : 'sal-panel--reference'
        }`}
      >
        <div className="sal-panel__head">
          <h2 className="sal-panel__title">{title}</h2>
          <span className="sal-badge sal-badge--muted">{badge}</span>
        </div>
        <p className="sal-panel__empty">
          {isPrimary
            ? 'A forecast row will appear for the next payroll deposit (25th). Enter earnings and deductions in the breakdown when you are ready.'
            : 'No finalized salary in history yet. Finalize a forecast to see it here.'}
        </p>
      </div>
    );
  }

  const e = period.earnings;
  const d = period.deductions;

  return (
    <div
      className={`sal-panel ${readOnly ? 'sal-panel--readonly' : ''} ${
        isPrimary ? 'sal-panel--primary' : 'sal-panel--reference'
      }`}
    >
      <div className="sal-panel__head">
        <div className="sal-panel__head-text">
          {isPrimary && (
            <p className="sal-panel__eyebrow">Active workspace</p>
          )}
          <h2 className="sal-panel__title">{title}</h2>
          <p className="sal-panel__meta">
            <span className="sal-panel__meta-deposit">
              {formatDepositLong(depositIso)}
            </span>
            <span className="sal-panel__meta-dot" aria-hidden>
              ·
            </span>
            <span>{period.label}</span>
          </p>
        </div>
        <span
          className={`sal-badge ${
            period.status === 'finalized'
              ? 'sal-badge--done'
              : 'sal-badge--forecast'
          }`}
        >
          {period.status === 'finalized' ? 'Finalized' : 'Forecast'}
        </span>
      </div>

      <div className="sal-groups">
        <div className="sal-group">
          <h3 className="sal-group__title">Earnings</h3>
          <ul className="sal-lines">
            {EARN_FIELDS.map(({ key, label }) => {
              const earnRo =
                readOnly ||
                !onPatch ||
                readOnlyEarningKeys.includes(key);
              return (
                <li key={key} className="sal-line">
                  <div className="sal-line__label-wrap">
                    <span className="sal-line__label">{label}</span>
                    {key === 'ot' && readOnlyEarningKeys.includes('ot') && (
                      <span className="sal-line__hint">From OT sessions</span>
                    )}
                  </div>
                  {earnRo ? (
                    <span className="sal-line__val">{formatMYR(e[key])}</span>
                  ) : (
                    <input
                      className="fld-num sal-line__input"
                      type="number"
                      step="0.01"
                      inputMode="decimal"
                      value={moneyInputDisplay(e[key])}
                      onChange={(ev) =>
                        onPatch({
                          earnings: { [key]: parseMoney(ev.target.value) },
                        })
                      }
                    />
                  )}
                </li>
              );
            })}
          </ul>
        </div>
        <div className="sal-group">
          <h3 className="sal-group__title">Deductions</h3>
          <ul className="sal-lines">
            {DED_FIELDS.map(({ key, label }) => {
              const dedRo = readOnly || !onPatch;
              return (
                <li key={key} className="sal-line">
                  <div className="sal-line__label-wrap">
                    <span className="sal-line__label">{label}</span>
                  </div>
                  {dedRo ? (
                    <span className="sal-line__val">{formatMYR(d[key])}</span>
                  ) : (
                    <input
                      className="fld-num sal-line__input"
                      type="number"
                      step="0.01"
                      inputMode="decimal"
                      value={moneyInputDisplay(d[key])}
                      onChange={(ev) =>
                        onPatch({
                          deductions: { [key]: parseMoney(ev.target.value) },
                        })
                      }
                    />
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      <div className="sal-totals-band">
        <div className="sal-totals-band__secondary">
          <div className="sal-total-chip">
            <span className="sal-total-chip__lbl">Gross salary</span>
            <span className="sal-total-chip__val">
              {formatMYR(computed.grossSalary)}
            </span>
          </div>
          <div className="sal-total-chip sal-total-chip--deduct">
            <span className="sal-total-chip__lbl">Total deductions</span>
            <span className="sal-total-chip__val">
              {formatMYR(computed.totalDeductions)}
            </span>
          </div>
        </div>
        <div className="sal-total-net">
          <span className="sal-total-net__lbl">Net salary</span>
          <span className="sal-total-net__val">
            {formatMYR(computed.netSalary)}
          </span>
        </div>
      </div>
    </div>
  );
}

export function IncomeOTPage() {
  const { month, monthLabel, setMonth, options } = useMonth();
  const { state, dispatch } = useFinance();
  const periods = state.salaryPeriods;
  const [otHistoryMonth, setOtHistoryMonth] = useState(month);

  const activeForecastDep = useMemo(
    () => resolveActiveForecastDeposit(periods),
    [periods]
  );

  const forecastMonthKey = monthKeyFromIso(activeForecastDep);

  useEffect(() => {
    const target = resolveActiveForecastDeposit(state.salaryPeriods);
    const exists = state.salaryPeriods.some((p) => p.depositDate === target);
    if (exists) return;

    const newPeriod: SalaryPeriodState = {
      id: newId('salary'),
      label: periodMonthLabel(target),
      depositDate: target,
      status: 'forecast',
      earnings: emptySalaryEarnings(),
      deductions: defaultSalaryDeductions(0),
    };

    dispatch({ type: 'salary/period/add', period: newPeriod });
  }, [state.salaryPeriods, dispatch]);

  const forecastPeriodRaw = periods.find(
    (p) => p.depositDate === activeForecastDep
  );
  const forecastPeriod = forecastPeriodRaw
    ? withComputedTotals(forecastPeriodRaw)
    : null;

  const forecastDeductionDefaultsSeededRef = useRef(new Set<string>());

  /** Backfill deduction defaults for legacy forecast rows (zeros) so inputs show amounts. */
  useEffect(() => {
    const p = forecastPeriodRaw;
    if (!p || p.status !== 'forecast') return;
    const d = p.deductions;
    const allZero =
      d.kwsp === 0 &&
      d.ies === 0 &&
      d.socso === 0 &&
      d.hostel === 0 &&
      d.lateIn === 0;
    if (!allZero) {
      forecastDeductionDefaultsSeededRef.current.add(p.id);
      return;
    }
    if (forecastDeductionDefaultsSeededRef.current.has(p.id)) return;
    forecastDeductionDefaultsSeededRef.current.add(p.id);
    dispatch({
      type: 'salary/period/patch',
      id: p.id,
      patch: { deductions: defaultSalaryDeductions(p.earnings.basic) },
    });
  }, [
    dispatch,
    forecastPeriodRaw?.id,
    forecastPeriodRaw?.status,
    forecastPeriodRaw?.earnings.basic,
    forecastPeriodRaw?.deductions.kwsp,
    forecastPeriodRaw?.deductions.ies,
    forecastPeriodRaw?.deductions.socso,
    forecastPeriodRaw?.deductions.hostel,
    forecastPeriodRaw?.deductions.lateIn,
  ]);

  /** Keep forecast OT in sync with calculated total for the forecast payroll month. */
  useEffect(() => {
    if (!forecastPeriodRaw || forecastPeriodRaw.status !== 'forecast') return;
    const ot = getOTData(state, forecastMonthKey);
    const next = Math.round(ot.otCashTotal * 100) / 100;
    if (forecastPeriodRaw.earnings.ot === next) return;
    dispatch({
      type: 'salary/period/patch',
      id: forecastPeriodRaw.id,
      patch: { earnings: { ot: next } },
    });
  }, [
    dispatch,
    forecastMonthKey,
    forecastPeriodRaw?.id,
    forecastPeriodRaw?.status,
    forecastPeriodRaw?.earnings.ot,
    state.monthData,
  ]);

  const lastPaid = latestFinalizedPeriod(periods);
  const lastPaidRaw = lastPaid
    ? periods.find((p) => p.id === lastPaid.id) ?? null
    : null;

  const historyRows = sortPeriodsByDepositDesc(periods);

  const salaryHistoryChartPoints = useMemo(() => {
    const sorted = [...periods].sort(
      (a, b) =>
        new Date(a.depositDate).getTime() - new Date(b.depositDate).getTime()
    );
    return sorted.map((p) => {
      const c = withComputedTotals(p);
      const [y, m] = p.depositDate.split('-').map(Number);
      const shortLabel =
        y && m
          ? new Intl.DateTimeFormat('en-MY', {
              month: 'short',
              year: '2-digit',
            }).format(new Date(y, m - 1, 25))
          : p.depositDate.slice(0, 7);
      return {
        shortLabel,
        fullLabel: `${p.label} · ${formatDepositLong(p.depositDate)}`,
        netSalary: c.netSalary,
        status: p.status,
      };
    });
  }, [periods]);

  const diffVsLast =
    lastPaid && forecastPeriod
      ? forecastPeriod.netSalary - lastPaid.netSalary
      : null;

  const {
    otEntries,
    monthlySalary,
    otCashTotal,
    otHourlyBasic,
  } = getOTData(state, month);

  const otHistoryData = getOTData(state, otHistoryMonth);

  const monthMismatch = month !== forecastMonthKey;

  const patchForecast = (patch: {
    earnings?: Partial<SalaryPeriodState['earnings']>;
    deductions?: Partial<SalaryPeriodState['deductions']>;
  }) => {
    if (!forecastPeriodRaw) return;
    dispatch({
      type: 'salary/period/patch',
      id: forecastPeriodRaw.id,
      patch,
    });
  };

  const finalizeForecast = () => {
    if (!forecastPeriodRaw || forecastPeriodRaw.status !== 'forecast') return;
    dispatch({ type: 'salary/period/finalize', id: forecastPeriodRaw.id });
  };

  const copyLastToNextCycle = () => {
    if (!lastPaidRaw) return;
    const nextDep = addOneMonthSameDay25(lastPaidRaw.depositDate);
    dispatch({
      type: 'salary/period/duplicateToNextDeposit',
      fromId: lastPaidRaw.id,
      nextDepositDate: nextDep,
      nextLabel: periodMonthLabel(nextDep),
    });
  };

  return (
    <AppShell title="Salary & OT">
      <section
        className="sal-top"
        aria-label="Salary forecast, last paid, OT and salary history"
      >
        <div className="sal-top-main-row">
          <div className="sal-top-col sal-top-col--forecast">
            <p className="sal-col-label sal-col-label--primary">
              Salary forecast
            </p>
            <div className="sal-forecast-strip" aria-live="polite">
              <div className="sal-forecast-strip__item sal-forecast-strip__item--hero">
                <span className="sal-forecast-strip__lbl">Expected net</span>
                <span className="sal-forecast-strip__val">
                  {forecastPeriod ? formatMYR(forecastPeriod.netSalary) : '—'}
                </span>
              </div>
              <div className="sal-forecast-strip__item">
                <span className="sal-forecast-strip__lbl">Next deposit</span>
                <span className="sal-forecast-strip__sub">
                  {formatDepositLong(activeForecastDep)}
                </span>
              </div>
              <div className="sal-forecast-strip__item">
                <span className="sal-forecast-strip__lbl">Vs last paid</span>
                <span
                  className={`sal-forecast-strip__sub ${
                    diffVsLast !== null && diffVsLast < 0
                      ? 'is-neg'
                      : diffVsLast !== null && diffVsLast > 0
                        ? 'is-pos'
                        : ''
                  }`}
                >
                  {diffVsLast !== null ? formatSignedMyr(diffVsLast) : '—'}
                </span>
              </div>
            </div>
            <BreakdownPanel
              title="Next salary forecast"
              badge="Edit breakdown"
              depositIso={activeForecastDep}
              period={forecastPeriodRaw ?? null}
              computed={forecastPeriod}
              readOnly={false}
              variant="primary"
              readOnlyEarningKeys={
                forecastPeriodRaw?.status === 'forecast' ? ['ot'] : []
              }
              onPatch={patchForecast}
            />
            {forecastPeriodRaw?.status === 'forecast' && (
              <div className="sal-actions sal-actions--primary">
                <button
                  type="button"
                  className="btn-row sal-btn-primary"
                  onClick={finalizeForecast}
                >
                  Mark as paid (finalize)
                </button>
                <p className="sal-actions__hint">
                  Locks this run as historical. The next open forecast follows the
                  25th calendar rule.
                </p>
              </div>
            )}
          </div>

          <aside
            className="sal-top-col sal-top-col--history"
            aria-label="OT history, salary trend, last paid"
          >
            <div className="sal-history-side-col">
              <div className="sal-history-chart-slot">
                <p className="sal-col-label sal-col-label--history">OT history</p>
                <div className="sal-ot-history-card">
                  <div className="sal-ot-history-head">
                    <label
                      className="sal-ot-history-head__lbl"
                      htmlFor="sal-ot-history-month"
                    >
                      Month
                    </label>
                    <select
                      id="sal-ot-history-month"
                      className="fld-input sal-ot-history-select"
                      value={otHistoryMonth}
                      onChange={(e) =>
                        setOtHistoryMonth(e.target.value as typeof month)
                      }
                    >
                      {options.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="sal-ot-history-stats">
                    <span className="sal-ot-history-stats__sessions">
                      {otHistoryData.otEntries.length} session
                      {otHistoryData.otEntries.length !== 1 ? 's' : ''}
                    </span>
                    <span className="sal-ot-history-stats__total">
                      {formatMYR(otHistoryData.otCashTotal)} OT
                    </span>
                  </div>
                  <div className="sal-ot-chart-wrap">
                    <ChartShell title="OT by week" minHeight={220}>
                      <OTWeekBar data={otHistoryData.otByWeek} />
                    </ChartShell>
                  </div>
                </div>
              </div>
              <div className="sal-history-chart-slot">
                <p className="sal-col-label sal-col-label--salary-graph">
                  Salary history
                </p>
                <div className="sal-salary-history-card">
                  {salaryHistoryChartPoints.length === 0 ? (
                    <p className="sal-salary-history-empty">
                      No salary periods yet.
                    </p>
                  ) : (
                    <>
                      <p className="sal-salary-history-hint">
                        <span className="sal-salary-history-legend-item">
                          <span
                            className="sal-salary-history-swatch"
                            style={{ backgroundColor: CHART_HEX[0] }}
                            aria-hidden
                          />
                          Finalized
                        </span>
                        <span className="sal-salary-history-hint__sep" aria-hidden>
                          ·
                        </span>
                        <span className="sal-salary-history-legend-item">
                          <span
                            className="sal-salary-history-swatch"
                            style={{ backgroundColor: CHART_HEX[4] }}
                            aria-hidden
                          />
                          Forecast
                        </span>
                      </p>
                      <div className="sal-salary-chart-wrap">
                        <ChartShell title="Net by deposit" minHeight={220}>
                          <SalaryHistoryNetLine
                            data={salaryHistoryChartPoints}
                          />
                        </ChartShell>
                      </div>
                    </>
                  )}
                </div>
              </div>
              <div className="sal-history-chart-slot">
                <p className="sal-col-label sal-col-label--last-paid">
                  Last salary paid
                </p>
                <div className="sal-last-mini sal-last-mini--top-row">
                  {lastPaid ? (
                    <>
                      <p className="sal-last-mini__net">{formatMYR(lastPaid.netSalary)}</p>
                      <p className="sal-last-mini__date">
                        {formatDepositLong(lastPaid.depositDate)}
                      </p>
                      <p className="sal-last-mini__meta">
                        Gross {formatMYR(lastPaid.grossSalary)} · Ded{' '}
                        {formatMYR(lastPaid.totalDeductions)}
                      </p>
                      {lastPaidRaw && (
                        <button
                          type="button"
                          className="btn-row sal-last-mini__btn"
                          onClick={copyLastToNextCycle}
                        >
                          Copy to next deposit
                        </button>
                      )}
                    </>
                  ) : (
                    <p className="sal-last-mini__empty">
                      No finalized run yet. Finalize a forecast to see it here.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </aside>
        </div>
      </section>

      <div className="sal-bottom">
        {monthMismatch && (
          <div className="sal-banner" role="status">
            Working month is <strong>{monthLabel}</strong>; forecast OT uses{' '}
            <strong>{forecastMonthKey}</strong>. Switch below or:{' '}
            {options.map((o, i) => (
              <span key={o.value}>
                {i > 0 ? ' · ' : ''}
                <button
                  type="button"
                  className="sal-banner__link"
                  onClick={() => setMonth(o.value)}
                >
                  {o.label}
                </button>
              </span>
            ))}
            .
          </div>
        )}

        <PageSection title="Basic pay & OT sessions">
        <div className="sal-work-month-bar">
          <label
            className="sal-work-month-bar__lbl"
            htmlFor="sal-work-month"
          >
            Month for sessions & rates
          </label>
          <select
            id="sal-work-month"
            className="fld-input sal-work-month-bar__select"
            value={month}
            onChange={(e) => setMonth(e.target.value as typeof month)}
          >
            {options.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <div className="sal-mini-grid">
          <div className="sal-field">
            <label className="sal-field__lbl">Monthly basic (sheet)</label>
            <input
              className="fld-num sal-field__input"
              type="number"
              step="0.01"
              value={monthlySalary}
              onChange={(e) =>
                dispatch({
                  type: 'income/setSalary',
                  monthKey: month,
                  salary: parseMoney(e.target.value),
                })
              }
            />
          </div>
          <div className="sal-field">
            <label className="sal-field__lbl">Basic hourly (OT)</label>
            <input
              className="fld-num sal-field__input"
              type="number"
              step="0.01"
              min={0}
              value={otHourlyBasic}
              onChange={(e) =>
                dispatch({
                  type: 'income/setOtHourlyBasic',
                  monthKey: month,
                  hourlyBasic: parseMoney(e.target.value),
                })
              }
            />
            <p className="sal-field__hint">
              Default from monthly ÷ 26 ÷ 8. Regular OT is 1.5× this rate (
              {formatMYR(computeOTPay(1, 'regular', otHourlyBasic))}/h).
            </p>
          </div>
          <div className="sal-field sal-field--stat">
            <span className="sal-field__lbl">OT total (this month)</span>
            <span className="sal-field__emph">{formatMYR(otCashTotal)}</span>
          </div>
        </div>
      </PageSection>

      <PageSection title="OT sessions">
        <div className="sal-table-wrap">
          <div className="sal-table-head">
            <h3 className="sal-table__title">Sessions · {monthLabel}</h3>
            <button
              type="button"
              className="btn-row"
              onClick={() =>
                dispatch({
                  type: 'ot/add',
                  monthKey: month,
                  entry: {
                    id: newId('ot'),
                    date: `${month}-15`,
                    hours: 0,
                    description: '',
                    dayType: 'regular',
                  },
                })
              }
            >
              Add session
            </button>
          </div>
          <div className="sal-table-scroll">
            <table className="sal-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Day type</th>
                  <th>Description</th>
                  <th>Hours</th>
                  <th>Amount</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {otEntries.map((o) => (
                  <tr key={o.id}>
                    <td>
                      <input
                        className="fld-input"
                        type="date"
                        value={
                          o.date.length >= 10 ? o.date.slice(0, 10) : o.date
                        }
                        onChange={(e) =>
                          dispatch({
                            type: 'ot/update',
                            monthKey: month,
                            id: o.id,
                            patch: { date: e.target.value },
                          })
                        }
                      />
                    </td>
                    <td>
                      <select
                        className="fld-input sal-table__select"
                        value={o.dayType}
                        onChange={(e) =>
                          dispatch({
                            type: 'ot/update',
                            monthKey: month,
                            id: o.id,
                            patch: {
                              dayType: e.target.value as OTDayType,
                            },
                          })
                        }
                      >
                        <option value="regular">Regular (×1.5)</option>
                        <option value="public">Public (8h×2, rest×3)</option>
                      </select>
                    </td>
                    <td>
                      <input
                        className="fld-input"
                        value={o.description}
                        onChange={(e) =>
                          dispatch({
                            type: 'ot/update',
                            monthKey: month,
                            id: o.id,
                            patch: { description: e.target.value },
                          })
                        }
                      />
                    </td>
                    <td>
                      <input
                        className="fld-num"
                        type="number"
                        step="0.01"
                        value={o.hours}
                        onChange={(e) =>
                          dispatch({
                            type: 'ot/update',
                            monthKey: month,
                            id: o.id,
                            patch: { hours: parseMoney(e.target.value) },
                          })
                        }
                      />
                    </td>
                    <td className="sal-table__strong">
                      {formatMYR(
                        computeOTPay(o.hours, o.dayType, otHourlyBasic)
                      )}
                    </td>
                    <td>
                      <button
                        type="button"
                        className="btn-row danger"
                        onClick={() =>
                          dispatch({
                            type: 'ot/remove',
                            monthKey: month,
                            id: o.id,
                          })
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
        </div>
      </PageSection>
      </div>

      <PageSection title="Salary history">
        <div className="sal-history">
          {historyRows.length === 0 ? (
            <p className="sal-history__empty">No salary periods yet.</p>
          ) : (
            <div className="sal-history-scroll">
              <table className="sal-history-table">
                <thead>
                  <tr>
                    <th>Period</th>
                    <th>Deposit</th>
                    <th>Gross</th>
                    <th>Deductions</th>
                    <th>Net</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {historyRows.map((row) => (
                    <tr key={row.id}>
                      <td>
                        <span className="sal-history__label">{row.label}</span>
                      </td>
                      <td>{formatDepositLong(row.depositDate)}</td>
                      <td className="sal-num">{formatMYR(row.grossSalary)}</td>
                      <td className="sal-num">
                        {formatMYR(row.totalDeductions)}
                      </td>
                      <td className="sal-num sal-num--strong">
                        {formatMYR(row.netSalary)}
                      </td>
                      <td>
                        <span
                          className={
                            row.status === 'finalized'
                              ? 'sal-pill sal-pill--done'
                              : 'sal-pill sal-pill--forecast'
                          }
                        >
                          {row.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </PageSection>

      <style>{`
        /* —— Top: forecast | OT + salary chart + last paid (flex, min-width 0) —— */
        .sal-top {
          margin-bottom: 1.5rem;
          width: 100%;
          max-width: 100%;
          box-sizing: border-box;
        }
        .sal-top-main-row {
          display: flex;
          flex-direction: row;
          flex-wrap: nowrap;
          align-items: flex-start;
          gap: 1.25rem;
          width: 100%;
          max-width: 100%;
          min-width: 0;
          box-sizing: border-box;
        }
        .sal-top-col {
          display: flex;
          flex-direction: column;
          gap: 0;
          min-width: 0;
          box-sizing: border-box;
        }
        .sal-top-col--forecast {
          flex: 1 1 0;
          min-width: 0;
          max-width: 100%;
          overflow-x: auto;
        }
        .sal-top-col--history {
          flex: 0 0 23rem;
          width: 23rem;
          min-width: 0;
          max-width: min(100%, 23rem);
          position: sticky;
          top: 0.5rem;
          align-self: flex-start;
        }
        .sal-history-side-col {
          display: flex;
          flex-direction: column;
          align-items: stretch;
          gap: 1rem;
          width: 100%;
          min-width: 0;
        }
        .sal-history-chart-slot {
          flex: 0 0 auto;
          min-width: 0;
          max-width: 100%;
          width: 100%;
          display: flex;
          flex-direction: column;
        }
        .sal-history-chart-slot .sal-col-label {
          margin-bottom: 0.5rem;
        }
        .sal-top-col--history .sal-ot-chart-wrap .chart-shell__body,
        .sal-top-col--history .sal-salary-chart-wrap .chart-shell__body {
          min-height: 168px !important;
          height: 168px !important;
        }
        @media (max-width: 1100px) {
          .sal-top-main-row {
            flex-direction: column;
            flex-wrap: wrap;
          }
          .sal-top-col--history {
            flex: 1 1 auto;
            width: 100%;
            max-width: 100%;
            position: static;
          }
          .sal-history-side-col {
            flex-direction: row;
            flex-wrap: wrap;
          }
          .sal-history-chart-slot {
            flex: 1 1 16rem;
          }
          .sal-top-col--history .sal-ot-chart-wrap .chart-shell__body,
          .sal-top-col--history .sal-salary-chart-wrap .chart-shell__body {
            min-height: 200px !important;
            height: 200px !important;
          }
        }

        .sal-col-label {
          margin: 0 0 0.5rem;
          font-size: 0.625rem;
          font-weight: 800;
          letter-spacing: 0.14em;
          text-transform: uppercase;
        }
        .sal-col-label--primary {
          color: #4338ca;
        }
        .sal-col-label--history {
          color: #0f766e;
        }
        .sal-col-label--salary-graph {
          color: #4338ca;
        }
        .sal-col-label--last-paid {
          color: var(--text-muted);
        }

        .sal-salary-history-card {
          background: var(--surface);
          border: 1px solid rgba(67, 56, 202, 0.2);
          border-radius: calc(var(--radius) + 4px);
          padding: 1rem 1.05rem 0.85rem;
          box-shadow: 0 12px 32px -22px rgba(15, 23, 42, 0.18);
          display: flex;
          flex-direction: column;
          flex: 1;
          min-width: 0;
          max-width: 100%;
          box-sizing: border-box;
        }
        .sal-salary-history-hint {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 0.35rem 0.5rem;
          margin: 0 0 0.65rem;
          font-size: 0.6875rem;
          font-weight: 600;
          color: var(--text-muted);
          letter-spacing: 0.02em;
        }
        .sal-salary-history-legend-item {
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
        }
        .sal-salary-history-swatch {
          width: 0.55rem;
          height: 0.55rem;
          border-radius: 50%;
          flex-shrink: 0;
          box-shadow: 0 0 0 1px rgba(15, 23, 42, 0.12);
        }
        .sal-salary-history-hint__sep {
          color: var(--text-subtle);
          font-weight: 500;
        }
        .sal-salary-history-empty {
          margin: 0;
          padding: 2rem 0.5rem;
          text-align: center;
          font-size: 0.875rem;
          color: var(--text-muted);
          line-height: 1.5;
        }
        .sal-salary-chart-wrap {
          flex: 0 0 auto;
          min-width: 0;
          max-width: 100%;
          overflow: hidden;
        }
        .sal-salary-chart-wrap .chart-shell {
          margin: 0;
          max-width: 100%;
          box-sizing: border-box;
        }
        .sal-salary-chart-wrap .chart-shell__body {
          min-height: 200px !important;
          height: 200px !important;
          max-width: 100% !important;
        }

        .sal-last-mini {
          background: var(--surface);
          border: 1px solid var(--border-subtle);
          border-radius: calc(var(--radius) + 2px);
          padding: 0.95rem 1rem 1.05rem;
          box-shadow: var(--shadow-card);
          min-width: 0;
          max-width: 100%;
          box-sizing: border-box;
        }
        .sal-last-mini--top-row {
          flex: 1;
          display: flex;
          flex-direction: column;
        }
        .sal-last-mini--top-row .sal-last-mini__net,
        .sal-last-mini--top-row .sal-last-mini__empty {
          margin-top: 0;
        }
        .sal-last-mini__eyebrow {
          margin: 0;
          font-size: 0.6rem;
          font-weight: 800;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--text-muted);
        }
        .sal-last-mini__net {
          margin: 0.5rem 0 0;
          font-family: var(--font-mono);
          font-size: 1.3rem;
          font-weight: 800;
          font-variant-numeric: tabular-nums;
          letter-spacing: -0.03em;
          line-height: 1.15;
          color: var(--text);
        }
        .sal-last-mini__date {
          margin: 0.3rem 0 0;
          font-size: 0.8125rem;
          color: var(--text-muted);
          font-weight: 600;
        }
        .sal-last-mini__meta {
          margin: 0.6rem 0 0;
          font-size: 0.6875rem;
          line-height: 1.45;
          color: var(--text-subtle);
          word-break: break-word;
        }
        .sal-last-mini__btn {
          margin-top: 0.8rem;
          width: 100%;
          justify-content: center;
          font-size: 0.8125rem !important;
          padding: 0.45rem 0.65rem !important;
        }
        .sal-last-mini__empty {
          margin: 0.55rem 0 0;
          font-size: 0.8125rem;
          color: var(--text-muted);
          line-height: 1.5;
        }

        .sal-forecast-strip {
          display: flex;
          flex-wrap: wrap;
          gap: 0.75rem 1.25rem;
          align-items: flex-end;
          padding: 0.85rem 1rem;
          margin-bottom: 0.85rem;
          border-radius: calc(var(--radius) + 2px);
          border: 1px solid rgba(99, 102, 241, 0.15);
          background: linear-gradient(
            120deg,
            rgba(79, 70, 229, 0.06),
            rgba(248, 250, 252, 0.9)
          );
          min-width: 0;
          max-width: 100%;
          box-sizing: border-box;
        }
        .sal-forecast-strip__item {
          display: flex;
          flex-direction: column;
          gap: 0.2rem;
          min-width: 5.5rem;
        }
        .sal-forecast-strip__item--hero {
          flex: 1;
          min-width: 8rem;
        }
        .sal-forecast-strip__lbl {
          font-size: 0.6rem;
          font-weight: 800;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--text-muted);
        }
        .sal-forecast-strip__val {
          font-family: var(--font-mono);
          font-size: clamp(1.35rem, 2.8vw, 1.85rem);
          font-weight: 800;
          font-variant-numeric: tabular-nums;
          letter-spacing: -0.03em;
          line-height: 1.1;
        }
        .sal-forecast-strip__sub {
          font-size: 0.875rem;
          font-weight: 600;
          font-family: var(--font-mono);
          font-variant-numeric: tabular-nums;
          color: var(--text);
        }
        .sal-forecast-strip__sub.is-pos {
          color: var(--positive);
        }
        .sal-forecast-strip__sub.is-neg {
          color: var(--negative);
        }

        .sal-ot-history-card {
          background: var(--surface);
          border: 1px solid rgba(13, 148, 136, 0.18);
          border-radius: calc(var(--radius) + 4px);
          padding: 1rem 1.05rem 0.85rem;
          box-shadow: 0 12px 32px -22px rgba(15, 23, 42, 0.18);
          display: flex;
          flex-direction: column;
          min-width: 0;
          max-width: 100%;
          box-sizing: border-box;
        }
        .sal-ot-history-head {
          display: flex;
          flex-direction: column;
          gap: 0.35rem;
          margin-bottom: 0.65rem;
        }
        .sal-ot-history-head__lbl {
          font-size: 0.65rem;
          font-weight: 800;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--text-muted);
        }
        .sal-ot-history-select {
          width: 100%;
          font-weight: 600;
        }
        .sal-ot-history-stats {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 0.75rem;
          flex-wrap: wrap;
          margin-bottom: 0.65rem;
          font-size: 0.8125rem;
          color: var(--text-muted);
        }
        .sal-ot-history-stats__total {
          font-family: var(--font-mono);
          font-weight: 700;
          font-variant-numeric: tabular-nums;
          color: var(--text);
        }
        .sal-ot-chart-wrap {
          flex: 0 0 auto;
          min-width: 0;
          max-width: 100%;
          overflow: hidden;
        }
        .sal-ot-chart-wrap .chart-shell {
          margin: 0;
          max-width: 100%;
          box-sizing: border-box;
        }
        .sal-ot-chart-wrap .chart-shell__body {
          min-height: 200px !important;
          height: 200px !important;
          max-width: 100% !important;
        }

        /* —— Bottom inputs —— */
        .sal-bottom {
          display: flex;
          flex-direction: column;
          gap: 0;
          margin-bottom: 0;
        }
        .sal-bottom .sal-banner {
          margin-bottom: 1rem;
        }
        .sal-bottom .bajet-section {
          gap: 0.65rem;
        }
        .sal-bottom .bajet-section__head {
          margin-bottom: 0;
          padding-bottom: 0.2rem;
        }
        .sal-bottom .bajet-section__title {
          font-size: 0.9375rem;
          font-weight: 700;
        }
        .sal-work-month-bar {
          display: flex;
          flex-direction: column;
          gap: 0.4rem;
          margin-bottom: 1.25rem;
          padding: 1rem 1.1rem;
          border-radius: var(--radius);
          border: 1px solid var(--border-subtle);
          background: rgba(15, 23, 42, 0.02);
        }
        .sal-work-month-bar__lbl {
          font-size: 0.65rem;
          font-weight: 800;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--text-muted);
        }
        .sal-work-month-bar__select {
          max-width: 20rem;
          font-weight: 600;
        }
        @media (max-width: 520px) {
          .sal-work-month-bar__select {
            max-width: none;
          }
        }

        .sal-line__label-wrap {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 0.15rem;
          min-width: 0;
          max-width: 100%;
          padding-right: 0.25rem;
        }
        .sal-line__hint {
          font-size: 0.625rem;
          font-weight: 600;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          color: var(--accent);
          opacity: 0.85;
        }

        /* —— Panels —— */
        .sal-panel {
          border-radius: calc(var(--radius) + 6px);
          padding: 1.5rem 1.55rem 1.45rem;
          border: 1px solid var(--border-subtle);
          min-width: 0;
          max-width: 100%;
          box-sizing: border-box;
        }
        .sal-panel--primary {
          background: linear-gradient(
            180deg,
            rgba(255, 255, 255, 0.99) 0%,
            var(--surface) 55%,
            rgba(248, 250, 252, 1) 100%
          );
          box-shadow:
            0 1px 0 rgba(255, 255, 255, 0.8) inset,
            0 24px 48px -32px rgba(79, 70, 229, 0.2),
            0 12px 28px -18px rgba(15, 23, 42, 0.12);
          border-color: rgba(99, 102, 241, 0.18);
          padding: 1.3rem 1.05rem 1.25rem;
        }
        .sal-panel--reference {
          background: var(--surface);
          padding: 1.15rem 1.2rem 1.2rem;
          border-radius: calc(var(--radius) + 2px);
          box-shadow: 0 8px 24px -20px rgba(15, 23, 42, 0.2);
          border-color: var(--border-subtle);
        }
        .sal-panel--reference .sal-panel__title {
          font-size: 1rem;
        }
        .sal-panel--reference .sal-group {
          padding: 0.75rem 0.85rem;
        }
        .sal-panel--reference .sal-line {
          padding: 0.4rem 0;
          font-size: 0.8125rem;
        }
        .sal-panel--readonly.sal-panel--reference {
          opacity: 1;
          background: rgba(248, 250, 252, 0.65);
        }

        .sal-panel--empty {
          min-height: 11rem;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }
        .sal-panel--empty.sal-panel--reference {
          min-height: 9rem;
        }

        .sal-panel__head {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 0.75rem 1rem;
          margin-bottom: 1.35rem;
          flex-wrap: wrap;
        }
        .sal-panel__head-text {
          flex: 1 1 12rem;
          min-width: 0;
          max-width: 100%;
        }
        .sal-panel__eyebrow {
          margin: 0 0 0.35rem;
          font-size: 0.625rem;
          font-weight: 800;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: #4f46e5;
        }
        .sal-panel__title {
          margin: 0;
          font-size: 1.2rem;
          font-weight: 800;
          letter-spacing: -0.03em;
          line-height: 1.2;
        }
        .sal-panel--reference .sal-panel__eyebrow {
          display: none;
        }
        .sal-panel__meta {
          margin: 0.45rem 0 0;
          font-size: 0.8125rem;
          color: var(--text-muted);
          line-height: 1.4;
        }
        .sal-panel__meta-deposit {
          font-weight: 600;
          color: var(--text);
        }
        .sal-panel__meta-dot {
          margin: 0 0.35rem;
          opacity: 0.45;
        }
        .sal-panel__empty {
          margin: 0;
          font-size: 0.875rem;
          color: var(--text-subtle);
          line-height: 1.55;
          max-width: 36rem;
        }

        .sal-badge {
          font-size: 0.625rem;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          padding: 0.4rem 0.75rem;
          border-radius: 999px;
          border: 1px solid var(--border-subtle);
          white-space: nowrap;
          flex-shrink: 0;
        }
        .sal-badge--forecast {
          background: rgba(79, 70, 229, 0.12);
          color: #3730a3;
          border-color: rgba(79, 70, 229, 0.22);
        }
        .sal-badge--done {
          background: rgba(13, 148, 136, 0.12);
          color: #0f766e;
          border-color: rgba(13, 148, 136, 0.22);
        }
        .sal-badge--muted {
          background: rgba(15, 23, 42, 0.04);
          color: var(--text-muted);
        }

        .sal-groups {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.35rem;
        }
        @media (max-width: 900px) {
          .sal-groups {
            grid-template-columns: 1fr;
            gap: 1rem;
          }
        }

        .sal-group {
          background: rgba(15, 23, 42, 0.025);
          border: 1px solid var(--border-subtle);
          border-radius: calc(var(--radius) + 2px);
          padding: 1.1rem 1.15rem;
          min-width: 0;
          max-width: 100%;
          box-sizing: border-box;
        }
        .sal-group__title {
          margin: 0 0 0.85rem;
          font-size: 0.65rem;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: var(--text-muted);
        }
        .sal-lines {
          list-style: none;
          margin: 0;
          padding: 0;
        }
        .sal-line {
          display: grid;
          grid-template-columns: minmax(10rem, 1.4fr) minmax(7.5rem, 11rem);
          align-items: center;
          column-gap: 1.25rem;
          row-gap: 0.4rem;
          padding: 0.6rem 0;
          border-bottom: 1px solid var(--border);
          font-size: 0.875rem;
        }
        .sal-line:last-child {
          border-bottom: none;
        }
        .sal-line__label {
          color: var(--text);
          line-height: 1.35;
          overflow-wrap: anywhere;
          word-break: break-word;
        }
        .sal-line__val {
          font-family: var(--font-mono);
          font-weight: 600;
          font-variant-numeric: tabular-nums;
          text-align: right;
          justify-self: end;
          width: 100%;
          max-width: 11rem;
          min-width: 0;
        }
        .sal-line__input {
          width: 100%;
          max-width: 11rem;
          min-width: 0;
          justify-self: end;
          text-align: right;
          font-weight: 600;
          box-sizing: border-box;
        }

        /* Compact forecast line inputs — stay inside card */
        .sal-panel--primary .sal-group {
          padding: 0.75rem 0.8rem;
        }
        .sal-panel--primary .sal-line {
          grid-template-columns: minmax(0, 1fr) minmax(4.25rem, 6.5rem);
          column-gap: 0.5rem;
          padding: 0.4rem 0;
          font-size: 0.8125rem;
        }
        .sal-panel--primary .sal-line__input {
          max-width: 6.5rem;
          width: 100%;
          padding: 0.2rem 0.3rem;
          font-size: 0.75rem;
          line-height: 1.25;
        }
        .sal-panel--primary .sal-line__val {
          max-width: 6.5rem;
          font-size: 0.8125rem;
        }
        .sal-panel--primary .sal-line__hint {
          font-size: 0.55rem;
        }

        @media (max-width: 720px) {
          .sal-line {
            grid-template-columns: 1fr;
            align-items: stretch;
          }
          .sal-line__val,
          .sal-line__input {
            max-width: none;
            justify-self: stretch;
            text-align: left;
          }
          .sal-line__val {
            text-align: right;
            padding-top: 0.15rem;
          }
          .sal-panel--primary .sal-line {
            grid-template-columns: 1fr;
          }
          .sal-panel--primary .sal-line__input,
          .sal-panel--primary .sal-line__val {
            max-width: none;
          }
        }

        /* —— Totals band —— */
        .sal-totals-band {
          margin-top: 1.5rem;
          padding-top: 1.35rem;
          border-top: 1px solid rgba(99, 102, 241, 0.12);
        }
        .sal-panel--reference .sal-totals-band {
          margin-top: 1.1rem;
          padding-top: 1rem;
          border-top-color: var(--border-subtle);
        }
        .sal-totals-band__secondary {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.75rem;
          margin-bottom: 1rem;
        }
        @media (max-width: 480px) {
          .sal-totals-band__secondary {
            grid-template-columns: 1fr;
          }
        }
        .sal-total-chip {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
          padding: 0.75rem 0.9rem;
          border-radius: var(--radius);
          background: rgba(15, 23, 42, 0.03);
          border: 1px solid var(--border-subtle);
        }
        .sal-total-chip--deduct {
          background: rgba(239, 68, 68, 0.04);
          border-color: rgba(239, 68, 68, 0.12);
        }
        .sal-total-chip__lbl {
          font-size: 0.65rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: var(--text-muted);
        }
        .sal-total-chip__val {
          font-family: var(--font-mono);
          font-size: 1.05rem;
          font-weight: 700;
          font-variant-numeric: tabular-nums;
          letter-spacing: -0.02em;
        }
        .sal-total-net {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
          flex-wrap: wrap;
          padding: 1rem 1.15rem;
          border-radius: calc(var(--radius) + 4px);
          background: linear-gradient(
            110deg,
            rgba(79, 70, 229, 0.11) 0%,
            rgba(45, 212, 191, 0.08) 100%
          );
          border: 1px solid rgba(99, 102, 241, 0.2);
          box-shadow: 0 8px 24px -16px rgba(79, 70, 229, 0.35);
        }
        .sal-panel--reference .sal-total-net {
          padding: 0.75rem 0.9rem;
          background: rgba(15, 23, 42, 0.04);
          border-color: var(--border-subtle);
          box-shadow: none;
        }
        .sal-total-net__lbl {
          font-size: 0.75rem;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: #312e81;
        }
        .sal-panel--reference .sal-total-net__lbl {
          color: var(--text-muted);
          font-size: 0.65rem;
        }
        .sal-total-net__val {
          font-family: var(--font-mono);
          font-size: clamp(1.35rem, 3.5vw, 1.75rem);
          font-weight: 800;
          font-variant-numeric: tabular-nums;
          letter-spacing: -0.04em;
          color: var(--text);
        }
        .sal-panel--reference .sal-total-net__val {
          font-size: 1.2rem;
        }

        /* —— Actions —— */
        .sal-actions {
          margin-top: 1.15rem;
          padding: 1.05rem 1.15rem;
          border-radius: calc(var(--radius) + 2px);
          border: 1px solid var(--border-subtle);
        }
        .sal-actions--primary {
          background: rgba(79, 70, 229, 0.06);
          border-color: rgba(99, 102, 241, 0.2);
        }
        .sal-actions__hint {
          margin: 0.55rem 0 0;
          font-size: 0.75rem;
          color: var(--text-muted);
          line-height: 1.45;
        }
        .sal-btn-primary {
          font-weight: 700 !important;
          width: 100%;
          justify-content: center;
          padding: 0.65rem 1rem !important;
          border-radius: calc(var(--radius) - 2px) !important;
          background: linear-gradient(
            135deg,
            #4f46e5 0%,
            #6366f1 50%,
            #4338ca 100%
          ) !important;
          color: #fff !important;
          border: none !important;
          box-shadow: 0 10px 28px -12px rgba(79, 70, 229, 0.65);
        }
        .sal-btn-primary:hover {
          filter: brightness(1.05);
        }
        .sal-btn-ghost {
          font-weight: 600 !important;
          width: 100%;
          justify-content: center;
          background: transparent !important;
          border: 1px dashed var(--border) !important;
        }

        .sal-code {
          font-family: var(--font-mono);
          font-size: 0.8em;
        }

        .sal-banner {
          margin-bottom: 1.5rem;
          padding: 0.9rem 1.15rem;
          border-radius: calc(var(--radius) + 2px);
          border: 1px solid rgba(234, 179, 8, 0.3);
          background: rgba(254, 252, 232, 0.85);
          font-size: 0.8125rem;
          line-height: 1.55;
          color: var(--text);
        }
        .sal-banner__link {
          display: inline;
          background: none;
          border: none;
          padding: 0 0.15rem;
          margin: 0 0.15rem;
          font: inherit;
          font-weight: 600;
          color: var(--accent);
          cursor: pointer;
          text-decoration: underline;
          text-underline-offset: 2px;
        }

        .sal-mini-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 1rem;
          margin-bottom: 1.25rem;
        }
        @media (max-width: 720px) {
          .sal-mini-grid {
            grid-template-columns: 1fr;
          }
        }
        .sal-field {
          background: var(--surface);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius);
          padding: 0.9rem 1rem;
          box-shadow: var(--shadow-card);
        }
        .sal-field--stat {
          display: flex;
          flex-direction: column;
          justify-content: center;
        }
        .sal-field__lbl {
          font-size: 0.6875rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: var(--text-muted);
        }
        .sal-field__input {
          margin-top: 0.45rem;
          font-size: 1rem;
          font-weight: 700;
        }
        .sal-field__hint {
          margin: 0.4rem 0 0;
          font-size: 0.75rem;
          line-height: 1.45;
          color: var(--text-muted);
        }
        .sal-field__emph {
          margin-top: 0.45rem;
          font-family: var(--font-mono);
          font-size: 1.2rem;
          font-weight: 800;
          font-variant-numeric: tabular-nums;
        }

        .sal-table-wrap {
          background: var(--surface);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius);
          overflow: hidden;
          box-shadow: var(--shadow-card);
        }
        .sal-table-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
          flex-wrap: wrap;
          padding: 1rem 1.15rem 0;
        }
        .sal-table__title {
          margin: 0;
          font-size: 0.9375rem;
          font-weight: 600;
        }
        .sal-table-scroll {
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
        }
        .sal-table {
          width: 100%;
          font-size: 0.875rem;
          min-width: 640px;
        }
        .sal-table th,
        .sal-table td {
          text-align: left;
          padding: 0.65rem 1.15rem;
          border-bottom: 1px solid var(--border);
          vertical-align: middle;
        }
        .sal-table th {
          font-size: 0.7rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--text-muted);
        }
        .sal-table__strong {
          font-family: var(--font-mono);
          font-weight: 700;
        }
        .sal-table__select {
          min-width: 10rem;
          font-size: 0.75rem;
        }

        .sal-history {
          background: var(--surface);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius);
          padding: 0.5rem 0;
          box-shadow: var(--shadow-card);
        }
        .sal-history__empty {
          margin: 0;
          padding: 1.5rem 1.25rem;
          font-size: 0.875rem;
          color: var(--text-muted);
        }
        .sal-history-scroll {
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
        }
        .sal-history-table {
          width: 100%;
          font-size: 0.8125rem;
          border-collapse: collapse;
          min-width: 560px;
        }
        .sal-history-table th,
        .sal-history-table td {
          padding: 0.8rem 1.15rem;
          text-align: left;
          border-bottom: 1px solid var(--border);
          vertical-align: middle;
        }
        .sal-history-table th {
          font-size: 0.65rem;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: var(--text-muted);
          font-weight: 800;
        }
        .sal-history__label {
          font-weight: 600;
        }
        .sal-num {
          font-family: var(--font-mono);
          font-variant-numeric: tabular-nums;
        }
        .sal-num--strong {
          font-weight: 800;
          font-size: 0.9375rem;
        }
        .sal-pill {
          display: inline-block;
          font-size: 0.6rem;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.07em;
          padding: 0.3rem 0.6rem;
          border-radius: 999px;
        }
        .sal-pill--forecast {
          background: rgba(79, 70, 229, 0.1);
          color: #4338ca;
        }
        .sal-pill--done {
          background: rgba(13, 148, 136, 0.12);
          color: #0f766e;
        }

        @media (max-width: 640px) {
          .sal-panel {
            padding: 0.85rem 0.9rem;
          }
          .sal-panel__title {
            font-size: 1.05rem;
          }
          .sal-group {
            padding: 0.75rem 0.8rem;
          }
          .sal-total-net {
            padding: 0.75rem 0.85rem;
          }
          .sal-total-chip {
            padding: 0.62rem 0.75rem;
          }
          .sal-total-chip__val {
            font-size: 0.95rem;
          }
          .sal-salary-history-card {
            padding: 0.8rem 0.85rem 0.72rem;
          }
          .sal-history-table th,
          .sal-history-table td {
            padding: 0.45rem 0.5rem;
            font-size: 0.76rem;
          }
          .sal-top {
            margin-bottom: 1.1rem;
          }
        }
      `}</style>
    </AppShell>
  );
}
