import type { ReactNode } from 'react';

type StatVariant = 'default' | 'hero';

type StatCardProps = {
  label: string;
  value: string;
  hint?: string;
  icon?: ReactNode;
  trend?: { label: string; positive?: boolean };
  variant?: StatVariant;
};

export function StatCard({
  label,
  value,
  hint,
  icon,
  trend,
  variant = 'default',
}: StatCardProps) {
  const isHero = variant === 'hero';
  return (
    <div className={`stat-card ${isHero ? 'stat-card--hero' : ''}`}>
      <div className="stat-card__accent" aria-hidden />
      <div className="stat-card__top">
        <span className="stat-card__label">{label}</span>
        {icon && <span className="stat-card__icon">{icon}</span>}
      </div>
      <p className="stat-card__value">{value}</p>
      {hint && <p className="stat-card__hint">{hint}</p>}
      {trend && (
        <p
          className={`stat-card__trend ${
            trend.positive === false ? 'is-neg' : 'is-pos'
          }`}
        >
          {trend.label}
        </p>
      )}
      <style>{`
        .stat-card {
          position: relative;
          background: var(--surface);
          border-radius: var(--radius);
          padding: 1.2rem 1.35rem;
          box-shadow: var(--shadow-card);
          border: 1px solid var(--border-subtle);
          min-height: 112px;
          overflow: hidden;
        }
        .stat-card--hero {
          min-height: 124px;
          padding: 1.35rem 1.4rem;
          background: linear-gradient(
            165deg,
            #ffffff 0%,
            #fafbfc 55%,
            #f8fafc 100%
          );
        }
        .stat-card__accent {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 3px;
          background: linear-gradient(
            90deg,
            var(--accent),
            rgba(79, 70, 229, 0.85)
          );
          opacity: 0.9;
        }
        .stat-card--hero .stat-card__accent {
          height: 4px;
          opacity: 1;
        }
        .stat-card__top {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 0.5rem;
        }
        .stat-card__label {
          font-size: 0.75rem;
          font-weight: 600;
          color: var(--text-muted);
          letter-spacing: 0.04em;
          text-transform: uppercase;
        }
        .stat-card__icon {
          display: flex;
          color: var(--accent);
          opacity: 0.88;
        }
        .stat-card__value {
          margin: 0.45rem 0 0;
          font-size: 1.45rem;
          font-weight: 700;
          letter-spacing: -0.03em;
          font-family: var(--font-mono);
          font-variant-numeric: tabular-nums;
          color: var(--text);
          line-height: 1.15;
        }
        .stat-card--hero .stat-card__value {
          font-size: 1.65rem;
        }
        .stat-card__hint {
          margin: 0.4rem 0 0;
          font-size: 0.8125rem;
          color: var(--text-subtle);
          line-height: 1.4;
        }
        .stat-card__trend {
          margin: 0.55rem 0 0;
          font-size: 0.75rem;
          font-weight: 600;
        }
        .stat-card__trend.is-pos {
          color: var(--positive);
        }
        .stat-card__trend.is-neg {
          color: var(--negative);
        }
      `}</style>
    </div>
  );
}
