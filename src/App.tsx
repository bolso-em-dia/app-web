import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./app/auth/useAuth";
import Spinner from "./components/feedback/Spinner";
import CategoriesPage from "./pages/categories/CategoriesPage";
import FamilyPage from "./pages/family/FamilyPage";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import PlaceholderPage from "./pages/shared/PlaceholderPage";

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
            <PlaceholderPage
              title="Accounts"
              subtitle="Manage bank accounts, savings, and cards."
            />
          </ProtectedRoute>
        }
      />
      <Route
        path="/envelopes"
        element={
          <ProtectedRoute>
            <PlaceholderPage
              title="Envelopes"
              subtitle="Manage family budgets and allowance envelopes."
            />
          </ProtectedRoute>
        }
      />
      <Route
        path="/fixed-expenses"
        element={
          <ProtectedRoute>
            <PlaceholderPage
              title="Fixed expenses"
              subtitle="Manage recurring transaction templates."
            />
          </ProtectedRoute>
        }
      />
      <Route
        path="/transactions"
        element={
          <ProtectedRoute>
            <PlaceholderPage
              title="Transactions"
              subtitle="Review and manage the monthly transaction history."
            />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}
