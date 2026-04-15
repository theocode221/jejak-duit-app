import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useMemo } from 'react';
import type { CategoryBalanceRow, MonthlyTrendPoint } from '@/services/installmentService';
import { formatMYR, formatMYR2 } from '@/utils/format';
import { layoutSliceDice } from '@/utils/treemapLayout';
import {
  CHART_HEX,
  CHART_AXIS,
  CHART_GRID,
  chartMarginBars,
  chartTooltipContentStyle,
  chartTooltipLabelStyle,
} from '@/components/charts/chartTheme';

function usagePct(usage: number, limit: number): number {
  if (limit <= 0) return usage > 0 ? 100 : 0;
  return Math.round((usage / limit) * 1000) / 10;
}

/** ok / warn / danger for usage vs limit (matches status bands) */
function usageTone(usage: number, limit: number): 'ok' | 'warn' | 'danger' {
  if (limit <= 0) return usage > 0 ? 'danger' : 'ok';
  if (usage >= limit) return 'danger';
  const ratio = usage / limit;
  if (ratio >= 1) return 'danger';
  if (ratio >= 0.8) return 'warn';
  return 'ok';
}

/** (usage / limit) × 100 for treemap weights; no limit → 100 if usage else 0 */
function rawUsageCapPct(r: CategoryBalanceRow): number {
  if (r.monthlyLimit > 0) return (r.usage / r.monthlyLimit) * 100;
  return r.usage > 0 ? 100 : 0;
}

function tilePalette(id: string): { bg: string; border: string; fg: string } {
  let acc = 0;
  for (let i = 0; i < id.length; i++) acc = (acc * 31 + id.charCodeAt(i)) >>> 0;
  const h = acc % 360;
  return {
    bg: `hsl(${h} 48% 90%)`,
    border: `hsl(${h} 42% 58%)`,
    fg: `hsl(${h} 28% 18%)`,
  };
}

type Props = {
  categoryRows: CategoryBalanceRow[];
  monthlyTrend: MonthlyTrendPoint[];
};

export function InstallmentCharts({ categoryRows, monthlyTrend }: Props) {
  const treemap = useMemo(() => {
    const raw = categoryRows.map((r) => ({ id: r.id, weight: rawUsageCapPct(r) }));
    const sum = raw.reduce((a, l) => a + l.weight, 0);
    const leaves = sum <= 0 ? raw.map((l) => ({ id: l.id, weight: 1 })) : raw;
    const rects = layoutSliceDice(leaves, 0, 0, 1, 1);
    return {
      rectById: new Map(rects.map((x) => [x.id, x.rect])),
    };
  }, [categoryRows]);

  return (
    <div className="bnpl-charts">
      <div className="bajet-chart-grid">
        <div className="bnpl-chart-card">
          <h3 className="bnpl-chart-card__title">Category usage</h3>
          <div className="bnpl-chart-card__body bnpl-chart-card__body--usage-treemap">
            {categoryRows.length === 0 ? (
              <p className="bnpl-chart-card__empty">No categories yet.</p>
            ) : (
              <div className="bnpl-usage-treemap" role="list" aria-label="Category usage treemap">
                {categoryRows.map((r) => {
                  const rect = treemap.rectById.get(r.id);
                  if (!rect) return null;
                  const pct = usagePct(r.usage, r.monthlyLimit);
                  const tone = usageTone(r.usage, r.monthlyLimit);
                  const remTone =
                    r.remaining < 0
                      ? 'over'
                      : r.status === 'warn'
                        ? 'warn'
                        : 'ok';
                  const pal = tilePalette(r.id);
                  return (
                    <div
                      key={r.id}
                      className="bnpl-usage-tile"
                      role="listitem"
                      style={{
                        left: `${rect.x * 100}%`,
                        top: `${rect.y * 100}%`,
                        width: `${rect.w * 100}%`,
                        height: `${rect.h * 100}%`,
                        background: pal.bg,
                        borderColor: pal.border,
                        color: pal.fg,
                      }}
                    >
                      <div className="bnpl-usage-tile__inner">
                        <div className="bnpl-usage-tile__head">
                          <span className="bnpl-usage-tile__name">{r.name}</span>
                          <div className="bnpl-usage-tile__status-col">
                            <span className={`bnpl-tag bnpl-tag--${r.status}`}>
                              {r.status === 'over'
                                ? 'OVER'
                                : r.status === 'warn'
                                  ? 'Tight'
                                  : 'OK'}
                            </span>
                            <div className={`bnpl-usage-tile__pct is-${tone}`}>{pct}%</div>
                          </div>
                        </div>
                        <div className={`bnpl-usage-tile__rem bnpl-usage-tile__rem--${remTone}`}>
                          {r.remaining < 0
                            ? `${formatMYR2(Math.abs(r.remaining))} over`
                            : `${formatMYR2(r.remaining)} left`}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="bnpl-chart-card">
          <h3 className="bnpl-chart-card__title">Total installment amount by month</h3>
          <div className="bnpl-chart-card__body">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyTrend} margin={{ ...chartMarginBars, left: 8 }}>
                <CartesianGrid strokeDasharray="3 6" vertical={false} stroke={CHART_GRID} />
                <XAxis
                  dataKey="label"
                  tick={{ fill: CHART_AXIS, fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: CHART_AXIS, fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => formatMYR(v, true)}
                  width={44}
                />
                <Tooltip
                  formatter={(v: number) => formatMYR2(v)}
                  contentStyle={chartTooltipContentStyle}
                  labelStyle={chartTooltipLabelStyle}
                />
                <Line
                  type="monotone"
                  dataKey="totalDue"
                  name="Total installment amount"
                  stroke={CHART_HEX[1]}
                  strokeWidth={2}
                  dot={{ r: 4, fill: CHART_HEX[1] }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <style>{`
        .bnpl-charts .bajet-chart-grid {
          display: grid;
          gap: clamp(1rem, 2vw, 1.5rem);
          grid-template-columns: minmax(0, 1fr);
        }
        .bnpl-chart-card {
          background: var(--surface);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius);
          box-shadow: var(--shadow-card);
          padding: 1.1rem 1.2rem 1rem;
          min-width: 0;
        }
        .bnpl-chart-card__title {
          margin: 0 0 0.65rem;
          font-size: 0.9375rem;
          font-weight: 700;
          letter-spacing: -0.02em;
          color: var(--text);
        }
        .bnpl-chart-card__body {
          height: 240px;
          min-height: 220px;
        }
        .bnpl-chart-card__body--tall {
          height: 280px;
          min-height: 260px;
        }
        .bnpl-chart-card__body--usage-treemap {
          height: auto;
          min-height: 0;
          overflow: visible;
        }
        .bnpl-usage-treemap {
          position: relative;
          width: 100%;
          height: 182px;
          margin: 0 auto;
          background: var(--surface-muted);
          border-radius: var(--radius-sm);
          border: 1px solid var(--border-subtle);
          box-shadow: inset 0 1px 2px rgba(15, 23, 42, 0.04);
        }
        .bnpl-usage-tile {
          position: absolute;
          box-sizing: border-box;
          border-width: 2px;
          border-style: solid;
          border-radius: clamp(6px, 1.2vw, 12px);
          overflow: hidden;
          box-shadow: 0 1px 2px rgba(15, 23, 42, 0.06);
          transition: transform 0.15s ease, box-shadow 0.15s ease, z-index 0s;
          container-type: size;
          container-name: bnpl-tile;
        }
        .bnpl-usage-tile:hover {
          z-index: 2;
          transform: scale(1.01);
          box-shadow: 0 6px 20px -6px rgba(15, 23, 42, 0.18);
        }
        .bnpl-usage-tile__inner {
          height: 100%;
          padding: 0.45rem 0.5rem 0.4rem;
          display: flex;
          flex-direction: column;
          gap: 0.15rem;
          min-height: 0;
        }
        .bnpl-usage-tile__head {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 0.35rem;
          min-height: 0;
        }
        .bnpl-usage-tile__status-col {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 0.18rem;
          flex-shrink: 0;
          text-align: right;
        }
        .bnpl-usage-tile__name {
          font-weight: 700;
          font-size: clamp(0.68rem, 0.55rem + 0.45vw, 0.82rem);
          line-height: 1.2;
          letter-spacing: -0.02em;
          min-width: 0;
          overflow: hidden;
          text-overflow: ellipsis;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
        }
        .bnpl-usage-tile__pct {
          font-family: var(--font-mono);
          font-variant-numeric: tabular-nums;
          font-weight: 800;
          /* Scales with tile: cqmin = min(1% width, 1% height) of this tile */
          font-size: clamp(0.58rem, 11cqmin, 2.15rem);
          letter-spacing: -0.03em;
          line-height: 1.05;
          margin-top: 0;
        }
        .bnpl-usage-tile__pct.is-ok {
          color: var(--positive);
        }
        .bnpl-usage-tile__pct.is-warn {
          color: #a16207;
        }
        .bnpl-usage-tile__pct.is-danger {
          color: var(--negative);
        }
        .bnpl-usage-tile__rem {
          font-family: var(--font-mono);
          font-size: clamp(0.58rem, 0.48rem + 0.3vw, 0.68rem);
          font-weight: 600;
          margin-top: auto;
        }
        .bnpl-usage-tile__rem--ok {
          color: var(--positive);
        }
        .bnpl-usage-tile__rem--warn {
          color: var(--warning);
        }
        .bnpl-usage-tile__rem--over {
          color: var(--negative);
        }
        .bnpl-charts .bnpl-tag {
          display: inline-block;
          padding: 0.2rem 0.55rem;
          border-radius: var(--radius-pill);
          font-size: 0.65rem;
          font-weight: 700;
          letter-spacing: 0.04em;
          text-transform: uppercase;
        }
        .bnpl-charts .bnpl-tag--ok {
          background: var(--positive-soft);
          color: var(--positive);
        }
        .bnpl-charts .bnpl-tag--warn {
          background: var(--warning-soft);
          color: var(--warning);
        }
        .bnpl-charts .bnpl-tag--over {
          background: var(--negative-soft);
          color: var(--negative);
        }
        .bnpl-chart-card__empty {
          margin: 0;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.875rem;
          color: var(--text-muted);
        }

        @media (max-width: 640px) {
          .bnpl-charts .bajet-chart-grid {
            gap: clamp(0.85rem, 2.5vw, 1.15rem);
          }
          .bnpl-chart-card {
            padding: 0.78rem 0.85rem 0.72rem;
          }
          .bnpl-chart-card__title {
            font-size: 0.88rem;
          }
          .bnpl-chart-card__body {
            height: 188px;
            min-height: 178px;
          }
          .bnpl-chart-card__body--usage-treemap {
            height: auto !important;
            overflow: visible;
          }
          .bnpl-usage-treemap {
            height: 182px;
          }
          .bnpl-usage-tile__inner {
            padding: 0.38rem 0.42rem 0.35rem;
          }
          .bnpl-charts .bnpl-tag {
            font-size: 0.55rem;
            padding: 0.15rem 0.42rem;
          }
        }
      `}</style>
    </div>
  );
}
