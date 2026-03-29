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
import EmptyState from "../components/ui/EmptyState";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import Pagination from "../components/ui/Pagination";
import { useToast, Toast } from "../components/ui/Toast";

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const DAYS = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY",
];

const DAY_COLORS = {
  MONDAY:    { bg: "bg-blue-100",    text: "text-blue-700",    border: "border-blue-200" },
  TUESDAY:   { bg: "bg-violet-100",  text: "text-violet-700",  border: "border-violet-200" },
  WEDNESDAY: { bg: "bg-emerald-100", text: "text-emerald-700", border: "border-emerald-200" },
  THURSDAY:  { bg: "bg-amber-100",   text: "text-amber-700",   border: "border-amber-200" },
  FRIDAY:    { bg: "bg-rose-100",    text: "text-rose-700",    border: "border-rose-200" },
  SATURDAY:  { bg: "bg-cyan-100",    text: "text-cyan-700",    border: "border-cyan-200" },
  SUNDAY:    { bg: "bg-orange-100",  text: "text-orange-700",  border: "border-orange-200" },
};

const DOCTOR_PALETTE = [
  { bg: "bg-blue-50",    border: "border-blue-200",    accent: "bg-blue-500",    text: "text-blue-900" },
  { bg: "bg-emerald-50", border: "border-emerald-200", accent: "bg-emerald-500", text: "text-emerald-900" },
  { bg: "bg-violet-50",  border: "border-violet-200",  accent: "bg-violet-500",  text: "text-violet-900" },
  { bg: "bg-amber-50",   border: "border-amber-200",   accent: "bg-amber-500",   text: "text-amber-900" },
  { bg: "bg-rose-50",    border: "border-rose-200",    accent: "bg-rose-500",    text: "text-rose-900" },
  { bg: "bg-cyan-50",    border: "border-cyan-200",    accent: "bg-cyan-500",    text: "text-cyan-900" },
  { bg: "bg-indigo-50",  border: "border-indigo-200",  accent: "bg-indigo-500",  text: "text-indigo-900" },
  { bg: "bg-teal-50",    border: "border-teal-200",    accent: "bg-teal-500",    text: "text-teal-900" },
  { bg: "bg-pink-50",    border: "border-pink-200",    accent: "bg-pink-500",    text: "text-pink-900" },
  { bg: "bg-lime-50",    border: "border-lime-200",    accent: "bg-lime-600",    text: "text-lime-900" },
];

const ITEMS_PER_PAGE = 10;

const EMPTY_FORM = {
  doctorId: "",
  day: "MONDAY",
  startTime: "09:00",
  endTime: "12:00",
};

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function formatTime12(time24) {
  if (!time24) return "--";
  const [hStr, mStr] = time24.split(":");
  let h = parseInt(hStr, 10);
  const m = mStr || "00";
  const suffix = h >= 12 ? "PM" : "AM";
  if (h === 0) h = 12;
  else if (h > 12) h -= 12;
  return `${h}:${m} ${suffix}`;
}

function dayLabel(day) {
  if (!day) return "--";
  return day.charAt(0) + day.slice(1).toLowerCase();
}

function getDoctorColor(doctorId) {
  return DOCTOR_PALETTE[doctorId % DOCTOR_PALETTE.length];
}

function getRole() {
  return (localStorage.getItem("role") || "").toUpperCase();
}

/* ------------------------------------------------------------------ */
/*  Day Badge component                                                */
/* ------------------------------------------------------------------ */

function DayBadge({ day }) {
  const c = DAY_COLORS[day] || { bg: "bg-gray-100", text: "text-gray-700", border: "border-gray-200" };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${c.bg} ${c.text} ${c.border}`}>
      {dayLabel(day)}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  Calendar View                                                      */
/* ------------------------------------------------------------------ */

function WeeklyCalendar({ schedules, onEdit, onDelete, isAdmin }) {
  const byDay = useMemo(() => {
    const map = {};
    DAYS.forEach((d) => (map[d] = []));
    schedules.forEach((sc) => {
      if (map[sc.day]) map[sc.day].push(sc);
    });
    // sort each day's schedules by start time
    Object.values(map).forEach((arr) =>
      arr.sort((a, b) => (a.startTime || "").localeCompare(b.startTime || ""))
    );
    return map;
  }, [schedules]);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3">
      {DAYS.map((day) => {
        const dayColor = DAY_COLORS[day];
        const items = byDay[day];
        return (
          <div key={day} className="flex flex-col">
            {/* Day header */}
            <div className={`text-center py-2 rounded-t-xl font-semibold text-sm ${dayColor.bg} ${dayColor.text} border ${dayColor.border} border-b-0`}>
              {dayLabel(day)}
            </div>
            {/* Schedule cards */}
            <div className={`flex-1 border border-t-0 rounded-b-xl p-2 space-y-2 bg-gray-50/50 min-h-[120px] ${dayColor.border}`}>
              {items.length === 0 && (
                <p className="text-xs text-gray-400 text-center pt-6">No schedules</p>
              )}
              {items.map((sc) => {
                const color = getDoctorColor(sc.doctorId);
                return (
                  <div
                    key={sc.id}
                    className={`rounded-lg border p-2.5 ${color.bg} ${color.border} transition-shadow hover:shadow-md group relative`}
                  >
                    {/* Accent bar */}
                    <div className={`absolute left-0 top-2 bottom-2 w-1 rounded-full ${color.accent}`} />
                    <div className="pl-2.5">
                      <p className={`text-xs font-bold ${color.text} truncate`} title={sc.doctorName}>
                        {sc.doctorName || "--"}
                      </p>
                      <p className="text-[10px] text-gray-500 truncate mt-0.5">
                        {sc.doctorSpecialization || "General"}
                      </p>
                      <p className="text-[11px] font-medium text-gray-700 mt-1">
                        {formatTime12(sc.startTime)} - {formatTime12(sc.endTime)}
                      </p>
                    </div>
                    {/* Action buttons on hover */}
                    {isAdmin && (
                      <div className="absolute top-1 right-1 hidden group-hover:flex gap-1">
                        <button
                          onClick={() => onEdit(sc)}
                          className="p-1 rounded bg-white/80 hover:bg-white shadow-sm text-gray-500 hover:text-blue-600 transition-colors"
                          title="Edit"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => onDelete(sc)}
                          className="p-1 rounded bg-white/80 hover:bg-white shadow-sm text-gray-500 hover:text-red-600 transition-colors"
                          title="Delete"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Schedule Form (used in Add and Edit modals)                        */
/* ------------------------------------------------------------------ */

function ScheduleForm({ form, onChange, doctors, onSubmit, loading, submitLabel }) {
  const handleField = (e) => onChange({ ...form, [e.target.name]: e.target.value });

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Doctor</label>
          <Select name="doctorId" value={form.doctorId} onChange={handleField} required>
            <option value="">Select Doctor</option>
            {doctors.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name} ({d.specialization})
              </option>
            ))}
          </Select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Day</label>
          <Select name="day" value={form.day} onChange={handleField} required>
            {DAYS.map((d) => (
              <option key={d} value={d}>
                {dayLabel(d)}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
          <Input type="time" name="startTime" value={form.startTime} onChange={handleField} required />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
          <Input type="time" name="endTime" value={form.endTime} onChange={handleField} required />
        </div>
      </div>
      <div className="flex justify-end pt-2">
        <Button type="submit" disabled={loading}>
          {loading ? "Saving..." : submitLabel}
        </Button>
      </div>
    </form>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Schedules page                                                */
/* ------------------------------------------------------------------ */

function Schedules() {
  const [schedules, setSchedules] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Filters
  const [search, setSearch] = useState("");
  const [filterDay, setFilterDay] = useState("");
  const [filterDoctor, setFilterDoctor] = useState("");

  // View mode
  const [viewMode, setViewMode] = useState("table"); // "table" | "calendar"

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);

  // Add modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState({ ...EMPTY_FORM });

  // Edit modal
  const [editModal, setEditModal] = useState({ open: false, schedule: null });
  const [editForm, setEditForm] = useState({ ...EMPTY_FORM });

  // Delete confirm
  const [deleteTarget, setDeleteTarget] = useState(null);

  // Toast
  const { toasts, toast, remove } = useToast();

  // Role
  const role = useMemo(() => getRole(), []);
  const isAdmin = role === "ADMIN";
  const canAddSchedule = role === "ADMIN" || role === "RECEPTIONIST";

  /* ---------- Data loading ---------- */

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [sRes, dRes] = await Promise.all([
        API.get("/schedules"),
        API.get("/doctors"),
      ]);
      setSchedules(sRes.data);
      setDoctors(dRes.data);
    } catch {
      toast.error("Failed to load schedules. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  /* ---------- Filtered & paginated data ---------- */

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return schedules
      .filter((sc) => (!filterDay || sc.day === filterDay))
      .filter((sc) => (!filterDoctor || String(sc.doctorId) === filterDoctor))
      .filter((sc) => {
        if (!q) return true;
        return [
          String(sc.id),
          sc.doctorName || "",
          sc.doctorSpecialization || "",
          sc.day || "",
          sc.startTime || "",
          sc.endTime || "",
        ].some((v) => v.toLowerCase().includes(q));
      });
  }, [schedules, search, filterDay, filterDoctor]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, filterDay, filterDoctor]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = useMemo(
    () => filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE),
    [filtered, currentPage]
  );

  /* ---------- Add schedule ---------- */

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!addForm.doctorId) {
      toast.warning("Please select a doctor.");
      return;
    }
    if (addForm.startTime >= addForm.endTime) {
      toast.warning("End time must be after start time.");
      return;
    }
    setSaving(true);
    try {
      await API.post("/schedules/add", {
        doctorId: Number(addForm.doctorId),
        day: addForm.day,
        startTime: addForm.startTime,
        endTime: addForm.endTime,
      });
      toast.success("Schedule added successfully.");
      setAddForm({ ...EMPTY_FORM });
      setShowAddModal(false);
      load();
    } catch (e) {
      toast.error(e?.response?.data?.message || e?.response?.data || "Failed to add schedule.");
    } finally {
      setSaving(false);
    }
  };

  /* ---------- Edit schedule ---------- */

  const openEdit = (sc) => {
    setEditForm({
      doctorId: String(sc.doctorId),
      day: sc.day,
      startTime: sc.startTime,
      endTime: sc.endTime,
    });
    setEditModal({ open: true, schedule: sc });
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    if (editForm.startTime >= editForm.endTime) {
      toast.warning("End time must be after start time.");
      return;
    }
    setSaving(true);
    try {
      await API.put(`/schedules/${editModal.schedule.id}`, {
        doctorId: Number(editForm.doctorId),
        day: editForm.day,
        startTime: editForm.startTime,
        endTime: editForm.endTime,
      });
      toast.success("Schedule updated successfully.");
      setEditModal({ open: false, schedule: null });
      load();
    } catch (e) {
      toast.error(e?.response?.data?.message || e?.response?.data || "Failed to update schedule.");
    } finally {
      setSaving(false);
    }
  };

  /* ---------- Delete schedule ---------- */

  const confirmDelete = (sc) => setDeleteTarget(sc);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await API.delete(`/schedules/${deleteTarget.id}`);
      toast.success("Schedule deleted successfully.");
      setDeleteTarget(null);
      load();
    } catch {
      toast.error("Failed to delete schedule.");
    } finally {
      setDeleting(false);
    }
  };

  /* ---------- Clear filters ---------- */

  const hasFilters = search || filterDay || filterDoctor;
  const clearFilters = () => {
    setSearch("");
    setFilterDay("");
    setFilterDoctor("");
  };

  /* ---------- Render ---------- */

  return (
    <DashboardLayout>
      <Toast toasts={toasts} remove={remove} />

      <div className="space-y-6">
        {/* Page header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Schedules</h2>
            <p className="text-gray-500 mt-1 text-sm">
              Manage weekly doctor schedules and availability.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* View toggle */}
            <div className="flex items-center bg-gray-100 rounded-lg p-0.5">
              <button
                onClick={() => setViewMode("table")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  viewMode === "table"
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
                Table
              </button>
              <button
                onClick={() => setViewMode("calendar")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  viewMode === "calendar"
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Calendar
              </button>
            </div>
            {canAddSchedule && (
              <Button onClick={() => setShowAddModal(true)}>
                <span className="flex items-center gap-1.5">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add Schedule
                </span>
              </Button>
            )}
          </div>
        </div>

        {/* Filter bar */}
        <Card>
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
            <SearchBar
              value={search}
              onChange={setSearch}
              placeholder="Search by doctor, specialization, day..."
              className="w-full sm:w-72"
            />
            <Select
              value={filterDoctor}
              onChange={(e) => setFilterDoctor(e.target.value)}
              className="w-full sm:w-48"
            >
              <option value="">All Doctors</option>
              {doctors.map((d) => (
                <option key={d.id} value={String(d.id)}>
                  {d.name}
                </option>
              ))}
            </Select>
            <Select
              value={filterDay}
              onChange={(e) => setFilterDay(e.target.value)}
              className="w-full sm:w-40"
            >
              <option value="">All Days</option>
              {DAYS.map((d) => (
                <option key={d} value={d}>
                  {dayLabel(d)}
                </option>
              ))}
            </Select>
            {hasFilters && (
              <button
                onClick={clearFilters}
                className="text-sm text-gray-500 hover:text-gray-700 underline underline-offset-2 whitespace-nowrap"
              >
                Clear filters
              </button>
            )}
            <div className="sm:ml-auto text-sm text-gray-500 whitespace-nowrap">
              {filtered.length} of {schedules.length} schedules
            </div>
          </div>
        </Card>

        {/* Content */}
        {loading ? (
          <LoadingSpinner message="Loading schedules..." />
        ) : filtered.length === 0 ? (
          <Card>
            <EmptyState
              title={hasFilters ? "No schedules match your filters" : "No schedules yet"}
              message={
                hasFilters
                  ? "Try adjusting your search or filter criteria."
                  : "Create your first doctor schedule to get started."
              }
              action={hasFilters ? clearFilters : canAddSchedule ? () => setShowAddModal(true) : undefined}
              actionLabel={hasFilters ? "Clear Filters" : "Add Schedule"}
            />
          </Card>
        ) : viewMode === "calendar" ? (
          /* ---- Calendar view ---- */
          <Card title="Weekly Calendar" subtitle={`${filtered.length} schedules`} noPadding>
            <div className="p-4">
              <WeeklyCalendar
                schedules={filtered}
                onEdit={openEdit}
                onDelete={confirmDelete}
                isAdmin={canAddSchedule}
              />
            </div>
          </Card>
        ) : (
          /* ---- Table view ---- */
          <Card
            title="Schedules List"
            subtitle={`${filtered.length} schedule${filtered.length !== 1 ? "s" : ""}`}
            noPadding
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      ID
                    </th>
                    <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Doctor
                    </th>
                    <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Specialization
                    </th>
                    <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Day
                    </th>
                    <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Time
                    </th>
                    {canAddSchedule && (
                      <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">
                        Actions
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {paginated.map((sc) => (
                    <tr key={sc.id} className="hover:bg-gray-50/60 transition-colors">
                      <td className="px-5 py-3.5 text-gray-400 font-mono text-xs">
                        #{sc.id}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                              getDoctorColor(sc.doctorId).accent
                            }`}
                          >
                            {(sc.doctorName || "?").charAt(0).toUpperCase()}
                          </div>
                          <span className="font-medium text-gray-900">
                            {sc.doctorName || "--"}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-gray-500">
                        {sc.doctorSpecialization || "--"}
                      </td>
                      <td className="px-5 py-3.5">
                        <DayBadge day={sc.day} />
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-gray-700 font-medium">
                          {formatTime12(sc.startTime)}
                        </span>
                        <span className="text-gray-400 mx-1.5">-</span>
                        <span className="text-gray-700 font-medium">
                          {formatTime12(sc.endTime)}
                        </span>
                      </td>
                      {canAddSchedule && (
                        <td className="px-5 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="secondary"
                              onClick={() => openEdit(sc)}
                              className="!px-2.5 !py-1.5"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </Button>
                            <Button
                              variant="danger"
                              onClick={() => confirmDelete(sc)}
                              className="!px-2.5 !py-1.5"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </Button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-5 pb-3">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={filtered.length}
                itemsPerPage={ITEMS_PER_PAGE}
                onPageChange={setCurrentPage}
              />
            </div>
          </Card>
        )}
      </div>

      {/* ---- Add Schedule Modal ---- */}
      <Modal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add New Schedule"
      >
        <ScheduleForm
          form={addForm}
          onChange={setAddForm}
          doctors={doctors}
          onSubmit={handleAdd}
          loading={saving}
          submitLabel="Add Schedule"
        />
      </Modal>

      {/* ---- Edit Schedule Modal ---- */}
      <Modal
        open={editModal.open}
        onClose={() => setEditModal({ open: false, schedule: null })}
        title="Edit Schedule"
      >
        <ScheduleForm
          form={editForm}
          onChange={setEditForm}
          doctors={doctors}
          onSubmit={handleEdit}
          loading={saving}
          submitLabel="Update Schedule"
        />
      </Modal>

      {/* ---- Delete Confirm Dialog ---- */}
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Schedule"
        message={
          deleteTarget
            ? `Are you sure you want to delete the ${dayLabel(deleteTarget.day)} schedule for ${deleteTarget.doctorName || "this doctor"} (${formatTime12(deleteTarget.startTime)} - ${formatTime12(deleteTarget.endTime)})? This action cannot be undone.`
            : ""
        }
        confirmLabel="Delete Schedule"
        loading={deleting}
      />
    </DashboardLayout>
  );
}

export default Schedules;
