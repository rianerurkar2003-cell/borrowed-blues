import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/state/AuthContext";

/**
 * Guard used by both portals. Renders `children` only when the current
 * user matches the required role. Redirects otherwise.
 */
export default function ProtectedRoute({ role, children }) {
  const { user } = useAuth();
  const location = useLocation();

  if (user === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bb-cream">
        <div className="bb-italic-serif text-bb-teal text-lg">A quiet moment…</div>
      </div>
    );
  }
  if (user === false) return <Navigate to="/login" state={{ from: location }} replace />;
  if (role && user.role !== role) {
    return <Navigate to={user.role === "therapist" ? "/therapist" : "/portal"} replace />;
  }
  return children;
}
