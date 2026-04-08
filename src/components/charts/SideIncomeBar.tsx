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
  CHART_AXIS,
  CHART_GRID,
  chartMarginBars,
  chartTooltipContentStyle,
  chartTooltipLabelStyle,
} from './chartTheme';

type Row = { name: string; income: number; expense: number };

const INCOME = '#059669';
const EXPENSE = '#dc2626';

export function SideIncomeBar({ data }: { data: Row[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={chartMarginBars} barGap={10}>
        <CartesianGrid strokeDasharray="3 6" vertical={false} stroke={CHART_GRID} />
        <XAxis
          dataKey="name"
          tick={{ fill: CHART_AXIS, fontSize: 11, fontWeight: 500 }}
          axisLine={false}
          tickLine={false}
          interval={0}
        />
        <YAxis
          tick={{ fill: CHART_AXIS, fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => formatMYR(v, true)}
          width={52}
        />
        <Tooltip
          formatter={(v: number) => formatMYR(v)}
          contentStyle={chartTooltipContentStyle}
          labelStyle={chartTooltipLabelStyle}
        />
        <Legend
          wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
          formatter={(v) => (v === 'income' ? 'Income' : 'Expenses')}
        />
        <Bar
          dataKey="income"
          name="income"
          fill={INCOME}
          radius={[8, 8, 4, 4]}
          maxBarSize={40}
        />
        <Bar
          dataKey="expense"
          name="expense"
          fill={EXPENSE}
          radius={[8, 8, 4, 4]}
          maxBarSize={40}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
