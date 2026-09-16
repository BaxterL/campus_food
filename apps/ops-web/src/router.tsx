import { MainLayout } from '@/layouts/MainLayout';
import { AuditLogPage } from '@/pages/audit/AuditLogPage';
import { DispatchBoardPage } from '@/pages/dispatch/DispatchBoardPage';
import { FinancePage } from '@/pages/finance/FinancePage';
import { LoginPage } from '@/pages/LoginPage';
import { MerchantListPage } from '@/pages/merchants/MerchantListPage';
import { OrderWorkbenchPage } from '@/pages/orders/OrderWorkbenchPage';
import { OverviewPage } from '@/pages/OverviewPage';
import { ProductListPage } from '@/pages/products/ProductListPage';
import { RiderWhitelistPage } from '@/pages/riders/RiderWhitelistPage';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate, Route, Routes } from 'react-router-dom';

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { identity } = useAuth();
  if (!identity) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export function AppRouter() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        element={
          <RequireAuth>
            <MainLayout />
          </RequireAuth>
        }
      >
        <Route index element={<OverviewPage />} />
        <Route path="merchants" element={<MerchantListPage />} />
        <Route path="products" element={<ProductListPage />} />
        <Route path="orders" element={<OrderWorkbenchPage />} />
        <Route path="dispatch" element={<DispatchBoardPage />} />
        <Route path="riders" element={<RiderWhitelistPage />} />
        <Route path="finance" element={<FinancePage />} />
        <Route path="audit" element={<AuditLogPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
