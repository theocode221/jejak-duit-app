import {
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { formatMYR } from '@/utils/format';
import {
  CHART_AXIS,
  chartMarginTight,
  chartTooltipContentStyle,
  chartTooltipLabelStyle,
} from './chartTheme';

const INCOME_HEX = '#059669';
const SPENT_HEX = '#dc2626';

type Row = { name: string; amount: number };

export function IncomeExpenseBar({ data }: { data: Row[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={chartMarginTight} barGap={16}>
        <XAxis
          dataKey="name"
          tick={{ fill: CHART_AXIS, fontSize: 12, fontWeight: 600 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis hide domain={[0, 'auto']} />
        <Tooltip
          formatter={(v: number) => formatMYR(v)}
          contentStyle={chartTooltipContentStyle}
          labelStyle={chartTooltipLabelStyle}
        />
        <Bar dataKey="amount" radius={[10, 10, 4, 4]} maxBarSize={72}>
          {data.map((entry) => (
            <Cell
              key={entry.name}
              fill={entry.name === 'Income' ? INCOME_HEX : SPENT_HEX}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
