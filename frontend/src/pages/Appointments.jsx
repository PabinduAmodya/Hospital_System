import { useCallback, useEffect, useMemo, useState } from "react";
import API from "../api/axios";
import DashboardLayout from "../layouts/DashboardLayout";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Select from "../components/ui/Select";
import Modal from "../components/ui/Modal";
import SearchBar from "../components/ui/SearchBar";
import StatusBadge from "../components/ui/StatusBadge";
import LoadingSpinner from "../components/ui/LoadingSpinner";
import EmptyState from "../components/ui/EmptyState";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import Pagination from "../components/ui/Pagination";
import { Toast, useToast } from "../components/ui/Toast";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const STATUSES = ["PENDING", "CONFIRMED", "COMPLETED", "CANCELLED", "RESCHEDULED"];
const DAYS_ORDER = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"];
const ITEMS_PER_PAGE = 15;
const HOSPITAL_CHARGE = 750;

const ROW_STATUS_BG = {
  PENDING: "bg-amber-50/40",
  CONFIRMED: "bg-blue-50/40",
  COMPLETED: "bg-emerald-50/30",
  CANCELLED: "bg-red-50/30",
  RESCHEDULED: "bg-violet-50/30",
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function getUpcomingDatesForDay(dayName, count = 8) {
  const dayIndex = DAYS_ORDER.indexOf(dayName.toUpperCase());
  if (dayIndex === -1) return [];
  const jsDayIndex = (dayIndex + 1) % 7;
  const toLocalDateStr = (d) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${dd}`;
  };
  const results = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const cursor = new Date(today);
  while (results.length < count) {
    if (cursor.getDay() === jsDayIndex) results.push(toLocalDateStr(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return results;
}

function formatDate(dateStr) {
  if (!dateStr) return "";
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-US", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatDateLong(dateStr) {
  if (!dateStr) return "";
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatCurrency(amount) {
  if (amount == null) return "Rs. 0";
  return `Rs. ${Number(amount).toLocaleString()}`;
}

function isTodayStr(dateStr) {
  if (!dateStr) return false;
  const today = new Date();
  const y = today.getFullYear();
  const m = String(today.getMonth() + 1).padStart(2, "0");
  const d = String(today.getDate()).padStart(2, "0");
  return dateStr === `${y}-${m}-${d}`;
}

// ---------------------------------------------------------------------------
// Token Badge sub-component
// ---------------------------------------------------------------------------
function TokenBadge({ number }) {
  if (!number && number !== 0) return <span className="text-gray-300">--</span>;
  return (
    <span className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-blue-600 text-white text-sm font-bold shadow-sm">
      {number}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Step Indicator sub-component
// ---------------------------------------------------------------------------
function StepIndicator({ currentStep }) {
  const steps = [
    { num: 1, label: "Select Patient" },
    { num: 2, label: "Select Doctor" },
    { num: 3, label: "Date & Time" },
  ];
  return (
    <div className="flex items-center gap-1 mb-6">
      {steps.map((step, i) => {
        const active = currentStep === step.num;
        const done = currentStep > step.num;
        return (
          <div key={step.num} className="flex items-center gap-1 flex-1">
            <div className="flex items-center gap-2 flex-shrink-0">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                  done
                    ? "bg-emerald-500 text-white"
                    : active
                    ? "bg-blue-600 text-white ring-4 ring-blue-100"
                    : "bg-gray-200 text-gray-500"
                }`}
              >
                {done ? (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  step.num
                )}
              </div>
              <span
                className={`text-sm whitespace-nowrap ${
                  active ? "font-semibold text-blue-600" : done ? "font-medium text-emerald-600" : "text-gray-400"
                }`}
              >
                {step.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className={`flex-1 h-0.5 mx-2 rounded ${done ? "bg-emerald-400" : "bg-gray-200"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Today's Queue Card sub-component
// ---------------------------------------------------------------------------
function QueueCard({ appointment, role, onReschedule, onCancel, onViewDetail }) {
  const a = appointment;
  return (
    <div
      className={`rounded-xl border p-4 transition-shadow hover:shadow-md ${
        ROW_STATUS_BG[a.status] || "bg-white"
      } border-gray-200`}
    >
      <div className="flex items-start gap-4">
        {/* Token */}
        <div className="flex flex-col items-center gap-1 flex-shrink-0">
          <span className="text-[10px] uppercase font-semibold text-gray-400 tracking-wider">Token</span>
          <span className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-600 text-white text-lg font-bold shadow">
            {a.tokenNumber ?? "--"}
          </span>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="font-semibold text-gray-900">{a.patient?.name}</h4>
            <StatusBadge status={a.status} size="xs" />
            <StatusBadge status={a.paymentStatus} size="xs" />
          </div>
          <p className="text-sm text-gray-500 mt-0.5">
            Dr. {a.schedule?.doctor?.name}
            {a.schedule?.doctor?.specialization && (
              <span className="text-gray-400"> - {a.schedule.doctor.specialization}</span>
            )}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            {a.schedule?.startTime} - {a.schedule?.endTime} | {formatCurrency(a.appointmentFee)}
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-1.5 flex-shrink-0">
          <button
            onClick={() => onViewDetail(a)}
            className="text-xs text-blue-600 hover:text-blue-800 font-medium"
          >
            View
          </button>
          {(role === "ADMIN" || role === "RECEPTIONIST") &&
            a.status !== "CANCELLED" &&
            a.status !== "COMPLETED" && (
              <>
                <button
                  onClick={() => onReschedule(a)}
                  className="text-xs text-violet-600 hover:text-violet-800 font-medium"
                >
                  Reschedule
                </button>
                <button
                  onClick={() => onCancel(a.id)}
                  className="text-xs text-red-500 hover:text-red-700 font-medium"
                >
                  Cancel
                </button>
              </>
            )}
        </div>
      </div>
    </div>
  );
}

// ===========================================================================
// Main Component
// ===========================================================================
function Appointments() {
  const role = localStorage.getItem("role");
  const { toasts, toast, remove } = useToast();

  // ── Core state ──────────────────────────────────────────────────────────
  const [appointments, setAppointments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState("table"); // "table" | "queue"

  // ── Book modal (3-step) ─────────────────────────────────────────────────
  const [bookOpen, setBookOpen] = useState(false);
  const [bookStep, setBookStep] = useState(1);
  const [selPatient, setSelPatient] = useState(null);
  const [selDoctor, setSelDoctor] = useState(null);
  const [doctorSchedules, setDoctorSchedules] = useState([]);
  const [selSchedule, setSelSchedule] = useState(null);
  const [selDate, setSelDate] = useState("");
  const [bookLoading, setBookLoading] = useState(false);
  const [patientSearch, setPatientSearch] = useState("");
  const [doctorSearch, setDoctorSearch] = useState("");

  // ── Cancel modal ────────────────────────────────────────────────────────
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelId, setCancelId] = useState(null);
  const [cancelReason, setCancelReason] = useState("");
  const [refundRequired, setRefundRequired] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);

  // ── Reschedule modal ────────────────────────────────────────────────────
  const [reschedOpen, setReschedOpen] = useState(false);
  const [reschedId, setReschedId] = useState(null);
  const [reschedAppt, setReschedAppt] = useState(null);
  const [availableDates, setAvailableDates] = useState([]);
  const [selectedDate, setSelectedDate] = useState("");
  const [reschedLoading, setReschedLoading] = useState(false);

  // ── Detail modal ────────────────────────────────────────────────────────
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailAppt, setDetailAppt] = useState(null);

  // ── Bill confirm dialog ─────────────────────────────────────────────────
  const [billConfirmOpen, setBillConfirmOpen] = useState(false);
  const [billApptId, setBillApptId] = useState(null);
  const [billLoading, setBillLoading] = useState(false);

  // ── Data loading ────────────────────────────────────────────────────────
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await API.get("/appointments");
      setAppointments(res.data);
    } catch {
      toast.error("Failed to load appointments.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // ── Filtering / pagination ──────────────────────────────────────────────
  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return appointments
      .filter((a) => (filterStatus ? a.status === filterStatus : true))
      .filter((a) => {
        if (!s) return true;
        const doctor = a.schedule?.doctor?.name || "";
        const patient = a.patient?.name || "";
        return [String(a.id), doctor, patient, a.status, a.appointmentDate, String(a.tokenNumber || "")].some(
          (v) => (v || "").toString().toLowerCase().includes(s)
        );
      });
  }, [appointments, q, filterStatus]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginated = useMemo(() => {
    const start = (safeCurrentPage - 1) * ITEMS_PER_PAGE;
    return filtered.slice(start, start + ITEMS_PER_PAGE);
  }, [filtered, safeCurrentPage]);

  // Today's queue: today's appointments sorted by token number
  const todaysQueue = useMemo(() => {
    return appointments
      .filter((a) => isTodayStr(a.appointmentDate) && a.status !== "CANCELLED")
      .sort((a, b) => (a.tokenNumber || 999) - (b.tokenNumber || 999));
  }, [appointments]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [q, filterStatus]);

  // ── Book flow ───────────────────────────────────────────────────────────
  const openBook = async () => {
    setBookStep(1);
    setSelPatient(null);
    setSelDoctor(null);
    setDoctorSchedules([]);
    setSelSchedule(null);
    setSelDate("");
    setPatientSearch("");
    setDoctorSearch("");
    setBookOpen(true);
    try {
      const [pRes, dRes] = await Promise.all([API.get("/patients"), API.get("/doctors")]);
      setPatients(pRes.data);
      setDoctors(dRes.data);
    } catch {
      toast.error("Failed to load patients/doctors.");
    }
  };

  const selectDoctor = async (doctor) => {
    setSelDoctor(doctor);
    setDoctorSchedules([]);
    setSelSchedule(null);
    setSelDate("");
    try {
      const res = await API.get(`/schedules/doctor/${doctor.id}`);
      setDoctorSchedules(res.data);
      setBookStep(3);
    } catch {
      toast.error("Failed to load doctor schedules.");
    }
  };

  const allUpcomingSlots = useMemo(() => {
    if (!doctorSchedules.length) return [];
    const slots = [];
    doctorSchedules.forEach((sc) => {
      getUpcomingDatesForDay(sc.day, 8).forEach((date) => {
        slots.push({ date, schedule: sc });
      });
    });
    slots.sort((a, b) => a.date.localeCompare(b.date));
    return slots;
  }, [doctorSchedules]);

  const book = async () => {
    if (!selPatient || !selSchedule || !selDate) {
      toast.warning("Please complete all selections.");
      return;
    }
    setBookLoading(true);
    try {
      await API.post("/appointments/book", {
        patientId: selPatient.id,
        scheduleId: selSchedule.id,
        appointmentDate: selDate,
      });
      setBookOpen(false);
      toast.success(`Appointment booked for ${selPatient.name} on ${formatDate(selDate)}.`, "Booking Confirmed");
      load();
    } catch (e) {
      toast.error(e?.response?.data || "Booking failed.", "Booking Failed");
    } finally {
      setBookLoading(false);
    }
  };

  // ── Status update ───────────────────────────────────────────────────────
  const updateStatus = async (id, status) => {
    try {
      await API.put(`/appointments/${id}/status`, { status, notes: "" });
      toast.success(`Status updated to ${status}.`, "Status Updated");
      load();
    } catch (e) {
      toast.error(e?.response?.data || "Status update failed.", "Update Failed");
    }
  };

  // ── Cancel ──────────────────────────────────────────────────────────────
  const openCancel = (id) => {
    setCancelId(id);
    setCancelReason("");
    setRefundRequired(false);
    setCancelLoading(false);
    setCancelOpen(true);
  };

  const doCancel = async () => {
    setCancelLoading(true);
    try {
      await API.put(`/appointments/${cancelId}/cancel`, {
        cancellationReason: cancelReason,
        refundRequired,
      });
      setCancelOpen(false);
      toast.success(`Appointment #${cancelId} cancelled successfully.`, "Cancelled");
      load();
    } catch (e) {
      toast.error(e?.response?.data || "Cancel failed.", "Cancel Failed");
    } finally {
      setCancelLoading(false);
    }
  };

  // ── Reschedule ──────────────────────────────────────────────────────────
  const openReschedule = async (appt) => {
    setReschedId(appt.id);
    setReschedAppt(appt);
    setSelectedDate("");
    setAvailableDates([]);
    setReschedOpen(true);
    setReschedLoading(true);
    try {
      const res = await API.get(`/appointments/${appt.id}/available-dates`);
      setAvailableDates(res.data);
    } catch (e) {
      toast.error(e?.response?.data || "Failed to load available dates.", "Error");
      setReschedOpen(false);
    } finally {
      setReschedLoading(false);
    }
  };

  const doReschedule = async () => {
    if (!selectedDate) {
      toast.warning("Please select a new date.");
      return;
    }
    setReschedLoading(true);
    try {
      await API.put(`/appointments/${reschedId}/reschedule-to`, { date: selectedDate });
      setReschedOpen(false);
      toast.success(`Appointment #${reschedId} rescheduled to ${formatDate(selectedDate)}.`, "Rescheduled");
      load();
    } catch (e) {
      toast.error(e?.response?.data || "Reschedule failed.", "Reschedule Failed");
    } finally {
      setReschedLoading(false);
    }
  };

  // ── Generate Bill ───────────────────────────────────────────────────────
  const openBillConfirm = (id) => {
    setBillApptId(id);
    setBillLoading(false);
    setBillConfirmOpen(true);
  };

  const createBill = async () => {
    setBillLoading(true);
    try {
      await API.post(`/bills/appointment/${billApptId}`);
      setBillConfirmOpen(false);
      toast.success("Bill created. Go to Billing to complete payment.", "Bill Generated");
      load();
    } catch (e) {
      toast.error(e?.response?.data || "Bill creation failed.", "Bill Failed");
    } finally {
      setBillLoading(false);
    }
  };

  // ── View Detail ─────────────────────────────────────────────────────────
  const openDetail = (appt) => {
    setDetailAppt(appt);
    setDetailOpen(true);
  };

  // ── Filtered patients/doctors for booking ───────────────────────────────
  const filteredPatients = useMemo(() => {
    const s = patientSearch.trim().toLowerCase();
    if (!s) return patients;
    return patients.filter((p) =>
      [p.name, String(p.id), p.phone || ""].some((v) => v.toLowerCase().includes(s))
    );
  }, [patients, patientSearch]);

  const filteredDoctors = useMemo(() => {
    const s = doctorSearch.trim().toLowerCase();
    if (!s) return doctors;
    return doctors.filter((d) =>
      [d.name || "", d.specialization || ""].some((v) => v.toLowerCase().includes(s))
    );
  }, [doctors, doctorSearch]);

  // ── Render ──────────────────────────────────────────────────────────────
  return (
    <DashboardLayout>
      <Toast toasts={toasts} remove={remove} />

      <div className="space-y-6">
        {/* ── Header ─────────────────────────────────────────────────── */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Appointments</h2>
            <p className="text-gray-500 mt-1 text-sm">
              Book, manage, cancel, reschedule, and generate bills.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
            {/* View toggle */}
            <div className="flex bg-gray-100 rounded-lg p-0.5">
              <button
                onClick={() => setViewMode("table")}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  viewMode === "table"
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <span className="flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                  Table
                </span>
              </button>
              <button
                onClick={() => setViewMode("queue")}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  viewMode === "queue"
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <span className="flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                  Today's Queue
                </span>
              </button>
            </div>
            {(role === "ADMIN" || role === "RECEPTIONIST") && (
              <Button onClick={openBook}>+ Book Appointment</Button>
            )}
          </div>
        </div>

        {/* ── Table View ─────────────────────────────────────────────── */}
        {viewMode === "table" && (
          <>
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
              <div className="w-48">
                <Select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                  <option value="">All Statuses</option>
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </Select>
              </div>
              <SearchBar
                value={q}
                onChange={setQ}
                placeholder="Search by patient, doctor, ID, date..."
                className="w-full sm:w-80"
              />
              <span className="text-xs text-gray-400 ml-auto whitespace-nowrap">
                {filtered.length} appointment{filtered.length !== 1 && "s"} found
              </span>
            </div>

            {/* Table Card */}
            <Card noPadding>
              {loading ? (
                <LoadingSpinner message="Loading appointments..." />
              ) : filtered.length === 0 ? (
                <EmptyState
                  title="No appointments found"
                  message={
                    q || filterStatus
                      ? "Try adjusting your search or filter criteria."
                      : "No appointments have been booked yet."
                  }
                  action={
                    !q && !filterStatus && (role === "ADMIN" || role === "RECEPTIONIST")
                      ? openBook
                      : undefined
                  }
                  actionLabel="Book Appointment"
                />
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-200">
                          <th className="px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wider">
                            Token
                          </th>
                          <th className="px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wider">
                            Patient
                          </th>
                          <th className="px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wider">
                            Doctor
                          </th>
                          <th className="px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wider">
                            Date
                          </th>
                          <th className="px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wider">
                            Fee
                          </th>
                          <th className="px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wider">
                            Payment
                          </th>
                          <th className="px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {paginated.map((a) => (
                          <tr
                            key={a.id}
                            className={`transition-colors hover:bg-gray-50/80 ${ROW_STATUS_BG[a.status] || ""}`}
                          >
                            <td className="px-4 py-3 text-center">
                              <TokenBadge number={a.tokenNumber} />
                            </td>
                            <td className="px-4 py-3">
                              <button
                                onClick={() => openDetail(a)}
                                className="font-medium text-gray-900 hover:text-blue-600 transition-colors text-left"
                              >
                                {a.patient?.name}
                              </button>
                              <p className="text-xs text-gray-400">ID #{a.id}</p>
                            </td>
                            <td className="px-4 py-3">
                              <span className="text-gray-800">{a.schedule?.doctor?.name}</span>
                              {a.schedule?.doctor?.specialization && (
                                <p className="text-xs text-gray-400">{a.schedule.doctor.specialization}</p>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              <span className="text-gray-700">{formatDate(a.appointmentDate)}</span>
                              {a.schedule?.startTime && (
                                <p className="text-xs text-gray-400">
                                  {a.schedule.startTime} - {a.schedule.endTime}
                                </p>
                              )}
                            </td>
                            <td className="px-4 py-3 font-medium text-gray-700">
                              {formatCurrency(a.appointmentFee)}
                            </td>
                            <td className="px-4 py-3">
                              <StatusBadge status={a.status} size="sm" />
                            </td>
                            <td className="px-4 py-3">
                              <StatusBadge status={a.paymentStatus} size="sm" />
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex flex-wrap items-center gap-1.5">
                                <button
                                  onClick={() => openDetail(a)}
                                  className="px-2 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                                  title="View details"
                                >
                                  View
                                </button>
                                {(role === "ADMIN" || role === "RECEPTIONIST") && (
                                  <Select
                                    className="!w-32 !py-1 !text-xs"
                                    value={a.status}
                                    onChange={(e) => updateStatus(a.id, e.target.value)}
                                  >
                                    {STATUSES.map((s) => (
                                      <option key={s} value={s}>
                                        {s}
                                      </option>
                                    ))}
                                  </Select>
                                )}
                                {(role === "ADMIN" || role === "RECEPTIONIST") &&
                                  a.status !== "CANCELLED" &&
                                  a.status !== "RESCHEDULED" && (
                                    <button
                                      onClick={() => openReschedule(a)}
                                      className="px-2 py-1 text-xs font-medium text-violet-600 hover:bg-violet-50 rounded-md transition-colors"
                                    >
                                      Reschedule
                                    </button>
                                  )}
                                {(role === "ADMIN" || role === "RECEPTIONIST") && a.status !== "CANCELLED" && (
                                  <button
                                    onClick={() => openCancel(a.id)}
                                    className="px-2 py-1 text-xs font-medium text-red-500 hover:bg-red-50 rounded-md transition-colors"
                                  >
                                    Cancel
                                  </button>
                                )}
                                {(role === "ADMIN" || role === "CASHIER" || role === "RECEPTIONIST") &&
                                  a.paymentStatus === "UNPAID" &&
                                  a.status !== "CANCELLED" &&
                                  a.status !== "RESCHEDULED" && (
                                    <button
                                      onClick={() => openBillConfirm(a.id)}
                                      className="px-2 py-1 text-xs font-medium text-emerald-600 hover:bg-emerald-50 rounded-md transition-colors"
                                    >
                                      Generate Bill
                                    </button>
                                  )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="px-4 border-t border-gray-100">
                    <Pagination
                      currentPage={safeCurrentPage}
                      totalPages={totalPages}
                      totalItems={filtered.length}
                      itemsPerPage={ITEMS_PER_PAGE}
                      onPageChange={setCurrentPage}
                    />
                  </div>
                </>
              )}
            </Card>
          </>
        )}

        {/* ── Today's Queue View ─────────────────────────────────────── */}
        {viewMode === "queue" && (
          <div className="space-y-4">
            <Card
              title="Today's Queue"
              subtitle={`${todaysQueue.length} appointment${todaysQueue.length !== 1 ? "s" : ""} today`}
            >
              {loading ? (
                <LoadingSpinner message="Loading today's queue..." />
              ) : todaysQueue.length === 0 ? (
                <EmptyState
                  title="No appointments today"
                  message="There are no appointments scheduled for today."
                  icon={
                    <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                  }
                />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {todaysQueue.map((a) => (
                    <QueueCard
                      key={a.id}
                      appointment={a}
                      role={role}
                      onReschedule={openReschedule}
                      onCancel={openCancel}
                      onViewDetail={openDetail}
                    />
                  ))}
                </div>
              )}
            </Card>
          </div>
        )}
      </div>

      {/* ================================================================= */}
      {/*  MODALS                                                           */}
      {/* ================================================================= */}

      {/* ── Book Appointment Modal (3-step wizard) ────────────────────── */}
      <Modal
        open={bookOpen}
        title="Book New Appointment"
        onClose={() => setBookOpen(false)}
        size="lg"
        footer={
          <div className="flex items-center justify-between">
            <div>
              {bookStep > 1 && (
                <Button variant="secondary" onClick={() => setBookStep(bookStep - 1)}>
                  <span className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                    </svg>
                    Back
                  </span>
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => setBookOpen(false)}>
                Cancel
              </Button>
              {bookStep === 3 && selSchedule && selDate && (
                <Button onClick={book} disabled={bookLoading}>
                  {bookLoading ? "Booking..." : "Confirm Booking"}
                </Button>
              )}
            </div>
          </div>
        }
      >
        <StepIndicator currentStep={bookStep} />

        {/* Step 1: Patient Selection */}
        {bookStep === 1 && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600 font-medium">Select the patient for this appointment:</p>
            <SearchBar
              value={patientSearch}
              onChange={setPatientSearch}
              placeholder="Search by name, ID, or phone..."
            />
            <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
              {filteredPatients.map((p) => (
                <button
                  key={p.id}
                  onClick={() => {
                    setSelPatient(p);
                    setBookStep(2);
                    setDoctorSearch("");
                  }}
                  className={`w-full text-left px-4 py-3 rounded-xl border transition-all ${
                    selPatient?.id === p.id
                      ? "border-blue-500 bg-blue-50 shadow-sm"
                      : "border-gray-200 hover:border-blue-300 hover:bg-blue-50/50"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-gray-800">{p.name}</div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        ID #{p.id}
                        {p.phone ? ` | ${p.phone}` : ""}
                        {p.email ? ` | ${p.email}` : ""}
                      </div>
                    </div>
                    <svg
                      className="w-4 h-4 text-gray-300"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </button>
              ))}
              {filteredPatients.length === 0 && (
                <EmptyState
                  title="No patients found"
                  message={`No patients match "${patientSearch}"`}
                />
              )}
            </div>
          </div>
        )}

        {/* Step 2: Doctor Selection */}
        {bookStep === 2 && (
          <div className="space-y-4">
            {/* Selection summary */}
            <div className="flex items-center gap-2 bg-blue-50 border border-blue-100 rounded-xl px-4 py-2.5 text-sm text-blue-700">
              <svg className="w-4 h-4 text-blue-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Patient: <strong>{selPatient?.name}</strong>
            </div>

            <p className="text-sm text-gray-600 font-medium">Select a doctor:</p>
            <SearchBar
              value={doctorSearch}
              onChange={setDoctorSearch}
              placeholder="Search by name or specialization..."
            />
            <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
              {filteredDoctors.map((d) => (
                <button
                  key={d.id}
                  onClick={() => selectDoctor(d)}
                  className="w-full text-left px-4 py-3 rounded-xl border border-gray-200 hover:border-blue-300 hover:bg-blue-50/50 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold text-sm flex-shrink-0">
                        {(d.name || "?").charAt(0)}
                      </div>
                      <div>
                        <div className="font-medium text-gray-800">{d.name}</div>
                        <div className="text-xs text-gray-500 mt-0.5">{d.specialization}</div>
                      </div>
                    </div>
                    {d.channelling_fee != null && (
                      <span className="text-sm font-semibold text-emerald-600 flex-shrink-0">
                        {formatCurrency(d.channelling_fee)}
                      </span>
                    )}
                  </div>
                </button>
              ))}
              {filteredDoctors.length === 0 && (
                <EmptyState
                  title="No doctors found"
                  message={`No doctors match "${doctorSearch}"`}
                />
              )}
            </div>
          </div>
        )}

        {/* Step 3: Schedule + Date */}
        {bookStep === 3 && (
          <div className="space-y-4">
            {/* Selection summary */}
            <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 text-sm text-blue-700 space-y-1">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-blue-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Patient: <strong>{selPatient?.name}</strong>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-blue-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Doctor: <strong>{selDoctor?.name}</strong>
                <span className="text-blue-500">({selDoctor?.specialization})</span>
              </div>
            </div>

            {doctorSchedules.length === 0 ? (
              <EmptyState
                title="No schedules available"
                message="This doctor has no schedules set up yet."
                icon={
                  <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                }
              />
            ) : (
              <>
                <p className="text-sm font-medium text-gray-700">Select an available date and time:</p>
                <div className="max-h-64 overflow-y-auto pr-1 space-y-2">
                  {allUpcomingSlots.map(({ date, schedule: sc }) => {
                    const d = new Date(date + "T00:00:00");
                    const isSelected = selDate === date && selSchedule?.id === sc.id;
                    const dayLabel = d.toLocaleDateString("en-US", { weekday: "long" });
                    const dateLabel = d.toLocaleDateString("en-US", {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    });
                    return (
                      <button
                        key={`${sc.id}-${date}`}
                        onClick={() => {
                          setSelSchedule(sc);
                          setSelDate(date);
                        }}
                        className={`w-full text-left px-4 py-3 rounded-xl border transition-all flex items-center justify-between ${
                          isSelected
                            ? "border-blue-500 bg-blue-600 text-white shadow-md ring-2 ring-blue-200"
                            : "border-gray-200 hover:border-blue-300 hover:bg-blue-50/50"
                        }`}
                      >
                        <div>
                          <div className={`font-semibold text-sm ${isSelected ? "text-white" : "text-gray-800"}`}>
                            {dayLabel}, {dateLabel}
                          </div>
                          <div className={`text-xs mt-0.5 ${isSelected ? "text-blue-100" : "text-gray-500"}`}>
                            {sc.startTime} - {sc.endTime}
                          </div>
                        </div>
                        {isSelected && (
                          <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Booking Summary */}
                {selSchedule && selDate && (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-5 py-4 text-sm text-emerald-800">
                    <p className="font-semibold text-base mb-3">Booking Summary</p>
                    <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5">
                      <span className="text-emerald-600">Patient:</span>
                      <span className="font-medium">{selPatient?.name}</span>
                      <span className="text-emerald-600">Doctor:</span>
                      <span className="font-medium">{selDoctor?.name}</span>
                      <span className="text-emerald-600">Date:</span>
                      <span className="font-medium">{formatDateLong(selDate)}</span>
                      <span className="text-emerald-600">Time:</span>
                      <span className="font-medium">
                        {selSchedule.startTime} - {selSchedule.endTime}
                      </span>
                    </div>
                    {/* Fee breakdown */}
                    <div className="mt-3 pt-3 border-t border-emerald-200">
                      <div className="flex justify-between text-sm">
                        <span className="text-emerald-600">Doctor Fee</span>
                        <span>{formatCurrency(selDoctor?.channelling_fee || 0)}</span>
                      </div>
                      <div className="flex justify-between text-sm mt-1">
                        <span className="text-emerald-600">Hospital Charge</span>
                        <span>{formatCurrency(HOSPITAL_CHARGE)}</span>
                      </div>
                      <div className="flex justify-between font-bold text-base mt-2 pt-2 border-t border-emerald-300">
                        <span>Total</span>
                        <span>{formatCurrency(Number(selDoctor?.channelling_fee || 0) + HOSPITAL_CHARGE)}</span>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </Modal>

      {/* ── Reschedule Modal ──────────────────────────────────────────── */}
      <Modal
        open={reschedOpen}
        title={`Reschedule Appointment #${reschedId ?? ""}`}
        onClose={() => setReschedOpen(false)}
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setReschedOpen(false)}>
              Cancel
            </Button>
            <Button onClick={doReschedule} disabled={!selectedDate || reschedLoading}>
              {reschedLoading ? "Rescheduling..." : "Confirm Reschedule"}
            </Button>
          </div>
        }
      >
        {reschedAppt && (
          <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 mb-4 text-sm">
            <p className="font-semibold text-blue-800 mb-2">Current Appointment</p>
            <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-blue-700">
              <span className="text-blue-500">Patient:</span>
              <span className="font-medium">{reschedAppt.patient?.name}</span>
              <span className="text-blue-500">Doctor:</span>
              <span className="font-medium">{reschedAppt.schedule?.doctor?.name}</span>
              <span className="text-blue-500">Schedule:</span>
              <span className="font-medium">
                {reschedAppt.schedule?.day}s | {reschedAppt.schedule?.startTime} - {reschedAppt.schedule?.endTime}
              </span>
              <span className="text-blue-500">Current Date:</span>
              <span className="font-medium text-red-600">{formatDate(reschedAppt.appointmentDate)}</span>
            </div>
          </div>
        )}

        <p className="text-sm font-medium text-gray-700 mb-3">
          Select a new date &mdash; available{" "}
          <span className="text-blue-600 font-semibold">{reschedAppt?.schedule?.day}</span> slots:
        </p>

        {reschedLoading ? (
          <LoadingSpinner message="Loading available dates..." size="md" />
        ) : availableDates.length === 0 ? (
          <EmptyState
            title="No available slots"
            message="No available slots found in the next 90 days."
            icon={
              <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            }
          />
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {availableDates.map((date) => (
              <button
                key={date}
                onClick={() => setSelectedDate(date)}
                className={`px-4 py-3 rounded-xl border text-sm font-medium text-left transition-all ${
                  selectedDate === date
                    ? "bg-blue-600 text-white border-blue-600 shadow-md ring-2 ring-blue-200"
                    : "bg-white text-gray-700 border-gray-200 hover:border-blue-300 hover:bg-blue-50"
                }`}
              >
                <div className="font-semibold">{formatDate(date)}</div>
                <div className={`text-xs mt-0.5 ${selectedDate === date ? "text-blue-100" : "text-gray-400"}`}>
                  Available
                </div>
              </button>
            ))}
          </div>
        )}

        {selectedDate && (
          <div className="mt-4 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 text-sm text-emerald-700 flex items-center gap-2">
            <svg className="w-4 h-4 text-emerald-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            New date selected: <strong>{formatDate(selectedDate)}</strong>
          </div>
        )}
      </Modal>

      {/* ── Cancel Modal ──────────────────────────────────────────────── */}
      <Modal
        open={cancelOpen}
        title={`Cancel Appointment #${cancelId ?? ""}`}
        onClose={() => setCancelOpen(false)}
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setCancelOpen(false)}>
              Back
            </Button>
            <Button variant="danger" onClick={doCancel} disabled={cancelLoading}>
              {cancelLoading ? "Cancelling..." : "Confirm Cancellation"}
            </Button>
          </div>
        }
      >
        <div className="space-y-5">
          {/* Warning banner */}
          <div className="flex items-start gap-3 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
            <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0 mt-0.5">
              <svg className="w-4 h-4 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-red-800">This action cannot be undone</p>
              <p className="text-xs text-red-600 mt-0.5">
                The appointment will be marked as cancelled permanently.
              </p>
            </div>
          </div>

          {/* Reason input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Cancellation Reason</label>
            <textarea
              placeholder="Enter the reason for cancellation..."
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              rows={3}
              className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-red-200 focus:border-red-400 resize-none"
            />
          </div>

          {/* Refund checkbox */}
          <div className="flex items-start gap-3 bg-gray-50 rounded-xl px-4 py-3">
            <input
              type="checkbox"
              id="refund"
              checked={refundRequired}
              onChange={(e) => setRefundRequired(e.target.checked)}
              className="mt-0.5 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <div>
              <label htmlFor="refund" className="text-sm font-medium text-gray-700 cursor-pointer">
                Process refund
              </label>
              <p className="text-xs text-gray-500 mt-0.5">
                If the patient has already paid, issue a refund for this appointment.
              </p>
            </div>
          </div>
        </div>
      </Modal>

      {/* ── Appointment Detail Modal ──────────────────────────────────── */}
      <Modal
        open={detailOpen}
        title="Appointment Details"
        onClose={() => setDetailOpen(false)}
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setDetailOpen(false)}>
              Close
            </Button>
            {detailAppt &&
              (role === "ADMIN" || role === "RECEPTIONIST") &&
              detailAppt.status !== "CANCELLED" &&
              detailAppt.status !== "RESCHEDULED" && (
                <Button
                  variant="secondary"
                  onClick={() => {
                    setDetailOpen(false);
                    openReschedule(detailAppt);
                  }}
                >
                  Reschedule
                </Button>
              )}
            {detailAppt &&
              (role === "ADMIN" || role === "RECEPTIONIST") &&
              detailAppt.status !== "CANCELLED" && (
                <Button
                  variant="danger"
                  onClick={() => {
                    setDetailOpen(false);
                    openCancel(detailAppt.id);
                  }}
                >
                  Cancel
                </Button>
              )}
          </div>
        }
      >
        {detailAppt && (
          <div className="space-y-5">
            {/* Header with token */}
            <div className="flex items-center gap-4">
              <div className="flex flex-col items-center">
                <span className="text-[10px] uppercase font-semibold text-gray-400 tracking-wider mb-1">Token</span>
                <span className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-blue-600 text-white text-xl font-bold shadow">
                  {detailAppt.tokenNumber ?? "--"}
                </span>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Appointment #{detailAppt.id}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <StatusBadge status={detailAppt.status} />
                  <StatusBadge status={detailAppt.paymentStatus} />
                </div>
              </div>
            </div>

            {/* Details grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-xs uppercase font-semibold text-gray-400 tracking-wider mb-2">Patient</p>
                <p className="font-semibold text-gray-900">{detailAppt.patient?.name}</p>
                {detailAppt.patient?.phone && (
                  <p className="text-sm text-gray-500">{detailAppt.patient.phone}</p>
                )}
                {detailAppt.patient?.email && (
                  <p className="text-sm text-gray-500">{detailAppt.patient.email}</p>
                )}
                <p className="text-xs text-gray-400 mt-1">Patient ID #{detailAppt.patient?.id}</p>
              </div>

              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-xs uppercase font-semibold text-gray-400 tracking-wider mb-2">Doctor</p>
                <p className="font-semibold text-gray-900">{detailAppt.schedule?.doctor?.name}</p>
                {detailAppt.schedule?.doctor?.specialization && (
                  <p className="text-sm text-gray-500">{detailAppt.schedule.doctor.specialization}</p>
                )}
              </div>

              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-xs uppercase font-semibold text-gray-400 tracking-wider mb-2">Schedule</p>
                <p className="font-semibold text-gray-900">{formatDateLong(detailAppt.appointmentDate)}</p>
                {detailAppt.schedule && (
                  <p className="text-sm text-gray-500">
                    {detailAppt.schedule.day} | {detailAppt.schedule.startTime} - {detailAppt.schedule.endTime}
                  </p>
                )}
              </div>

              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-xs uppercase font-semibold text-gray-400 tracking-wider mb-2">Fees</p>
                <p className="font-semibold text-gray-900 text-lg">{formatCurrency(detailAppt.appointmentFee)}</p>
                <p className="text-xs text-gray-400 mt-1">Payment: {detailAppt.paymentStatus}</p>
              </div>
            </div>

            {/* Cancellation details if cancelled */}
            {detailAppt.status === "CANCELLED" && detailAppt.cancellationReason && (
              <div className="bg-red-50 border border-red-100 rounded-xl p-4">
                <p className="text-xs uppercase font-semibold text-red-400 tracking-wider mb-1">Cancellation Reason</p>
                <p className="text-sm text-red-700">{detailAppt.cancellationReason}</p>
              </div>
            )}

            {/* Notes if present */}
            {detailAppt.notes && (
              <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
                <p className="text-xs uppercase font-semibold text-amber-400 tracking-wider mb-1">Notes</p>
                <p className="text-sm text-amber-700">{detailAppt.notes}</p>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* ── Bill Confirm Dialog ───────────────────────────────────────── */}
      <ConfirmDialog
        open={billConfirmOpen}
        onClose={() => setBillConfirmOpen(false)}
        onConfirm={createBill}
        title="Generate Bill"
        message="Create a bill for this appointment? You can complete the payment from the Billing page."
        confirmLabel="Generate Bill"
        confirmVariant="primary"
        loading={billLoading}
      />
    </DashboardLayout>
  );
}

export default Appointments;
