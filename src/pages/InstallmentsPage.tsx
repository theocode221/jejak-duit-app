import { useEffect, useMemo, useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { PageSection } from '@/components/common/PageSection';
import { StatCard } from '@/components/common/StatCard';
import { useMonth } from '@/context/MonthContext';
import { CategoryLimitSection } from '@/features/installments/components/CategoryLimitSection';
import { InstallmentCharts } from '@/features/installments/components/InstallmentCharts';
import { InstallmentForm } from '@/features/installments/components/InstallmentForm';
import { InstallmentMasterTable } from '@/features/installments/components/InstallmentMasterTable';
import { MonthlyCommitmentsTable } from '@/features/installments/components/MonthlyCommitmentsTable';
import { useInstallmentsStore } from '@/features/installments/useInstallmentsStore';
import { activeEntriesForMonth } from '@/services/installmentService';
import { formatMYR2 } from '@/utils/format';

export function InstallmentsPage() {
  const { month, monthLabel, options } = useMonth();
  const model = useInstallmentsStore(month);
  const [editingId, setEditingId] = useState<string | null>(null);

  const editingEntry = useMemo(
    () => model.entries.find((e) => e.id === editingId) ?? null,
    [model.entries, editingId]
  );

  useEffect(() => {
    if (editingId && !model.entries.some((e) => e.id === editingId)) {
      setEditingId(null);
    }
  }, [editingId, model.entries]);

  const activeThisMonth = activeEntriesForMonth(model.entries, month);

  const categoryName = (id: string) =>
    model.categories.find((c) => c.id === id)?.name ?? id;

  const monthOptions = [
    ...options,
    { value: '2026-06', label: 'June 2026' },
    { value: '2026-07', label: 'July 2026' },
  ];

  return (
    <AppShell title="Installment">
      <div className="bnpl-installments">
      <div className="bajet-stat-grid">
        <StatCard
          label="Total installment amount"
          value={formatMYR2(model.summary.totalDue)}
        />
        <StatCard
          label="Total paid"
          value={formatMYR2(model.summary.totalPaid)}
        />
        <StatCard
          label="Total unpaid"
          value={formatMYR2(model.summary.totalUnpaid)}
        />
        <StatCard
          label="Active installments"
          value={String(model.summary.activeCount)}
        />
      </div>

      <PageSection>
        <InstallmentCharts
          categoryRows={model.categoryBalances}
          monthlyTrend={model.monthlyTrend}
        />
      </PageSection>

      <PageSection>
        <div className="bajet-panel bnpl-panel-pad">
          <h2 className="bajet-section__title bnpl-in-panel-title">Category limits</h2>
          <CategoryLimitSection
            rows={model.categoryBalances}
            onUpdate={model.updateCategory}
            onDelete={model.deleteCategory}
            onAdd={model.addCategory}
          />
        </div>
      </PageSection>

      <div className="bnpl-two-col">
        <div className="bnpl-two-col__cell">
        <PageSection>
          <div className="bajet-panel bnpl-panel-pad bnpl-two-col__panel">
            <h2 className="bajet-section__title bnpl-in-panel-title">
              {editingEntry ? 'Edit installment / BNPL' : 'Add installment / BNPL'}
            </h2>
            <InstallmentForm
              categories={model.categories}
              defaultStartMonth={month}
              editingEntry={editingEntry}
              onAdd={model.addEntry}
              onUpdate={(id, data) => {
                model.updateEntry(id, data);
                setEditingId(null);
              }}
              onCancelEdit={() => setEditingId(null)}
            />
          </div>
        </PageSection>
        </div>

        <div className="bnpl-two-col__cell">
        <PageSection>
          <div className="bajet-panel bnpl-panel-pad bnpl-two-col__panel">
            <h2 className="bajet-section__title bnpl-in-panel-title">This month’s commitments</h2>
            <MonthlyCommitmentsTable
              month={month}
              monthLabel={monthLabel}
              entries={activeThisMonth}
              statuses={model.statuses}
              categoryName={categoryName}
              onTogglePaid={model.togglePaid}
            />
          </div>
        </PageSection>
        </div>
      </div>

      <PageSection>
        <div className="bajet-panel bnpl-panel-pad">
          <h2 className="bajet-section__title bnpl-in-panel-title">All installments</h2>
          <InstallmentMasterTable
            entries={model.entries}
            statuses={model.statuses}
            categories={model.categories}
            contextMonth={month}
            monthOptions={monthOptions}
            onRemove={model.removeEntry}
            onEdit={(id) => setEditingId(id)}
          />
        </div>
      </PageSection>

      <style>{`
        .bnpl-installments {
          display: flex;
          flex-direction: column;
          gap: clamp(1rem, 2vw, 1.5rem);
        }
        .bnpl-panel-pad {
          padding: 1.15rem 1.25rem 1.25rem;
        }
        .bnpl-in-panel-title {
          margin: 0 0 0.9rem;
        }
        .bnpl-two-col__panel .bnpl-in-panel-title {
          flex-shrink: 0;
        }
        .bnpl-two-col {
          display: grid;
          gap: clamp(1rem, 2vw, 1.5rem);
          grid-template-columns: repeat(2, minmax(0, 1fr));
          align-items: stretch;
        }
        .bnpl-two-col__cell {
          display: flex;
          flex-direction: column;
          min-width: 0;
          min-height: 0;
        }
        .bnpl-two-col__cell > .bajet-section {
          flex: 1;
          display: flex;
          flex-direction: column;
          min-height: 0;
        }
        .bnpl-two-col__panel {
          flex: 1;
          display: flex;
          flex-direction: column;
          min-height: 0;
        }
        @media (max-width: 900px) {
          .bnpl-two-col {
            grid-template-columns: 1fr;
          }
          .bnpl-two-col__cell > .bajet-section,
          .bnpl-two-col__panel {
            flex: 0 1 auto;
          }
        }
        @media (max-width: 640px) {
          .bnpl-installments {
            gap: clamp(0.85rem, 2.5vw, 1.15rem);
            padding-left: max(0px, env(safe-area-inset-left, 0px));
            padding-right: max(0px, env(safe-area-inset-right, 0px));
            touch-action: manipulation;
            font-size: 95%;
          }
          .bnpl-installments .bajet-section {
            gap: 1.2rem;
          }
          .bnpl-installments .bajet-section__head {
            gap: 0.4rem;
          }
          .bnpl-installments .bnpl-panel-pad {
            padding: 0.72rem 0.78rem 0.85rem;
          }
          .bnpl-installments .bajet-stat-grid {
            gap: 0.95rem;
          }
          .bnpl-installments .stat-card {
            padding: 1.05rem 1.12rem;
            min-height: 102px;
          }
          .bnpl-installments .stat-card__label {
            font-size: 0.7rem;
          }
          .bnpl-installments .stat-card__value {
            font-size: 1.32rem;
          }
          .bnpl-installments .stat-card__hint {
            font-size: 0.76rem;
            line-height: 1.45;
          }
          .bnpl-installments .bajet-section__title {
            font-size: 0.95rem;
            line-height: 1.32;
            letter-spacing: -0.015em;
          }
          .bnpl-installments .bajet-section__desc {
            font-size: 0.77rem;
            line-height: 1.58;
            max-width: 100%;
          }
          .bnpl-installments .bnpl-two-col {
            gap: 1.05rem;
          }
        }
      `}</style>
      </div>
    </AppShell>
  );
}
