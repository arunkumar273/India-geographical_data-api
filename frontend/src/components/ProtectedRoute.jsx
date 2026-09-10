import { Navigate } from "react-router-dom";

function ProtectedRoute({ children, adminOnly = false }) {
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (adminOnly && role !== "ADMIN") {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

export default ProtectedRoute;