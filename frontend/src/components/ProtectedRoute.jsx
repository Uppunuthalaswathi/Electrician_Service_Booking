import { useContext } from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

const ProtectedRoute = ({ children, role }) => {
  const { user } = useContext(AuthContext);

  if (!user) return <Navigate to="/" />;

  if (role && user.role !== role) return <h2>Unauthorized ❌</h2>;

  return children;
};

export default ProtectedRoute;