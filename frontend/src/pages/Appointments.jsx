import { useEffect, useMemo, useState } from "react";
import API from "../api/axios";
import DashboardLayout from "../layouts/DashboardLayout";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Select from "../components/ui/Select";
import Modal from "../components/ui/Modal";

// Matches fixed AppointmentStatus enum (PAID and unused values removed)
const STATUSES = ["PENDING", "CONFIRMED", "COMPLETED", "CANCELLED", "RESCHEDULED"];

function statusPill(status) {
  const base = "px-2 py-1 rounded-full text-xs font-semibold";
  const map = {
    PENDING:     "bg-amber-100 text-amber-700",
    CONFIRMED:   "bg-blue-100 text-blue-700",
    COMPLETED:   "bg-emerald-100 text-emerald-700",
    CANCELLED:   "bg-red-100 text-red-700",
    RESCHEDULED: "bg-gray-100 text-gray-700",
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

  const [appointments, setAppointments] = useState([]);
  const [patients, setPatients]         = useState([]);
  const [schedules, setSchedules]       = useState([]);

  const [loading, setLoading]         = useState(false);
  const [q, setQ]                     = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  // Book modal
  const [bookOpen, setBookOpen] = useState(false);
  const [bookForm, setBookForm] = useState({ patientId: "", scheduleId: "", appointmentDate: "" });

  // Cancel modal
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelId, setCancelId]     = useState(null);
  const [cancelReason, setCancelReason] = useState("");
  const [refundRequired, setRefundRequired] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await API.get("/appointments");
      setAppointments(res.data);
    } catch (e) {
      console.error(e);
      alert("Failed to load appointments.");
    } finally {
      setLoading(false);
    }
  };

  const loadForBooking = async () => {
    try {
      const [pRes, sRes] = await Promise.all([API.get("/patients"), API.get("/schedules")]);
      setPatients(pRes.data);
      setSchedules(sRes.data);
    } catch (e) {
      alert("Failed to load patients/schedules.");
    }
  };

  useEffect(() => { load(); }, []);

  // FIX: Filter available schedules based on selected date's day-of-week
  const availableSchedules = useMemo(() => {
    if (!bookForm.appointmentDate) return schedules;
    const dayName = new Date(bookForm.appointmentDate + "T00:00:00")
      .toLocaleDateString("en-US", { weekday: "long" })
      .toUpperCase();
    return schedules.filter((s) => s.day?.toUpperCase() === dayName);
  }, [schedules, bookForm.appointmentDate]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return appointments
      .filter((a) => (filterStatus ? a.status === filterStatus : true))
      .filter((a) => {
        if (!s) return true;
        const doctor  = a.schedule?.doctor?.name || "";
        const patient = a.patient?.name || "";
        return [String(a.id), doctor, patient, a.status, a.appointmentDate].some(
          (v) => (v || "").toString().toLowerCase().includes(s)
        );
      });
  }, [appointments, q, filterStatus]);

  const openBook = async () => {
    setBookForm({ patientId: "", scheduleId: "", appointmentDate: "" });
    setBookOpen(true);
    await loadForBooking();
  };

  const book = async () => {
    if (!bookForm.patientId || !bookForm.scheduleId || !bookForm.appointmentDate) {
      alert("Please fill in patient, date, and schedule.");
      return;
    }
    try {
      await API.post("/appointments/book", {
        patientId:       Number(bookForm.patientId),
        scheduleId:      Number(bookForm.scheduleId),
        appointmentDate: bookForm.appointmentDate,
      });
      setBookOpen(false);
      load();
    } catch (e) {
      alert(e?.response?.data || "Booking failed.");
    }
  };

  const updateStatus = async (id, status) => {
    try {
      await API.put(`/appointments/${id}/status`, { status, notes: "" });
      load();
    } catch (e) {
      alert(e?.response?.data || "Status update failed.");
    }
  };

  const openCancel = (id) => {
    setCancelId(id);
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
      load();
    } catch (e) {
      alert(e?.response?.data || "Cancel failed.");
    }
  };

  const reschedule = async (id) => {
    if (!confirm("Reschedule to next available date on the same schedule?")) return;
    try {
      await API.put(`/appointments/${id}/reschedule`);
      load();
    } catch (e) {
      alert(e?.response?.data || "Reschedule failed.");
    }
  };

  // FIX: Create a bill for this appointment instead of taking payment directly
  const createBill = async (id) => {
    if (!confirm("Create a bill for this appointment?")) return;
    try {
      await API.post(`/bills/appointment/${id}`);
      alert("Bill created successfully. Go to Billing to complete payment.");
      load();
    } catch (e) {
      alert(e?.response?.data || "Bill creation failed.");
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold">Appointments</h2>
            <p className="text-gray-600 mt-1">Book, manage status, cancel, reschedule, and generate bills.</p>
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
                  <tr key={a.id} className="border-t">
                    <td className="p-3">{a.id}</td>
                    <td className="p-3 font-medium">{a.patient?.name}</td>
                    <td className="p-3">{a.schedule?.doctor?.name}</td>
                    <td className="p-3">{a.appointmentDate}</td>
                    <td className="p-3">Rs. {a.appointmentFee}</td>
                    <td className="p-3">{statusPill(a.status)}</td>
                    <td className="p-3">{paymentPill(a.paymentStatus)}</td>
                    <td className="p-3">
                      <div className="flex flex-wrap gap-2">
                        {(role === "ADMIN" || role === "RECEPTIONIST") && (
                          <Select
                            className="w-40"
                            value={a.status}
                            onChange={(e) => updateStatus(a.id, e.target.value)}
                          >
                            {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                          </Select>
                        )}

                        {(role === "ADMIN" || role === "RECEPTIONIST") && a.status !== "CANCELLED" && a.status !== "RESCHEDULED" && (
                          <Button variant="secondary" onClick={() => reschedule(a.id)}>
                            Reschedule
                          </Button>
                        )}

                        {(role === "ADMIN" || role === "RECEPTIONIST") && a.status !== "CANCELLED" && (
                          <Button variant="danger" onClick={() => openCancel(a.id)}>
                            Cancel
                          </Button>
                        )}

                        {/* Generate bill instead of taking direct payment */}
                        {(role === "ADMIN" || role === "CASHIER" || role === "RECEPTIONIST") &&
                          a.paymentStatus === "UNPAID" &&
                          a.status !== "CANCELLED" &&
                          a.status !== "RESCHEDULED" && (
                          <Button variant="success" onClick={() => createBill(a.id)}>
                            Generate Bill
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}

                {!loading && filtered.length === 0 && (
                  <tr>
                    <td colSpan="8" className="p-6 text-center text-gray-500">
                      No appointments found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Book Appointment Modal */}
        <Modal
          open={bookOpen}
          title="Book Appointment"
          onClose={() => setBookOpen(false)}
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
              <Select
                value={bookForm.patientId}
                onChange={(e) => setBookForm({ ...bookForm, patientId: e.target.value })}
              >
                <option value="">Select patient</option>
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>{p.name} (#{p.id})</option>
                ))}
              </Select>
            </div>

            <div>
              {/* FIX: Date must be selected first so schedule filter works */}
              <label className="text-xs text-gray-600">Appointment Date</label>
              <Input
                type="date"
                value={bookForm.appointmentDate}
                onChange={(e) =>
                  setBookForm({ ...bookForm, appointmentDate: e.target.value, scheduleId: "" })
                }
              />
            </div>

            <div>
              <label className="text-xs text-gray-600">
                Schedule
                {bookForm.appointmentDate
                  ? ` (available on ${new Date(bookForm.appointmentDate + "T00:00:00").toLocaleDateString("en-US", { weekday: "long" })})`
                  : " — pick a date first"}
              </label>
              <Select
                value={bookForm.scheduleId}
                onChange={(e) => setBookForm({ ...bookForm, scheduleId: e.target.value })}
                disabled={!bookForm.appointmentDate}
              >
                <option value="">
                  {bookForm.appointmentDate
                    ? availableSchedules.length === 0
                      ? "No schedules on this day"
                      : "Select schedule"
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

          <p className="text-xs text-gray-500 mt-4">
            Fee is calculated automatically: doctor channeling fee + Rs. 750 hospital charge.
          </p>
        </Modal>

        {/* Cancel Appointment Modal */}
        <Modal
          open={cancelOpen}
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
            <div>
              <label className="text-xs text-gray-600">Cancellation Reason</label>
              <Input
                placeholder="Enter reason..."
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="refund"
                checked={refundRequired}
                onChange={(e) => setRefundRequired(e.target.checked)}
              />
              <label htmlFor="refund" className="text-sm text-gray-700">
                Refund required (if already paid)
              </label>
            </div>
          </div>
        </Modal>
      </div>
    </DashboardLayout>
  );
}

export default Appointments;
