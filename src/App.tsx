import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { useAuth } from "./app/auth/useAuth";
import { useI18n } from "./app/i18n/I18nContext";
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

  if (isAuthenticated && user?.mustChangePassword && location.pathname !== "/change-password") {
    return <Navigate to="/change-password" replace />;
  }

  if (isAuthenticated && !user?.mustChangePassword && location.pathname === "/change-password") {
    return <Navigate to="/dashboard" replace />;
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
            <ChangePasswordPage />
          </ProtectedRoute>
        }
      />
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <HomePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/family"
        element={
          <ProtectedRoute>
            <FamilyPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/categories"
        element={
          <ProtectedRoute>
            <CategoriesPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/accounts"
        element={
          <ProtectedRoute>
            <AccountsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/budgets"
        element={
          <ProtectedRoute>
            <BudgetsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/fixed-transactions"
        element={
          <ProtectedRoute>
            <FixedExpensesPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/transactions"
        element={
          <ProtectedRoute>
            <TransactionsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <UserSettingsPage />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}
