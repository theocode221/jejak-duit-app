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

type Row = { name: string; value: number };

export function BreakdownDonut({ data }: { data: Row[] }) {
  const filtered = data.filter((d) => d.value > 0);
  if (filtered.length === 0) {
    return (
      <div
        style={{
          height: '100%',
          minHeight: 200,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#64748b',
          fontSize: 14,
          fontWeight: 500,
        }}
      >
        No spend in this breakdown yet.
      </div>
    );
  }
  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart margin={{ top: 4, bottom: 4, left: 4, right: 4 }}>
        <Pie
          data={filtered}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="44%"
          innerRadius="50%"
          outerRadius="68%"
          paddingAngle={2}
        >
          {filtered.map((_, i) => (
            <Cell key={i} fill={CHART_HEX[i % CHART_HEX.length]} />
          ))}
        </Pie>
        <Tooltip
          formatter={(value: number) => formatMYR(value)}
          contentStyle={chartTooltipContentStyle}
          labelStyle={chartTooltipLabelStyle}
        />
        <Legend
          layout="horizontal"
          align="center"
          verticalAlign="bottom"
          wrapperStyle={{ fontSize: 10, paddingTop: 6, lineHeight: 1.5 }}
          formatter={(value) => (
            <span style={{ color: '#475569', fontWeight: 500 }}>{value}</span>
          )}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
