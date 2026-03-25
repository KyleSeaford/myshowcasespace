import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export function PublicOnlyRoute() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="centered-state">Loading...</div>;
  }

  if (user) {
    return <Navigate to="/app" replace />;
  }

  return <Outlet />;
}

