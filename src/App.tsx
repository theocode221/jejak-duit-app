import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { MonthProvider } from '@/context/MonthContext';
import { FinanceProvider } from '@/state/FinanceContext';
import { DashboardPage } from '@/pages/DashboardPage';
import { MonthlyBudgetPage } from '@/pages/MonthlyBudgetPage';
import { IncomeOTPage } from '@/pages/IncomeOTPage';
import { BillsPage } from '@/pages/BillsPage';
import { EventsPage } from '@/pages/EventsPage';
import { GearWishlistPage } from '@/pages/GearWishlistPage';
import { SideIncomePage } from '@/pages/SideIncomePage';

export default function App() {
  return (
    <BrowserRouter>
      <FinanceProvider>
      <MonthProvider>
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/budget" element={<MonthlyBudgetPage />} />
          <Route path="/income" element={<IncomeOTPage />} />
          <Route path="/bills" element={<BillsPage />} />
          <Route path="/events" element={<EventsPage />} />
          <Route path="/gear" element={<GearWishlistPage />} />
          <Route path="/side-income" element={<SideIncomePage />} />
        </Routes>
      </MonthProvider>
      </FinanceProvider>
    </BrowserRouter>
  );
}
