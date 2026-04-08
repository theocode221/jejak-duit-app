import type { ReactNode } from 'react';

type Variant = 'success' | 'warning' | 'danger' | 'neutral' | 'info';

const variantMap: Record<
  Variant,
  { bg: string; color: string; border: string }
> = {
  success: {
    bg: 'var(--positive-soft)',
    color: 'var(--positive)',
    border: 'rgba(5, 150, 105, 0.25)',
  },
  warning: {
    bg: 'var(--warning-soft)',
    color: 'var(--warning)',
    border: 'rgba(217, 119, 6, 0.25)',
  },
  danger: {
    bg: 'var(--negative-soft)',
    color: 'var(--negative)',
    border: 'rgba(220, 38, 38, 0.2)',
  },
  neutral: {
    bg: '#f1f5f9',
    color: 'var(--text-muted)',
    border: '#e2e8f0',
  },
  info: {
    bg: 'var(--accent-soft)',
    color: 'var(--accent)',
    border: 'rgba(13, 148, 136, 0.25)',
  },
};

export function StatusBadge({
  children,
  variant = 'neutral',
}: {
  children: ReactNode;
  variant?: Variant;
}) {
  const v = variantMap[variant];
  return (
    <span
      className="status-badge"
      style={{
        background: v.bg,
        color: v.color,
        borderColor: v.border,
      }}
    >
      {children}
      <style>{`
        .status-badge {
          display: inline-flex;
          align-items: center;
          padding: 0.2rem 0.55rem;
          border-radius: 999px;
          font-size: 0.6875rem;
          font-weight: 600;
          text-transform: capitalize;
          border: 1px solid;
          letter-spacing: 0.02em;
        }
      `}</style>
    </span>
  );
}
