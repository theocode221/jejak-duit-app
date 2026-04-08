import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
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

type Row = {
  name: string;
  label: string;
  planned: number;
  actual: number;
};

export function PlannedActualBars({ data }: { data: Row[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={chartMarginBars} barGap={4} barCategoryGap="18%">
        <CartesianGrid strokeDasharray="3 6" vertical={false} stroke={CHART_GRID} />
        <XAxis
          dataKey="label"
          tick={{ fill: CHART_AXIS, fontSize: 11, fontWeight: 500 }}
          axisLine={false}
          tickLine={false}
          interval={0}
          height={36}
        />
        <YAxis
          tick={{ fill: CHART_AXIS, fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => formatMYR(v, true)}
          width={52}
        />
        <Tooltip
          formatter={(v: number, key: string) => [
            formatMYR(v),
            key === 'planned' ? 'Planned' : 'Actual',
          ]}
          labelFormatter={(_, payload) =>
            (payload?.[0]?.payload as Row)?.name ?? ''
          }
          contentStyle={chartTooltipContentStyle}
          labelStyle={chartTooltipLabelStyle}
        />
        <Legend
          wrapperStyle={{ fontSize: 12, paddingTop: 12 }}
          formatter={(value) => (value === 'planned' ? 'Planned' : 'Actual')}
        />
        <Bar
          dataKey="planned"
          fill={CHART_HEX[1]}
          radius={[6, 6, 0, 0]}
          maxBarSize={32}
        />
        <Bar
          dataKey="actual"
          fill={CHART_HEX[0]}
          radius={[6, 6, 0, 0]}
          maxBarSize={32}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
