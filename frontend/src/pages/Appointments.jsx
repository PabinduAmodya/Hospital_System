import { useEffect, useMemo, useState } from "react";
import API from "../api/axios";
import DashboardLayout from "../layouts/DashboardLayout";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Select from "../components/ui/Select";
import Modal from "../components/ui/Modal";

const STATUSES = ["PENDING","CONFIRMED","COMPLETED","PAID","CANCELLED","REFUNDED","RESCHEDULED"];

function statusPill(status) {
  const base = "px-2 py-1 rounded-full text-xs font-semibold";
  const map = {
    PENDING: "bg-amber-100 text-amber-700",
    CONFIRMED: "bg-blue-100 text-blue-700",
    COMPLETED: "bg-emerald-100 text-emerald-700",
    PAID: "bg-purple-100 text-purple-700",
    CANCELLED: "bg-red-100 text-red-700",
    REFUNDED: "bg-slate-100 text-slate-700",
    RESCHEDULED: "bg-gray-100 text-gray-700",
  };
  return <span className={`${base} ${map[status] || "bg-gray-100 text-gray-700"}`}>{status}</span>;
}

function Appointments() {
  const role = localStorage.getItem("role");
  const [appointments, setAppointments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [schedules, setSchedules] = useState([]);

  const [loading, setLoading] = useState(false);
  const [q, setQ] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  const [bookOpen, setBookOpen] = useState(false);
  const [bookForm, setBookForm] = useState({ patientId: "", scheduleId: "", appointmentDate: "" });

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
      console.error(e);
      alert("Failed to load patients/schedules.");
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return appointments
      .filter((a) => (filterStatus ? a.status === filterStatus : true))
      .filter((a) => {
        if (!s) return true;
        const doctor = a.schedule?.doctor?.name || "";
        const patient = a.patient?.name || "";
        return [String(a.id), doctor, patient, a.status, a.appointmentDate].some((v) =>
          (v || "").toString().toLowerCase().includes(s)
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
      alert("Fill patient, schedule, and date");
      return;
    }
    try {
      await API.post("/appointments/book", {
        patientId: Number(bookForm.patientId),
        scheduleId: Number(bookForm.scheduleId),
        appointmentDate: bookForm.appointmentDate,
      });
      setBookOpen(false);
      load();
    } catch (e) {
      console.error(e);
      alert(e?.response?.data || "Booking failed");
    }
  };

  const updateStatus = async (id, status) => {
    try {
      await API.put(`/appointments/${id}/status`, { status, notes: "" });
      load();
    } catch (e) {
      console.error(e);
      alert(e?.response?.data || "Status update failed");
    }
  };

  const cancel = async (id) => {
    const reason = prompt("Cancellation reason?");
    if (reason === null) return;
    const refundRequired = confirm("Refund required?");
    try {
      await API.put(`/appointments/${id}/cancel`, {
        cancellationReason: reason,
        refundRequired,
      });
      load();
    } catch (e) {
      console.error(e);
      alert(e?.response?.data || "Cancel failed");
    }
  };

  const pay = async (id) => {
    const amountStr = prompt("Paid amount (number)?");
    if (amountStr === null) return;
    const amount = Number(amountStr);
    if (!Number.isFinite(amount) || amount <= 0) {
      alert("Invalid amount");
      return;
    }
    try {
      await API.post(`/appointments/${id}/payment`, { amount });
      load();
    } catch (e) {
      console.error(e);
      alert(e?.response?.data || "Payment failed");
    }
  };

  const reschedule = async (id) => {
    if (!confirm("Reschedule to next available date?")) return;
    try {
      await API.put(`/appointments/${id}/reschedule`);
      load();
    } catch (e) {
      console.error(e);
      alert(e?.response?.data || "Reschedule failed");
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold">Appointments</h2>
            <p className="text-gray-600 mt-1">Book, update status, cancel, and take payments.</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
            <div className="w-56">
              <Select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                <option value="">All statuses</option>
                {STATUSES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
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
                    <td className="p-3">{a.appointmentFee}</td>
                    <td className="p-3">{statusPill(a.status)}</td>
                    <td className="p-3">
                      <div className="flex flex-wrap gap-2">
                        {(role === "ADMIN" || role === "RECEPTIONIST") && (
                          <Select
                            className="w-44"
                            value={a.status}
                            onChange={(e) => updateStatus(a.id, e.target.value)}
                          >
                            {STATUSES.map((s) => (
                              <option key={s} value={s}>{s}</option>
                            ))}
                          </Select>
                        )}

                        {(role === "ADMIN" || role === "RECEPTIONIST") && (
                          <Button variant="secondary" onClick={() => reschedule(a.id)}>
                            Reschedule
                          </Button>
                        )}

                        {(role === "ADMIN" || role === "RECEPTIONIST") && (
                          <Button variant="danger" onClick={() => cancel(a.id)}>
                            Cancel
                          </Button>
                        )}

                        {(role === "ADMIN" || role === "CASHIER" || role === "RECEPTIONIST") && (
                          <Button variant="success" onClick={() => pay(a.id)}>
                            Take Payment
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}

                {!loading && filtered.length === 0 && (
                  <tr>
                    <td colSpan="7" className="p-6 text-center text-gray-500">
                      No appointments found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>

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
              <label className="text-xs text-gray-600">Schedule</label>
              <Select
                value={bookForm.scheduleId}
                onChange={(e) => setBookForm({ ...bookForm, scheduleId: e.target.value })}
              >
                <option value="">Select schedule</option>
                {schedules.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.doctor?.name} - {s.day} {s.startTime}-{s.endTime}
                  </option>
                ))}
              </Select>
            </div>

            <div>
              <label className="text-xs text-gray-600">Appointment Date</label>
              <Input
                type="date"
                value={bookForm.appointmentDate}
                onChange={(e) => setBookForm({ ...bookForm, appointmentDate: e.target.value })}
              />
            </div>
          </div>

          <p className="text-xs text-gray-500 mt-4">
            Booking uses: <span className="font-mono">POST /api/appointments/book</span> and fee is calculated by backend.
          </p>
        </Modal>
      </div>
    </DashboardLayout>
  );
}

export default Appointments;
