import {
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { BillStatus } from '@/types';
import {
  CHART_AXIS,
  chartMarginTight,
  chartTooltipContentStyle,
  chartTooltipLabelStyle,
} from './chartTheme';

type Row = { status: BillStatus; count: number };

const labels: Record<BillStatus, string> = {
  paid: 'Paid',
  unpaid: 'Unpaid',
};

const STATUS_HEX: Record<BillStatus, string> = {
  paid: '#059669',
  unpaid: '#dc2626',
};

export function BillStatusBar({ data }: { data: Row[] }) {
  const chartData = data.map((d) => ({
    ...d,
    label: labels[d.status],
  }));
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={chartData} margin={chartMarginTight} barCategoryGap="28%">
        <XAxis
          dataKey="label"
          tick={{ fill: CHART_AXIS, fontSize: 12, fontWeight: 500 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          allowDecimals={false}
          tick={{ fill: CHART_AXIS, fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          width={28}
        />
        <Tooltip
          formatter={(v: number) => [v, 'Bills']}
          contentStyle={chartTooltipContentStyle}
          labelStyle={chartTooltipLabelStyle}
        />
        <Bar dataKey="count" radius={[8, 8, 4, 4]} maxBarSize={48}>
          {chartData.map((entry, index) => (
            <Cell
              key={`${entry.status}-${index}`}
              fill={STATUS_HEX[entry.status]}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
