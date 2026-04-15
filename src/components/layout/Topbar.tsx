import { Menu, ChevronDown, Sparkles } from 'lucide-react';
import { useMonth } from '@/context/MonthContext';
import { FinanceToolbar } from './FinanceToolbar';

type TopbarProps = {
  title: string;
  subtitle?: string;
  onMenuClick: () => void;
};

export function Topbar({ title, subtitle, onMenuClick }: TopbarProps) {
  const { month, monthLabel, setMonth, options } = useMonth();

  return (
    <header className="app-topbar">
      <div className="app-topbar__left">
        <button
          type="button"
          className="app-topbar__menu"
          onClick={onMenuClick}
          aria-label="Open menu"
        >
          <Menu size={22} strokeWidth={1.75} />
        </button>
        <div className="app-topbar__titles">
          <h1 className="app-topbar__title">{title}</h1>
          {subtitle && <p className="app-topbar__sub">{subtitle}</p>}
        </div>
      </div>
      <div className="app-topbar__right">
        <div className="app-topbar__month">
          <label htmlFor="month-select" className="visually-hidden">
            Month
          </label>
          <select
            id="month-select"
            className="app-topbar__select"
            value={month}
            onChange={(e) =>
              setMonth(e.target.value as (typeof options)[number]['value'])
            }
          >
            {options.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <ChevronDown size={16} className="app-topbar__chev" aria-hidden />
        </div>
        <FinanceToolbar />
        <div className="app-topbar__pill">
          <Sparkles size={16} strokeWidth={1.75} />
          <span>{monthLabel}</span>
        </div>
      </div>
      <button
        type="button"
        className="app-topbar__user-icon"
        aria-label="Account (MH)"
      >
        MH
      </button>
      <style>{`
        .app-topbar {
          position: relative;
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 1rem;
          padding: 0.15rem 3rem 0.25rem 0;
          flex-wrap: wrap;
          border-bottom: 1px solid var(--border-subtle);
          margin-bottom: 0.25rem;
          padding-bottom: 1.1rem;
        }
        .app-topbar__left {
          display: flex;
          align-items: flex-start;
          gap: 0.85rem;
          min-width: 0;
        }
        .app-topbar__titles {
          min-width: 0;
        }
        .app-topbar__menu {
          display: none;
          align-items: center;
          justify-content: center;
          width: 44px;
          height: 44px;
          border-radius: var(--radius-sm);
          border: 1px solid var(--border);
          background: var(--surface);
          color: var(--text);
          flex-shrink: 0;
          box-shadow: var(--shadow-sm);
        }
        .app-topbar__menu:hover {
          background: var(--surface-muted);
          border-color: #cbd5e1;
        }
        @media (max-width: 900px) {
          .app-topbar__menu {
            display: flex;
          }
        }
        .app-topbar__title {
          margin: 0;
          font-size: clamp(1.35rem, 3vw, 1.65rem);
          font-weight: 700;
          letter-spacing: -0.035em;
          line-height: 1.15;
          color: var(--text);
        }
        .app-topbar__sub {
          margin: 0.35rem 0 0;
          font-size: 0.875rem;
          color: var(--text-muted);
          line-height: 1.5;
          max-width: 38rem;
        }
        .app-topbar__right {
          display: flex;
          align-items: center;
          gap: 0.6rem;
          flex-wrap: wrap;
        }
        .app-topbar__month {
          position: relative;
          display: flex;
          align-items: center;
        }
        .app-topbar__select {
          appearance: none;
          padding: 0.5rem 2.1rem 0.5rem 0.95rem;
          border-radius: var(--radius-pill);
          border: 1px solid var(--border);
          background: var(--surface);
          font-family: inherit;
          font-size: 0.8125rem;
          font-weight: 600;
          color: var(--text);
          cursor: pointer;
          box-shadow: var(--shadow-sm);
        }
        .app-topbar__select:hover {
          border-color: #cbd5e1;
        }
        .app-topbar__select:focus {
          outline: 2px solid var(--accent);
          outline-offset: 2px;
        }
        .app-topbar__chev {
          position: absolute;
          right: 10px;
          pointer-events: none;
          color: var(--text-muted);
        }
        .app-topbar__pill {
          display: flex;
          align-items: center;
          gap: 0.35rem;
          padding: 0.48rem 0.9rem;
          border-radius: var(--radius-pill);
          background: var(--accent-2-soft);
          color: var(--accent-2);
          font-size: 0.75rem;
          font-weight: 600;
          border: 1px solid rgba(79, 70, 229, 0.12);
        }
        @media (max-width: 480px) {
          .app-topbar__pill {
            display: none;
          }
        }
        .app-topbar__user-icon {
          position: absolute;
          top: 0;
          right: 0;
          width: 40px;
          height: 40px;
          margin: 0;
          padding: 0;
          border-radius: 9999px;
          background: linear-gradient(145deg, #ccfbf1, #e0e7ff);
          border: 1px solid var(--border-subtle);
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: inherit;
          font-size: 0.7rem;
          font-weight: 700;
          letter-spacing: -0.02em;
          color: var(--accent-hover);
          box-shadow: var(--shadow-sm);
          cursor: default;
          flex-shrink: 0;
        }
        .app-topbar__user-icon:hover {
          border-color: #cbd5e1;
          box-shadow: var(--shadow-sm), 0 0 0 1px rgba(99, 102, 241, 0.12);
        }
        .app-topbar__user-icon:focus-visible {
          outline: 2px solid var(--accent);
          outline-offset: 2px;
        }
        @media (max-width: 640px) {
          .app-topbar {
            gap: 0.65rem;
            padding-bottom: 0.85rem;
            margin-bottom: 0.15rem;
          }
          .app-topbar__left {
            gap: 0.65rem;
          }
          .app-topbar__title {
            font-size: clamp(1.12rem, 4.5vw, 1.38rem);
            letter-spacing: -0.03em;
          }
          .app-topbar__sub {
            font-size: 0.8rem;
            margin-top: 0.28rem;
            line-height: 1.45;
            max-width: 100%;
          }
          .app-topbar__right {
            gap: 0.45rem;
            width: 100%;
            justify-content: flex-start;
          }
          .app-topbar__select {
            font-size: 0.75rem;
            padding: 0.42rem 1.85rem 0.42rem 0.8rem;
          }
          .app-topbar {
            padding-right: 2.65rem;
          }
          .app-topbar__user-icon {
            width: 36px;
            height: 36px;
            font-size: 0.65rem;
          }
        }
      `}</style>
    </header>
  );
}
