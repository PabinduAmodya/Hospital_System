import { useEffect, useMemo, useState, useCallback } from "react";
import API from "../api/axios";
import DashboardLayout from "../layouts/DashboardLayout";
import Card from "../components/ui/Card";
import Input from "../components/ui/Input";
import Select from "../components/ui/Select";
import Button from "../components/ui/Button";
import Modal from "../components/ui/Modal";
import SearchBar from "../components/ui/SearchBar";
import LoadingSpinner from "../components/ui/LoadingSpinner";
import EmptyState from "../components/ui/EmptyState";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import Pagination from "../components/ui/Pagination";
import { useToast, Toast } from "../components/ui/Toast";

const EMPTY_FORM = { name: "", specialization: "", phone: "", email: "", channeling_fee: "" };
const ITEMS_PER_PAGE = 10;

const SPEC_COLORS = {
  Cardiology:       { bg: "bg-red-50",     text: "text-red-700",     border: "border-red-200" },
  Neurology:        { bg: "bg-purple-50",  text: "text-purple-700",  border: "border-purple-200" },
  Orthopedics:      { bg: "bg-amber-50",   text: "text-amber-700",   border: "border-amber-200" },
  Pediatrics:       { bg: "bg-pink-50",    text: "text-pink-700",    border: "border-pink-200" },
  Dermatology:      { bg: "bg-orange-50",  text: "text-orange-700",  border: "border-orange-200" },
  Ophthalmology:    { bg: "bg-cyan-50",    text: "text-cyan-700",    border: "border-cyan-200" },
  ENT:              { bg: "bg-teal-50",    text: "text-teal-700",    border: "border-teal-200" },
  Psychiatry:       { bg: "bg-violet-50",  text: "text-violet-700",  border: "border-violet-200" },
  "General Medicine": { bg: "bg-blue-50",  text: "text-blue-700",    border: "border-blue-200" },
  Surgery:          { bg: "bg-rose-50",    text: "text-rose-700",    border: "border-rose-200" },
  Gynecology:       { bg: "bg-fuchsia-50", text: "text-fuchsia-700", border: "border-fuchsia-200" },
};
const DEFAULT_SPEC_COLOR = { bg: "bg-indigo-50", text: "text-indigo-700", border: "border-indigo-200" };

function getSpecColor(spec) {
  return SPEC_COLORS[spec] || DEFAULT_SPEC_COLOR;
}

function formatFee(value) {
  const num = Number(value);
  if (isNaN(num)) return "Rs. 0.00";
  return `Rs. ${num.toLocaleString("en-LK", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function getInitials(name) {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

const AVATAR_COLORS = [
  "bg-blue-500", "bg-emerald-500", "bg-purple-500", "bg-rose-500",
  "bg-amber-500", "bg-cyan-500", "bg-indigo-500", "bg-teal-500",
];

function getAvatarColor(name) {
  if (!name) return AVATAR_COLORS[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function SpecBadge({ specialization, size = "sm" }) {
  const color = getSpecColor(specialization);
  const sizeClass = size === "xs"
    ? "text-[10px] px-1.5 py-0.5"
    : size === "sm"
    ? "text-xs px-2.5 py-0.5"
    : "text-sm px-3 py-1";
  return (
    <span className={`inline-flex items-center font-medium rounded-full border ${color.bg} ${color.text} ${color.border} ${sizeClass}`}>
      {specialization}
    </span>
  );
}

function DoctorAvatar({ name, size = "md" }) {
  const sizeClass = size === "sm" ? "w-8 h-8 text-xs" : size === "md" ? "w-10 h-10 text-sm" : "w-16 h-16 text-xl";
  return (
    <div className={`${sizeClass} ${getAvatarColor(name)} rounded-full flex items-center justify-center text-white font-bold flex-shrink-0`}>
      {getInitials(name)}
    </div>
  );
}

// --- View toggle icons ---
function TableIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
    </svg>
  );
}
function GridIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
    </svg>
  );
}

function DoctorIcon() {
  return (
    <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

// ========================================
// Main Component
// ========================================
function Doctors() {
  const role = localStorage.getItem("role");
  const { toasts, toast, remove } = useToast();

  const [doctors, setDoctors] = useState([]);
  const [specializations, setSpecs] = useState([]);
  const [loading, setLoading] = useState(true);

  // filters
  const [q, setQ] = useState("");
  const [filterSpec, setFilterSpec] = useState("");

  // pagination
  const [currentPage, setCurrentPage] = useState(1);

  // view mode
  const [viewMode, setViewMode] = useState("table");

  // add form
  const [form, setForm] = useState(EMPTY_FORM);
  const [addLoading, setAddLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);

  // edit modal
  const [editOpen, setEditOpen] = useState(false);
  const [editData, setEditData] = useState(EMPTY_FORM);
  const [editId, setEditId] = useState(null);
  const [editLoading, setEditLoading] = useState(false);

  // view / detail modal
  const [viewOpen, setViewOpen] = useState(false);
  const [viewDoctor, setViewDoctor] = useState(null);
  const [viewLoading, setViewLoading] = useState(false);

  // delete confirm
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // ---- Data fetching ----
  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [dRes, sRes] = await Promise.all([
        API.get("/doctors"),
        API.get("/master/specializations"),
      ]);
      setDoctors(dRes.data);
      setSpecs(sRes.data);
    } catch {
      toast.error("Failed to fetch doctors. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // ---- Form handlers ----
  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const onEditChange = (e) => setEditData({ ...editData, [e.target.name]: e.target.value });

  const addDoctor = async (e) => {
    e.preventDefault();
    setAddLoading(true);
    try {
      await API.post("/doctors/add", { ...form, channeling_fee: Number(form.channeling_fee) });
      setForm(EMPTY_FORM);
      setShowAddForm(false);
      toast.success("Doctor added successfully.", "Doctor Created");
      fetchAll();
    } catch (e) {
      toast.error(e?.response?.data?.message || e?.response?.data || "Failed to add doctor.");
    } finally {
      setAddLoading(false);
    }
  };

  const openEdit = (d) => {
    setEditId(d.id);
    setEditData({
      name: d.name || "",
      specialization: d.specialization || "",
      phone: d.phone || "",
      email: d.email || "",
      channeling_fee: String(d.channelling_fee ?? d.channeling_fee ?? ""),
    });
    setEditOpen(true);
  };

  const saveEdit = async () => {
    setEditLoading(true);
    try {
      await API.put(`/doctors/${editId}`, {
        ...editData,
        channeling_fee: Number(editData.channeling_fee),
      });
      setEditOpen(false);
      toast.success("Doctor updated successfully.", "Changes Saved");
      fetchAll();
    } catch (e) {
      toast.error(e?.response?.data?.message || e?.response?.data || "Failed to update doctor.");
    } finally {
      setEditLoading(false);
    }
  };

  const openDelete = (id) => {
    setDeleteId(id);
    setDeleteOpen(true);
  };

  const confirmDelete = async () => {
    setDeleteLoading(true);
    try {
      await API.delete(`/doctors/${deleteId}`);
      setDeleteOpen(false);
      setDeleteId(null);
      toast.success("Doctor deleted successfully.", "Doctor Removed");
      fetchAll();
    } catch {
      toast.error("Failed to delete doctor.");
    } finally {
      setDeleteLoading(false);
    }
  };

  const openView = async (doctor) => {
    setViewOpen(true);
    setViewDoctor(null);
    setViewLoading(true);
    try {
      const res = await API.get(`/doctors/${doctor.id}`);
      setViewDoctor(res.data);
    } catch {
      setViewDoctor(doctor);
      toast.warning("Could not load full doctor details.");
    } finally {
      setViewLoading(false);
    }
  };

  // ---- Derived data ----
  const specOptions = useMemo(() => {
    const fromData = [...new Set(doctors.map((d) => d.specialization).filter(Boolean))];
    const merged = [...new Set([...specializations, ...fromData])].sort();
    return merged;
  }, [doctors, specializations]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return doctors
      .filter((d) => (filterSpec ? d.specialization === filterSpec : true))
      .filter((d) => {
        if (!s) return true;
        return [d.name, d.specialization, d.phone, d.email, String(d.id)].some(
          (v) => (v || "").toLowerCase().includes(s)
        );
      });
  }, [doctors, q, filterSpec]);

  // Reset to page 1 when filters change
  useEffect(() => { setCurrentPage(1); }, [q, filterSpec]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginatedDoctors = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filtered.slice(start, start + ITEMS_PER_PAGE);
  }, [filtered, currentPage]);

  // Quick stats for view modal
  const viewSchedules = viewDoctor?.schedules || [];
  const viewAppointments = viewDoctor?.appointments || [];
  const totalAppointments = viewAppointments.length;
  const totalRevenue = viewAppointments.reduce((sum, a) => {
    const fee = a.channelling_fee ?? a.channeling_fee ?? viewDoctor?.channelling_fee ?? viewDoctor?.channeling_fee ?? 0;
    return sum + Number(fee);
  }, 0);

  const getFee = (d) => d.channelling_fee ?? d.channeling_fee ?? 0;

  // ---- Render ----
  return (
    <DashboardLayout>
      <Toast toasts={toasts} remove={remove} />

      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Doctor Management</h2>
            <p className="text-gray-500 mt-1">
              {loading ? "Loading doctors..." : `${doctors.length} doctors registered`}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button onClick={() => setShowAddForm(!showAddForm)}>
              {showAddForm ? "Cancel" : "+ Add Doctor"}
            </Button>
          </div>
        </div>

        {/* Add Doctor Form */}
        {showAddForm && (
          <Card title="Add New Doctor" subtitle="Fill in all fields to register a new doctor">
            <form onSubmit={addDoctor} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">Full Name</label>
                <Input name="name" placeholder="Dr. John Doe" value={form.name} onChange={onChange} required />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">Specialization</label>
                <Select name="specialization" value={form.specialization} onChange={onChange} required>
                  <option value="">Select specialization</option>
                  {specializations.map((s) => <option key={s} value={s}>{s}</option>)}
                </Select>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">Phone Number</label>
                <Input name="phone" placeholder="+94 77 123 4567" value={form.phone} onChange={onChange} required />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">Email Address</label>
                <Input name="email" type="email" placeholder="doctor@hospital.com" value={form.email} onChange={onChange} required />
              </div>
              <div className="md:col-span-2">
                <label className="text-xs font-medium text-gray-600 mb-1 block">Channelling Fee (Rs.)</label>
                <Input name="channeling_fee" type="number" step="0.01" min="0" placeholder="2500.00" value={form.channeling_fee} onChange={onChange} required />
              </div>
              <div className="md:col-span-2 flex justify-end gap-3 pt-2">
                <Button variant="secondary" type="button" onClick={() => { setForm(EMPTY_FORM); setShowAddForm(false); }}>
                  Cancel
                </Button>
                <Button type="submit" disabled={addLoading}>
                  {addLoading ? "Adding..." : "Add Doctor"}
                </Button>
              </div>
            </form>
          </Card>
        )}

        {/* Filters & View Toggle */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex flex-col sm:flex-row gap-3 sm:items-center flex-1">
            <Select value={filterSpec} onChange={(e) => setFilterSpec(e.target.value)} className="w-52">
              <option value="">All Specializations</option>
              {specOptions.map((s) => <option key={s} value={s}>{s}</option>)}
            </Select>
            <SearchBar
              value={q}
              onChange={setQ}
              placeholder="Search by name, email, phone, ID..."
              className="w-full sm:w-80"
            />
          </div>
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

        {/* Content */}
        {loading ? (
          <LoadingSpinner message="Loading doctors..." />
        ) : filtered.length === 0 ? (
          <Card>
            <EmptyState
              icon={<DoctorIcon />}
              title="No doctors found"
              message={q || filterSpec ? "Try adjusting your search or filter criteria." : "Get started by adding your first doctor."}
              action={!q && !filterSpec ? () => setShowAddForm(true) : undefined}
              actionLabel="Add Doctor"
            />
          </Card>
        ) : viewMode === "table" ? (
          /* ====== TABLE VIEW ====== */
          <Card
            noPadding
            title="Doctors List"
            subtitle={`Showing ${paginatedDoctors.length} of ${filtered.length} doctors`}
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-gray-50/80 border-b border-gray-200">
                    <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Doctor</th>
                    <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Specialization</th>
                    <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Phone</th>
                    <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Email</th>
                    <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Channelling Fee</th>
                    <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {paginatedDoctors.map((d) => (
                    <tr key={d.id} className="hover:bg-blue-50/40 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <DoctorAvatar name={d.name} size="md" />
                          <div>
                            <p className="font-semibold text-gray-900">{d.name}</p>
                            <p className="text-xs text-gray-400">ID: {d.id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <SpecBadge specialization={d.specialization} />
                      </td>
                      <td className="px-5 py-3.5 text-gray-600">{d.phone}</td>
                      <td className="px-5 py-3.5 text-gray-600">{d.email}</td>
                      <td className="px-5 py-3.5 text-right font-semibold text-gray-900">{formatFee(getFee(d))}</td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="secondary" onClick={() => openView(d)} className="!px-2.5 !py-1.5 !text-xs">
                            View
                          </Button>
                          <Button variant="secondary" onClick={() => openEdit(d)} className="!px-2.5 !py-1.5 !text-xs">
                            Edit
                          </Button>
                          {role === "ADMIN" && (
                            <Button variant="danger" onClick={() => openDelete(d.id)} className="!px-2.5 !py-1.5 !text-xs">
                              Delete
                            </Button>
                          )}
                        </div>
                      </td>
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
          /* ====== GRID / CARD VIEW ====== */
          <div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {paginatedDoctors.map((d) => (
                <div
                  key={d.id}
                  className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md hover:border-blue-200 transition-all p-5 flex flex-col"
                >
                  <div className="flex items-start gap-3 mb-4">
                    <DoctorAvatar name={d.name} size="lg" />
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-gray-900 truncate">{d.name}</p>
                      <p className="text-xs text-gray-400 mb-1.5">ID: {d.id}</p>
                      <SpecBadge specialization={d.specialization} size="xs" />
                    </div>
                  </div>
                  <div className="space-y-2 text-sm flex-1">
                    <div className="flex items-center gap-2 text-gray-600">
                      <svg className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      <span className="truncate">{d.phone}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <svg className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      <span className="truncate">{d.email}</span>
                    </div>
                  </div>
                  <div className="mt-4 pt-3 border-t border-gray-100">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs text-gray-400">Channelling Fee</span>
                      <span className="font-bold text-gray-900">{formatFee(getFee(d))}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="secondary" onClick={() => openView(d)} className="flex-1 !text-xs !py-1.5">View</Button>
                      <Button variant="secondary" onClick={() => openEdit(d)} className="flex-1 !text-xs !py-1.5">Edit</Button>
                      {role === "ADMIN" && (
                        <Button variant="danger" onClick={() => openDelete(d.id)} className="!text-xs !py-1.5 !px-2.5">
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
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

      {/* ====== VIEW DOCTOR DETAIL MODAL ====== */}
      <Modal
        open={viewOpen}
        title="Doctor Details"
        onClose={() => setViewOpen(false)}
        size="lg"
        footer={
          <div className="flex justify-end">
            <Button variant="secondary" onClick={() => setViewOpen(false)}>Close</Button>
          </div>
        }
      >
        {viewLoading ? (
          <LoadingSpinner message="Loading doctor details..." size="md" />
        ) : viewDoctor ? (
          <div className="space-y-6">
            {/* Doctor Header */}
            <div className="flex items-start gap-4">
              <DoctorAvatar name={viewDoctor.name} size="lg" />
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-900">{viewDoctor.name}</h3>
                <div className="mt-1 mb-2">
                  <SpecBadge specialization={viewDoctor.specialization} />
                </div>
                <p className="text-sm text-gray-500">Doctor ID: #{viewDoctor.id}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-400">Channelling Fee</p>
                <p className="text-xl font-bold text-gray-900">{formatFee(getFee(viewDoctor))}</p>
              </div>
            </div>

            {/* Contact Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">Phone</p>
                <p className="text-sm font-medium text-gray-900">{viewDoctor.phone || "N/A"}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">Email</p>
                <p className="text-sm font-medium text-gray-900">{viewDoctor.email || "N/A"}</p>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-blue-700">{totalAppointments}</p>
                <p className="text-xs text-blue-500 font-medium mt-1">Total Appointments</p>
              </div>
              <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-emerald-700">{formatFee(totalRevenue)}</p>
                <p className="text-xs text-emerald-500 font-medium mt-1">Total Revenue</p>
              </div>
            </div>

            {/* Schedules */}
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-3">Schedules</h4>
              {viewSchedules.length === 0 ? (
                <p className="text-sm text-gray-400 bg-gray-50 rounded-lg p-4 text-center">No schedules available.</p>
              ) : (
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 border-b">
                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Day</th>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Time</th>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Max Patients</th>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {viewSchedules.map((s, idx) => (
                        <tr key={s.id || idx} className="hover:bg-gray-50">
                          <td className="px-4 py-2 font-medium text-gray-900">{s.day_of_week || s.day || "N/A"}</td>
                          <td className="px-4 py-2 text-gray-600">
                            {s.start_time && s.end_time ? `${s.start_time} - ${s.end_time}` : "N/A"}
                          </td>
                          <td className="px-4 py-2 text-gray-600">{s.max_patients ?? "N/A"}</td>
                          <td className="px-4 py-2">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                              s.status === "ACTIVE" || s.is_active
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : "bg-gray-50 text-gray-500 border border-gray-200"
                            }`}>
                              {s.status || (s.is_active ? "Active" : "Inactive")}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        ) : null}
      </Modal>

      {/* ====== EDIT DOCTOR MODAL ====== */}
      <Modal
        open={editOpen}
        title={`Edit Doctor #${editId}`}
        onClose={() => setEditOpen(false)}
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button onClick={saveEdit} disabled={editLoading}>
              {editLoading ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">Full Name</label>
            <Input name="name" value={editData.name} onChange={onEditChange} required />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">Specialization</label>
            <Select name="specialization" value={editData.specialization} onChange={onEditChange} required>
              <option value="">Select specialization</option>
              {specializations.map((s) => <option key={s} value={s}>{s}</option>)}
            </Select>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">Phone Number</label>
            <Input name="phone" value={editData.phone} onChange={onEditChange} required />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">Email Address</label>
            <Input name="email" type="email" value={editData.email} onChange={onEditChange} required />
          </div>
          <div className="md:col-span-2">
            <label className="text-xs font-medium text-gray-600 mb-1 block">Channelling Fee (Rs.)</label>
            <Input type="number" step="0.01" min="0" name="channeling_fee" value={editData.channeling_fee} onChange={onEditChange} required />
          </div>
        </div>
      </Modal>

      {/* ====== DELETE CONFIRM DIALOG ====== */}
      <ConfirmDialog
        open={deleteOpen}
        onClose={() => { setDeleteOpen(false); setDeleteId(null); }}
        onConfirm={confirmDelete}
        title="Delete Doctor"
        message="Are you sure you want to delete this doctor? This action cannot be undone and will remove all associated records."
        confirmLabel="Delete Doctor"
        loading={deleteLoading}
      />
    </DashboardLayout>
  );
}

export default Doctors;
