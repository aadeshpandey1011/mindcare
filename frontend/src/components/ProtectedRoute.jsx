import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ children, allowedRoles }) => {
  const storedUser = localStorage.getItem("user");
  if (!storedUser) return <Navigate to="/login" replace />;

  let user;
  try {
    user = JSON.parse(storedUser);
  } catch {
    return <Navigate to="/login" replace />;
  }

  if (!user.role || !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;

