import { Navigate, useLocation } from "react-router-dom";

const getStoredUser = () => {
  try {
    return JSON.parse(localStorage.getItem("user") || "null");
  } catch {
    return null;
  }
};

const getUserRoles = (user) => {
  if (!user) return [];
  if (Array.isArray(user.roles)) return user.roles;
  if (user.role) return [user.role];
  return [];
};

const ProtectedRoute = ({ children, role }) => {
  const location = useLocation();
  const token = localStorage.getItem("token");
  const user = getStoredUser();
  const roles = getUserRoles(user);

  if (!token) return <Navigate to="/" replace state={{ from: location }} />;
  if (role && !roles.includes(role)) return <Navigate to="/" replace />;

  return children;
};

export default ProtectedRoute;
