import { BrowserRouter, Routes, Route } from "react-router-dom";
import ForgotPassword from "../pages/auth/ForgotPassword";
import Login from "../pages/auth/Login";
import Register from "../pages/auth/Register";


import UserDashboard from "../pages/user/Dashboard";
import ElectricianDashboard from "../pages/electrician/Dashboard";
import AdminDashboard from "../pages/admin/Dashboard";

import ProtectedRoute from "../components/ProtectedRoute";

const AppRoutes = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Auth */}
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot" element={<ForgotPassword />} />

        <Route path="/user" element={<UserDashboard />} />
        <Route path="/electrician" element={<ElectricianDashboard />} />
        {/* User */}
        <Route
          path="/user"
          element={
            <ProtectedRoute role="user">
              <UserDashboard />
            </ProtectedRoute>
          }
        />

        {/* Electrician */}
        <Route
          path="/electrician"
          element={
            <ProtectedRoute role="electrician">
              <ElectricianDashboard />
            </ProtectedRoute>
          }
        />

        {/* Admin */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute role="admin">
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
};

export default AppRoutes;