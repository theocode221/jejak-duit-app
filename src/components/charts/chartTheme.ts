import type { CSSProperties } from 'react';

/** Hex colors for Recharts SVG fills (CSS variables are unreliable inside SVG in some engines). */
export const CHART_HEX = [
  '#0d9488',
  '#4f46e5',
  '#7c3aed',
  '#0284c7',
  '#d97706',
  '#059669',
  '#db2777',
  '#64748b',
] as const;

export const CHART_GRID = '#e8ecf1';

export const CHART_AXIS = '#94a3b8';

/** Shared tooltip look — readable, premium */
export const chartTooltipContentStyle: CSSProperties = {
  borderRadius: 12,
  border: '1px solid #e2e8f0',
  boxShadow: '0 16px 40px -12px rgba(15, 23, 42, 0.18)',
  padding: '10px 14px',
  fontSize: 13,
  fontFamily: "'DM Sans', system-ui, sans-serif",
  background: 'rgba(255, 255, 255, 0.98)',
  backdropFilter: 'blur(8px)',
};

export const chartTooltipLabelStyle: CSSProperties = {
  color: '#64748b',
  fontSize: 11,
  fontWeight: 600,
  marginBottom: 4,
  textTransform: 'capitalize',
};

export const chartMarginTight = { top: 12, right: 12, left: 4, bottom: 8 };

export const chartMarginBars = {
  top: 12,
  right: 16,
  left: 4,
  bottom: 4,
};
