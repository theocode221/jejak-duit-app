import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import {
  CHART_HEX,
  chartTooltipContentStyle,
  chartTooltipLabelStyle,
} from './chartTheme';
import { formatMYR } from '@/utils/format';

type Row = { category: string; amount: number };

export function ExpenseDonut({ data }: { data: Row[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart margin={{ top: 4, bottom: 4, left: 4, right: 4 }}>
        <Pie
          data={data}
          dataKey="amount"
          nameKey="category"
          cx="50%"
          cy="46%"
          innerRadius="54%"
          outerRadius="72%"
          paddingAngle={2}
        >
          {data.map((_, i) => (
            <Cell key={i} fill={CHART_HEX[i % CHART_HEX.length]} />
          ))}
        </Pie>
        <Tooltip
          formatter={(value: number) => [formatMYR(value), 'Actual']}
          contentStyle={chartTooltipContentStyle}
          labelStyle={chartTooltipLabelStyle}
        />
        <Legend
          layout="horizontal"
          align="center"
          verticalAlign="bottom"
          wrapperStyle={{
            fontSize: 11,
            paddingTop: 8,
            lineHeight: 1.6,
          }}
          formatter={(value) => (
            <span style={{ color: '#475569', fontWeight: 500 }}>{value}</span>
          )}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
