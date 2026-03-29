import { useEffect, useMemo, useState } from "react";
import API from "../api/axios";
import DashboardLayout from "../layouts/DashboardLayout";
import Card from "../components/ui/Card";
import Input from "../components/ui/Input";
import Select from "../components/ui/Select";
import Button from "../components/ui/Button";
import Modal from "../components/ui/Modal";
import LoadingSpinner from "../components/ui/LoadingSpinner";
import SearchBar from "../components/ui/SearchBar";
import EmptyState from "../components/ui/EmptyState";
import Pagination from "../components/ui/Pagination";
import StatusBadge from "../components/ui/StatusBadge";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import { useToast, Toast } from "../components/ui/Toast";

/* ────────────────────────── constants ────────────────────────── */

const TYPES = ["LAB", "XRAY", "SCAN", "RADIOLOGY", "OTHER"];
const ITEMS_PER_PAGE = 12;

const TYPE_CONFIG = {
  LAB: {
    color: "bg-blue-100 text-blue-700 border-blue-200",
    bg: "bg-blue-50",
    accent: "text-blue-600",
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
      </svg>
    ),
  },
  XRAY: {
    color: "bg-purple-100 text-purple-700 border-purple-200",
    bg: "bg-purple-50",
    accent: "text-purple-600",
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
      </svg>
    ),
  },
  SCAN: {
    color: "bg-amber-100 text-amber-700 border-amber-200",
    bg: "bg-amber-50",
    accent: "text-amber-600",
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
      </svg>
    ),
  },
  RADIOLOGY: {
    color: "bg-rose-100 text-rose-700 border-rose-200",
    bg: "bg-rose-50",
    accent: "text-rose-600",
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.636 18.364a9 9 0 010-12.728m12.728 0a9 9 0 010 12.728m-9.9-2.829a5 5 0 010-7.07m7.072 0a5 5 0 010 7.07M13 12a1 1 0 11-2 0 1 1 0 012 0z" />
      </svg>
    ),
  },
  OTHER: {
    color: "bg-gray-100 text-gray-700 border-gray-200",
    bg: "bg-gray-50",
    accent: "text-gray-600",
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
      </svg>
    ),
  },
};

/* ────────────────────────── helpers ────────────────────────── */

const formatPrice = (price) => {
  const num = Number(price);
  if (isNaN(num)) return "Rs. 0.00";
  return `Rs. ${num.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const TypeBadge = ({ type, size = "sm" }) => {
  const cfg = TYPE_CONFIG[type] || TYPE_CONFIG.OTHER;
  const sizeClass = size === "xs" ? "text-[10px] px-1.5 py-0.5 gap-1" : "text-xs px-2.5 py-1 gap-1.5";
  return (
    <span className={`inline-flex items-center font-semibold rounded-full border ${cfg.color} ${sizeClass}`}>
      {cfg.icon}
      {type}
    </span>
  );
};

const TableIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18M3 6h18M3 18h18" />
  </svg>
);

const GridIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
  </svg>
);

const TestIcon = () => (
  <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
  </svg>
);

/* ────────────────────────── toggle switch ────────────────────────── */

const ToggleSwitch = ({ checked, onChange, disabled }) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    disabled={disabled}
    onClick={onChange}
    className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-1 ${
      disabled ? "opacity-50 cursor-not-allowed" : ""
    } ${checked ? "bg-emerald-500" : "bg-gray-300"}`}
  >
    <span
      className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow-sm transform ring-0 transition duration-200 ease-in-out ${
        checked ? "translate-x-4" : "translate-x-0"
      }`}
    />
  </button>
);

/* ══════════════════════════ MAIN COMPONENT ══════════════════════════ */

function Tests() {
  const role = localStorage.getItem("role");
  const { toasts, toast, remove } = useToast();

  /* ── data state ── */
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);

  /* ── filters ── */
  const [q, setQ] = useState("");
  const [activeTab, setActiveTab] = useState("ALL");
  const [showInactive, setShowInactive] = useState(false);

  /* ── view ── */
  const [viewMode, setViewMode] = useState("table");
  const [currentPage, setCurrentPage] = useState(1);

  /* ── add form ── */
  const [showAddForm, setShowAddForm] = useState(false);
  const [addLoading, setAddLoading] = useState(false);
  const [form, setForm] = useState({ name: "", type: "LAB", price: "", description: "" });

  /* ── edit modal ── */
  const [editOpen, setEditOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [editData, setEditData] = useState({ name: "", type: "LAB", price: "", description: "" });
  const [editLoading, setEditLoading] = useState(false);

  /* ── deactivate confirm ── */
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmId, setConfirmId] = useState(null);
  const [confirmLoading, setConfirmLoading] = useState(false);

  /* ── toggle active loading tracker ── */
  const [togglingIds, setTogglingIds] = useState(new Set());

  /* ────────────────────── data loading ────────────────────── */

  const load = async () => {
    setLoading(true);
    try {
      const res = await API.get("/tests");
      setTests(res.data);
    } catch {
      toast.error("Failed to load medical tests.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  /* ────────────────────── filtering & pagination ────────────────────── */

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return tests
      .filter((t) => (showInactive ? true : t.active))
      .filter((t) => (activeTab === "ALL" ? true : t.type === activeTab))
      .filter((t) => {
        if (!s) return true;
        return [String(t.id), t.name, t.type, String(t.price), t.description || ""].some((v) =>
          v.toLowerCase().includes(s)
        );
      });
  }, [tests, q, activeTab, showInactive]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [q, activeTab, showInactive]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  /* ────────────────────── summary stats ────────────────────── */

  const stats = useMemo(() => {
    const active = tests.filter((t) => t.active);
    const avgPrice = active.length > 0 ? active.reduce((s, t) => s + Number(t.price || 0), 0) / active.length : 0;
    const byType = {};
    TYPES.forEach((type) => {
      byType[type] = tests.filter((t) => t.type === type && t.active).length;
    });
    return {
      total: tests.length,
      active: active.length,
      inactive: tests.length - active.length,
      avgPrice,
      byType,
    };
  }, [tests]);

  /* ────────────────────── form handlers ────────────────────── */

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const onEditChange = (e) => setEditData({ ...editData, [e.target.name]: e.target.value });

  const add = async (e) => {
    e.preventDefault();
    setAddLoading(true);
    try {
      await API.post("/tests", { ...form, price: Number(form.price), active: true });
      setForm({ name: "", type: "LAB", price: "", description: "" });
      toast.success("Test added successfully.", "Test Created");
      load();
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.response?.data || "Failed to add test.");
    } finally {
      setAddLoading(false);
    }
  };

  const openEdit = (t) => {
    setEditId(t.id);
    setEditData({
      name: t.name || "",
      type: t.type || "LAB",
      price: String(t.price || ""),
      description: t.description || "",
    });
    setEditOpen(true);
  };

  const saveEdit = async () => {
    setEditLoading(true);
    try {
      await API.put(`/tests/${editId}`, {
        ...editData,
        price: Number(editData.price),
        active: true,
      });
      setEditOpen(false);
      toast.success("Test updated successfully.", "Test Updated");
      load();
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.response?.data || "Failed to update test.");
    } finally {
      setEditLoading(false);
    }
  };

  /* ────────────────────── deactivate ────────────────────── */

  const openDeactivate = (id) => {
    setConfirmId(id);
    setConfirmOpen(true);
  };

  const confirmDeactivate = async () => {
    setConfirmLoading(true);
    try {
      await API.delete(`/tests/${confirmId}`);
      toast.success("Test deactivated. It will no longer appear in billing.", "Deactivated");
      setConfirmOpen(false);
      load();
    } catch {
      toast.error("Failed to deactivate test.");
    } finally {
      setConfirmLoading(false);
    }
  };

  /* ────────────────────── toggle active/inactive ────────────────────── */

  const toggleActive = async (test) => {
    const newActive = !test.active;
    setTogglingIds((prev) => new Set(prev).add(test.id));
    try {
      if (newActive) {
        // Reactivate via PUT
        await API.put(`/tests/${test.id}`, {
          name: test.name,
          type: test.type,
          price: Number(test.price),
          description: test.description || "",
          active: true,
        });
        toast.success(`"${test.name}" reactivated.`);
      } else {
        // Deactivate via DELETE (soft delete)
        await API.delete(`/tests/${test.id}`);
        toast.success(`"${test.name}" deactivated.`);
      }
      load();
    } catch {
      toast.error(`Failed to ${newActive ? "activate" : "deactivate"} test.`);
    } finally {
      setTogglingIds((prev) => {
        const next = new Set(prev);
        next.delete(test.id);
        return next;
      });
    }
  };

  /* ══════════════════════════ RENDER ══════════════════════════ */

  return (
    <DashboardLayout>
      <Toast toasts={toasts} remove={remove} />

      <div className="space-y-6">
        {/* ────── Page Header ────── */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Medical Tests</h2>
            <p className="text-gray-500 mt-1">Manage tests available for billing and diagnostics.</p>
          </div>
          {role === "ADMIN" && (
            <Button
              onClick={() => setShowAddForm(!showAddForm)}
              className="flex items-center gap-2"
            >
              {showAddForm ? (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Close Form
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add Test
                </>
              )}
            </Button>
          )}
        </div>

        {/* ────── Summary Stats ────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                </svg>
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium">Total Tests</p>
                <p className="text-xl font-bold text-gray-900">{stats.total}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium">Active Tests</p>
                <p className="text-xl font-bold text-emerald-600">{stats.active}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                <svg className="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium">Avg. Price</p>
                <p className="text-xl font-bold text-gray-900">{formatPrice(stats.avgPrice)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-violet-100 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-violet-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z" />
                </svg>
              </div>
              <div className="min-w-0">
                <p className="text-xs text-gray-500 font-medium mb-1">By Type</p>
                <div className="flex flex-wrap gap-x-2 gap-y-0.5">
                  {TYPES.map((type) => (
                    <span key={type} className="text-[11px] text-gray-600">
                      <span className="font-semibold">{stats.byType[type]}</span> {type}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ────── Add Test Form (Collapsible) ────── */}
        {role === "ADMIN" && showAddForm && (
          <Card title="Add New Test" subtitle="Create a new medical test entry">
            <form onSubmit={add} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1.5 block">Test Name *</label>
                  <Input
                    name="name"
                    placeholder="e.g. Complete Blood Count"
                    value={form.name}
                    onChange={onChange}
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1.5 block">Type *</label>
                  <Select name="type" value={form.type} onChange={onChange}>
                    {TYPES.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </Select>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1.5 block">Price (Rs.) *</label>
                  <Input
                    name="price"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="e.g. 1500.00"
                    value={form.price}
                    onChange={onChange}
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1.5 block">Description</label>
                  <Input
                    name="description"
                    placeholder="Brief description (optional)"
                    value={form.description}
                    onChange={onChange}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setShowAddForm(false);
                    setForm({ name: "", type: "LAB", price: "", description: "" });
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={addLoading}>
                  {addLoading ? "Adding..." : "Add Test"}
                </Button>
              </div>
            </form>
          </Card>
        )}

        {/* ────── Type Category Tabs ────── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-1 overflow-x-auto bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setActiveTab("ALL")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                activeTab === "ALL" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              All
              <span className="text-[10px] bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded-full ml-0.5">
                {showInactive ? stats.total : stats.active}
              </span>
            </button>
            {TYPES.map((type) => {
              const cfg = TYPE_CONFIG[type];
              const count = showInactive
                ? tests.filter((t) => t.type === type).length
                : stats.byType[type];
              return (
                <button
                  key={type}
                  onClick={() => setActiveTab(type)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                    activeTab === type ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  <span className={cfg.accent}>{cfg.icon}</span>
                  {type}
                  <span className="text-[10px] bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded-full ml-0.5">
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-3">
            {/* Show Inactive Toggle */}
            {stats.inactive > 0 && (
              <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer whitespace-nowrap">
                <ToggleSwitch
                  checked={showInactive}
                  onChange={() => setShowInactive(!showInactive)}
                />
                Show inactive ({stats.inactive})
              </label>
            )}

            {/* View Mode Toggle */}
            <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode("table")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  viewMode === "table" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <TableIcon /> Table
              </button>
              <button
                onClick={() => setViewMode("grid")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  viewMode === "grid" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <GridIcon /> Cards
              </button>
            </div>
          </div>
        </div>

        {/* ────── Search Bar ────── */}
        <SearchBar
          value={q}
          onChange={setQ}
          placeholder="Search tests by name, type, price, or description..."
          className="w-full sm:max-w-md"
        />

        {/* ────── Content ────── */}
        {loading ? (
          <LoadingSpinner message="Loading medical tests..." />
        ) : filtered.length === 0 ? (
          <Card>
            <EmptyState
              icon={<TestIcon />}
              title="No tests found"
              message={
                q || activeTab !== "ALL"
                  ? "Try adjusting your search or filter criteria."
                  : "Get started by adding your first medical test."
              }
              action={role === "ADMIN" && !q && activeTab === "ALL" ? () => setShowAddForm(true) : undefined}
              actionLabel="Add Test"
            />
          </Card>
        ) : viewMode === "table" ? (
          /* ══════ TABLE VIEW ══════ */
          <Card
            noPadding
            title="Tests List"
            subtitle={`Showing ${paginated.length} of ${filtered.length} tests`}
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-gray-50/80 border-b border-gray-200">
                    <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">ID</th>
                    <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Test Name</th>
                    <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Type</th>
                    <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Price</th>
                    <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Description</th>
                    <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center">Status</th>
                    {role === "ADMIN" && (
                      <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {paginated.map((t) => (
                    <tr
                      key={t.id}
                      className={`hover:bg-blue-50/40 transition-colors ${!t.active ? "opacity-60" : ""}`}
                    >
                      <td className="px-5 py-3.5 text-gray-400 font-mono text-xs">{t.id}</td>
                      <td className="px-5 py-3.5">
                        <p className="font-semibold text-gray-900">{t.name}</p>
                      </td>
                      <td className="px-5 py-3.5">
                        <TypeBadge type={t.type} />
                      </td>
                      <td className="px-5 py-3.5 text-right font-semibold text-gray-900">
                        {formatPrice(t.price)}
                      </td>
                      <td className="px-5 py-3.5 text-gray-500 max-w-xs truncate">
                        {t.description || <span className="text-gray-300">--</span>}
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        {role === "ADMIN" ? (
                          <div className="flex items-center justify-center gap-2">
                            <ToggleSwitch
                              checked={t.active}
                              onChange={() => toggleActive(t)}
                              disabled={togglingIds.has(t.id)}
                            />
                            <span className={`text-xs font-medium ${t.active ? "text-emerald-600" : "text-gray-400"}`}>
                              {t.active ? "Active" : "Inactive"}
                            </span>
                          </div>
                        ) : (
                          <StatusBadge status={t.active ? "ACTIVE" : "INACTIVE"} size="xs" />
                        )}
                      </td>
                      {role === "ADMIN" && (
                        <td className="px-5 py-3.5">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="secondary"
                              onClick={() => openEdit(t)}
                              className="!px-2.5 !py-1.5 !text-xs"
                            >
                              Edit
                            </Button>
                            {t.active && (
                              <Button
                                variant="danger"
                                onClick={() => openDeactivate(t.id)}
                                className="!px-2.5 !py-1.5 !text-xs"
                              >
                                Deactivate
                              </Button>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-5 border-t border-gray-100">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={filtered.length}
                itemsPerPage={ITEMS_PER_PAGE}
                onPageChange={setCurrentPage}
              />
            </div>
          </Card>
        ) : (
          /* ══════ GRID / CARD VIEW ══════ */
          <div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {paginated.map((t) => {
                const cfg = TYPE_CONFIG[t.type] || TYPE_CONFIG.OTHER;
                return (
                  <div
                    key={t.id}
                    className={`bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md hover:border-blue-200 transition-all flex flex-col overflow-hidden ${
                      !t.active ? "opacity-60" : ""
                    }`}
                  >
                    {/* Colored top bar */}
                    <div className={`h-1.5 ${cfg.color.split(" ")[0]}`} />

                    <div className="p-5 flex-1 flex flex-col">
                      {/* Header */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-gray-900 truncate">{t.name}</p>
                          <p className="text-xs text-gray-400 mt-0.5">ID: {t.id}</p>
                        </div>
                        <TypeBadge type={t.type} size="xs" />
                      </div>

                      {/* Price */}
                      <div className="mb-3">
                        <p className="text-lg font-bold text-gray-900">{formatPrice(t.price)}</p>
                      </div>

                      {/* Description */}
                      <p className="text-sm text-gray-500 mb-4 line-clamp-2 flex-1">
                        {t.description || "No description provided."}
                      </p>

                      {/* Footer */}
                      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                        {role === "ADMIN" ? (
                          <div className="flex items-center gap-2">
                            <ToggleSwitch
                              checked={t.active}
                              onChange={() => toggleActive(t)}
                              disabled={togglingIds.has(t.id)}
                            />
                            <span className={`text-xs font-medium ${t.active ? "text-emerald-600" : "text-gray-400"}`}>
                              {t.active ? "Active" : "Inactive"}
                            </span>
                          </div>
                        ) : (
                          <StatusBadge status={t.active ? "ACTIVE" : "INACTIVE"} size="xs" />
                        )}

                        {role === "ADMIN" && (
                          <div className="flex items-center gap-1.5">
                            <Button
                              variant="secondary"
                              onClick={() => openEdit(t)}
                              className="!px-2.5 !py-1.5 !text-xs"
                            >
                              Edit
                            </Button>
                            {t.active && (
                              <Button
                                variant="danger"
                                onClick={() => openDeactivate(t.id)}
                                className="!px-2.5 !py-1.5 !text-xs"
                              >
                                Deactivate
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-4">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={filtered.length}
                itemsPerPage={ITEMS_PER_PAGE}
                onPageChange={setCurrentPage}
              />
            </div>
          </div>
        )}
      </div>

      {/* ────── Edit Test Modal ────── */}
      <Modal
        open={editOpen}
        title={`Edit Test #${editId}`}
        onClose={() => setEditOpen(false)}
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setEditOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveEdit} disabled={editLoading}>
              {editLoading ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1.5 block">Test Name *</label>
            <Input name="name" value={editData.name} onChange={onEditChange} required />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1.5 block">Type *</label>
            <Select name="type" value={editData.type} onChange={onEditChange}>
              {TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </Select>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1.5 block">Price (Rs.) *</label>
            <Input type="number" step="0.01" min="0" name="price" value={editData.price} onChange={onEditChange} required />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1.5 block">Description</label>
            <Input name="description" placeholder="Optional" value={editData.description} onChange={onEditChange} />
          </div>
        </div>
      </Modal>

      {/* ────── Deactivate Confirm Dialog ────── */}
      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={confirmDeactivate}
        title="Deactivate Test"
        message="Are you sure you want to deactivate this test? It will no longer appear in billing but will not be permanently deleted."
        confirmLabel="Deactivate"
        loading={confirmLoading}
      />
    </DashboardLayout>
  );
}

export default Tests;
