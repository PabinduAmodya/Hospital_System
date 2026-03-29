import { useEffect, useMemo, useState, useCallback } from "react";
import API from "../api/axios";
import DashboardLayout from "../layouts/DashboardLayout";
import Card from "../components/ui/Card";
import Input from "../components/ui/Input";
import Select from "../components/ui/Select";
import Button from "../components/ui/Button";
import Modal from "../components/ui/Modal";
import LoadingSpinner from "../components/ui/LoadingSpinner";
import SearchBar from "../components/ui/SearchBar";
import StatusBadge from "../components/ui/StatusBadge";
import EmptyState from "../components/ui/EmptyState";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import Pagination from "../components/ui/Pagination";
import { useToast, Toast } from "../components/ui/Toast";

const ROLES = ["ADMIN", "RECEPTIONIST", "CASHIER", "DOCTOR"];
const ITEMS_PER_PAGE = 8;
const EMPTY_FORM = { name: "", username: "", password: "", role: "RECEPTIONIST", email: "" };

const ROLE_COLORS = {
  ADMIN: "bg-indigo-500",
  RECEPTIONIST: "bg-cyan-500",
  CASHIER: "bg-teal-500",
  DOCTOR: "bg-emerald-500",
};

const ROLE_AVATAR_BG = {
  ADMIN: "bg-indigo-100 text-indigo-700",
  RECEPTIONIST: "bg-cyan-100 text-cyan-700",
  CASHIER: "bg-teal-100 text-teal-700",
  DOCTOR: "bg-emerald-100 text-emerald-700",
};

function getInitials(name) {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function PasswordStrength({ password }) {
  if (!password) return null;

  let score = 0;
  if (password.length >= 6) score++;
  if (password.length >= 10) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  const levels = [
    { label: "Very Weak", color: "bg-red-500", width: "w-1/5" },
    { label: "Weak", color: "bg-orange-500", width: "w-2/5" },
    { label: "Fair", color: "bg-amber-500", width: "w-3/5" },
    { label: "Strong", color: "bg-blue-500", width: "w-4/5" },
    { label: "Very Strong", color: "bg-emerald-500", width: "w-full" },
  ];

  const level = levels[Math.min(score, 4)];

  return (
    <div className="mt-1.5 space-y-1">
      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-300 ${level.color} ${level.width}`} />
      </div>
      <p className="text-[11px] text-gray-400">{level.label}</p>
    </div>
  );
}

function PasswordInput({ value, onChange, placeholder = "Password", name = "password", required = false }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input
        type={show ? "text" : "password"}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500 pr-10"
      />
      <button
        type="button"
        onClick={() => setShow(!show)}
        className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
        tabIndex={-1}
      >
        {show ? (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L6.59 6.59m7.532 7.532l3.29 3.29M3 3l18 18" />
          </svg>
        ) : (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
        )}
      </button>
    </div>
  );
}

function UserAvatar({ name, role, size = "md" }) {
  const sizes = { sm: "w-8 h-8 text-xs", md: "w-10 h-10 text-sm", lg: "w-12 h-12 text-base" };
  const colorClass = ROLE_AVATAR_BG[role] || "bg-gray-100 text-gray-700";
  return (
    <div className={`${sizes[size]} ${colorClass} rounded-full flex items-center justify-center font-semibold flex-shrink-0`}>
      {getInitials(name)}
    </div>
  );
}

function StatCard({ label, value, icon, color }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex items-center gap-4">
      <div className={`w-11 h-11 rounded-xl ${color} flex items-center justify-center flex-shrink-0`}>
        {icon}
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        <p className="text-xs text-gray-500 mt-0.5">{label}</p>
      </div>
    </div>
  );
}

function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [filterRole, setFilterRole] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [creating, setCreating] = useState(false);

  const [form, setForm] = useState(EMPTY_FORM);
  const [editOpen, setEditOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [editUser, setEditUser] = useState(null);
  const [editData, setEditData] = useState({ name: "", username: "", password: "", role: "", email: "" });
  const [editOriginalRole, setEditOriginalRole] = useState("");
  const [editLoading, setEditLoading] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [doctors, setDoctors] = useState([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState("");

  const { toasts, toast, remove } = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await API.get("/admin/users");
      setUsers(res.data);
    } catch {
      toast.error("Failed to load users. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const res = await API.get("/doctors");
        setDoctors(res.data);
      } catch {
        // silently fail — doctors list is only needed for DOCTOR role
      }
    };
    fetchDoctors();
  }, []);

  const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  const onEditChange = (e) => setEditData((d) => ({ ...d, [e.target.name]: e.target.value }));

  // --- Stats ---
  const stats = useMemo(() => {
    const total = users.length;
    const admins = users.filter((u) => u.role === "ADMIN").length;
    const receptionists = users.filter((u) => u.role === "RECEPTIONIST").length;
    const cashiers = users.filter((u) => u.role === "CASHIER").length;
    return { total, admins, receptionists, cashiers };
  }, [users]);

  // --- Filtering + Pagination ---
  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return users
      .filter((u) => (filterRole ? u.role === filterRole : true))
      .filter((u) =>
        !s ||
        [String(u.id), u.name, u.username, u.role, u.email || ""].some((v) =>
          v.toLowerCase().includes(s)
        )
      );
  }, [users, q, filterRole]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);
  const paginated = useMemo(
    () => filtered.slice((safePage - 1) * ITEMS_PER_PAGE, safePage * ITEMS_PER_PAGE),
    [filtered, safePage]
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [q, filterRole]);

  // --- Create ---
  const create = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      const params = form.role === "DOCTOR" && selectedDoctorId ? `?doctorId=${selectedDoctorId}` : "";
      await API.post(`/admin/users${params}`, { ...form, enabled: true });
      const emailHint = form.email ? ` Welcome email sent to ${form.email}.` : "";
      toast.success(`User "${form.username}" created successfully.${emailHint}`, "User Created");
      setForm(EMPTY_FORM);
      setSelectedDoctorId("");
      setFormOpen(false);
      load();
    } catch (e) {
      toast.error(
        e?.response?.data?.message || e?.response?.data || "Failed to create user. Please check the details and try again.",
        "Creation Failed"
      );
    } finally {
      setCreating(false);
    }
  };

  // --- Edit ---
  const openEdit = (u) => {
    setEditId(u.id);
    setEditUser(u);
    setEditOriginalRole(u.role || "");
    setEditData({
      name: u.name || "",
      username: u.username || "",
      password: "",
      role: u.role || "RECEPTIONIST",
      email: u.email || "",
    });
    setEditOpen(true);
  };

  const saveEdit = async () => {
    setEditLoading(true);
    try {
      const payload = {
        name: editData.name,
        username: editData.username,
        role: editData.role,
        email: editData.email,
      };
      if (editData.password.trim()) payload.password = editData.password;
      await API.put(`/admin/users/${editId}`, payload);
      setEditOpen(false);
      toast.success("User details updated successfully.", "User Updated");
      load();
    } catch (e) {
      toast.error(
        e?.response?.data?.message || e?.response?.data || "Failed to update user.",
        "Update Failed"
      );
    } finally {
      setEditLoading(false);
    }
  };

  // --- Reset Password ---
  const sendReset = async (u) => {
    if (!u.email) {
      toast.warning(
        `No email on record for ${u.name}. Edit the user and add an email first.`,
        "No Email"
      );
      return;
    }
    try {
      await API.post("/auth/forgot-password", { email: u.email });
      toast.success(`Password reset link sent to ${u.email}.`, "Reset Email Sent");
    } catch {
      toast.info(`Reset link sent (if ${u.email} is registered).`, "Reset Requested");
    }
  };

  // --- Delete ---
  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await API.delete(`/admin/users/${deleteTarget.id}`);
      toast.success(`User "${deleteTarget.name || deleteTarget.username}" has been deleted.`, "User Deleted");
      setDeleteTarget(null);
      load();
    } catch (e) {
      toast.error(
        e?.response?.data?.message || "Failed to delete user.",
        "Delete Failed"
      );
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <Toast toasts={toasts} remove={remove} />

      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">User Management</h2>
            <p className="text-gray-500 text-sm mt-1">Create and manage system accounts for staff members.</p>
          </div>
          <Button onClick={() => setFormOpen((o) => !o)} className="flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={formOpen ? "M5 15l7-7 7 7" : "M12 4v16m8-8H4"} />
            </svg>
            {formOpen ? "Hide Form" : "Add New User"}
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Total Users"
            value={stats.total}
            color="bg-blue-50"
            icon={<svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}
          />
          <StatCard
            label="Admins"
            value={stats.admins}
            color="bg-indigo-50"
            icon={<svg className="w-5 h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>}
          />
          <StatCard
            label="Receptionists"
            value={stats.receptionists}
            color="bg-cyan-50"
            icon={<svg className="w-5 h-5 text-cyan-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>}
          />
          <StatCard
            label="Cashiers"
            value={stats.cashiers}
            color="bg-teal-50"
            icon={<svg className="w-5 h-5 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>}
          />
        </div>

        {/* Create User Form (Collapsible) */}
        {formOpen && (
          <Card
            title="Create New User"
            subtitle="Fill in the details below to add a new staff member"
            right={
              <button
                onClick={() => setFormOpen(false)}
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            }
          >
            <form onSubmit={create} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Full Name</label>
                  <Input
                    name="name"
                    placeholder="e.g. John Doe"
                    value={form.name}
                    onChange={onChange}
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Username</label>
                  <Input
                    name="username"
                    placeholder="e.g. johndoe"
                    value={form.username}
                    onChange={onChange}
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Password</label>
                  <PasswordInput
                    name="password"
                    value={form.password}
                    onChange={onChange}
                    placeholder="Create a strong password"
                    required
                  />
                  <PasswordStrength password={form.password} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Role</label>
                  <Select name="role" value={form.role} onChange={onChange}>
                    {ROLES.map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </Select>
                </div>
                {form.role === "DOCTOR" && (
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1.5">Link to Doctor</label>
                    <Select value={selectedDoctorId} onChange={(e) => setSelectedDoctorId(e.target.value)}>
                      <option value="">-- Select a Doctor --</option>
                      {doctors.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name} — {d.specialization || "General"}
                        </option>
                      ))}
                    </Select>
                    <p className="text-[11px] text-gray-400 mt-1.5">
                      Link this login account to an existing doctor record.
                    </p>
                  </div>
                )}
                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Email Address</label>
                  <Input
                    name="email"
                    placeholder="e.g. john@hospital.com"
                    type="email"
                    value={form.email}
                    onChange={onChange}
                  />
                  <p className="text-[11px] text-gray-400 mt-1.5 flex items-center gap-1">
                    <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {form.email
                      ? `A welcome email with login credentials will be sent to ${form.email}`
                      : "Add an email to send a welcome message with login details. Also used for password resets."
                    }
                  </p>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
                <Button variant="secondary" type="button" onClick={() => { setForm(EMPTY_FORM); setFormOpen(false); }}>
                  Cancel
                </Button>
                <Button type="submit" disabled={creating} className="flex items-center gap-2">
                  {creating ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Creating...
                    </>
                  ) : (
                    "Create User"
                  )}
                </Button>
              </div>
            </form>
          </Card>
        )}

        {/* User List */}
        <Card
          title="Users"
          subtitle={loading ? "Loading..." : `${filtered.length} of ${users.length} users`}
          noPadding
          right={
            <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
              <Select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                className="w-36 !py-2"
              >
                <option value="">All Roles</option>
                {ROLES.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </Select>
              <SearchBar
                value={q}
                onChange={setQ}
                placeholder="Search users..."
                className="w-64"
              />
            </div>
          }
        >
          {loading ? (
            <LoadingSpinner message="Loading users..." />
          ) : filtered.length === 0 ? (
            <EmptyState
              title={q || filterRole ? "No matching users" : "No users yet"}
              message={
                q || filterRole
                  ? "Try adjusting your search or filter criteria."
                  : "Get started by creating your first user account."
              }
              action={!q && !filterRole ? () => setFormOpen(true) : undefined}
              actionLabel="Add New User"
            />
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="bg-gray-50/80 border-b border-gray-100">
                      <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">User</th>
                      <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Username</th>
                      <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Role</th>
                      <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Email</th>
                      <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {paginated.map((u) => (
                      <tr key={u.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <UserAvatar name={u.name} role={u.role} />
                            <div>
                              <p className="font-medium text-gray-900">{u.name}</p>
                              <p className="text-xs text-gray-400">ID: {u.id}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="text-gray-600 font-mono text-xs bg-gray-50 px-2 py-1 rounded">
                            @{u.username}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          <StatusBadge status={u.role} size="xs" />
                        </td>
                        <td className="px-5 py-3.5">
                          {u.email ? (
                            <span className="text-gray-500 text-xs">{u.email}</span>
                          ) : (
                            <span className="text-gray-300 text-xs italic">No email</span>
                          )}
                        </td>
                        <td className="px-5 py-3.5">
                          <StatusBadge status={u.enabled ? "ACTIVE" : "INACTIVE"} size="xs" />
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => openEdit(u)}
                              className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Edit user"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => sendReset(u)}
                              className="p-2 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                              title={u.email ? `Send reset to ${u.email}` : "No email on record"}
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => setDeleteTarget(u)}
                              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete user"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="px-5 border-t border-gray-100">
                <Pagination
                  currentPage={safePage}
                  totalPages={totalPages}
                  totalItems={filtered.length}
                  itemsPerPage={ITEMS_PER_PAGE}
                  onPageChange={setCurrentPage}
                />
              </div>
            </>
          )}
        </Card>
      </div>

      {/* Edit Modal */}
      <Modal
        open={editOpen}
        title={editUser ? `Edit User - ${editUser.name}` : "Edit User"}
        onClose={() => setEditOpen(false)}
        size="md"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setEditOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveEdit} disabled={editLoading} className="flex items-center gap-2">
              {editLoading ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </div>
        }
      >
        <div className="space-y-5">
          {/* User preview */}
          {editUser && (
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
              <UserAvatar name={editData.name || editUser.name} role={editData.role} size="lg" />
              <div>
                <p className="font-medium text-gray-900">{editData.name || editUser.name}</p>
                <p className="text-xs text-gray-500">@{editData.username || editUser.username} &middot; ID: {editId}</p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Full Name</label>
              <Input name="name" value={editData.name} onChange={onEditChange} required />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Username</label>
              <Input name="username" value={editData.username} onChange={onEditChange} required />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Role</label>
              <Select name="role" value={editData.role} onChange={onEditChange}>
                {ROLES.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </Select>
              {editOriginalRole && editData.role !== editOriginalRole && (
                <div className="mt-2 flex items-start gap-2 p-2.5 bg-amber-50 border border-amber-200 rounded-lg">
                  <svg className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  <p className="text-xs text-amber-700">
                    Changing role from <strong>{editOriginalRole}</strong> to <strong>{editData.role}</strong> will
                    modify this user's permissions and access level immediately.
                  </p>
                </div>
              )}
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Email Address</label>
              <Input
                name="email"
                type="email"
                placeholder="user@hospital.com"
                value={editData.email}
                onChange={onEditChange}
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1.5">
                New Password{" "}
                <span className="text-gray-400 font-normal">(leave blank to keep current)</span>
              </label>
              <PasswordInput
                name="password"
                value={editData.password}
                onChange={onEditChange}
                placeholder="Enter new password"
              />
              {editData.password && <PasswordStrength password={editData.password} />}
            </div>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title="Delete User"
        message={
          deleteTarget
            ? `Are you sure you want to delete "${deleteTarget.name || deleteTarget.username}"? This action cannot be undone and all associated data will be permanently removed.`
            : ""
        }
        confirmLabel="Delete User"
        loading={deleteLoading}
      />
    </DashboardLayout>
  );
}

export default Users;
