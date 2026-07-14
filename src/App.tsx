import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { useAuth } from "./app/auth/useAuth";
import { useI18n } from "./app/i18n/I18nContext";
import ErrorBoundary from "./components/ErrorBoundary";
import Spinner from "./components/feedback/Spinner";
import AccountsPage from "./pages/accounts/AccountsPage";
import CategoriesPage from "./pages/categories/CategoriesPage";
import BudgetsPage from "./pages/budgets/BudgetsPage";
import ChangePasswordPage from "./pages/ChangePasswordPage";
import FamilyPage from "./pages/family/FamilyPage";
import FixedExpensesPage from "./pages/fixed-expenses/FixedExpensesPage";
import HomePage from "./pages/HomePage";
import UserSettingsPage from "./pages/settings/UserSettingsPage";
import LoginPage from "./pages/LoginPage";
import TransactionsPage from "./pages/transactions/TransactionsPage";

function ProtectedRoute({ children }: { children: JSX.Element }) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const { t } = useI18n();
  const location = useLocation();

  if (isLoading) {
    return <Spinner label={t("app.loadingSession")} fullScreen />;
  }

  const mustChangePassword = isAuthenticated && user?.mustChangePassword;
  const isOnChangePassword = location.pathname === "/change-password";

  if (mustChangePassword && !isOnChangePassword) {
    return <Navigate to="/change-password" replace />;
  }

  if (isAuthenticated && !mustChangePassword && isOnChangePassword) {
    return <Navigate to="/transactions" replace />;
  }

  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/change-password"
        element={
          <ProtectedRoute>
            <ErrorBoundary>
              <ChangePasswordPage />
            </ErrorBoundary>
          </ProtectedRoute>
        }
      />
      <Route path="/" element={<Navigate to="/transactions" replace />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <ErrorBoundary>
              <HomePage />
            </ErrorBoundary>
          </ProtectedRoute>
        }
      />
      <Route
        path="/family"
        element={
          <ProtectedRoute>
            <ErrorBoundary>
              <FamilyPage />
            </ErrorBoundary>
          </ProtectedRoute>
        }
      />
      <Route
        path="/categories"
        element={
          <ProtectedRoute>
            <ErrorBoundary>
              <CategoriesPage />
            </ErrorBoundary>
          </ProtectedRoute>
        }
      />
      <Route
        path="/accounts"
        element={
          <ProtectedRoute>
            <ErrorBoundary>
              <AccountsPage />
            </ErrorBoundary>
          </ProtectedRoute>
        }
      />
      <Route
        path="/budgets"
        element={
          <ProtectedRoute>
            <ErrorBoundary>
              <BudgetsPage />
            </ErrorBoundary>
          </ProtectedRoute>
        }
      />
      <Route
        path="/fixed-transactions"
        element={
          <ProtectedRoute>
            <ErrorBoundary>
              <FixedExpensesPage />
            </ErrorBoundary>
          </ProtectedRoute>
        }
      />
      <Route
        path="/transactions"
        element={
          <ProtectedRoute>
            <ErrorBoundary>
              <TransactionsPage />
            </ErrorBoundary>
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <ErrorBoundary>
              <UserSettingsPage />
            </ErrorBoundary>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}
