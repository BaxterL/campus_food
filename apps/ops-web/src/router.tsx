import type { OpsRole } from '@/api/types';
import { MERCHANT_OPS_ROLES, PLATFORM_ROLES, primaryOpsRole } from '@/lib/roles';
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
import { Spin } from 'antd';
import { Navigate, Route, Routes } from 'react-router-dom';
function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Spin size="large" />
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function RequireRole({
  roles,
  children,
}: {
  roles: readonly OpsRole[];
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  if (loading) return null;
  const role = user ? primaryOpsRole(user.roles) : null;
  if (!role || !roles.includes(role)) {
    return <Navigate to="/" replace />;
  }
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
        <Route
          path="merchants"
          element={
            <RequireRole roles={PLATFORM_ROLES}>
              <MerchantListPage />
            </RequireRole>
          }
        />
        <Route
          path="products"
          element={
            <RequireRole roles={MERCHANT_OPS_ROLES}>
              <ProductListPage />
            </RequireRole>
          }
        />
        <Route
          path="orders"
          element={
            <RequireRole roles={MERCHANT_OPS_ROLES}>
              <OrderWorkbenchPage />
            </RequireRole>
          }
        />
        <Route
          path="dispatch"
          element={
            <RequireRole roles={PLATFORM_ROLES}>
              <DispatchBoardPage />
            </RequireRole>
          }
        />
        <Route
          path="riders"
          element={
            <RequireRole roles={PLATFORM_ROLES}>
              <RiderWhitelistPage />
            </RequireRole>
          }
        />
        <Route
          path="finance"
          element={
            <RequireRole roles={PLATFORM_ROLES}>
              <FinancePage />
            </RequireRole>
          }
        />
        <Route
          path="audit"
          element={
            <RequireRole roles={PLATFORM_ROLES}>
              <AuditLogPage />
            </RequireRole>
          }
        />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
