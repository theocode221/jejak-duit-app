import {
  ArrowDownRight,
  ArrowUpRight,
  Banknote,
  Calendar,
  CalendarClock,
  ChevronRight,
  CreditCard,
  PiggyBank,
  Plane,
  Receipt,
  Timer,
  TrendingUp,
  Wallet,
  Zap,
} from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
import { StatCard } from '@/components/common/StatCard';
import { PageSection } from '@/components/common/PageSection';
import { ChartShell } from '@/components/common/ChartShell';
import { ExpenseDonut } from '@/components/charts/ExpenseDonut';
import { IncomeExpenseBar } from '@/components/charts/IncomeExpenseBar';
import { PlannedActualBars } from '@/components/charts/PlannedActualBars';
import { BillStatusBar } from '@/components/charts/BillStatusBar';
import { useMonth } from '@/context/MonthContext';
import { useInstallmentsStore } from '@/features/installments/useInstallmentsStore';
import { useFinance } from '@/state/FinanceContext';
import {
  getDashboardSummary,
  getChartExpenseByCategory,
  getChartIncomeVsExpense,
  getChartBudgetPlanActual,
  getChartBillStatus,
  getEvents,
  getReferenceDate,
} from '@/state/financeSelectors';
import { formatMYR, formatMYR2, formatDate } from '@/utils/format';
import type { LucideIcon } from 'lucide-react';

const WORKSPACES: {
  to: string;
  label: string;
  Icon: LucideIcon;
}[] = [
  { to: '/budget', label: 'Monthly Budget', Icon: Wallet },
  { to: '/income', label: 'Salary & OT', Icon: Banknote },
  { to: '/bills', label: 'Bills', Icon: CalendarClock },
  { to: '/events', label: 'Events', Icon: Plane },
  { to: '/side-income', label: 'Side Income', Icon: TrendingUp },
  { to: '/installments', label: 'Installment', Icon: CreditCard },
];

export function DashboardPage() {
  const { month } = useMonth();
  const { state } = useFinance();
  const installments = useInstallmentsStore(month);
  const d = getDashboardSummary(state, month);
  const expenseByCategory = getChartExpenseByCategory(state, month);
  const incomeVsExpense = getChartIncomeVsExpense(state, month);
  const budgetAllocationOverview = getChartBudgetPlanActual(state, month);
  const billDueStatus = getChartBillStatus(state, month);
  const ref = getReferenceDate(state);
  const upcoming = [...getEvents(state)]
    .filter((e) => new Date(e.eventDate) >= new Date(ref))
    .sort(
      (a, b) =>
        new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime()
    )
    .slice(0, 4);

  return (
    <AppShell title="Dashboard">
      <PageSection title="Workspaces">
        <nav className="dash-nav" aria-label="App workspaces">
          {WORKSPACES.map(({ to, label, Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `dash-nav-card${isActive ? ' is-active' : ''}`
              }
            >
              <span className="dash-nav-card__icon" aria-hidden>
                <Icon size={20} strokeWidth={1.7} />
              </span>
              <span className="dash-nav-card__body">
                <span className="dash-nav-card__title">{label}</span>
              </span>
              <ChevronRight
                className="dash-nav-card__go"
                size={18}
                strokeWidth={2}
                aria-hidden
              />
            </NavLink>
          ))}
        </nav>
      </PageSection>

      <PageSection title="Month snapshot">
        <div className="bajet-stat-grid">
          <StatCard
            variant="hero"
            label="Cash inflow"
            value={formatMYR(d.totalIncome)}
            icon={<Wallet size={18} strokeWidth={1.75} />}
          />
          <StatCard
            variant="hero"
            label="Budget outflow"
            value={formatMYR(d.totalExpenses)}
            icon={<Receipt size={18} strokeWidth={1.75} />}
          />
          <StatCard
            variant="hero"
            label="Net headroom"
            value={formatMYR(d.remainingBalance)}
            icon={
              d.remainingBalance >= 0 ? (
                <ArrowUpRight size={18} strokeWidth={1.75} />
              ) : (
                <ArrowDownRight size={18} strokeWidth={1.75} />
              )
            }
          />
          <StatCard
            variant="hero"
            label="Savings ticket"
            value={formatMYR(d.savingsAllocation)}
            icon={<PiggyBank size={18} strokeWidth={1.75} />}
          />
        </div>
        <div className="dash-grid-secondary">
          <StatCard
            label="Bills open"
            value={String(d.upcomingBillsCount)}
            icon={<Timer size={18} strokeWidth={1.75} />}
          />
          <StatCard
            label="BNPL unpaid"
            value={formatMYR2(installments.summary.totalUnpaid)}
            icon={<CreditCard size={18} strokeWidth={1.75} />}
          />
          <StatCard
            label="Events ahead"
            value={String(d.upcomingEventsCount)}
            icon={<Calendar size={18} strokeWidth={1.75} />}
          />
          <StatCard
            label="Side income"
            value={formatMYR(d.sideIncomeThisMonth)}
            icon={<TrendingUp size={18} strokeWidth={1.75} />}
          />
        </div>
        <div className="dash-ot-strip">
          <StatCard
            label="OT (cash)"
            value={formatMYR(d.otEarnedThisMonth)}
            icon={<Zap size={18} strokeWidth={1.75} />}
          />
        </div>
      </PageSection>

      <PageSection title="Composition & flow">
        <div className="bajet-chart-grid">
          <ChartShell title="Spend by category" minHeight={300}>
            <ExpenseDonut data={expenseByCategory} />
          </ChartShell>
          <ChartShell title="Inflow vs spend" minHeight={268}>
            <IncomeExpenseBar data={incomeVsExpense} />
          </ChartShell>
          <ChartShell title="Plan vs actual" minHeight={340}>
            <PlannedActualBars data={budgetAllocationOverview} />
          </ChartShell>
          <ChartShell title="Bill status mix" minHeight={268}>
            <BillStatusBar data={billDueStatus} />
          </ChartShell>
        </div>
      </PageSection>

      <PageSection
        title="Up next on the calendar"
        aside={
          <NavLink to="/events" className="dash-link-all">
            View all
            <ChevronRight size={16} strokeWidth={2} aria-hidden />
          </NavLink>
        }
      >
        <div className="bajet-panel dash-upcoming">
          {upcoming.length === 0 ? (
            <p className="dash-upcoming__empty">No upcoming events.</p>
          ) : (
            <ul className="dash-upcoming__list">
              {upcoming.map((e) => (
                <li key={e.id} className="dash-upcoming__row">
                  <div>
                    <span className="dash-upcoming__name">{e.name}</span>
                    <span className="dash-upcoming__meta">
                      {formatDate(e.eventDate)}
                    </span>
                  </div>
                  <span className="dash-upcoming__amt">
                    {formatMYR(e.plannedBudget)} budget
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </PageSection>

      <style>{`
        .dash-nav {
          display: grid;
          gap: 0.85rem;
          grid-template-columns: repeat(3, minmax(0, 1fr));
        }
        @media (max-width: 960px) {
          .dash-nav {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }
        @media (max-width: 520px) {
          .dash-nav {
            grid-template-columns: 1fr;
          }
        }
        .dash-nav-card {
          display: flex;
          align-items: center;
          gap: 0.85rem;
          padding: 1rem 1.1rem;
          border-radius: var(--radius);
          border: 1px solid var(--border-subtle);
          background: var(--surface);
          text-decoration: none;
          color: inherit;
          box-shadow: var(--shadow-card);
          transition:
            border-color 0.15s ease,
            box-shadow 0.15s ease,
            transform 0.12s ease;
        }
        .dash-nav-card:hover {
          border-color: var(--accent);
          box-shadow: var(--shadow-float);
        }
        .dash-nav-card.is-active {
          border-color: var(--accent);
          background: linear-gradient(
            165deg,
            #ffffff 0%,
            #f8fafc 100%
          );
        }
        .dash-nav-card__icon {
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 2.45rem;
          height: 2.45rem;
          border-radius: var(--radius-sm);
          background: rgba(79, 70, 229, 0.09);
          color: var(--accent);
        }
        .dash-nav-card__body {
          flex: 1;
          min-width: 0;
        }
        .dash-nav-card__title {
          display: block;
          font-size: 0.9375rem;
          font-weight: 700;
          letter-spacing: -0.02em;
          color: var(--text);
        }
        .dash-nav-card__go {
          flex-shrink: 0;
          margin-top: 0.12rem;
          color: var(--text-subtle);
          opacity: 0.65;
        }
        .dash-nav-card:hover .dash-nav-card__go {
          color: var(--accent);
          opacity: 1;
        }
        .dash-link-all {
          display: inline-flex;
          align-items: center;
          gap: 0.2rem;
          font-size: 0.8125rem;
          font-weight: 600;
          color: var(--accent);
          text-decoration: none;
          white-space: nowrap;
        }
        .dash-link-all:hover {
          text-decoration: underline;
        }
        .dash-grid-secondary {
          display: grid;
          gap: var(--space-4);
          grid-template-columns: repeat(4, minmax(0, 1fr));
        }
        @media (max-width: 1100px) {
          .dash-grid-secondary {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }
        @media (max-width: 520px) {
          .dash-grid-secondary {
            grid-template-columns: 1fr;
          }
        }
        .dash-ot-strip {
          margin-top: var(--space-4);
          max-width: 22rem;
        }
        .dash-upcoming {
          padding: 1.1rem 1.2rem 1rem;
        }
        .dash-upcoming__empty {
          margin: 0;
          font-size: 0.875rem;
          color: var(--text-muted);
          line-height: 1.5;
        }
        .dash-upcoming__empty a {
          color: var(--accent);
          font-weight: 600;
          text-decoration: none;
        }
        .dash-upcoming__empty a:hover {
          text-decoration: underline;
        }
        .dash-upcoming__list {
          list-style: none;
          margin: 0;
          padding: 0;
        }
        .dash-upcoming__row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
          padding: 0.75rem 0;
          border-bottom: 1px solid var(--border-subtle);
        }
        .dash-upcoming__row:last-child {
          border-bottom: none;
        }
        .dash-upcoming__name {
          display: block;
          font-weight: 600;
          font-size: 0.875rem;
          color: var(--text);
        }
        .dash-upcoming__meta {
          font-size: 0.75rem;
          color: var(--text-muted);
        }
        .dash-upcoming__amt {
          font-family: var(--font-mono);
          font-size: 0.8125rem;
          font-weight: 600;
          color: var(--accent);
          white-space: nowrap;
        }
        @media (max-width: 640px) {
          .dash-grid-secondary {
            gap: 0.75rem;
          }
          .dash-ot-strip {
            max-width: none;
          }
          .dash-upcoming {
            padding: 0.85rem 0.95rem 0.8rem;
            border-radius: var(--radius-sm);
          }
          .dash-upcoming__row {
            padding: 0.62rem 0;
            gap: 0.65rem;
            align-items: flex-start;
          }
          .dash-upcoming__name {
            font-size: 0.82rem;
          }
          .dash-upcoming__amt {
            font-size: 0.75rem;
          }
        }
      `}</style>
    </AppShell>
  );
}
