import { Navigate } from "react-router-dom";
import { useAuth } from "./AuthContext";

/**
 * Wraps any route that requires authentication.
 * If ownerOnly=true, redirects staff to "/" (they'll see the staff home).
 */
export default function ProtectedRoute({ children, ownerOnly = false }) {
  const { user, role, loading } = useAuth();

  if (loading) return <div className="screen-loading">Loading…</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (ownerOnly && role !== "owner") return <Navigate to="/" replace />;

  return children;
}
