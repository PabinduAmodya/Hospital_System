import { Link, useLocation } from "react-router-dom";

const icons = {
  dashboard: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  ),
  queue: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
    </svg>
  ),
  consultations: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),
  patients: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  schedule: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),
  profile: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
};

function DoctorSidebar() {
  const location = useLocation();
  const doctorName = localStorage.getItem("name") || "Doctor";
  const specialization = localStorage.getItem("specialization") || "General";

  const initials = doctorName
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const menuItem = (path, label, icon) => {
    const isActive = location.pathname === path;
    return (
      <li key={path}>
        <Link
          to={path}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${
            isActive
              ? "bg-blue-600 text-white shadow-lg shadow-blue-600/25"
              : "text-slate-400 hover:bg-slate-800/50 hover:text-white"
          }`}
        >
          <span className={isActive ? "text-white" : "text-slate-500"}>{icon}</span>
          <span className="text-sm font-medium">{label}</span>
        </Link>
      </li>
    );
  };

  const sectionLabel = (label) => (
    <li key={`section-${label}`} className="pt-5 pb-1.5 px-3">
      <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-600">{label}</span>
    </li>
  );

  return (
    <div className="w-64 h-screen bg-slate-950 text-white fixed border-r border-slate-800/50 flex flex-col">
      {/* Brand */}
      <div className="px-5 py-6 border-b border-slate-800/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-700 flex items-center justify-center shadow-lg shadow-emerald-600/20">
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </div>
          <div>
            <h2 className="text-base font-bold text-white leading-tight">Hospital HMS</h2>
            <p className="text-[10px] text-emerald-400 font-medium uppercase tracking-wider mt-0.5">Doctor Portal</p>
          </div>
        </div>
      </div>

      {/* Doctor Info */}
      <div className="px-4 py-4 border-b border-slate-800/50">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center text-xs font-bold text-white shadow-sm">
            {initials}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white truncate">Dr. {doctorName}</p>
            <p className="text-[10px] text-slate-500 truncate">{specialization}</p>
          </div>
        </div>
      </div>

      {/* Menu */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="space-y-1">
          {menuItem("/doctor/dashboard", "Dashboard", icons.dashboard)}

          {sectionLabel("Clinical")}
          {menuItem("/doctor/queue", "My Queue", icons.queue)}
          {menuItem("/doctor/consultations", "Consultations", icons.consultations)}
          {menuItem("/doctor/patients", "My Patients", icons.patients)}

          {sectionLabel("Management")}
          {menuItem("/doctor/schedule", "My Schedule", icons.schedule)}
          {menuItem("/profile", "Profile", icons.profile)}
        </ul>
      </nav>

      {/* Footer */}
      <div className="px-5 py-4 border-t border-slate-800/50">
        <p className="text-[10px] text-slate-600 text-center">Hospital Management System v1.0</p>
      </div>
    </div>
  );
}

export default DoctorSidebar;
