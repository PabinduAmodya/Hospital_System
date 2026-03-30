import { useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const titles = {
  "/dashboard":    "Dashboard",
  "/patients":     "Patients",
  "/doctors":      "Doctors",
  "/schedules":    "Schedules",
  "/appointments": "Appointments",
  "/billing":      "Billing & Payments",
  "/users":        "User Management",
  "/tests":        "Medical Tests",
  "/settings":     "System Settings",
  "/profile":      "My Profile",
  "/reports":      "Reports & Analytics",
  "/activity-log": "Activity Log",
  "/doctor/dashboard":     "Doctor Dashboard",
  "/doctor/queue":         "Today's Queue",
  "/doctor/consultations": "My Consultations",
  "/doctor/patients":      "My Patients",
  "/doctor/schedule":      "My Schedule",
  "/patient/dashboard":    "Patient Dashboard",
  "/patient/doctors":      "Find a Doctor",
  "/patient/appointments": "My Appointments",
  "/patient/records":      "Medical Records",
  "/patient/bills":        "My Bills",
  "/patient/profile":      "My Profile",
};

const subtitles = {
  "/dashboard":    "Overview of hospital operations",
  "/patients":     "Manage patient records",
  "/doctors":      "Manage doctor profiles and specializations",
  "/schedules":    "Doctor availability and schedules",
  "/appointments": "Book and manage appointments",
  "/billing":      "Bills, payments, and receipts",
  "/users":        "Manage system users and roles",
  "/tests":        "Medical test catalog",
  "/settings":     "Hospital configuration",
  "/profile":      "Account settings",
  "/reports":      "Revenue and performance analytics",
  "/activity-log": "System activity tracking",
  "/doctor/dashboard":     "Overview of your clinical day",
  "/doctor/queue":         "Patients waiting for consultation",
  "/doctor/consultations": "View all your consultations",
  "/doctor/patients":      "Patients you have treated",
  "/doctor/schedule":      "Your weekly availability",
  "/patient/dashboard":    "Overview of your health journey",
  "/patient/appointments": "View and manage your appointments",
  "/patient/records":      "Your consultation history",
  "/patient/bills":        "Your billing and payment history",
  "/patient/profile":      "Manage your account",
};

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const name = localStorage.getItem("name");
  const role = localStorage.getItem("role");
  const title = useMemo(() => {
    if (location.pathname.startsWith("/doctor/consultation/")) return "Consultation";
    return titles[location.pathname] || "Hospital HMS";
  }, [location.pathname]);
  const subtitle = useMemo(() => {
    if (location.pathname.startsWith("/doctor/consultation/")) return "Patient consultation form";
    return subtitles[location.pathname] || "";
  }, [location.pathname]);

  const logout = () => { localStorage.clear(); navigate("/"); };

  const initials = (name || "U").split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div className="h-16 bg-white/80 backdrop-blur-sm flex items-center justify-between px-6 border-b border-gray-200/80 sticky top-0 z-30">
      <div>
        <h1 className="text-lg font-semibold text-gray-900">{title}</h1>
        <p className="text-xs text-gray-400">{subtitle}</p>
      </div>

      <div className="flex items-center gap-4">
        {/* Date */}
        <span className="hidden lg:block text-xs text-gray-400 font-medium">{today}</span>

        {/* Divider */}
        <div className="hidden lg:block w-px h-8 bg-gray-200"></div>

        {/* Profile button */}
        <button
          onClick={() => navigate("/profile")}
          title="My Profile"
          className={`flex items-center gap-2.5 px-3 py-1.5 rounded-xl transition-all duration-200 ${
            location.pathname === "/profile"
              ? "bg-blue-50 ring-1 ring-blue-200"
              : "hover:bg-gray-50"
          }`}
        >
          <span className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 text-white flex items-center justify-center text-xs font-bold flex-shrink-0 shadow-sm">
            {initials}
          </span>
          <div className="hidden md:block text-left">
            <p className="text-sm font-medium text-gray-900 leading-tight">{name || "Profile"}</p>
            <p className="text-[10px] text-gray-400 leading-tight">{role}</p>
          </div>
        </button>

        {/* Logout */}
        <button
          onClick={logout}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium text-gray-500 hover:text-red-600 hover:bg-red-50 transition-all duration-200"
          title="Logout"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>
    </div>
  );
}

export default Navbar;
