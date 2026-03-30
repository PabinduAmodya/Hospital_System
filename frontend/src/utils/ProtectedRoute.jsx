import { Navigate } from "react-router-dom";

function ProtectedRoute({ children, allowedRoles }) {
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");

  // If no token → go to login
  if (!token) {
    return <Navigate to="/" replace />;
  }

  // If role restriction exists and role not allowed
  if (allowedRoles && !allowedRoles.includes(role)) {
    if (role === "DOCTOR") {
      return <Navigate to="/doctor/dashboard" replace />;
    } else if (role === "PATIENT") {
      return <Navigate to="/patient/dashboard" replace />;
    } else {
      return <Navigate to="/dashboard" replace />;
    }
  }

  return children;
}

export default ProtectedRoute;
