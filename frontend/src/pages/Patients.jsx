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

const EMPTY_FORM = { name: "", phone: "", email: "", gender: "", dob: "" };
const ITEMS_PER_PAGE = 15;

/* ── Gender badge color mapping ────────────────────────────────── */
const genderBadgeStyle = {
  Male: "bg-blue-50 text-blue-700 border-blue-200",
  Female: "bg-pink-50 text-pink-700 border-pink-200",
};

function GenderBadge({ gender }) {
  const style = genderBadgeStyle[gender] || "bg-gray-50 text-gray-600 border-gray-200";
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border ${style}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${gender === "Male" ? "bg-blue-500" : gender === "Female" ? "bg-pink-500" : "bg-gray-400"}`} />
      {gender}
    </span>
  );
}

/* ── CSV export helper ─────────────────────────────────────────── */
function downloadCSV(patients) {
  const headers = ["ID", "Name", "Phone", "Email", "Gender", "Date of Birth"];
  const rows = patients.map((p) => [p.id, p.name, p.phone, p.email, p.gender, p.dob]);
  const csv = [headers, ...rows].map((r) => r.map((c) => `"${String(c ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `patients_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

/* ── Format date helper ────────────────────────────────────────── */
function fmtDate(d) {
  if (!d) return "N/A";
  try {
    return new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
  } catch {
    return d;
  }
}

function calcAge(dob) {
  if (!dob) return null;
  const birth = new Date(dob);
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
  return age;
}

/* ══════════════════════════════════════════════════════════════════
   PATIENTS PAGE
   ══════════════════════════════════════════════════════════════════ */
function Patients() {
  const role = localStorage.getItem("role");
  const { toasts, toast, remove } = useToast();

  /* ── State ─────────────────────────────────────────────────────── */
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [q, setQ] = useState("");
  const [filterGender, setFilterGender] = useState("");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);

  // Add form
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [addLoading, setAddLoading] = useState(false);

  // Edit modal
  const [editOpen, setEditOpen] = useState(false);
  const [editData, setEditData] = useState(EMPTY_FORM);
  const [editId, setEditId] = useState(null);
  const [editLoading, setEditLoading] = useState(false);

  // Delete confirmation
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // View detail modal
  const [viewOpen, setViewOpen] = useState(false);
  const [viewPatient, setViewPatient] = useState(null);

  // History modal
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyPatient, setHistoryPatient] = useState(null);
  const [historyData, setHistoryData] = useState(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyTab, setHistoryTab] = useState("appointments");

  /* ── Fetch patients ────────────────────────────────────────────── */
  const fetchPatients = useCallback(async () => {
    setLoading(true);
    try {
      const res = await API.get("/patients");
      setPatients(res.data);
    } catch {
      toast.error("Failed to fetch patients.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPatients();
  }, [fetchPatients]);

  /* ── Filtered + paginated data ─────────────────────────────────── */
  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return patients
      .filter((p) => (filterGender ? p.gender === filterGender : true))
      .filter((p) => {
        if (!s) return true;
        return [p.name, p.phone, p.email, p.gender, String(p.id), p.dob].some(
          (v) => (v || "").toLowerCase().includes(s)
        );
      });
  }, [patients, q, filterGender]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [q, filterGender]);

  const paginated = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filtered.slice(start, start + ITEMS_PER_PAGE);
  }, [filtered, currentPage]);

  /* ── Handlers ──────────────────────────────────────────────────── */
  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleEditChange = (e) =>
    setEditData({ ...editData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setAddLoading(true);
    try {
      await API.post("/patients/register", formData);
      setFormData(EMPTY_FORM);
      toast.success("Patient registered successfully.", "Patient Added");
      fetchPatients();
    } catch (e) {
      toast.error(
        e?.response?.data?.message || e?.response?.data || "Failed to add patient",
        "Registration Failed"
      );
    } finally {
      setAddLoading(false);
    }
  };

  const openEdit = (p) => {
    setEditId(p.id);
    setEditData({
      name: p.name || "",
      phone: p.phone || "",
      email: p.email || "",
      gender: p.gender || "",
      dob: p.dob || "",
    });
    setEditOpen(true);
  };

  const saveEdit = async () => {
    setEditLoading(true);
    try {
      await API.put(`/patients/${editId}`, editData);
      setEditOpen(false);
      toast.success("Patient updated successfully.", "Updated");
      fetchPatients();
    } catch (e) {
      toast.error(
        e?.response?.data?.message || e?.response?.data || "Failed to update patient",
        "Update Failed"
      );
    } finally {
      setEditLoading(false);
    }
  };

  const confirmDelete = (p) => {
    setDeleteTarget(p);
    setDeleteOpen(true);
  };

  const executeDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await API.delete(`/patients/${deleteTarget.id}`);
      setDeleteOpen(false);
      setDeleteTarget(null);
      toast.success("Patient deleted successfully.", "Deleted");
      fetchPatients();
    } catch (e) {
      toast.error(
        e?.response?.data?.message || e?.response?.data || "Failed to delete patient",
        "Delete Failed"
      );
    } finally {
      setDeleteLoading(false);
    }
  };

  const openView = (p) => {
    setViewPatient(p);
    setViewOpen(true);
  };

  const openHistory = async (p) => {
    setHistoryPatient(p);
    setHistoryData(null);
    setHistoryTab("appointments");
    setHistoryOpen(true);
    setHistoryLoading(true);
    try {
      const res = await API.get(`/patients/${p.id}/history`);
      setHistoryData(res.data);
    } catch {
      toast.error("Failed to load patient history.", "Error");
      setHistoryOpen(false);
    } finally {
      setHistoryLoading(false);
    }
  };

  /* ── Quick stats for view modal ────────────────────────────────── */
  const patientAge = viewPatient ? calcAge(viewPatient.dob) : null;

  /* ══════════════════════════════════════════════════════════════════
     RENDER
     ══════════════════════════════════════════════════════════════════ */
  return (
    <DashboardLayout>
      <Toast toasts={toasts} remove={remove} />

      <div className="space-y-6">
        {/* ── Page header ─────────────────────────────────────────── */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Patient Management</h2>
            <p className="text-gray-500 mt-1">Register, edit, and manage patients.</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
            <Select
              value={filterGender}
              onChange={(e) => setFilterGender(e.target.value)}
              className="w-36"
            >
              <option value="">All genders</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </Select>
            <SearchBar
              value={q}
              onChange={setQ}
              placeholder="Search by name, phone, email..."
              className="w-72"
            />
            <Button
              variant="secondary"
              onClick={() => {
                downloadCSV(filtered);
                toast.success(`Exported ${filtered.length} patients to CSV.`, "Export Complete");
              }}
              className="flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3M3 17v3a2 2 0 002 2h14a2 2 0 002-2v-3" />
              </svg>
              Export CSV
            </Button>
          </div>
        </div>

        {/* ── Add patient form ────────────────────────────────────── */}
        <Card title="Register New Patient" subtitle="Fill in the details below to add a new patient record">
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Full Name</label>
              <Input name="name" placeholder="Enter full name" value={formData.name} onChange={handleChange} required />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Phone Number</label>
              <Input name="phone" placeholder="Enter phone number" value={formData.phone} onChange={handleChange} required />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Email Address</label>
              <Input name="email" placeholder="Enter email address" value={formData.email} onChange={handleChange} required />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Gender</label>
              <Select name="gender" value={formData.gender} onChange={handleChange} required>
                <option value="">Select gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </Select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Date of Birth</label>
              <Input type="date" name="dob" value={formData.dob} onChange={handleChange} required />
            </div>
            <div className="flex items-end">
              <Button type="submit" disabled={addLoading} className="w-full">
                {addLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                    Adding...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                    Add Patient
                  </span>
                )}
              </Button>
            </div>
          </form>
        </Card>

        {/* ── Patient list ────────────────────────────────────────── */}
        <Card
          title="Patients List"
          subtitle={loading ? "Loading..." : `${filtered.length} of ${patients.length} records`}
          noPadding
          right={
            <span className="text-xs text-gray-400">
              Page {currentPage} of {totalPages}
            </span>
          }
        >
          {loading ? (
            <LoadingSpinner message="Loading patients..." />
          ) : filtered.length === 0 ? (
            <EmptyState
              title="No patients found"
              message={q || filterGender ? "Try adjusting your search or filter criteria." : "Get started by registering your first patient above."}
              icon={
                <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              }
            />
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="bg-gray-50/80 border-b border-gray-100">
                      <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">ID</th>
                      <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Patient</th>
                      <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Phone</th>
                      <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Email</th>
                      <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Gender</th>
                      <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">DOB</th>
                      <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {paginated.map((p, idx) => (
                      <tr
                        key={p.id}
                        className={`transition-colors hover:bg-blue-50/40 ${idx % 2 === 0 ? "bg-white" : "bg-gray-50/30"}`}
                      >
                        <td className="px-5 py-3.5 text-gray-400 font-mono text-xs">#{p.id}</td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                              {(p.name || "?")[0].toUpperCase()}
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{p.name}</p>
                              {p.dob && (
                                <p className="text-xs text-gray-400">{calcAge(p.dob)} years old</p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-gray-600">{p.phone}</td>
                        <td className="px-5 py-3.5 text-gray-600 truncate max-w-[200px]">{p.email}</td>
                        <td className="px-5 py-3.5">
                          <GenderBadge gender={p.gender} />
                        </td>
                        <td className="px-5 py-3.5 text-gray-600">{fmtDate(p.dob)}</td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => openView(p)}
                              title="View details"
                              className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => openHistory(p)}
                              title="Patient history"
                              className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => openEdit(p)}
                              title="Edit patient"
                              className="p-1.5 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            {role === "ADMIN" && (
                              <button
                                onClick={() => confirmDelete(p)}
                                title="Delete patient"
                                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
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
            </>
          )}
        </Card>
      </div>

      {/* ══════════════════════════════════════════════════════════════
         EDIT PATIENT MODAL
         ══════════════════════════════════════════════════════════════ */}
      <Modal
        open={editOpen}
        title={`Edit Patient #${editId}`}
        onClose={() => setEditOpen(false)}
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setEditOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveEdit} disabled={editLoading}>
              {editLoading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                  Saving...
                </span>
              ) : (
                "Save Changes"
              )}
            </Button>
          </div>
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Full Name</label>
            <Input name="name" value={editData.name} onChange={handleEditChange} required />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Phone</label>
            <Input name="phone" value={editData.phone} onChange={handleEditChange} required />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Email</label>
            <Input name="email" value={editData.email} onChange={handleEditChange} required />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Gender</label>
            <Select name="gender" value={editData.gender} onChange={handleEditChange} required>
              <option value="">Select gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </Select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Date of Birth</label>
            <Input type="date" name="dob" value={editData.dob} onChange={handleEditChange} required />
          </div>
        </div>
      </Modal>

      {/* ══════════════════════════════════════════════════════════════
         DELETE CONFIRM DIALOG
         ══════════════════════════════════════════════════════════════ */}
      <ConfirmDialog
        open={deleteOpen}
        onClose={() => {
          setDeleteOpen(false);
          setDeleteTarget(null);
        }}
        onConfirm={executeDelete}
        title="Delete Patient"
        message={
          deleteTarget
            ? `Are you sure you want to delete patient "${deleteTarget.name}" (ID #${deleteTarget.id})? This action cannot be undone.`
            : "Are you sure?"
        }
        confirmLabel="Delete Patient"
        confirmVariant="danger"
        loading={deleteLoading}
      />

      {/* ══════════════════════════════════════════════════════════════
         VIEW PATIENT DETAIL MODAL
         ══════════════════════════════════════════════════════════════ */}
      <Modal
        open={viewOpen}
        title="Patient Details"
        onClose={() => {
          setViewOpen(false);
          setViewPatient(null);
        }}
        footer={
          <div className="flex justify-between">
            <Button
              variant="secondary"
              onClick={() => {
                setViewOpen(false);
                if (viewPatient) openHistory(viewPatient);
              }}
            >
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                View History
              </span>
            </Button>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                onClick={() => {
                  setViewOpen(false);
                  if (viewPatient) openEdit(viewPatient);
                }}
              >
                Edit
              </Button>
              <Button variant="primary" onClick={() => { setViewOpen(false); setViewPatient(null); }}>
                Close
              </Button>
            </div>
          </div>
        }
      >
        {viewPatient && (
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-2xl font-bold flex-shrink-0">
                {(viewPatient.name || "?")[0].toUpperCase()}
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">{viewPatient.name}</h3>
                <p className="text-sm text-gray-500">Patient ID: #{viewPatient.id}</p>
              </div>
            </div>

            {/* Quick stats */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-blue-50 rounded-xl p-3 text-center">
                <p className="text-2xl font-bold text-blue-700">{patientAge ?? "N/A"}</p>
                <p className="text-xs text-blue-600 mt-0.5">Age (years)</p>
              </div>
              <div className="bg-indigo-50 rounded-xl p-3 text-center">
                <p className="text-2xl font-bold text-indigo-700">#{viewPatient.id}</p>
                <p className="text-xs text-indigo-600 mt-0.5">Patient ID</p>
              </div>
              <div className="bg-emerald-50 rounded-xl p-3 text-center">
                <p className="text-lg font-bold text-emerald-700 mt-1">
                  <GenderBadge gender={viewPatient.gender} />
                </p>
                <p className="text-xs text-emerald-600 mt-1">Gender</p>
              </div>
            </div>

            {/* Info grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">Phone</p>
                <p className="text-sm font-medium text-gray-900">{viewPatient.phone || "N/A"}</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">Email</p>
                <p className="text-sm font-medium text-gray-900">{viewPatient.email || "N/A"}</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">Date of Birth</p>
                <p className="text-sm font-medium text-gray-900">{fmtDate(viewPatient.dob)}</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">Gender</p>
                <p className="text-sm font-medium text-gray-900">{viewPatient.gender || "N/A"}</p>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* ══════════════════════════════════════════════════════════════
         PATIENT HISTORY MODAL
         ══════════════════════════════════════════════════════════════ */}
      <Modal
        open={historyOpen}
        title={historyPatient ? `History - ${historyPatient.name}` : "Patient History"}
        onClose={() => {
          setHistoryOpen(false);
          setHistoryPatient(null);
          setHistoryData(null);
        }}
        size="lg"
        footer={
          <div className="flex justify-end">
            <Button variant="secondary" onClick={() => { setHistoryOpen(false); setHistoryPatient(null); setHistoryData(null); }}>
              Close
            </Button>
          </div>
        }
      >
        {/* Patient info header */}
        {historyPatient && (
          <div className="flex items-center gap-3 mb-5 pb-4 border-b border-gray-100">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
              {(historyPatient.name || "?")[0].toUpperCase()}
            </div>
            <div>
              <p className="font-semibold text-gray-900">{historyPatient.name}</p>
              <p className="text-xs text-gray-500">ID: #{historyPatient.id} | {historyPatient.phone} | {historyPatient.email}</p>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 mb-5 bg-gray-100 rounded-xl p-1">
          {[
            { key: "appointments", label: "Appointments" },
            { key: "bills", label: "Bills" },
            { key: "payments", label: "Payments" },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setHistoryTab(tab.key)}
              className={`flex-1 py-2 px-3 text-sm font-medium rounded-lg transition-colors ${
                historyTab === tab.key
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab.label}
              {historyData && (
                <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${
                  historyTab === tab.key ? "bg-blue-100 text-blue-700" : "bg-gray-200 text-gray-500"
                }`}>
                  {(historyData[tab.key] || []).length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {historyLoading ? (
          <LoadingSpinner message="Loading history..." size="md" />
        ) : !historyData ? (
          <EmptyState title="No data available" message="Could not load patient history." />
        ) : (
          <>
            {/* ── Appointments tab ─────────────────────────────────── */}
            {historyTab === "appointments" && (
              <div className="space-y-2">
                {(historyData.appointments || []).length === 0 ? (
                  <EmptyState title="No appointments" message="This patient has no appointment records." />
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-50 text-left">
                          <th className="px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase">Date</th>
                          <th className="px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase">Doctor</th>
                          <th className="px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase">Status</th>
                          <th className="px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase">Fee</th>
                          <th className="px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase">Token</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {historyData.appointments.map((a, i) => (
                          <tr key={a.id || i} className="hover:bg-gray-50/50">
                            <td className="px-4 py-2.5 text-gray-700">{fmtDate(a.date || a.appointmentDate)}</td>
                            <td className="px-4 py-2.5 text-gray-700">{a.doctorName || a.doctor || "N/A"}</td>
                            <td className="px-4 py-2.5">
                              <StatusBadge status={a.status} size="xs" />
                            </td>
                            <td className="px-4 py-2.5 text-gray-700 font-medium">
                              {a.fee != null ? `$${Number(a.fee).toFixed(2)}` : "N/A"}
                            </td>
                            <td className="px-4 py-2.5 text-gray-500 font-mono text-xs">{a.tokenNumber || a.token || "N/A"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* ── Bills tab ────────────────────────────────────────── */}
            {historyTab === "bills" && (
              <div className="space-y-2">
                {(historyData.bills || []).length === 0 ? (
                  <EmptyState title="No bills" message="This patient has no billing records." />
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-50 text-left">
                          <th className="px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase">Bill ID</th>
                          <th className="px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase">Type</th>
                          <th className="px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase">Amount</th>
                          <th className="px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase">Status</th>
                          <th className="px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase">Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {historyData.bills.map((b, i) => (
                          <tr key={b.id || i} className="hover:bg-gray-50/50">
                            <td className="px-4 py-2.5 text-gray-500 font-mono text-xs">#{b.id}</td>
                            <td className="px-4 py-2.5 text-gray-700">{b.type || b.billType || "N/A"}</td>
                            <td className="px-4 py-2.5 text-gray-700 font-medium">
                              {b.amount != null ? `$${Number(b.amount).toFixed(2)}` : "N/A"}
                            </td>
                            <td className="px-4 py-2.5">
                              <StatusBadge status={b.paid ? "PAID" : b.status || "UNPAID"} size="xs" />
                            </td>
                            <td className="px-4 py-2.5 text-gray-600">{fmtDate(b.date || b.createdAt)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* ── Payments tab ─────────────────────────────────────── */}
            {historyTab === "payments" && (
              <div className="space-y-2">
                {(historyData.payments || []).length === 0 ? (
                  <EmptyState title="No payments" message="This patient has no payment records." />
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-50 text-left">
                          <th className="px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase">Payment ID</th>
                          <th className="px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase">Amount</th>
                          <th className="px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase">Method</th>
                          <th className="px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase">Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {historyData.payments.map((p, i) => (
                          <tr key={p.id || i} className="hover:bg-gray-50/50">
                            <td className="px-4 py-2.5 text-gray-500 font-mono text-xs">#{p.id}</td>
                            <td className="px-4 py-2.5 text-gray-700 font-medium">
                              {p.amount != null ? `$${Number(p.amount).toFixed(2)}` : "N/A"}
                            </td>
                            <td className="px-4 py-2.5 text-gray-700">{p.method || p.paymentMethod || "N/A"}</td>
                            <td className="px-4 py-2.5 text-gray-600">{fmtDate(p.date || p.paymentDate || p.createdAt)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </Modal>
    </DashboardLayout>
  );
}

export default Patients;
