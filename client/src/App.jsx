import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import AdminLayout from "./components/layout/AdminLayout.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import DashboardPage from "./pages/DashboardPage.jsx";
import UsersPage from "./pages/UsersPage.jsx";
import GoldOverviewPage from "./pages/GoldOverviewPage.jsx";
import SilverOverviewPage from "./pages/SilverOverviewPage.jsx";
import TransactionsPage from "./pages/TransactionsPage.jsx";
import WithdrawalsPage from "./pages/WithdrawalsPage.jsx";
import OrdersPage from "./pages/OrdersPage.jsx";
import ProductsPage from "./pages/ProductsPage.jsx";
import SettingsPage from "./pages/SettingsPage.jsx";
import { ToastProvider } from "./components/common/Toast.jsx";
import { useAuthStore } from "./store/authStore.js";

// Global React Query client — serves cached live data instantly and refreshes in background
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 0,
      gcTime: 10 * 60 * 1000,
      refetchOnWindowFocus: true,
      retry: 1,
    },
  },
});

// Protected Route wrapper
function ProtectedRoute({ children }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Authentication Route */}
            <Route path="/login" element={<LoginPage />} />

            {/* Protected Admin Console Routes */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <AdminLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/dashboard" replace />} />

              {/* 1. Dashboard */}
              <Route path="dashboard" element={<DashboardPage />} />

              {/* 2. Users */}
              <Route path="users" element={<UsersPage />} />
              <Route path="users/:id" element={<UsersPage />} />
              <Route path="kyc" element={<Navigate to="/users" replace />} />
              <Route
                path="kyc/:id"
                element={<Navigate to="/users" replace />}
              />

              {/* 3. Gold (Single Overview Screen) */}
              <Route path="gold" element={<GoldOverviewPage />} />
              <Route path="gold/*" element={<Navigate to="/gold" replace />} />

              {/* 4. Silver (Single Overview Screen) */}
              <Route path="silver" element={<SilverOverviewPage />} />
              <Route
                path="silver/*"
                element={<Navigate to="/silver" replace />}
              />

              {/* 5. Products Catalog (Physical Gold & Silver Products) */}
              <Route path="products" element={<ProductsPage />} />

              {/* 6. Physical Orders & Purchase Requests */}
              <Route path="orders" element={<OrdersPage />} />
              <Route path="purchase-requests" element={<OrdersPage />} />

              {/* 7. Transactions */}
              <Route path="transactions" element={<TransactionsPage />} />

              {/* 8. Cash Withdrawal Requests */}
              <Route path="withdrawals" element={<WithdrawalsPage />} />

              {/* 5. Settings (Profile, Terms & Conditions, Privacy Policy) */}
              <Route path="settings" element={<SettingsPage />} />
              <Route
                path="profile"
                element={<Navigate to="/settings" replace />}
              />

              {/* Wildcard fallback */}
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </QueryClientProvider>
  );
}
