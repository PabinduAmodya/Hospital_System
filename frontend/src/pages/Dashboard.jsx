import { useEffect, useMemo, useState } from "react";
import DashboardLayout from "../layouts/DashboardLayout";
import API from "../api/axios";
import Card from "../components/ui/Card";

// ─── Stat card ────────────────────────────────────────────────────────────────
function Stat({ label, value, color = "blue", icon }) {
  const colors = {
    blue:   "bg-blue-50   border-blue-200   text-blue-700",
    green:  "bg-green-50  border-green-200  text-green-700",
    purple: "bg-purple-50 border-purple-200 text-purple-700",
    amber:  "bg-amber-50  border-amber-200  text-amber-700",
  };
  return (
    <div className={`p-6 rounded-xl border shadow-sm ${colors[color]}`}>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium opacity-75">{label}</h3>
        <span className="text-2xl">{icon}</span>
      </div>
      <p className="text-3xl font-bold mt-2">{value}</p>
    </div>
  );
}

// ─── SVG Bar Chart ────────────────────────────────────────────────────────────
function BarChart({ data, width = 700, height = 220 }) {
  const PAD = { top: 20, right: 20, bottom: 48, left: 56 };
  const innerW = width - PAD.left - PAD.right;
  const innerH = height - PAD.top - PAD.bottom;

  const maxVal = Math.max(...data.map((d) => d.value), 1);
  // Round max up to a nice number
  const niceMax = Math.ceil(maxVal / 5) * 5 || 5;
  const yTicks  = 5;

  const barW = Math.max(innerW / data.length - 8, 8);

  const xOf  = (i) => PAD.left + (i + 0.5) * (innerW / data.length);
  const yOf  = (v) => PAD.top + innerH - (v / niceMax) * innerH;
  const yTick = (i) => Math.round((niceMax / yTicks) * i);

  const [tooltip, setTooltip] = useState(null);

  return (
    <div className="relative w-full overflow-x-auto">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full"
        style={{ minWidth: Math.max(data.length * 40, 320) }}
      >
        {/* Y-axis grid lines + labels */}
        {Array.from({ length: yTicks + 1 }, (_, i) => {
          const val = yTick(i);
          const y   = yOf(val);
          return (
            <g key={i}>
              <line x1={PAD.left} x2={PAD.left + innerW} y1={y} y2={y}
                stroke={i === 0 ? "#94a3b8" : "#e2e8f0"} strokeWidth={i === 0 ? 1.5 : 1} />
              <text x={PAD.left - 8} y={y + 4} textAnchor="end"
                fontSize="11" fill="#64748b">{val}</text>
            </g>
          );
        })}

        {/* Bars */}
        {data.map((d, i) => {
          const x   = xOf(i) - barW / 2;
          const barH = Math.max((d.value / niceMax) * innerH, d.value > 0 ? 2 : 0);
          const y   = yOf(d.value);
          const isHovered = tooltip?.i === i;
          return (
            <g key={i}
              onMouseEnter={() => setTooltip({ i, x: xOf(i), y, value: d.value, label: d.label })}
              onMouseLeave={() => setTooltip(null)}
              style={{ cursor: "pointer" }}
            >
              {/* Hover zone */}
              <rect x={x - 4} y={PAD.top} width={barW + 8} height={innerH}
                fill="transparent" />
              {/* Bar */}
              <rect
                x={x} y={y} width={barW} height={barH}
                rx="4"
                fill={isHovered ? "#1d4ed8" : "#3b82f6"}
                style={{ transition: "fill 0.15s" }}
              />
              {/* X label */}
              <text x={xOf(i)} y={PAD.top + innerH + 16}
                textAnchor="middle" fontSize="10" fill="#64748b">
                {d.label}
              </text>
              {/* Value on bar if > 0 */}
              {d.value > 0 && (
                <text x={xOf(i)} y={y - 5}
                  textAnchor="middle" fontSize="11" fontWeight="600"
                  fill={isHovered ? "#1d4ed8" : "#3b82f6"}>
                  {d.value > 0 ? `Rs.${d.value >= 1000 ? (d.value/1000).toFixed(1)+"k" : d.value}` : ""}
                </text>
              )}
            </g>
          );
        })}

        {/* Tooltip */}
        {tooltip && (() => {
          const tw = 110, th = 38;
          const tx = Math.min(tooltip.x - tw / 2, width - tw - 4);
          const ty = Math.max(tooltip.y - th - 8, 4);
          return (
            <g>
              <rect x={tx} y={ty} width={tw} height={th}
                rx="6" fill="#1e293b" opacity="0.92" />
              <text x={tx + tw / 2} y={ty + 14}
                textAnchor="middle" fontSize="11" fill="#94a3b8">{tooltip.label}</text>
              <text x={tx + tw / 2} y={ty + 30}
                textAnchor="middle" fontSize="13" fontWeight="700" fill="#fff">
                Rs. {tooltip.value.toLocaleString()}
              </text>
            </g>
          );
        })()}
      </svg>
    </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────
function Dashboard() {
  const [stats, setStats] = useState({
    patients: "—", doctors: "—", todayAppointments: "—", unpaidBills: "—",
  });
  const [bills, setBills]     = useState([]);
  const [range, setRange]     = useState("7");  // "7" | "14" | "30"
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const [pRes, dRes, tRes, ubRes, bRes] = await Promise.allSettled([
        API.get("/patients"),
        API.get("/doctors"),
        API.get("/appointments/today"),
        API.get("/bills/unpaid"),
        API.get("/bills"),
      ]);
      setStats({
        patients:          pRes.status  === "fulfilled" ? pRes.value.data.length  : "—",
        doctors:           dRes.status  === "fulfilled" ? dRes.value.data.length  : "—",
        todayAppointments: tRes.status  === "fulfilled" ? tRes.value.data.length  : "—",
        unpaidBills:       ubRes.status === "fulfilled" ? ubRes.value.data.length : "—",
      });
      if (bRes.status === "fulfilled") setBills(bRes.value.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  // Build daily sales data from paid bills
  const chartData = useMemo(() => {
    const days = parseInt(range);
    const today = new Date();
    today.setHours(23, 59, 59, 999);

    // Build map: dateStr → total revenue
    const map = {};
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      map[key] = 0;
    }

    bills.forEach((b) => {
      if (!b.paid || !b.paidAt) return;
      const key = b.paidAt.slice(0, 10);
      if (key in map) map[key] += Number(b.totalAmount) || 0;
    });

    return Object.entries(map).map(([date, value]) => {
      const d = new Date(date + "T00:00:00");
      const label = days <= 7
        ? d.toLocaleDateString("en-US", { weekday: "short" })    // Mon
        : days <= 14
        ? d.toLocaleDateString("en-US", { month: "short", day: "numeric" })  // Jan 5
        : d.toLocaleDateString("en-US", { month: "short", day: "numeric" }); // Jan 5
      return { date, label, value };
    });
  }, [bills, range]);

  const totalRevenue = useMemo(
    () => bills.filter((b) => b.paid).reduce((s, b) => s + (Number(b.totalAmount) || 0), 0),
    [bills]
  );

  const periodRevenue = useMemo(
    () => chartData.reduce((s, d) => s + d.value, 0),
    [chartData]
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">

        <div>
          <h2 className="text-2xl font-bold">Hospital Dashboard 🏥</h2>
          <p className="text-gray-500 text-sm mt-1">Welcome back. Here's what's happening today.</p>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          <Stat label="Total Patients"       value={stats.patients}          color="blue"   icon="👤" />
          <Stat label="Total Doctors"        value={stats.doctors}           color="purple" icon="👨‍⚕️" />
          <Stat label="Appointments Today"   value={stats.todayAppointments} color="green"  icon="📅" />
          <Stat label="Unpaid Bills"         value={stats.unpaidBills}       color="amber"  icon="💳" />
        </div>

        {/* Daily Sales Chart */}
        <div className="bg-white rounded-xl border shadow-sm p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-800">Daily Sales Revenue</h3>
              <p className="text-sm text-gray-500 mt-0.5">
                Period total:{" "}
                <span className="font-semibold text-blue-600">Rs. {periodRevenue.toLocaleString()}</span>
                {" "}· All-time:{" "}
                <span className="font-semibold text-gray-700">Rs. {totalRevenue.toLocaleString()}</span>
              </p>
            </div>

            {/* Range selector */}
            <div className="flex rounded-lg border border-gray-200 overflow-hidden text-sm">
              {[["7","7 Days"],["14","14 Days"],["30","30 Days"]].map(([v, label]) => (
                <button
                  key={v}
                  onClick={() => setRange(v)}
                  className={`px-4 py-2 font-medium transition-colors ${
                    range === v
                      ? "bg-blue-600 text-white"
                      : "bg-white text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="h-48 flex items-center justify-center text-gray-400 text-sm">
              Loading chart...
            </div>
          ) : chartData.every((d) => d.value === 0) ? (
            <div className="h-48 flex flex-col items-center justify-center text-gray-400">
              <span className="text-4xl mb-2">📊</span>
              <span className="text-sm">No paid bills in this period yet.</span>
            </div>
          ) : (
            <BarChart data={chartData} />
          )}
        </div>

        {/* Quick tips */}
        <Card title="Quick Tips">
          <ul className="list-disc pl-5 text-sm text-gray-700 space-y-1">
            <li>Receptionist: create patients, schedules, appointments.</li>
            <li>Cashier: manage bills and payments.</li>
            <li>Admin: full access + user management.</li>
          </ul>
        </Card>

      </div>
    </DashboardLayout>
  );
}

export default Dashboard;