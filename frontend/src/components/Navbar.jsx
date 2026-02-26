import { useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const titles = {
  "/dashboard":    "Dashboard",
  "/patients":     "Patients",
  "/doctors":      "Doctors",
  "/schedules":    "Schedules",
  "/appointments": "Appointments",
  "/billing":      "Billing",
  "/users":        "User Management",
  "/tests":        "Medical Tests",
  "/settings":     "Settings",
  "/profile":      "My Profile",
};

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const name = localStorage.getItem("name");
  const role = localStorage.getItem("role");
  const title = useMemo(() => titles[location.pathname] || "Hospital HMS", [location.pathname]);

  const logout = () => { localStorage.clear(); navigate("/"); };

  const initials = (name || "U").split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();

  return (
    <div className="h-16 bg-white shadow-sm flex items-center justify-between px-6 border-b">
      <div>
        <h1 className="text-lg font-semibold">{title}</h1>
        <p className="text-xs text-gray-500">{name ? `${name} · ${role}` : role}</p>
      </div>

      <div className="flex items-center gap-2">
        {/* Profile button */}
        <button
          onClick={() => navigate("/profile")}
          title="My Profile"
          className={`flex items-center gap-2 px-3 py-2 rounded-lg transition text-sm
            ${location.pathname === "/profile"
              ? "bg-blue-50 text-blue-700"
              : "text-gray-600 hover:bg-gray-100"}`}
        >
          <span className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
            {initials}
          </span>
          <span className="hidden md:block font-medium">{name || "Profile"}</span>
        </button>

        {/* Logout */}
        <button
          onClick={logout}
          className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition text-sm font-medium"
        >
          Logout
        </button>
      </div>
    </div>
  );
}

export default Navbar;