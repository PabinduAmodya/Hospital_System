import { Link, useLocation } from "react-router-dom";

function Sidebar() {
  const role = localStorage.getItem("role");
  const location = useLocation();

  const menuItem = (path, label) => (
    <li>
      <Link
        to={path}
        className={`flex items-center gap-2 px-3 py-2 rounded-lg transition ${
          location.pathname === path
            ? "bg-blue-600 text-white shadow"
            : "text-gray-200 hover:bg-gray-800 hover:text-white"
        }`}
      >
        <span className="text-sm font-medium">{label}</span>
      </Link>
    </li>
  );

  return (
    <div className="w-64 h-screen bg-slate-950 text-white p-5 fixed border-r border-slate-800">
      <div className="mb-8">
        <h2 className="text-xl font-bold leading-tight">Hospital HMS</h2>
        <p className="text-xs text-slate-300 mt-1">Role: {role || "—"}</p>
      </div>

      <ul className="space-y-2">
        {menuItem("/dashboard", "Dashboard")}
        {menuItem("/appointments", "Appointments")}

        {/* ADMIN */}
        {role === "ADMIN" && (
          <>
            <div className="mt-4 mb-2 text-xs uppercase tracking-wider text-slate-400">
              Management
            </div>
            {menuItem("/patients", "Patients")}
            {menuItem("/doctors", "Doctors")}
            {menuItem("/schedules", "Schedules")}
            {menuItem("/tests", "Medical Tests")}
            {menuItem("/billing", "Billing")}
            {menuItem("/users", "User Management")}
            {menuItem("/settings", "Settings")}
          </>
        )}

        {/* RECEPTIONIST */}
        {role === "RECEPTIONIST" && (
          <>
            <div className="mt-4 mb-2 text-xs uppercase tracking-wider text-slate-400">
              Reception
            </div>
            {menuItem("/patients", "Patients")}
            {menuItem("/doctors", "Doctors")}
            {menuItem("/schedules", "Schedules")}
            {menuItem("/tests", "Medical Tests")}
          </>
        )}

        {/* CASHIER */}
        {role === "CASHIER" && (
          <>
            <div className="mt-4 mb-2 text-xs uppercase tracking-wider text-slate-400">
              Cashier
            </div>
            {menuItem("/billing", "Billing")}
            {menuItem("/tests", "Medical Tests")}
          </>
        )}
      </ul>
    </div>
  );
}

export default Sidebar;