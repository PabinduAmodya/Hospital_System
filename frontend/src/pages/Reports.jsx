import { useState, useEffect, useMemo, useCallback } from "react";
import API from "../api/axios";
import Card from "../components/ui/Card";
import LoadingSpinner from "../components/ui/LoadingSpinner";
import StatCard from "../components/ui/StatCard";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatCurrency(amount) {
  if (amount == null || isNaN(amount)) return "Rs. 0.00";
  return `Rs. ${Number(amount).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDate(d) {
  const date = new Date(d);
  return date.toISOString().split("T")[0];
}

function getToday() {
  return formatDate(new Date());
}

function getDateRange(preset) {
  const today = new Date();
  let start;
  switch (preset) {
    case "today":
      start = new Date(today);
      break;
    case "week":
      start = new Date(today);
      start.setDate(today.getDate() - today.getDay());
      break;
    case "month":
      start = new Date(today.getFullYear(), today.getMonth(), 1);
      break;
    case "year":
      start = new Date(today.getFullYear(), 0, 1);
      break;
    case "last30":
      start = new Date(today);
      start.setDate(today.getDate() - 30);
      break;
    default:
      start = new Date(today);
      start.setDate(today.getDate() - 30);
  }
  return { startDate: formatDate(start), endDate: formatDate(today) };
}

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const STATUS_COLORS = {
  PENDING: { fill: "#f59e0b", bg: "bg-amber-500", text: "text-amber-600", light: "bg-amber-100" },
  CONFIRMED: { fill: "#3b82f6", bg: "bg-blue-500", text: "text-blue-600", light: "bg-blue-100" },
  COMPLETED: { fill: "#10b981", bg: "bg-emerald-500", text: "text-emerald-600", light: "bg-emerald-100" },
  CANCELLED: { fill: "#ef4444", bg: "bg-red-500", text: "text-red-600", light: "bg-red-100" },
  RESCHEDULED: { fill: "#8b5cf6", bg: "bg-violet-500", text: "text-violet-600", light: "bg-violet-100" },
};

// ─── SVG Monthly Revenue Chart ───────────────────────────────────────────────

function MonthlyRevenueChart({ data }) {
  const [hoveredBar, setHoveredBar] = useState(null);

  const WIDTH = 760;
  const HEIGHT = 300;
  const PAD = { top: 24, right: 24, bottom: 50, left: 70 };
  const innerW = WIDTH - PAD.left - PAD.right;
  const innerH = HEIGHT - PAD.top - PAD.bottom;

  const maxVal = Math.max(...data.map((d) => d.revenue || 0), 1);
  const niceMax = Math.ceil(maxVal / 10000) * 10000 || 10000;
  const yTicks = 5;

  const barGap = 6;
  const barW = Math.max((innerW / data.length) - barGap, 12);

  const xOf = (i) => PAD.left + (i + 0.5) * (innerW / data.length);
  const yOf = (v) => PAD.top + innerH - (v / niceMax) * innerH;

  const gradientId = "monthlyRevenueGrad";

  return (
    <div className="relative w-full overflow-x-auto">
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full" style={{ minWidth: 500 }}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.3" />
          </linearGradient>
        </defs>

        {/* Y-axis grid + labels */}
        {Array.from({ length: yTicks + 1 }, (_, i) => {
          const val = Math.round((niceMax / yTicks) * i);
          const y = yOf(val);
          return (
            <g key={i}>
              <line x1={PAD.left} x2={PAD.left + innerW} y1={y} y2={y}
                stroke={i === 0 ? "#cbd5e1" : "#f1f5f9"} strokeWidth={1} />
              <text x={PAD.left - 10} y={y + 4} textAnchor="end"
                fontSize="10" fill="#94a3b8" fontFamily="system-ui">
                {val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}
              </text>
            </g>
          );
        })}

        {/* Bars */}
        {data.map((d, i) => {
          const x = xOf(i) - barW / 2;
          const barH = Math.max((d.revenue / niceMax) * innerH, d.revenue > 0 ? 2 : 0);
          const y = yOf(d.revenue);
          const isHovered = hoveredBar === i;
          return (
            <g key={i}
              onMouseEnter={() => setHoveredBar(i)}
              onMouseLeave={() => setHoveredBar(null)}
              style={{ cursor: "pointer" }}>
              <rect x={x - 4} y={PAD.top} width={barW + 8} height={innerH} fill="transparent" />
              <rect x={x} y={y} width={barW} height={barH} rx={4}
                fill={`url(#${gradientId})`} opacity={isHovered ? 1 : 0.85}
                style={{ transition: "opacity 0.15s" }} />
              {/* X label */}
              <text x={xOf(i)} y={PAD.top + innerH + 18} textAnchor="middle"
                fontSize="10" fill="#64748b" fontFamily="system-ui">
                {MONTH_NAMES[d.month - 1]} {String(d.year).slice(2)}
              </text>
              {/* Tooltip */}
              {isHovered && (
                <g>
                  <rect x={xOf(i) - 50} y={y - 32} width={100} height={24} rx={6}
                    fill="#1e293b" opacity="0.95" />
                  <text x={xOf(i)} y={y - 16} textAnchor="middle"
                    fontSize="11" fill="#fff" fontWeight="600" fontFamily="system-ui">
                    {formatCurrency(d.revenue)}
                  </text>
                </g>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// ─── SVG Donut Chart ─────────────────────────────────────────────────────────

function DonutChart({ data }) {
  const [hoveredSlice, setHoveredSlice] = useState(null);
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  const SIZE = 200;
  const CX = SIZE / 2;
  const CY = SIZE / 2;
  const R = 80;
  const INNER_R = 52;

  let cumAngle = -Math.PI / 2;
  const slices = data.map((d) => {
    const angle = (d.value / total) * Math.PI * 2;
    const startAngle = cumAngle;
    cumAngle += angle;
    const endAngle = cumAngle;

    const x1 = CX + R * Math.cos(startAngle);
    const y1 = CY + R * Math.sin(startAngle);
    const x2 = CX + R * Math.cos(endAngle);
    const y2 = CY + R * Math.sin(endAngle);
    const ix1 = CX + INNER_R * Math.cos(endAngle);
    const iy1 = CY + INNER_R * Math.sin(endAngle);
    const ix2 = CX + INNER_R * Math.cos(startAngle);
    const iy2 = CY + INNER_R * Math.sin(startAngle);

    const largeArc = angle > Math.PI ? 1 : 0;
    const path = [
      `M ${x1} ${y1}`,
      `A ${R} ${R} 0 ${largeArc} 1 ${x2} ${y2}`,
      `L ${ix1} ${iy1}`,
      `A ${INNER_R} ${INNER_R} 0 ${largeArc} 0 ${ix2} ${iy2}`,
      "Z",
    ].join(" ");

    return { ...d, path, percentage: ((d.value / total) * 100).toFixed(1) };
  });

  return (
    <div className="flex flex-col sm:flex-row items-center gap-6">
      <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} className="flex-shrink-0">
        {slices.map((s, i) => (
          <path key={s.label} d={s.path} fill={s.color}
            opacity={hoveredSlice === null || hoveredSlice === i ? 1 : 0.4}
            onMouseEnter={() => setHoveredSlice(i)}
            onMouseLeave={() => setHoveredSlice(null)}
            style={{ cursor: "pointer", transition: "opacity 0.2s" }} />
        ))}
        <text x={CX} y={CY - 6} textAnchor="middle" fontSize="22" fontWeight="700" fill="#1e293b" fontFamily="system-ui">
          {total}
        </text>
        <text x={CX} y={CY + 12} textAnchor="middle" fontSize="10" fill="#94a3b8" fontFamily="system-ui">
          Total
        </text>
      </svg>

      <div className="flex flex-col gap-2 min-w-0">
        {slices.map((s, i) => (
          <div key={s.label}
            className={`flex items-center gap-3 px-3 py-1.5 rounded-lg transition-colors ${hoveredSlice === i ? "bg-gray-50" : ""}`}
            onMouseEnter={() => setHoveredSlice(i)}
            onMouseLeave={() => setHoveredSlice(null)}>
            <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: s.color }} />
            <span className="text-sm text-gray-700 font-medium min-w-[90px]">{s.label}</span>
            <span className="text-sm font-semibold text-gray-900">{s.value}</span>
            <span className="text-xs text-gray-400">({s.percentage}%)</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── SVG Daily Revenue Bar Chart ─────────────────────────────────────────────

function DailyRevenueChart({ data }) {
  const [hoveredBar, setHoveredBar] = useState(null);

  if (!data || data.length === 0) {
    return <p className="text-gray-400 text-sm text-center py-10">No revenue data for the selected range.</p>;
  }

  const WIDTH = 760;
  const HEIGHT = 260;
  const PAD = { top: 24, right: 24, bottom: 56, left: 70 };
  const innerW = WIDTH - PAD.left - PAD.right;
  const innerH = HEIGHT - PAD.top - PAD.bottom;

  const maxVal = Math.max(...data.map((d) => d.revenue || 0), 1);
  const niceMax = Math.ceil(maxVal / 1000) * 1000 || 1000;
  const yTicks = 4;
  const avg = data.reduce((s, d) => s + (d.revenue || 0), 0) / data.length;

  const barGap = data.length > 30 ? 1 : 4;
  const barW = Math.max((innerW / data.length) - barGap, 3);

  const xOf = (i) => PAD.left + (i + 0.5) * (innerW / data.length);
  const yOf = (v) => PAD.top + innerH - (v / niceMax) * innerH;

  const showEveryNth = Math.max(1, Math.floor(data.length / 10));

  return (
    <div className="relative w-full overflow-x-auto">
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full" style={{ minWidth: 400 }}>
        <defs>
          <linearGradient id="dailyRevGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#10b981" stopOpacity="0.3" />
          </linearGradient>
        </defs>

        {/* Y grid */}
        {Array.from({ length: yTicks + 1 }, (_, i) => {
          const val = Math.round((niceMax / yTicks) * i);
          const y = yOf(val);
          return (
            <g key={i}>
              <line x1={PAD.left} x2={PAD.left + innerW} y1={y} y2={y}
                stroke={i === 0 ? "#cbd5e1" : "#f1f5f9"} strokeWidth={1} />
              <text x={PAD.left - 10} y={y + 4} textAnchor="end"
                fontSize="10" fill="#94a3b8" fontFamily="system-ui">
                {val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}
              </text>
            </g>
          );
        })}

        {/* Average line */}
        <line x1={PAD.left} x2={PAD.left + innerW}
          y1={yOf(avg)} y2={yOf(avg)}
          stroke="#f59e0b" strokeWidth={1.5} strokeDasharray="6 4" />
        <text x={PAD.left + innerW + 2} y={yOf(avg) + 4} fontSize="9" fill="#f59e0b" fontFamily="system-ui">
          Avg
        </text>

        {/* Bars */}
        {data.map((d, i) => {
          const x = xOf(i) - barW / 2;
          const barH = Math.max((d.revenue / niceMax) * innerH, d.revenue > 0 ? 1 : 0);
          const y = yOf(d.revenue);
          const isHovered = hoveredBar === i;
          const dateStr = d.date ? new Date(d.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "";
          return (
            <g key={i}
              onMouseEnter={() => setHoveredBar(i)}
              onMouseLeave={() => setHoveredBar(null)}
              style={{ cursor: "pointer" }}>
              <rect x={x - 2} y={PAD.top} width={barW + 4} height={innerH} fill="transparent" />
              <rect x={x} y={y} width={barW} height={barH} rx={2}
                fill="url(#dailyRevGrad)" opacity={isHovered ? 1 : 0.8}
                style={{ transition: "opacity 0.15s" }} />
              {/* X label every Nth */}
              {i % showEveryNth === 0 && (
                <text x={xOf(i)} y={PAD.top + innerH + 18} textAnchor="middle"
                  fontSize="9" fill="#94a3b8" fontFamily="system-ui"
                  transform={`rotate(-30, ${xOf(i)}, ${PAD.top + innerH + 18})`}>
                  {dateStr}
                </text>
              )}
              {isHovered && (
                <g>
                  <rect x={xOf(i) - 55} y={y - 34} width={110} height={26} rx={6}
                    fill="#1e293b" opacity="0.95" />
                  <text x={xOf(i)} y={y - 17} textAnchor="middle"
                    fontSize="10" fill="#fff" fontWeight="600" fontFamily="system-ui">
                    {dateStr}: {formatCurrency(d.revenue)}
                  </text>
                </g>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// ─── Sort Icon ───────────────────────────────────────────────────────────────

function SortIcon({ active, direction }) {
  return (
    <svg className={`w-3.5 h-3.5 inline-block ml-1 ${active ? "text-blue-600" : "text-gray-300"}`}
      fill="currentColor" viewBox="0 0 20 20">
      {direction === "asc" ? (
        <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" />
      ) : (
        <path fillRule="evenodd" d="M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 12.586V5a1 1 0 012 0v7.586l2.293-2.293a1 1 0 011.414 0z" />
      )}
    </svg>
  );
}

// ─── Main Reports Page ───────────────────────────────────────────────────────

export default function Reports() {
  const [dateRange, setDateRange] = useState(() => getDateRange("last30"));
  const [activePreset, setActivePreset] = useState("last30");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Data states
  const [overview, setOverview] = useState(null);
  const [monthlyRevenue, setMonthlyRevenue] = useState([]);
  const [appointments, setAppointments] = useState({});
  const [doctorPerformance, setDoctorPerformance] = useState([]);
  const [dailyRevenue, setDailyRevenue] = useState([]);

  // Sort state for doctor table
  const [sortConfig, setSortConfig] = useState({ key: "revenue", direction: "desc" });

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [overviewRes, monthlyRes, apptRes, doctorsRes, dailyRes] = await Promise.all([
        API.get("/reports/overview"),
        API.get("/reports/revenue/monthly?months=12"),
        API.get(`/reports/appointments?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`),
        API.get("/reports/doctors/performance"),
        API.get(`/reports/revenue?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`),
      ]);
      setOverview(overviewRes.data);
      setMonthlyRevenue(Array.isArray(monthlyRes.data) ? monthlyRes.data : []);
      setAppointments(apptRes.data || {});
      setDoctorPerformance(Array.isArray(doctorsRes.data) ? doctorsRes.data : []);
      setDailyRevenue(Array.isArray(dailyRes.data) ? dailyRes.data : []);
    } catch (err) {
      console.error("Failed to load reports:", err);
      setError("Failed to load report data. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [dateRange.startDate, dateRange.endDate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Computed stats
  const totalRevenue = overview?.totalRevenue || 0;
  const totalAppointments = overview?.todayAppointments || 0;
  const completedCount = appointments?.COMPLETED || 0;
  const totalApptInRange = Object.values(appointments).reduce((s, v) => s + (v || 0), 0);
  const completedRate = totalApptInRange > 0 ? ((completedCount / totalApptInRange) * 100).toFixed(1) : "0.0";
  const daysDiff = Math.max(1, Math.ceil((new Date(dateRange.endDate) - new Date(dateRange.startDate)) / (1000 * 60 * 60 * 24)) + 1);
  const rangeRevenue = dailyRevenue.reduce((s, d) => s + (d.revenue || 0), 0);
  const avgRevenuePerDay = rangeRevenue / daysDiff;

  // Monthly revenue total
  const totalMonthlyRevenue = monthlyRevenue.reduce((s, d) => s + (d.revenue || 0), 0);

  // Appointment donut data
  const donutData = useMemo(() => {
    return Object.entries(STATUS_COLORS).map(([status, c]) => ({
      label: status.charAt(0) + status.slice(1).toLowerCase(),
      value: appointments[status] || 0,
      color: c.fill,
    })).filter((d) => d.value > 0);
  }, [appointments]);

  // Sorted doctors
  const sortedDoctors = useMemo(() => {
    const sorted = [...doctorPerformance];
    sorted.sort((a, b) => {
      let aVal = a[sortConfig.key];
      let bVal = b[sortConfig.key];
      if (typeof aVal === "string") aVal = aVal.toLowerCase();
      if (typeof bVal === "string") bVal = bVal.toLowerCase();
      if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });
    return sorted;
  }, [doctorPerformance, sortConfig]);

  const handleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "desc" ? "asc" : "desc",
    }));
  };

  const handlePreset = (preset) => {
    setActivePreset(preset);
    setDateRange(getDateRange(preset));
  };

  const handleDateChange = (field, value) => {
    setActivePreset(null);
    setDateRange((prev) => ({ ...prev, [field]: value }));
  };

  // Presets
  const presets = [
    { key: "today", label: "Today" },
    { key: "week", label: "This Week" },
    { key: "month", label: "This Month" },
    { key: "year", label: "This Year" },
    { key: "last30", label: "Last 30 Days" },
  ];

  if (loading) {
    return <LoadingSpinner message="Loading reports..." />;
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center">
          <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
        </div>
        <p className="text-sm text-gray-600">{error}</p>
        <button onClick={fetchData}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ── Page Header ─────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="text-sm text-gray-500 mt-1">Insights and performance metrics for your hospital</p>
        </div>
      </div>

      {/* Date range controls */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
        <div className="flex flex-col lg:flex-row lg:items-center gap-4">
          {/* Date inputs */}
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">From</label>
            <input type="date" value={dateRange.startDate}
              onChange={(e) => handleDateChange("startDate", e.target.value)}
              max={dateRange.endDate}
              className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">To</label>
            <input type="date" value={dateRange.endDate}
              onChange={(e) => handleDateChange("endDate", e.target.value)}
              min={dateRange.startDate} max={getToday()}
              className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
          </div>

          {/* Quick range buttons */}
          <div className="flex flex-wrap gap-2">
            {presets.map((p) => (
              <button key={p.key} onClick={() => handlePreset(p.key)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all ${
                  activePreset === p.key
                    ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                    : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50 hover:border-gray-300"
                }`}>
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Overview Stats Row ──────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
          label="Total Revenue"
          value={formatCurrency(totalRevenue)}
          color="emerald"
          subtitle="All time"
        />
        <StatCard
          icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" /></svg>}
          label="Appointments (Range)"
          value={totalApptInRange.toLocaleString()}
          color="blue"
          subtitle={`${dateRange.startDate} to ${dateRange.endDate}`}
        />
        <StatCard
          icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
          label="Completed Rate"
          value={`${completedRate}%`}
          color="violet"
          subtitle={`${completedCount} of ${totalApptInRange} appointments`}
        />
        <StatCard
          icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" /></svg>}
          label="Avg Revenue / Day"
          value={formatCurrency(avgRevenuePerDay)}
          color="amber"
          subtitle={`Over ${daysDiff} days`}
        />
      </div>

      {/* ── Charts Grid ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

        {/* Monthly Revenue Trend */}
        <Card title="Monthly Revenue Trend"
          subtitle={`Past 12 months — Total: ${formatCurrency(totalMonthlyRevenue)}`}
          className="xl:col-span-2">
          {monthlyRevenue.length > 0 ? (
            <MonthlyRevenueChart data={monthlyRevenue} />
          ) : (
            <p className="text-gray-400 text-sm text-center py-10">No monthly revenue data available.</p>
          )}
        </Card>

        {/* Appointment Status Distribution */}
        <Card title="Appointment Status Distribution"
          subtitle={`${dateRange.startDate} to ${dateRange.endDate}`}>
          {donutData.length > 0 ? (
            <DonutChart data={donutData} />
          ) : (
            <p className="text-gray-400 text-sm text-center py-10">No appointment data for the selected range.</p>
          )}
        </Card>

        {/* Daily Revenue */}
        <Card title="Daily Revenue"
          subtitle={`${dateRange.startDate} to ${dateRange.endDate} — Avg: ${formatCurrency(avgRevenuePerDay)}/day`}>
          <DailyRevenueChart data={dailyRevenue} />
        </Card>
      </div>

      {/* ── Doctor Performance Table ────────────────────────────────────── */}
      <Card title="Doctor Performance" subtitle="Sortable by column headers" noPadding>
        {sortedDoctors.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  {[
                    { key: null, label: "#", sortable: false },
                    { key: "doctorName", label: "Doctor Name" },
                    { key: "specialization", label: "Specialization" },
                    { key: "totalAppointments", label: "Total Appts" },
                    { key: "completedAppointments", label: "Completed" },
                    { key: "cancelledAppointments", label: "Cancelled" },
                    { key: null, label: "Completion Rate", sortable: false },
                    { key: "revenue", label: "Revenue" },
                  ].map((col, i) => (
                    <th key={i}
                      className={`px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider ${
                        col.sortable !== false && col.key ? "cursor-pointer hover:text-gray-700 select-none" : ""
                      }`}
                      onClick={() => col.key && col.sortable !== false && handleSort(col.key)}>
                      {col.label}
                      {col.key && col.sortable !== false && (
                        <SortIcon active={sortConfig.key === col.key} direction={sortConfig.direction} />
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {sortedDoctors.map((doc, idx) => {
                  const completionRate = doc.totalAppointments > 0
                    ? ((doc.completedAppointments / doc.totalAppointments) * 100).toFixed(1)
                    : 0;
                  return (
                    <tr key={doc.doctorId || idx} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                          idx === 0 ? "bg-amber-100 text-amber-700" :
                          idx === 1 ? "bg-gray-100 text-gray-600" :
                          idx === 2 ? "bg-orange-100 text-orange-600" :
                          "bg-gray-50 text-gray-400"
                        }`}>
                          {idx + 1}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-900">{doc.doctorName}</td>
                      <td className="px-4 py-3 text-gray-500">{doc.specialization}</td>
                      <td className="px-4 py-3 text-gray-700 font-medium">{doc.totalAppointments}</td>
                      <td className="px-4 py-3">
                        <span className="text-emerald-600 font-medium">{doc.completedAppointments}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-red-500 font-medium">{doc.cancelledAppointments}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden max-w-[120px]">
                            <div className="h-full rounded-full transition-all"
                              style={{
                                width: `${completionRate}%`,
                                backgroundColor: completionRate >= 75 ? "#10b981" : completionRate >= 50 ? "#f59e0b" : "#ef4444",
                              }} />
                          </div>
                          <span className="text-xs text-gray-500 w-12">{completionRate}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-semibold text-gray-900">{formatCurrency(doc.revenue)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-12 text-center">
            <p className="text-gray-400 text-sm">No doctor performance data available.</p>
          </div>
        )}
      </Card>
    </div>
  );
}
