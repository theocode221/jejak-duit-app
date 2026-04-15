import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { EventBreakdown } from '@/types';
import { formatMYR } from '@/utils/format';
import {
  CHART_HEX,
  CHART_AXIS,
  CHART_GRID,
  chartTooltipContentStyle,
  chartTooltipLabelStyle,
} from './chartTheme';

const keys: { key: keyof EventBreakdown; label: string }[] = [
  { key: 'transport', label: 'Transport' },
  { key: 'hotel', label: 'Hotel' },
  { key: 'makan', label: 'Makan' },
  { key: 'registration', label: 'Registration' },
  { key: 'shopping', label: 'Shopping' },
  { key: 'others', label: 'Others' },
];

export function EventBreakdownChart({ breakdown }: { breakdown: EventBreakdown }) {
  const data = keys.map(({ key, label }) => ({
    name: label,
    value: breakdown[key],
  }));
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 8, right: 20, left: 4, bottom: 8 }}
      >
        <CartesianGrid
          strokeDasharray="3 6"
          horizontal
          vertical={false}
          stroke={CHART_GRID}
        />
        <XAxis
          type="number"
          tick={{ fill: CHART_AXIS, fontSize: 10 }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => formatMYR(v, true)}
        />
        <YAxis
          type="category"
          dataKey="name"
          width={86}
          tick={{ fill: CHART_AXIS, fontSize: 11, fontWeight: 500 }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          formatter={(v: number) => formatMYR(v)}
          contentStyle={chartTooltipContentStyle}
          labelStyle={chartTooltipLabelStyle}
        />
        <Bar dataKey="value" fill={CHART_HEX[1]} radius={[0, 8, 8, 0]} maxBarSize={22} />
      </BarChart>
    </ResponsiveContainer>
  );
}
