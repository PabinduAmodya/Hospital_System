export default function StatCard({ icon, label, value, trend, trendLabel, color = "blue", subtitle }) {
  const colors = {
    blue: { bg: "bg-blue-50", icon: "bg-blue-100 text-blue-600", border: "border-blue-100" },
    emerald: { bg: "bg-emerald-50", icon: "bg-emerald-100 text-emerald-600", border: "border-emerald-100" },
    violet: { bg: "bg-violet-50", icon: "bg-violet-100 text-violet-600", border: "border-violet-100" },
    amber: { bg: "bg-amber-50", icon: "bg-amber-100 text-amber-600", border: "border-amber-100" },
    rose: { bg: "bg-rose-50", icon: "bg-rose-100 text-rose-600", border: "border-rose-100" },
    cyan: { bg: "bg-cyan-50", icon: "bg-cyan-100 text-cyan-600", border: "border-cyan-100" },
  };
  const c = colors[color] || colors.blue;

  return (
    <div className={`${c.bg} border ${c.border} rounded-xl p-5 transition-all hover:shadow-md`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">{label}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
          {trend !== undefined && (
            <div className={`flex items-center gap-1 mt-2 text-xs font-medium ${trend >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
              <svg className={`w-3.5 h-3.5 ${trend < 0 ? 'rotate-180' : ''}`} fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" />
              </svg>
              <span>{Math.abs(trend)}% {trendLabel || ''}</span>
            </div>
          )}
        </div>
        <div className={`${c.icon} p-3 rounded-xl`}>
          {icon}
        </div>
      </div>
    </div>
  );
}
