import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// Reads auth state from AuthContext (which itself reads from the /me endpoint on mount).
// Never reads raw localStorage — that data can be stale or partial.
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading, authChecked } = useAuth();

  // Wait until the auth check completes before making any redirect decision.
  // Without this, a page refresh always flashes to /login for a split second.
  if (!authChecked || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600" />
      </div>
    );
  }

  // Not logged in at all
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Logged in but wrong role for this route
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/newhome" replace />;
  }

  return children;
};

export default ProtectedRoute;
