import {
  ArrowDownRight,
  ArrowUpRight,
  Calendar,
  PiggyBank,
  Receipt,
  Timer,
  Wallet,
  Zap,
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { StatCard } from '@/components/common/StatCard';
import { PageSection } from '@/components/common/PageSection';
import { ChartShell } from '@/components/common/ChartShell';
import { ExpenseDonut } from '@/components/charts/ExpenseDonut';
import { IncomeExpenseBar } from '@/components/charts/IncomeExpenseBar';
import { PlannedActualBars } from '@/components/charts/PlannedActualBars';
import { BillStatusBar } from '@/components/charts/BillStatusBar';
import { useMonth } from '@/context/MonthContext';
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
import { formatMYR, formatDate } from '@/utils/format';

export function DashboardPage() {
  const { month, monthLabel } = useMonth();
  const { state } = useFinance();
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

  const burnPct =
    d.totalIncome > 0
      ? Math.round((d.totalExpenses / d.totalIncome) * 100)
      : 0;

  return (
    <AppShell
      kicker="Overview"
      title="Command centre"
      subtitle={`Editable local data — ${d.monthLabel}. Charts follow the month selector.`}
    >
      <PageSection
        kicker="Pulse"
        title="Month snapshot"
        description="Primary KPIs from your salary stack, overtime, extras, and side projects versus tracked spend."
      >
        <div className="bajet-stat-grid">
          <StatCard
            variant="hero"
            label="Cash inflow"
            value={formatMYR(d.totalIncome)}
            hint={`Salary + OT + extras + side (${monthLabel})`}
            icon={<Wallet size={18} strokeWidth={1.75} />}
            trend={{ label: `${burnPct}% of inflow allocated to spend`, positive: burnPct < 85 }}
          />
          <StatCard
            variant="hero"
            label="Budget outflow"
            value={formatMYR(d.totalExpenses)}
            hint="Sum of category actuals"
            icon={<Receipt size={18} strokeWidth={1.75} />}
          />
          <StatCard
            variant="hero"
            label="Net headroom"
            value={formatMYR(d.remainingBalance)}
            hint="Inflow − budget actuals (prototype)"
            icon={
              d.remainingBalance >= 0 ? (
                <ArrowUpRight size={18} strokeWidth={1.75} />
              ) : (
                <ArrowDownRight size={18} strokeWidth={1.75} />
              )
            }
            trend={{
              label:
                d.remainingBalance >= 0 ? 'Above spend line' : 'Below line',
              positive: d.remainingBalance >= 0,
            }}
          />
          <StatCard
            variant="hero"
            label="Savings ticket"
            value={formatMYR(d.savingsAllocation)}
            hint="ASB / forced savings line item"
            icon={<PiggyBank size={18} strokeWidth={1.75} />}
          />
        </div>
        <div className="dash-grid-secondary">
          <StatCard
            label="Bills open"
            value={String(d.upcomingBillsCount)}
            hint="Unpaid or upcoming this cycle"
            icon={<Timer size={18} strokeWidth={1.75} />}
          />
          <StatCard
            label="Trips & events ahead"
            value={String(d.upcomingEventsCount)}
            hint={`From ${formatDate(ref)} forward`}
            icon={<Calendar size={18} strokeWidth={1.75} />}
          />
          <StatCard
            label="OT (cash)"
            value={formatMYR(d.otEarnedThisMonth)}
            hint="Logged sessions × rate"
            icon={<Zap size={18} strokeWidth={1.75} />}
          />
          <StatCard
            label="Side income"
            value={formatMYR(d.sideIncomeThisMonth)}
            hint="Resale + affiliate"
            icon={<ArrowUpRight size={18} strokeWidth={1.75} />}
          />
        </div>
      </PageSection>

      <PageSection
        kicker="Analytics"
        title="Composition & flow"
        description="Category mix, inflow vs tracked spend, plan adherence, and bill hygiene."
      >
        <div className="bajet-chart-grid">
          <ChartShell
            kicker="Distribution"
            title="Spend by category"
            subtitle={`Share of ${monthLabel} actuals across your envelope.`}
            minHeight={300}
          >
            <ExpenseDonut data={expenseByCategory} />
          </ChartShell>
          <ChartShell
            kicker="Flow"
            title="Inflow vs spend"
            subtitle="Single-month comparison — not cashflow timing."
            minHeight={268}
          >
            <IncomeExpenseBar data={incomeVsExpense} />
          </ChartShell>
          <ChartShell
            kicker="Discipline"
            title="Plan vs actual"
            subtitle="Short labels on axis; full names in tooltips."
            minHeight={340}
          >
            <PlannedActualBars data={budgetAllocationOverview} />
          </ChartShell>
          <ChartShell
            kicker="Obligations"
            title="Bill status mix"
            subtitle="Count of line items by payment state."
            minHeight={268}
          >
            <BillStatusBar data={billDueStatus} />
          </ChartShell>
        </div>
      </PageSection>

      <section className="bajet-panel dash-upcoming">
        <header className="dash-upcoming__head">
          <p className="dash-upcoming__kicker">Calendar</p>
          <h2 className="dash-upcoming__title">Up next</h2>
          <p className="dash-upcoming__desc">
            Closest trips and events on your radar.
          </p>
        </header>
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
      </section>

      <style>{`
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
        .dash-upcoming {
          padding: 1.25rem 1.35rem 1.15rem;
        }
        .dash-upcoming__head {
          margin-bottom: 0.5rem;
        }
        .dash-upcoming__kicker {
          margin: 0 0 0.25rem;
          font-size: 0.6875rem;
          font-weight: 600;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--accent);
        }
        .dash-upcoming__title {
          margin: 0;
          font-size: 1.0625rem;
          font-weight: 700;
          letter-spacing: -0.02em;
        }
        .dash-upcoming__desc {
          margin: 0.35rem 0 0;
          font-size: 0.875rem;
          color: var(--text-muted);
          max-width: 36rem;
          line-height: 1.45;
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
      `}</style>
    </AppShell>
  );
}
