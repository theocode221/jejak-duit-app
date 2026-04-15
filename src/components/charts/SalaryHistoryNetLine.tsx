import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { formatMYR } from '@/utils/format';
import {
  CHART_HEX,
  CHART_AXIS,
  CHART_GRID,
  chartMarginBars,
  chartTooltipContentStyle,
  chartTooltipLabelStyle,
} from './chartTheme';

export type SalaryHistoryChartPoint = {
  shortLabel: string;
  fullLabel: string;
  netSalary: number;
  status: 'finalized' | 'forecast';
};

export function SalaryHistoryNetLine({ data }: { data: SalaryHistoryChartPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={chartMarginBars}>
        <CartesianGrid strokeDasharray="3 6" vertical={false} stroke={CHART_GRID} />
        <XAxis
          dataKey="shortLabel"
          tick={{ fill: CHART_AXIS, fontSize: 11, fontWeight: 500 }}
          axisLine={false}
          tickLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          tick={{ fill: CHART_AXIS, fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => formatMYR(v, true)}
          width={48}
        />
        <Tooltip
          formatter={(v: number) => [formatMYR(v), 'Net']}
          labelFormatter={(_l, pl) => (pl?.[0]?.payload as SalaryHistoryChartPoint)?.fullLabel ?? ''}
          contentStyle={chartTooltipContentStyle}
          labelStyle={chartTooltipLabelStyle}
        />
        <Line
          type="monotone"
          dataKey="netSalary"
          stroke={CHART_HEX[0]}
          strokeWidth={2}
          dot={(props) => {
            const { cx, cy, payload } = props as {
              cx: number;
              cy: number;
              payload: SalaryHistoryChartPoint;
            };
            const fill =
              payload.status === 'finalized' ? CHART_HEX[0] : CHART_HEX[4];
            return (
              <circle
                cx={cx}
                cy={cy}
                r={4}
                fill={fill}
                stroke="#fff"
                strokeWidth={1.5}
              />
            );
          }}
          activeDot={{ r: 6, strokeWidth: 2, stroke: '#fff' }}
          connectNulls
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
