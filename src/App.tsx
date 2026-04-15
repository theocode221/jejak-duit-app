import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { MonthProvider } from '@/context/MonthContext';
import { InstallmentsProvider } from '@/features/installments/useInstallmentsStore';
import { FinanceProvider } from '@/state/FinanceContext';
import { DashboardPage } from '@/pages/DashboardPage';
import { MonthlyBudgetPage } from '@/pages/MonthlyBudgetPage';
import { IncomeOTPage } from '@/pages/IncomeOTPage';
import { BillsPage } from '@/pages/BillsPage';
import { EventsPage } from '@/pages/EventsPage';
import { SideIncomePage } from '@/pages/SideIncomePage';
import { InstallmentsPage } from '@/pages/InstallmentsPage';

export default function App() {
  return (
    <BrowserRouter>
      <FinanceProvider>
      <InstallmentsProvider>
      <MonthProvider>
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/budget" element={<MonthlyBudgetPage />} />
          <Route path="/income" element={<IncomeOTPage />} />
          <Route path="/bills" element={<BillsPage />} />
          <Route path="/events" element={<EventsPage />} />
          <Route path="/side-income" element={<SideIncomePage />} />
          <Route path="/installments" element={<InstallmentsPage />} />
        </Routes>
      </MonthProvider>
      </InstallmentsProvider>
      </FinanceProvider>
    </BrowserRouter>
  );
}
