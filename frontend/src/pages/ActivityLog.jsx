import { useEffect, useMemo, useState } from "react";
import API from "../api/axios";
import DashboardLayout from "../layouts/DashboardLayout";
import Card from "../components/ui/Card";
import LoadingSpinner from "../components/ui/LoadingSpinner";
import StatusBadge from "../components/ui/StatusBadge";
import SearchBar from "../components/ui/SearchBar";
import Pagination from "../components/ui/Pagination";
import EmptyState from "../components/ui/EmptyState";

// ─── Constants ────────────────────────────────────────────────────────────────
const ITEMS_PER_PAGE = 20;

const ACTIONS = ["All", "CREATE", "UPDATE", "DELETE", "LOGIN", "PAYMENT", "REFUND", "CANCEL", "RESCHEDULE"];
const ENTITY_TYPES = ["All", "PATIENT", "DOCTOR", "APPOINTMENT", "BILL", "USER"];

const ACTION_COLORS = {
  CREATE:     { bg: "bg-emerald-50",  text: "text-emerald-700", border: "border-emerald-300", dot: "bg-emerald-500", ring: "ring-emerald-100" },
  UPDATE:     { bg: "bg-blue-50",     text: "text-blue-700",    border: "border-blue-300",    dot: "bg-blue-500",    ring: "ring-blue-100" },
  DELETE:     { bg: "bg-red-50",      text: "text-red-700",     border: "border-red-300",     dot: "bg-red-500",     ring: "ring-red-100" },
  LOGIN:      { bg: "bg-indigo-50",   text: "text-indigo-700",  border: "border-indigo-300",  dot: "bg-indigo-500",  ring: "ring-indigo-100" },
  PAYMENT:    { bg: "bg-green-50",    text: "text-green-700",   border: "border-green-300",   dot: "bg-green-500",   ring: "ring-green-100" },
  REFUND:     { bg: "bg-purple-50",   text: "text-purple-700",  border: "border-purple-300",  dot: "bg-purple-500",  ring: "ring-purple-100" },
  CANCEL:     { bg: "bg-rose-50",     text: "text-rose-700",    border: "border-rose-300",    dot: "bg-rose-500",    ring: "ring-rose-100" },
  RESCHEDULE: { bg: "bg-violet-50",   text: "text-violet-700",  border: "border-violet-300",  dot: "bg-violet-500",  ring: "ring-violet-100" },
};

const DEFAULT_COLOR = { bg: "bg-gray-50", text: "text-gray-700", border: "border-gray-300", dot: "bg-gray-500", ring: "ring-gray-100" };

// ─── Helper: action color ─────────────────────────────────────────────────────
function getActionColor(action) {
  return ACTION_COLORS[action] || DEFAULT_COLOR;
}

// ─── Helper: action icon SVG ──────────────────────────────────────────────────
function getActionIcon(action) {
  const cls = "w-4 h-4";
  switch (action) {
    case "CREATE":
      return (
        <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      );
    case "UPDATE":
      return (
        <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      );
    case "DELETE":
      return (
        <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      );
    case "LOGIN":
      return (
        <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
        </svg>
      );
    case "PAYMENT":
      return (
        <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    case "REFUND":
      return (
        <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
        </svg>
      );
    case "CANCEL":
      return (
        <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
        </svg>
      );
    case "RESCHEDULE":
      return (
        <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      );
    default:
      return (
        <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
  }
}

// ─── Helper: relative time ────────────────────────────────────────────────────
function formatRelativeTime(dateString) {
  if (!dateString) return "";
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now - date;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return "Just now";
  if (diffMin < 60) return `${diffMin} minute${diffMin !== 1 ? "s" : ""} ago`;
  if (diffHour < 24) return `${diffHour} hour${diffHour !== 1 ? "s" : ""} ago`;
  if (diffDay === 1) {
    return `Yesterday at ${date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`;
  }
  if (diffDay < 7) return `${diffDay} days ago`;
  return date.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });
}

// ─── Helper: is today ─────────────────────────────────────────────────────────
function isToday(dateString) {
  if (!dateString) return false;
  const d = new Date(dateString);
  const now = new Date();
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function ActivityLog() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("All");
  const [entityFilter, setEntityFilter] = useState("All");
  const [userFilter, setUserFilter] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);

  // Fetch all recent logs
  useEffect(() => {
    const fetchLogs = async () => {
      setLoading(true);
      try {
        // Try paginated endpoint first, fall back to recent
        let allLogs = [];
        try {
          const res = await API.get("/audit-logs/recent?limit=500");
          allLogs = Array.isArray(res.data) ? res.data : res.data.content || [];
        } catch {
          // Fallback: fetch paginated
          const res = await API.get("/audit-logs?page=0&size=500");
          allLogs = res.data.content || [];
        }
        setLogs(allLogs);
      } catch (err) {
        console.error("Failed to fetch audit logs:", err);
        setLogs([]);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, []);

  // Unique users for filter dropdown
  const uniqueUsers = useMemo(() => {
    const users = [...new Set(logs.map((l) => l.performedBy).filter(Boolean))];
    return users.sort();
  }, [logs]);

  // Stats
  const stats = useMemo(() => {
    const todayLogs = logs.filter((l) => isToday(l.performedAt));
    const totalToday = todayLogs.length;

    // Most active user
    const userCounts = {};
    logs.forEach((l) => {
      if (l.performedBy) userCounts[l.performedBy] = (userCounts[l.performedBy] || 0) + 1;
    });
    const mostActiveUser = Object.entries(userCounts).sort((a, b) => b[1] - a[1])[0];

    // Most common action
    const actionCounts = {};
    logs.forEach((l) => {
      if (l.action) actionCounts[l.action] = (actionCounts[l.action] || 0) + 1;
    });
    const mostCommonAction = Object.entries(actionCounts).sort((a, b) => b[1] - a[1])[0];

    return { totalToday, mostActiveUser, mostCommonAction };
  }, [logs]);

  // Client-side filtering
  const filteredLogs = useMemo(() => {
    let result = [...logs];

    if (actionFilter !== "All") {
      result = result.filter((l) => l.action === actionFilter);
    }
    if (entityFilter !== "All") {
      result = result.filter((l) => l.entityType === entityFilter);
    }
    if (userFilter !== "All") {
      result = result.filter((l) => l.performedBy === userFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (l) =>
          (l.details && l.details.toLowerCase().includes(q)) ||
          (l.performedBy && l.performedBy.toLowerCase().includes(q)) ||
          (l.action && l.action.toLowerCase().includes(q)) ||
          (l.entityType && l.entityType.toLowerCase().includes(q))
      );
    }

    return result;
  }, [logs, actionFilter, entityFilter, userFilter, search]);

  // Pagination
  const totalPages = Math.ceil(filteredLogs.length / ITEMS_PER_PAGE);
  const paginatedLogs = filteredLogs.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, actionFilter, entityFilter, userFilter]);

  // ── Filter select style ───────────────────────────────────────────────────
  const selectClass =
    "text-sm border border-gray-300 rounded-xl bg-white px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all text-gray-700 appearance-none bg-[url('data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2212%22%20height%3D%2212%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%236b7280%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[right_0.75rem_center] pr-8";

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* ── Page Header ──────────────────────────────────────────────────── */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Activity Log</h1>
          <p className="text-sm text-gray-500 mt-1">Track all system activities and user actions</p>
        </div>

        {/* ── Stats Pills ──────────────────────────────────────────────────── */}
        {!loading && logs.length > 0 && (
          <div className="flex flex-wrap gap-3">
            {/* Total actions today */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-200 rounded-full">
              <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
              <span className="text-sm font-semibold text-blue-700">{stats.totalToday}</span>
              <span className="text-xs text-blue-600">Actions Today</span>
            </div>

            {/* Most active user */}
            {stats.mostActiveUser && (
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 border border-emerald-200 rounded-full">
                <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span className="text-sm font-semibold text-emerald-700">{stats.mostActiveUser[0]}</span>
                <span className="text-xs text-emerald-600">Most Active ({stats.mostActiveUser[1]})</span>
              </div>
            )}

            {/* Most common action */}
            {stats.mostCommonAction && (
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-violet-50 border border-violet-200 rounded-full">
                <svg className="w-4 h-4 text-violet-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <span className="text-sm font-semibold text-violet-700">{stats.mostCommonAction[0]}</span>
                <span className="text-xs text-violet-600">Most Common ({stats.mostCommonAction[1]})</span>
              </div>
            )}
          </div>
        )}

        {/* ── Filter Bar ───────────────────────────────────────────────────── */}
        <Card>
          <div className="flex flex-wrap items-center gap-3">
            <SearchBar
              value={search}
              onChange={setSearch}
              placeholder="Search details, user, action..."
              className="w-full sm:w-64"
            />
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className={selectClass}
            >
              {ACTIONS.map((a) => (
                <option key={a} value={a}>
                  {a === "All" ? "All Actions" : a}
                </option>
              ))}
            </select>
            <select
              value={entityFilter}
              onChange={(e) => setEntityFilter(e.target.value)}
              className={selectClass}
            >
              {ENTITY_TYPES.map((e) => (
                <option key={e} value={e}>
                  {e === "All" ? "All Entities" : e}
                </option>
              ))}
            </select>
            <select
              value={userFilter}
              onChange={(e) => setUserFilter(e.target.value)}
              className={selectClass}
            >
              <option value="All">All Users</option>
              {uniqueUsers.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
            {(search || actionFilter !== "All" || entityFilter !== "All" || userFilter !== "All") && (
              <button
                onClick={() => {
                  setSearch("");
                  setActionFilter("All");
                  setEntityFilter("All");
                  setUserFilter("All");
                }}
                className="text-sm text-gray-500 hover:text-gray-700 underline transition-colors"
              >
                Clear filters
              </button>
            )}
          </div>
        </Card>

        {/* ── Content ──────────────────────────────────────────────────────── */}
        {loading ? (
          <LoadingSpinner message="Loading activity logs..." />
        ) : filteredLogs.length === 0 ? (
          <Card>
            <EmptyState
              icon={
                <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              }
              title="No activity logs found"
              message={search || actionFilter !== "All" || entityFilter !== "All" || userFilter !== "All"
                ? "No logs match your current filters. Try adjusting your search criteria."
                : "There are no activity logs recorded yet."}
            />
          </Card>
        ) : (
          <div className="space-y-2">
            {paginatedLogs.map((log, idx) => {
              const color = getActionColor(log.action);
              const isEven = idx % 2 === 0;

              return (
                <div
                  key={log.id || idx}
                  className={`group relative flex items-start gap-4 p-4 rounded-xl border-l-4 ${color.border} ${
                    isEven ? "bg-white" : "bg-gray-50/50"
                  } hover:shadow-md hover:bg-white transition-all duration-200`}
                >
                  {/* Icon */}
                  <div
                    className={`flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center ${color.bg} ${color.text} ring-4 ${color.ring}`}
                  >
                    {getActionIcon(log.action)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      {/* Action badge */}
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${color.bg} ${color.text} border ${color.border}`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${color.dot}`}></span>
                        {log.action}
                      </span>

                      {/* Entity badge */}
                      {log.entityType && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200">
                          {log.entityType}
                        </span>
                      )}

                      {/* Entity ID */}
                      {log.entityId && (
                        <span className="text-xs text-gray-400 font-mono">
                          #{log.entityId}
                        </span>
                      )}
                    </div>

                    {/* Details */}
                    {log.details && (
                      <p className="text-sm text-gray-700 mb-1 leading-relaxed">{log.details}</p>
                    )}

                    {/* Meta */}
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-400">
                      {log.performedBy && (
                        <span className="inline-flex items-center gap-1">
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          <span>
                            by <span className="font-medium text-gray-600">{log.performedBy}</span>
                            {log.performedByRole && (
                              <span className="text-gray-400"> ({log.performedByRole})</span>
                            )}
                          </span>
                        </span>
                      )}

                      {log.ipAddress && (
                        <span className="inline-flex items-center gap-1">
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9" />
                          </svg>
                          {log.ipAddress}
                        </span>
                      )}

                      <span className="inline-flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {formatRelativeTime(log.performedAt)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Pagination */}
            <div className="pt-2">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={filteredLogs.length}
                itemsPerPage={ITEMS_PER_PAGE}
                onPageChange={setCurrentPage}
              />
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
