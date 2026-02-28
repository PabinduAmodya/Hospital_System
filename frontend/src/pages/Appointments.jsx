import { useEffect, useMemo, useState } from "react";
import API from "../api/axios";
import DashboardLayout from "../layouts/DashboardLayout";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Select from "../components/ui/Select";
import Modal from "../components/ui/Modal";
import { Toast, useToast } from "../components/ui/Toast";

const STATUSES = ["PENDING", "CONFIRMED", "COMPLETED", "CANCELLED", "RESCHEDULED"];

function statusPill(status) {
  const base = "px-2 py-1 rounded-full text-xs font-semibold";
  const map = {
    PENDING:     "bg-amber-100 text-amber-700",
    CONFIRMED:   "bg-blue-100 text-blue-700",
    COMPLETED:   "bg-emerald-100 text-emerald-700",
    CANCELLED:   "bg-red-100 text-red-700",
    RESCHEDULED: "bg-gray-100 text-gray-600",
  };
  return <span className={`${base} ${map[status] || "bg-gray-100 text-gray-700"}`}>{status}</span>;
}

function paymentPill(status) {
  const base = "px-2 py-1 rounded-full text-xs font-semibold";
  const map = {
    UNPAID:   "bg-amber-100 text-amber-700",
    PAID:     "bg-purple-100 text-purple-700",
    REFUNDED: "bg-slate-100 text-slate-700",
  };
  return <span className={`${base} ${map[status] || "bg-gray-100 text-gray-700"}`}>{status}</span>;
}

function Appointments() {
  const role = localStorage.getItem("role");
  const { toasts, toast, remove } = useToast();

  const [appointments, setAppointments] = useState([]);
  const [patients, setPatients]         = useState([]);
  const [schedules, setSchedules]       = useState([]);
  const [loading, setLoading]           = useState(false);
  const [q, setQ]                       = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  // Book modal
  const [bookOpen, setBookOpen] = useState(false);
  const [bookForm, setBookForm] = useState({ patientId: "", scheduleId: "", appointmentDate: "" });

  // Cancel modal
  const [cancelOpen, setCancelOpen]         = useState(false);
  const [cancelId, setCancelId]             = useState(null);
  const [cancelAppt, setCancelAppt]         = useState(null);
  const [cancelReason, setCancelReason]     = useState("");
  const [refundRequired, setRefundRequired] = useState(false);

  // Reschedule modal
  const [reschedOpen, setReschedOpen]       = useState(false);
  const [reschedId, setReschedId]           = useState(null);
  const [reschedAppt, setReschedAppt]       = useState(null);
  const [availableDates, setAvailableDates] = useState([]);
  const [selectedDate, setSelectedDate]     = useState("");
  const [reschedLoading, setReschedLoading] = useState(false);

  // ── Data ────────────────────────────────────────────────────────────────────
  const load = async () => {
    setLoading(true);
    try {
      const res = await API.get("/appointments");
      setAppointments(res.data);
    } catch { toast.error("Failed to load appointments."); }
    finally { setLoading(false); }
  };

  const loadForBooking = async () => {
    try {
      const [pRes, sRes] = await Promise.all([API.get("/patients"), API.get("/schedules")]);
      setPatients(pRes.data);
      setSchedules(sRes.data);
    } catch { toast.error("Failed to load patients or schedules."); }
  };

  useEffect(() => { load(); }, []);

  // ── Filters ─────────────────────────────────────────────────────────────────
  const availableSchedules = useMemo(() => {
    if (!bookForm.appointmentDate) return schedules;
    const dayName = new Date(bookForm.appointmentDate + "T00:00:00")
      .toLocaleDateString("en-US", { weekday: "long" }).toUpperCase();
    return schedules.filter((s) => s.day?.toUpperCase() === dayName);
  }, [schedules, bookForm.appointmentDate]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return appointments
      .filter((a) => (filterStatus ? a.status === filterStatus : true))
      .filter((a) => {
        if (!s) return true;
        return [String(a.id), a.schedule?.doctor?.name || "", a.patient?.name || "", a.status, a.appointmentDate]
          .some((v) => (v || "").toLowerCase().includes(s));
      });
  }, [appointments, q, filterStatus]);

  // ── Book ────────────────────────────────────────────────────────────────────
  const openBook = async () => {
    setBookForm({ patientId: "", scheduleId: "", appointmentDate: "" });
    setBookOpen(true);
    await loadForBooking();
  };

  const book = async () => {
    if (!bookForm.patientId || !bookForm.scheduleId || !bookForm.appointmentDate) {
      toast.warning("Please fill in patient, date, and schedule.");
      return;
    }
    try {
      await API.post("/appointments/book", {
        patientId:       Number(bookForm.patientId),
        scheduleId:      Number(bookForm.scheduleId),
        appointmentDate: bookForm.appointmentDate,
      });
      setBookOpen(false);
      toast.success("Appointment booked successfully!", "Booking Confirmed");
      load();
    } catch (e) {
      toast.error(e?.response?.data || "Booking failed.", "Booking Failed");
    }
  };

  // ── Status update ───────────────────────────────────────────────────────────
  const updateStatus = async (id, status, currentStatus) => {
    if (currentStatus === "CANCELLED") {
      toast.error("Cancelled appointments cannot be restored.", "Action Blocked");
      return;
    }
    try {
      await API.put(`/appointments/${id}/status`, { status, notes: "" });
      toast.success(`Appointment #${id} status updated to ${status}.`, "Status Updated");
      load();
    } catch (e) {
      toast.error(e?.response?.data || "Status update failed.", "Update Failed");
    }
  };

  // ── Cancel ──────────────────────────────────────────────────────────────────
  const openCancel = (appt) => {
    if (appt.status === "CANCELLED") {
      toast.error("This appointment is already cancelled.", "Already Cancelled");
      return;
    }
    setCancelId(appt.id);
    setCancelAppt(appt);
    setCancelReason("");
    setRefundRequired(false);
    setCancelOpen(true);
  };

  const doCancel = async () => {
    try {
      await API.put(`/appointments/${cancelId}/cancel`, {
        cancellationReason: cancelReason,
        refundRequired,
      });
      setCancelOpen(false);
      const msg = refundRequired && cancelAppt?.paymentStatus === "PAID"
        ? `Appointment #${cancelId} cancelled. Refund has been processed.`
        : `Appointment #${cancelId} cancelled successfully.`;
      toast.success(msg, "Appointment Cancelled");
      load();
    } catch (e) {
      toast.error(e?.response?.data || "Cancel failed.", "Cancel Failed");
    }
  };

  // ── Reschedule ──────────────────────────────────────────────────────────────
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
    if (!selectedDate) { toast.warning("Please select a new date."); return; }
    try {
      await API.put(`/appointments/${reschedId}/reschedule-to`, { date: selectedDate });
      setReschedOpen(false);
      toast.success(
        `Appointment #${reschedId} rescheduled to ${formatDate(selectedDate)}.`,
        "Rescheduled"
      );
      load();
    } catch (e) {
      toast.error(e?.response?.data || "Reschedule failed.", "Reschedule Failed");
    }
  };

  // ── Bill ────────────────────────────────────────────────────────────────────
  const createBill = async (appt) => {
    if (!confirm(`Create a bill for appointment #${appt.id}?`)) return;
    try {
      await API.post(`/bills/appointment/${appt.id}`);
      toast.success(`Bill created for ${appt.patient?.name}. Go to Billing to collect payment.`, "Bill Created");
      load();
    } catch (e) {
      toast.error(e?.response?.data || "Bill creation failed.", "Bill Failed");
    }
  };

  // ── Helper ──────────────────────────────────────────────────────────────────
  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    return new Date(dateStr + "T00:00:00")
      .toLocaleDateString("en-US", { weekday: "short", year: "numeric", month: "short", day: "numeric" });
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <DashboardLayout>
      <Toast toasts={toasts} remove={remove} />

      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold">Appointments</h2>
            <p className="text-gray-600 mt-1">Book, manage, reschedule and bill appointments.</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
            <div className="w-56">
              <Select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                <option value="">All statuses</option>
                {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </Select>
            </div>
            <div className="w-72">
              <Input placeholder="Search..." value={q} onChange={(e) => setQ(e.target.value)} />
            </div>
            {(role === "ADMIN" || role === "RECEPTIONIST") && (
              <Button onClick={openBook}>+ Book Appointment</Button>
            )}
          </div>
        </div>

        {/* Table */}
        <Card title="Appointments List" subtitle={loading ? "Loading..." : `${filtered.length} records`}>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="p-3">ID</th>
                  <th className="p-3">Patient</th>
                  <th className="p-3">Doctor</th>
                  <th className="p-3">Date</th>
                  <th className="p-3">Fee</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Payment</th>
                  <th className="p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((a) => (
                  <tr key={a.id} className={`border-t hover:bg-gray-50 ${a.status === "CANCELLED" ? "opacity-60" : ""}`}>
                    <td className="p-3 text-gray-400">{a.id}</td>
                    <td className="p-3 font-medium">{a.patient?.name}</td>
                    <td className="p-3">{a.schedule?.doctor?.name}</td>
                    <td className="p-3">{a.appointmentDate}</td>
                    <td className="p-3">Rs. {a.appointmentFee}</td>
                    <td className="p-3">{statusPill(a.status)}</td>
                    <td className="p-3">{paymentPill(a.paymentStatus)}</td>
                    <td className="p-3">
                      <div className="flex flex-wrap gap-1.5">

                        {/* Status dropdown — locked if cancelled */}
                        {(role === "ADMIN" || role === "RECEPTIONIST") && (
                          <Select
                            className="w-36 text-xs"
                            value={a.status}
                            disabled={a.status === "CANCELLED"}
                            title={a.status === "CANCELLED" ? "Cancelled appointments cannot be restored" : ""}
                            onChange={(e) => updateStatus(a.id, e.target.value, a.status)}
                          >
                            {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                          </Select>
                        )}

                        {/* Reschedule */}
                        {(role === "ADMIN" || role === "RECEPTIONIST") &&
                          a.status !== "CANCELLED" && a.status !== "COMPLETED" && (
                          <Button variant="secondary" onClick={() => openReschedule(a)}>
                            📅 Reschedule
                          </Button>
                        )}

                        {/* Cancel */}
                        {(role === "ADMIN" || role === "RECEPTIONIST") && a.status !== "CANCELLED" && (
                          <Button variant="danger" onClick={() => openCancel(a)}>Cancel</Button>
                        )}

                        {/* Generate Bill */}
                        {(role === "ADMIN" || role === "CASHIER" || role === "RECEPTIONIST") &&
                          a.paymentStatus === "UNPAID" &&
                          a.status !== "CANCELLED" && a.status !== "RESCHEDULED" && (
                          <Button variant="success" onClick={() => createBill(a)}>
                            Generate Bill
                          </Button>
                        )}

                      </div>
                    </td>
                  </tr>
                ))}
                {!loading && filtered.length === 0 && (
                  <tr>
                    <td colSpan="8" className="p-6 text-center text-gray-500">No appointments found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* ── Book Modal ── */}
      <Modal open={bookOpen} title="Book Appointment" onClose={() => setBookOpen(false)}
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setBookOpen(false)}>Cancel</Button>
            <Button onClick={book}>Book</Button>
          </div>
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-xs text-gray-600">Patient</label>
            <Select value={bookForm.patientId} onChange={(e) => setBookForm({ ...bookForm, patientId: e.target.value })}>
              <option value="">Select patient</option>
              {patients.map((p) => <option key={p.id} value={p.id}>{p.name} (#{p.id})</option>)}
            </Select>
          </div>
          <div>
            <label className="text-xs text-gray-600">Appointment Date</label>
            <Input type="date" value={bookForm.appointmentDate}
              onChange={(e) => setBookForm({ ...bookForm, appointmentDate: e.target.value, scheduleId: "" })} />
          </div>
          <div>
            <label className="text-xs text-gray-600">
              Schedule {bookForm.appointmentDate
                ? `(${new Date(bookForm.appointmentDate + "T00:00:00").toLocaleDateString("en-US", { weekday: "long" })})`
                : "— pick date first"}
            </label>
            <Select value={bookForm.scheduleId} disabled={!bookForm.appointmentDate}
              onChange={(e) => setBookForm({ ...bookForm, scheduleId: e.target.value })}>
              <option value="">
                {bookForm.appointmentDate
                  ? availableSchedules.length === 0 ? "No schedules on this day" : "Select schedule"
                  : "Pick a date first"}
              </option>
              {availableSchedules.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.doctor?.name} — {s.day} {s.startTime}–{s.endTime}
                </option>
              ))}
            </Select>
          </div>
        </div>
        <p className="text-xs text-gray-400 mt-3">Fee = doctor channeling fee + hospital charge (auto-calculated).</p>
      </Modal>

      {/* ── Reschedule Modal ── */}
      <Modal open={reschedOpen} title={`Reschedule Appointment #${reschedId ?? ""}`}
        onClose={() => setReschedOpen(false)}
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setReschedOpen(false)}>Cancel</Button>
            <Button onClick={doReschedule} disabled={!selectedDate}>Confirm Reschedule</Button>
          </div>
        }
      >
        {reschedAppt && (
          <div className="bg-blue-50 border border-blue-100 rounded-lg px-4 py-3 mb-4 text-sm">
            <p className="font-semibold text-blue-800 mb-1">Current Appointment</p>
            <div className="grid grid-cols-2 gap-1 text-blue-700">
              <span>Patient:</span>  <span className="font-medium">{reschedAppt.patient?.name}</span>
              <span>Doctor:</span>   <span className="font-medium">{reschedAppt.schedule?.doctor?.name}</span>
              <span>Schedule:</span> <span className="font-medium">{reschedAppt.schedule?.day}s · {reschedAppt.schedule?.startTime} – {reschedAppt.schedule?.endTime}</span>
              <span>Current date:</span> <span className="font-medium text-red-600">{formatDate(reschedAppt.appointmentDate)}</span>
            </div>
          </div>
        )}
        <p className="text-sm font-medium text-gray-700 mb-3">
          Select a new date — available <span className="text-blue-600">{reschedAppt?.schedule?.day}</span> slots:
        </p>
        {reschedLoading ? (
          <div className="flex items-center justify-center py-8 gap-3">
            <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-gray-500 text-sm">Loading available dates...</span>
          </div>
        ) : availableDates.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p className="text-3xl mb-2">📅</p>
            <p className="font-medium">No available slots found in the next 90 days.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {availableDates.map((date) => (
              <button key={date} onClick={() => setSelectedDate(date)}
                className={`px-4 py-3 rounded-lg border text-sm font-medium text-left transition-all ${
                  selectedDate === date
                    ? "bg-blue-600 text-white border-blue-600 shadow-md"
                    : "bg-white text-gray-700 border-gray-200 hover:border-blue-400 hover:bg-blue-50"
                }`}
              >
                <div className="font-semibold">{formatDate(date)}</div>
                <div className={`text-xs mt-0.5 ${selectedDate === date ? "text-blue-100" : "text-gray-400"}`}>Available ✓</div>
              </button>
            ))}
          </div>
        )}
        {selectedDate && (
          <div className="mt-4 bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-3 text-sm text-emerald-700">
            ✓ New date selected: <strong>{formatDate(selectedDate)}</strong>
          </div>
        )}
      </Modal>

      {/* ── Cancel Modal ── */}
      <Modal open={cancelOpen}
        title={`Cancel Appointment #${cancelId ?? ""}`}
        onClose={() => setCancelOpen(false)}
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setCancelOpen(false)}>Back</Button>
            <Button variant="danger" onClick={doCancel}>Confirm Cancel</Button>
          </div>
        }
      >
        <div className="space-y-4">
          {/* Warning banner */}
          <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
            ⚠ <strong>This action cannot be undone.</strong> Cancelled appointments cannot be restored.
          </div>

          {cancelAppt && (
            <div className="bg-gray-50 rounded-lg px-4 py-3 text-sm text-gray-700">
              <div className="grid grid-cols-2 gap-1">
                <span className="text-gray-500">Patient:</span> <span className="font-medium">{cancelAppt.patient?.name}</span>
                <span className="text-gray-500">Doctor:</span>  <span className="font-medium">{cancelAppt.schedule?.doctor?.name}</span>
                <span className="text-gray-500">Date:</span>    <span className="font-medium">{cancelAppt.appointmentDate}</span>
              </div>
            </div>
          )}

          <div>
            <label className="text-xs text-gray-600 font-medium">Cancellation Reason</label>
            <Input placeholder="Enter reason..." value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)} />
          </div>

          {/* Only show refund option if already PAID */}
          {cancelAppt?.paymentStatus === "PAID" && (
            <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
              <input type="checkbox" id="refund" checked={refundRequired}
                onChange={(e) => setRefundRequired(e.target.checked)}
                className="mt-0.5" />
              <label htmlFor="refund" className="text-sm text-amber-800">
                <span className="font-semibold">Process refund</span> — this appointment is already paid.
                Checking this will mark the payment as refunded and record it for reporting.
              </label>
            </div>
          )}
        </div>
      </Modal>

    </DashboardLayout>
  );
}

export default Appointments;