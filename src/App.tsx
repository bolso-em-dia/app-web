import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./app/auth/useAuth";
import Spinner from "./components/feedback/Spinner";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";

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
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <HomePage />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}
