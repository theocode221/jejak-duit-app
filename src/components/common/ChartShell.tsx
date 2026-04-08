import type { ReactNode } from 'react';

type ChartShellProps = {
  kicker?: string;
  title: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
  minHeight?: number;
};

export function ChartShell({
  kicker,
  title,
  subtitle,
  action,
  children,
  minHeight = 280,
}: ChartShellProps) {
  return (
    <div className="chart-shell">
      <div className="chart-shell__head">
        <div>
          {kicker && <p className="chart-shell__kicker">{kicker}</p>}
          <h3 className="chart-shell__title">{title}</h3>
          {subtitle && <p className="chart-shell__sub">{subtitle}</p>}
        </div>
        {action && <div className="chart-shell__action">{action}</div>}
      </div>
      <div
        className="chart-shell__body"
        style={{ height: minHeight, minHeight }}
      >
        {children}
      </div>
      <style>{`
        .chart-shell {
          background: var(--surface);
          border-radius: var(--radius);
          border: 1px solid var(--border-subtle);
          box-shadow: var(--shadow-card);
          padding: 1.2rem 1.35rem 1.1rem;
        }
        .chart-shell__head {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 1rem;
          margin-bottom: 0.85rem;
        }
        .chart-shell__kicker {
          margin: 0 0 0.2rem;
          font-size: 0.6875rem;
          font-weight: 600;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--accent);
        }
        .chart-shell__title {
          margin: 0;
          font-size: 1rem;
          font-weight: 700;
          letter-spacing: -0.02em;
          color: var(--text);
        }
        .chart-shell__sub {
          margin: 0.25rem 0 0;
          font-size: 0.8125rem;
          color: var(--text-muted);
          line-height: 1.45;
          max-width: 36rem;
        }
        .chart-shell__body {
          width: 100%;
          position: relative;
          border-radius: var(--radius-sm);
          background: linear-gradient(
            180deg,
            var(--surface-muted) 0%,
            #ffffff 40%
          );
          border: 1px solid var(--border-subtle);
        }
        @media (max-width: 640px) {
          .chart-shell__body {
            height: 248px !important;
            min-height: 248px !important;
          }
        }
      `}</style>
    </div>
  );
}
