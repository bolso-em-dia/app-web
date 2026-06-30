import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./app/auth/useAuth";
import Spinner from "./components/feedback/Spinner";
import AccountsPage from "./pages/accounts/AccountsPage";
import CategoriesPage from "./pages/categories/CategoriesPage";
import EnvelopesPage from "./pages/envelopes/EnvelopesPage";
import FamilyPage from "./pages/family/FamilyPage";
import FixedExpensesPage from "./pages/fixed-expenses/FixedExpensesPage";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import TransactionsPage from "./pages/transactions/TransactionsPage";

function ProtectedRoute({ children }: { children: JSX.Element }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <Spinner label="Loading session" fullScreen />;
  }

  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
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
        path="/envelopes"
        element={
          <ProtectedRoute>
            <EnvelopesPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/fixed-expenses"
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
    </Routes>
  );
}
