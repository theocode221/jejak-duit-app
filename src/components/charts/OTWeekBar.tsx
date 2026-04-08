import {
  Bar,
  BarChart,
  CartesianGrid,
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

type Row = { week: string; amount: number };

export function OTWeekBar({ data }: { data: Row[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={chartMarginBars}>
        <CartesianGrid strokeDasharray="3 6" vertical={false} stroke={CHART_GRID} />
        <XAxis
          dataKey="week"
          tick={{ fill: CHART_AXIS, fontSize: 12, fontWeight: 500 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fill: CHART_AXIS, fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => formatMYR(v, true)}
          width={48}
        />
        <Tooltip
          formatter={(v: number) => formatMYR(v)}
          contentStyle={chartTooltipContentStyle}
          labelStyle={chartTooltipLabelStyle}
        />
        <Bar
          dataKey="amount"
          fill={CHART_HEX[1]}
          radius={[8, 8, 4, 4]}
          maxBarSize={40}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
