import { useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const titles = {
  "/dashboard": "Dashboard",
  "/patients": "Patients",
  "/doctors": "Doctors",
  "/schedules": "Schedules",
  "/appointments": "Appointments",
  "/billing": "Billing",
  "/users": "User Management",
  "/tests": "Medical Tests",
};

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const name = localStorage.getItem("name");
  const role = localStorage.getItem("role");

  const title = useMemo(() => titles[location.pathname] || "Hospital HMS", [location.pathname]);

  const logout = () => {
    localStorage.clear();
    navigate("/");
  };

  return (
    <div className="h-16 bg-white shadow-sm flex items-center justify-between px-6 border-b">
      <div>
        <h1 className="text-lg font-semibold">{title}</h1>
        <p className="text-xs text-gray-500">{name ? `${name} (${role})` : role}</p>
      </div>

      <button
        onClick={logout}
        className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition"
      >
        Logout
      </button>
    </div>
  );
}

export default Navbar;
