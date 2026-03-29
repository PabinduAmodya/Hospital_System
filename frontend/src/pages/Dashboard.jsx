import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../layouts/DashboardLayout";
import API from "../api/axios";
import StatCard from "../components/ui/StatCard";
import LoadingSpinner from "../components/ui/LoadingSpinner";
import Card from "../components/ui/Card";
import StatusBadge from "../components/ui/StatusBadge";

// ─── SVG Icons ───────────────────────────────────────────────────────────────

const icons = {
  patients: (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
    </svg>
  ),
  calendar: (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
    </svg>
  ),
  currency: (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
    </svg>
  ),
  document: (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
    </svg>
  ),
  stethoscope: (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
    </svg>
  ),
  weeklyAppts: (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
    </svg>
  ),
  todayRevenue: (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  monthlyRevenue: (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
    </svg>
  ),
  clock: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  userPlus: (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z" />
    </svg>
  ),
  calendarPlus: (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5m-9-6h.008v.008H12v-.008zM12 15h.008v.008H12V15zm0 2.25h.008v.008H12v-.008zM9.75 15h.008v.008H9.75V15zm0 2.25h.008v.008H9.75v-.008zM7.5 15h.008v.008H7.5V15zm0 2.25h.008v.008H7.5v-.008zm6.75-4.5h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008V15zm0 2.25h.008v.008h-.008v-.008zm2.25-4.5h.008v.008H16.5v-.008zm0 2.25h.008v.008H16.5V15z" />
    </svg>
  ),
  receipt: (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 14.25l6-6m4.5-3.493V21.75l-3.75-1.5-3.75 1.5-3.75-1.5-3.75 1.5V4.757c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0c1.1.128 1.907 1.077 1.907 2.185zM9.75 9h.008v.008H9.75V9zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm4.125 4.5h.008v.008h-.008V13.5zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
    </svg>
  ),
  chart: (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
    </svg>
  ),
  trophy: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 007.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M18.75 4.236c.982.143 1.954.317 2.916.52A6.003 6.003 0 0016.27 9.728M18.75 4.236V4.5c0 2.108-.966 3.99-2.48 5.228m0 0a6.023 6.023 0 01-2.77.853m0 0l-.5 3.169m0 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172" />
    </svg>
  ),
};

// ─── Currency formatter ──────────────────────────────────────────────────────

function formatCurrency(amount) {
  const num = Number(amount) || 0;
  return `Rs. ${num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatCurrencyShort(amount) {
  const num = Number(amount) || 0;
  if (num >= 1000000) return `Rs. ${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `Rs. ${(num / 1000).toFixed(1)}k`;
  return `Rs. ${num.toLocaleString()}`;
}

// ─── Date helpers ────────────────────────────────────────────────────────────

function formatDate(dateStr) {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatTime(timeStr) {
  if (!timeStr) return "--:--";
  const [h, m] = timeStr.split(":");
  const hour = parseInt(h);
  const ampm = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${m} ${ampm}`;
}

function getDateStr(daysAgo) {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().slice(0, 10);
}

// ─── Revenue Bar Chart ───────────────────────────────────────────────────────

function RevenueChart({ data, width = 700, height = 280 }) {
  const PAD = { top: 24, right: 20, bottom: 52, left: 64 };
  const innerW = width - PAD.left - PAD.right;
  const innerH = height - PAD.top - PAD.bottom;

  const maxVal = Math.max(...data.map((d) => d.revenue), 1);
  const niceMax = (() => {
    const mag = Math.pow(10, Math.floor(Math.log10(maxVal)));
    const normalized = maxVal / mag;
    const steps = [1, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10];
    const step = steps.find((s) => s >= normalized) || 10;
    return step * mag;
  })();

  const yTicks = 5;
  const gap = Math.max(4, Math.min(8, innerW / data.length * 0.15));
  const barW = Math.max((innerW / data.length) - gap, 6);

  const xOf = (i) => PAD.left + (i + 0.5) * (innerW / data.length);
  const yOf = (v) => PAD.top + innerH - (v / niceMax) * innerH;
  const yTickVal = (i) => Math.round((niceMax / yTicks) * i);

  const [hovered, setHovered] = useState(null);

  // Show fewer x-labels if many bars
  const labelEvery = data.length > 20 ? 3 : data.length > 14 ? 2 : 1;

  return (
    <div className="relative w-full overflow-x-auto">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full"
        style={{ minWidth: Math.max(data.length * 28, 320) }}
      >
        {/* Grid lines and Y labels */}
        {Array.from({ length: yTicks + 1 }, (_, i) => {
          const val = yTickVal(i);
          const y = yOf(val);
          return (
            <g key={`y-${i}`}>
              <line
                x1={PAD.left} x2={PAD.left + innerW}
                y1={y} y2={y}
                stroke={i === 0 ? "#cbd5e1" : "#f1f5f9"}
                strokeWidth={i === 0 ? 1 : 1}
              />
              <text
                x={PAD.left - 10} y={y + 4}
                textAnchor="end" fontSize="11" fill="#94a3b8"
                fontFamily="system-ui"
              >
                {formatCurrencyShort(val)}
              </text>
            </g>
          );
        })}

        {/* Bars */}
        {data.map((d, i) => {
          const x = xOf(i) - barW / 2;
          const barH = Math.max((d.revenue / niceMax) * innerH, d.revenue > 0 ? 3 : 0);
          const y = yOf(d.revenue);
          const isHovered = hovered === i;

          return (
            <g
              key={i}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
              style={{ cursor: "pointer" }}
            >
              {/* Hover background */}
              <rect
                x={xOf(i) - innerW / data.length / 2}
                y={PAD.top}
                width={innerW / data.length}
                height={innerH}
                fill={isHovered ? "#f8fafc" : "transparent"}
                rx="2"
              />
              {/* Bar with gradient effect */}
              <defs>
                <linearGradient id={`bar-grad-${i}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={isHovered ? "#6366f1" : "#818cf8"} />
                  <stop offset="100%" stopColor={isHovered ? "#4f46e5" : "#6366f1"} />
                </linearGradient>
              </defs>
              <rect
                x={x} y={y} width={barW} height={barH}
                rx="3"
                fill={`url(#bar-grad-${i})`}
                style={{ transition: "all 0.2s ease" }}
              />
              {/* X label */}
              {i % labelEvery === 0 && (
                <text
                  x={xOf(i)} y={PAD.top + innerH + 18}
                  textAnchor="middle" fontSize="10" fill="#94a3b8"
                  fontFamily="system-ui"
                >
                  {formatDate(d.date)}
                </text>
              )}
            </g>
          );
        })}

        {/* Tooltip */}
        {hovered !== null && data[hovered] && (() => {
          const d = data[hovered];
          const tw = 130, th = 44;
          let tx = xOf(hovered) - tw / 2;
          tx = Math.max(4, Math.min(tx, width - tw - 4));
          const ty = Math.max(yOf(d.revenue) - th - 12, 4);
          return (
            <g>
              <rect x={tx} y={ty} width={tw} height={th} rx="8" fill="#1e293b" opacity="0.95" />
              <polygon
                points={`${xOf(hovered) - 5},${ty + th} ${xOf(hovered) + 5},${ty + th} ${xOf(hovered)},${ty + th + 6}`}
                fill="#1e293b" opacity="0.95"
              />
              <text x={tx + tw / 2} y={ty + 17} textAnchor="middle" fontSize="11" fill="#94a3b8" fontFamily="system-ui">
                {formatDate(d.date)}
              </text>
              <text x={tx + tw / 2} y={ty + 35} textAnchor="middle" fontSize="13" fontWeight="700" fill="#fff" fontFamily="system-ui">
                {formatCurrency(d.revenue)}
              </text>
            </g>
          );
        })()}
      </svg>
    </div>
  );
}

// ─── Quick Action Button ─────────────────────────────────────────────────────

function QuickAction({ icon, label, color, onClick }) {
  const colors = {
    blue: "bg-blue-50 hover:bg-blue-100 text-blue-600 border-blue-200",
    emerald: "bg-emerald-50 hover:bg-emerald-100 text-emerald-600 border-emerald-200",
    violet: "bg-violet-50 hover:bg-violet-100 text-violet-600 border-violet-200",
    amber: "bg-amber-50 hover:bg-amber-100 text-amber-600 border-amber-200",
  };

  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center justify-center gap-2.5 p-5 rounded-xl border transition-all hover:shadow-md ${colors[color]}`}
    >
      <div className="p-2.5 rounded-lg bg-white/60">{icon}</div>
      <span className="text-sm font-semibold">{label}</span>
    </button>
  );
}

// ─── Main Dashboard ──────────────────────────────────────────────────────────

function Dashboard() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState(null);
  const [revenueData, setRevenueData] = useState([]);
  const [todayAppointments, setTodayAppointments] = useState([]);
  const [topDoctors, setTopDoctors] = useState([]);
  const [revenuePeriod, setRevenuePeriod] = useState(7);

  // Initial data load
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [overviewRes, apptRes, doctorsRes] = await Promise.allSettled([
          API.get("/reports/overview"),
          API.get("/appointments/today"),
          API.get("/reports/doctors/top?limit=5"),
        ]);

        if (overviewRes.status === "fulfilled") {
          setOverview(overviewRes.value.data);
        }
        if (apptRes.status === "fulfilled") {
          setTodayAppointments(apptRes.value.data || []);
        }
        if (doctorsRes.status === "fulfilled") {
          setTopDoctors(doctorsRes.value.data || []);
        }
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Revenue chart data - reloads when period changes
  useEffect(() => {
    async function loadRevenue() {
      try {
        const endDate = getDateStr(0);
        const startDate = getDateStr(revenuePeriod - 1);
        const res = await API.get(`/reports/revenue?startDate=${startDate}&endDate=${endDate}`);
        setRevenueData(res.data || []);
      } catch {
        setRevenueData([]);
      }
    }
    loadRevenue();
  }, [revenuePeriod]);

  // Computed values
  const periodTotal = useMemo(
    () => revenueData.reduce((sum, d) => sum + (Number(d.revenue) || 0), 0),
    [revenueData]
  );

  const maxDoctorAppts = useMemo(
    () => Math.max(...topDoctors.map((d) => d.appointmentCount || 0), 1),
    [topDoctors]
  );

  if (loading) {
    return (
      <DashboardLayout>
        <LoadingSpinner message="Loading dashboard..." />
      </DashboardLayout>
    );
  }

  const o = overview || {};

  return (
    <DashboardLayout>
      <div className="space-y-6">

        {/* Header */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
          <p className="text-gray-500 text-sm mt-1">
            Welcome back. Here is an overview of your hospital today.
          </p>
        </div>

        {/* ── Primary Stats Row ─────────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <StatCard
            icon={icons.patients}
            label="Total Patients"
            value={(o.totalPatients || 0).toLocaleString()}
            color="blue"
          />
          <StatCard
            icon={icons.calendar}
            label="Today's Appointments"
            value={(o.todayAppointments || 0).toLocaleString()}
            color="emerald"
          />
          <StatCard
            icon={icons.currency}
            label="Total Revenue"
            value={formatCurrency(o.totalRevenue)}
            color="violet"
          />
          <StatCard
            icon={icons.document}
            label="Pending Bills"
            value={(o.pendingBills || 0).toLocaleString()}
            color="amber"
          />
        </div>

        {/* ── Secondary Stats Row ───────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <StatCard
            icon={icons.stethoscope}
            label="Total Doctors"
            value={(o.totalDoctors || 0).toLocaleString()}
            color="cyan"
          />
          <StatCard
            icon={icons.weeklyAppts}
            label="Weekly Appointments"
            value={(o.weeklyAppointments || 0).toLocaleString()}
            color="blue"
          />
          <StatCard
            icon={icons.todayRevenue}
            label="Today's Revenue"
            value={formatCurrency(o.todayRevenue)}
            color="emerald"
          />
          <StatCard
            icon={icons.monthlyRevenue}
            label="Monthly Revenue"
            value={formatCurrency(o.monthlyRevenue)}
            color="violet"
          />
        </div>

        {/* ── Revenue Chart + Today's Appointments ──────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

          {/* Revenue Chart - 3/5 width */}
          <div className="lg:col-span-3">
            <Card
              title="Revenue Overview"
              subtitle={`Period total: ${formatCurrency(periodTotal)}`}
              right={
                <div className="flex rounded-lg border border-gray-200 overflow-hidden text-xs">
                  {[
                    { days: 7, label: "7d" },
                    { days: 14, label: "14d" },
                    { days: 30, label: "30d" },
                  ].map(({ days, label }) => (
                    <button
                      key={days}
                      onClick={() => setRevenuePeriod(days)}
                      className={`px-3 py-1.5 font-medium transition-colors ${
                        revenuePeriod === days
                          ? "bg-violet-600 text-white"
                          : "bg-white text-gray-500 hover:bg-gray-50"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              }
            >
              {revenueData.length === 0 ? (
                <div className="h-56 flex flex-col items-center justify-center text-gray-400">
                  <svg className="w-10 h-10 mb-2 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
                  </svg>
                  <span className="text-sm">No revenue data for this period.</span>
                </div>
              ) : revenueData.every((d) => (Number(d.revenue) || 0) === 0) ? (
                <div className="h-56 flex flex-col items-center justify-center text-gray-400">
                  <svg className="w-10 h-10 mb-2 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
                  </svg>
                  <span className="text-sm">No revenue recorded in this period yet.</span>
                </div>
              ) : (
                <RevenueChart data={revenueData} />
              )}
            </Card>
          </div>

          {/* Today's Appointments - 2/5 width */}
          <div className="lg:col-span-2">
            <Card
              title="Today's Appointments"
              subtitle={`${todayAppointments.length} appointment${todayAppointments.length !== 1 ? "s" : ""}`}
              right={
                <button
                  onClick={() => navigate("/appointments")}
                  className="text-xs font-medium text-blue-600 hover:text-blue-800 transition-colors"
                >
                  View All
                </button>
              }
              noPadding
            >
              {todayAppointments.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                  <svg className="w-10 h-10 mb-2 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                  </svg>
                  <span className="text-sm">No appointments today</span>
                </div>
              ) : (
                <div className="divide-y divide-gray-100 max-h-[340px] overflow-y-auto">
                  {todayAppointments.map((appt, idx) => (
                    <div key={appt.id || idx} className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition-colors">
                      {/* Token number */}
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold">
                        {appt.tokenNumber || idx + 1}
                      </div>

                      {/* Details */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {appt.patientName || appt.patient?.name || "Unknown Patient"}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          Dr. {appt.doctorName || appt.doctor?.name || "Unknown"}
                        </p>
                      </div>

                      {/* Time */}
                      <div className="flex-shrink-0 flex items-center gap-1 text-xs text-gray-500">
                        {icons.clock}
                        <span>{formatTime(appt.appointmentTime || appt.time)}</span>
                      </div>

                      {/* Status */}
                      <div className="flex-shrink-0">
                        <StatusBadge status={appt.status || "PENDING"} size="xs" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </div>

        {/* ── Bottom Row: Top Doctors + Quick Actions ───────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

          {/* Top Doctors */}
          <div className="lg:col-span-3">
            <Card
              title="Top Doctors"
              subtitle="By appointment count"
              right={
                <button
                  onClick={() => navigate("/doctors")}
                  className="text-xs font-medium text-blue-600 hover:text-blue-800 transition-colors"
                >
                  View All
                </button>
              }
            >
              {topDoctors.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-gray-400">
                  <svg className="w-10 h-10 mb-2 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                  </svg>
                  <span className="text-sm">No doctor data available</span>
                </div>
              ) : (
                <div className="space-y-4">
                  {topDoctors.map((doc, idx) => {
                    const pct = ((doc.appointmentCount || 0) / maxDoctorAppts) * 100;
                    const rankColors = [
                      "from-violet-500 to-violet-400",
                      "from-blue-500 to-blue-400",
                      "from-emerald-500 to-emerald-400",
                      "from-amber-500 to-amber-400",
                      "from-cyan-500 to-cyan-400",
                    ];
                    return (
                      <div key={doc.id || idx} className="group">
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-2.5">
                            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center text-xs font-bold">
                              {idx + 1}
                            </span>
                            <div>
                              <span className="text-sm font-medium text-gray-900">
                                Dr. {doc.doctorName || doc.name || "Unknown"}
                              </span>
                              {(doc.specialization || doc.specialty) && (
                                <span className="text-xs text-gray-400 ml-2">
                                  {doc.specialization || doc.specialty}
                                </span>
                              )}
                            </div>
                          </div>
                          <span className="text-sm font-semibold text-gray-700">
                            {(doc.appointmentCount || 0).toLocaleString()}
                          </span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full bg-gradient-to-r ${rankColors[idx] || rankColors[4]} transition-all duration-500`}
                            style={{ width: `${Math.max(pct, 3)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          </div>

          {/* Quick Actions */}
          <div className="lg:col-span-2">
            <Card title="Quick Actions" subtitle="Common tasks">
              <div className="grid grid-cols-2 gap-3">
                <QuickAction
                  icon={icons.userPlus}
                  label="New Patient"
                  color="blue"
                  onClick={() => navigate("/patients")}
                />
                <QuickAction
                  icon={icons.calendarPlus}
                  label="Book Appointment"
                  color="emerald"
                  onClick={() => navigate("/appointments")}
                />
                <QuickAction
                  icon={icons.receipt}
                  label="Create Bill"
                  color="violet"
                  onClick={() => navigate("/billing")}
                />
                <QuickAction
                  icon={icons.chart}
                  label="View Reports"
                  color="amber"
                  onClick={() => navigate("/settings")}
                />
              </div>
            </Card>
          </div>
        </div>

      </div>
    </DashboardLayout>
  );
}

export default Dashboard;
