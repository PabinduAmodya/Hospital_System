import { useEffect, useMemo, useState } from "react";
import API from "../api/axios";
import DashboardLayout from "../layouts/DashboardLayout";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Select from "../components/ui/Select";
import Modal from "../components/ui/Modal";

const STATUSES = ["PENDING", "CONFIRMED", "COMPLETED", "CANCELLED", "RESCHEDULED"];

const DAYS_ORDER = ["MONDAY","TUESDAY","WEDNESDAY","THURSDAY","FRIDAY","SATURDAY","SUNDAY"];

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

// Given a schedule day like "MONDAY" and today's date, find the next N upcoming dates for that day
function getUpcomingDatesForDay(dayName, count = 8) {
  const dayIndex = DAYS_ORDER.indexOf(dayName.toUpperCase()); // 0=Mon ... 6=Sun
  if (dayIndex === -1) return [];

  // JS getDay(): 0=Sun,1=Mon...6=Sat — map to our 0=Mon index
  const jsDayIndex = (dayIndex + 1) % 7; // Mon=1, Tue=2...Sun=0

  // Build YYYY-MM-DD from LOCAL date parts to avoid UTC timezone shift
  const toLocalDateStr = (d) => {
    const y  = d.getFullYear();
    const m  = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${dd}`;
  };

  const results = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const cursor = new Date(today);
  cursor.setDate(cursor.getDate() + 1); // start from tomorrow

  while (results.length < count) {
    if (cursor.getDay() === jsDayIndex) {
      results.push(toLocalDateStr(cursor)); // ← local date, not UTC
    }
    cursor.setDate(cursor.getDate() + 1);
  }
  return results;
}

function Appointments() {
  const role = localStorage.getItem("role");

  const [appointments, setAppointments] = useState([]);
  const [patients, setPatients]         = useState([]);
  const [doctors, setDoctors]           = useState([]);
  const [loading, setLoading]           = useState(false);
  const [q, setQ]                       = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  // ── Book modal state (step-by-step) ──────────────────────────────────────
  const [bookOpen, setBookOpen]   = useState(false);
  // step: 1=patient, 2=doctor, 3=date+time
  const [bookStep, setBookStep]   = useState(1);

  const [selPatient, setSelPatient]   = useState(null);
  const [selDoctor, setSelDoctor]     = useState(null);
  const [doctorSchedules, setDoctorSchedules] = useState([]); // schedules for selected doctor
  const [selSchedule, setSelSchedule] = useState(null);        // schedule selected in step 3
  const [selDate, setSelDate]         = useState("");           // date selected in step 3
  const [bookLoading, setBookLoading] = useState(false);
  const [patientSearch, setPatientSearch] = useState("");
  const [doctorSearch, setDoctorSearch]   = useState("");

  // ── Cancel modal ──────────────────────────────────────────────────────────
  const [cancelOpen, setCancelOpen]     = useState(false);
  const [cancelId, setCancelId]         = useState(null);
  const [cancelReason, setCancelReason] = useState("");
  const [refundRequired, setRefundRequired] = useState(false);

  // ─────────────────────────────────────────────────────────────────────────

  const load = async () => {
    setLoading(true);
    try {
      const res = await API.get("/appointments");
      setAppointments(res.data);
    } catch (e) {
      alert("Failed to load appointments.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

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

  // ── Book flow ─────────────────────────────────────────────────────────────

  const openBook = async () => {
    setBookStep(1);
    setSelPatient(null);
    setSelDoctor(null);
    setDoctorSchedules([]);
    setSelSchedule(null);
    setSelDate("");
    setBookOpen(true);
    setPatientSearch("");
    setDoctorSearch("");
    try {
      const [pRes, dRes] = await Promise.all([API.get("/patients"), API.get("/doctors")]);
      setPatients(pRes.data);
      setDoctors(dRes.data);
    } catch (e) {
      alert("Failed to load patients/doctors.");
    }
  };

  // Step 2: after selecting a doctor, load their schedules
  const selectDoctor = async (doctor) => {
    setSelDoctor(doctor);
    setDoctorSchedules([]);
    setSelSchedule(null);
    setSelDate("");
    try {
      const res = await API.get(`/schedules/doctor/${doctor.id}`);
      setDoctorSchedules(res.data);
      setBookStep(3);
    } catch (e) {
      alert("Failed to load doctor schedules.");
    }
  };

  // Upcoming dates for the selected schedule's day
  const upcomingDates = useMemo(() => {
    if (!selSchedule) return [];
    return getUpcomingDatesForDay(selSchedule.day, 8);
  }, [selSchedule]);

  const book = async () => {
    if (!selPatient || !selSchedule || !selDate) {
      alert("Please complete all selections.");
      return;
    }
    setBookLoading(true);
    try {
      await API.post("/appointments/book", {
        patientId:       selPatient.id,
        scheduleId:      selSchedule.id,
        appointmentDate: selDate,
      });
      setBookOpen(false);
      load();
    } catch (e) {
      alert(e?.response?.data || "Booking failed.");
    } finally {
      setBookLoading(false);
    }
  };

  // ── Other actions ─────────────────────────────────────────────────────────

  const updateStatus = async (id, status) => {
    try {
      await API.put(`/appointments/${id}/status`, { status, notes: "" });
      load();
    } catch (e) {
      alert(e?.response?.data || "Status update failed.");
    }
  };

  const openCancel = (id) => {
    setCancelId(id); setCancelReason(""); setRefundRequired(false); setCancelOpen(true);
  };

  const doCancel = async () => {
    try {
      await API.put(`/appointments/${cancelId}/cancel`, { cancellationReason: cancelReason, refundRequired });
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

  const createBill = async (id) => {
    if (!confirm("Create a bill for this appointment?")) return;
    try {
      await API.post(`/bills/appointment/${id}`);
      alert("Bill created. Go to Billing to complete payment.");
      load();
    } catch (e) {
      alert(e?.response?.data || "Bill creation failed.");
    }
  };

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <DashboardLayout>
      <div className="space-y-6">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold">Appointments</h2>
            <p className="text-gray-600 mt-1">Book, manage, cancel, reschedule, and generate bills.</p>
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
                          <Select className="w-40" value={a.status} onChange={(e) => updateStatus(a.id, e.target.value)}>
                            {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                          </Select>
                        )}
                        {(role === "ADMIN" || role === "RECEPTIONIST") && a.status !== "CANCELLED" && a.status !== "RESCHEDULED" && (
                          <Button variant="secondary" onClick={() => reschedule(a.id)}>Reschedule</Button>
                        )}
                        {(role === "ADMIN" || role === "RECEPTIONIST") && a.status !== "CANCELLED" && (
                          <Button variant="danger" onClick={() => openCancel(a.id)}>Cancel</Button>
                        )}
                        {(role === "ADMIN" || role === "CASHIER" || role === "RECEPTIONIST") &&
                          a.paymentStatus === "UNPAID" && a.status !== "CANCELLED" && a.status !== "RESCHEDULED" && (
                          <Button variant="success" onClick={() => createBill(a.id)}>Generate Bill</Button>
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

        {/* ── Book Appointment Modal ─────────────────────────────────────────── */}
        <Modal
          open={bookOpen}
          title="Book Appointment"
          onClose={() => setBookOpen(false)}
          footer={
            <div className="flex items-center justify-between">
              {/* Back button for steps 2 & 3 */}
              <div>
                {bookStep > 1 && (
                  <Button variant="secondary" onClick={() => setBookStep(bookStep - 1)}>
                    ← Back
                  </Button>
                )}
              </div>
              <div className="flex gap-2">
                <Button variant="secondary" onClick={() => setBookOpen(false)}>Cancel</Button>
                {bookStep === 3 && (
                  <Button onClick={book} disabled={!selSchedule || !selDate || bookLoading}>
                    {bookLoading ? "Booking..." : "Confirm Booking"}
                  </Button>
                )}
              </div>
            </div>
          }
        >
          {/* Step indicator */}
          <div className="flex items-center gap-2 mb-6">
            {["Patient", "Doctor", "Date & Time"].map((label, i) => {
              const step = i + 1;
              const active = bookStep === step;
              const done   = bookStep > step;
              return (
                <div key={step} className="flex items-center gap-2">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold
                    ${done   ? "bg-emerald-500 text-white"
                    : active ? "bg-blue-600 text-white"
                             : "bg-gray-200 text-gray-500"}`}>
                    {done ? "✓" : step}
                  </div>
                  <span className={`text-sm ${active ? "font-semibold text-blue-600" : "text-gray-500"}`}>
                    {label}
                  </span>
                  {i < 2 && <div className="flex-1 h-px bg-gray-200 w-6" />}
                </div>
              );
            })}
          </div>

          {/* ── STEP 1: Select Patient ── */}
          {bookStep === 1 && (
            <div className="space-y-3">
              <p className="text-sm text-gray-600 font-medium">Select the patient for this appointment:</p>
              <input
                type="text"
                placeholder="Search by name, ID or phone..."
                value={patientSearch}
                onChange={(e) => setPatientSearch(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                autoFocus
              />
              <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
                {patients
                  .filter((p) => {
                    const s = patientSearch.trim().toLowerCase();
                    if (!s) return true;
                    return [p.name, String(p.id), p.phone || ""].some((v) => v.toLowerCase().includes(s));
                  })
                  .map((p) => (
                    <button
                      key={p.id}
                      onClick={() => { setSelPatient(p); setBookStep(2); setDoctorSearch(""); }}
                      className="w-full text-left px-4 py-3 rounded-lg border border-gray-200 hover:border-blue-400 hover:bg-blue-50 transition-colors"
                    >
                      <div className="font-medium text-gray-800">{p.name}</div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        ID #{p.id}{p.phone ? ` · ${p.phone}` : ""}
                      </div>
                    </button>
                  ))}
                {patients.filter((p) => {
                  const s = patientSearch.trim().toLowerCase();
                  if (!s) return true;
                  return [p.name, String(p.id), p.phone || ""].some((v) => v.toLowerCase().includes(s));
                }).length === 0 && (
                  <p className="text-gray-400 text-sm text-center py-6">No patients match "{patientSearch}"</p>
                )}
              </div>
            </div>
          )}

          {/* ── STEP 2: Select Doctor ── */}
          {bookStep === 2 && (
            <div className="space-y-3">
              <div className="bg-blue-50 border border-blue-100 rounded-lg px-4 py-2 text-sm text-blue-700">
                Patient: <strong>{selPatient?.name}</strong>
              </div>
              <p className="text-sm text-gray-600 font-medium">Select a doctor:</p>
              <input
                type="text"
                placeholder="Search by name or specialization..."
                value={doctorSearch}
                onChange={(e) => setDoctorSearch(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                autoFocus
              />
              <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
                {doctors
                  .filter((d) => {
                    const s = doctorSearch.trim().toLowerCase();
                    if (!s) return true;
                    return [d.name || "", d.specialization || ""].some((v) => v.toLowerCase().includes(s));
                  })
                  .map((d) => (
                    <button
                      key={d.id}
                      onClick={() => selectDoctor(d)}
                      className="w-full text-left px-4 py-3 rounded-lg border border-gray-200 hover:border-blue-400 hover:bg-blue-50 transition-colors"
                    >
                      <div className="font-medium text-gray-800">{d.name}</div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        {d.specialization}
                        {d.channelling_fee ? ` · Channelling fee: Rs. ${d.channelling_fee}` : ""}
                      </div>
                    </button>
                  ))}
                {doctors.filter((d) => {
                  const s = doctorSearch.trim().toLowerCase();
                  if (!s) return true;
                  return [d.name || "", d.specialization || ""].some((v) => v.toLowerCase().includes(s));
                }).length === 0 && (
                  <p className="text-gray-400 text-sm text-center py-6">No doctors match "{doctorSearch}"</p>
                )}
              </div>
            </div>
          )}

          {/* ── STEP 3: Select Schedule + Date ── */}
          {bookStep === 3 && (
            <div className="space-y-4">
              {/* Selection summary */}
              <div className="bg-blue-50 border border-blue-100 rounded-lg px-4 py-2 text-sm text-blue-700 space-y-0.5">
                <div>Patient: <strong>{selPatient?.name}</strong></div>
                <div>Doctor: <strong>{selDoctor?.name}</strong> ({selDoctor?.specialization})</div>
              </div>

              {doctorSchedules.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <p className="text-3xl mb-2">📅</p>
                  <p className="text-sm">This doctor has no schedules set up yet.</p>
                </div>
              ) : (
                <>
                  {/* Schedule picker */}
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">Available schedules:</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {doctorSchedules.map((sc) => {
                        const isSelected = selSchedule?.id === sc.id;
                        return (
                          <button
                            key={sc.id}
                            onClick={() => { setSelSchedule(sc); setSelDate(""); }}
                            className={`text-left px-4 py-3 rounded-lg border transition-colors ${
                              isSelected
                                ? "border-blue-500 bg-blue-50 text-blue-700"
                                : "border-gray-200 hover:border-blue-300 hover:bg-gray-50"
                            }`}
                          >
                            <div className="font-semibold text-sm capitalize">
                              {sc.day.charAt(0) + sc.day.slice(1).toLowerCase()}s
                            </div>
                            <div className="text-xs text-gray-500 mt-0.5">
                              {sc.startTime} – {sc.endTime}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Date picker — only shown after schedule selected */}
                  {selSchedule && (
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-2">
                        Pick a date <span className="text-gray-400 font-normal">(upcoming {selSchedule.day.charAt(0) + selSchedule.day.slice(1).toLowerCase()}s)</span>:
                      </p>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {upcomingDates.map((date) => {
                          const d = new Date(date + "T00:00:00");
                          const isSelected = selDate === date;
                          return (
                            <button
                              key={date}
                              onClick={() => setSelDate(date)}
                              className={`px-3 py-2 rounded-lg border text-sm transition-colors ${
                                isSelected
                                  ? "border-blue-500 bg-blue-600 text-white font-semibold"
                                  : "border-gray-200 hover:border-blue-300 hover:bg-gray-50"
                              }`}
                            >
                              <div className="font-medium">
                                {d.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                              </div>
                              <div className={`text-xs mt-0.5 ${isSelected ? "text-blue-100" : "text-gray-400"}`}>
                                {d.toLocaleDateString("en-US", { weekday: "short" })}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Booking summary */}
                  {selSchedule && selDate && (
                    <div className="bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-3 text-sm text-emerald-800">
                      <p className="font-semibold mb-1">Booking Summary</p>
                      <p>Patient: <strong>{selPatient?.name}</strong></p>
                      <p>Doctor: <strong>{selDoctor?.name}</strong></p>
                      <p>Date: <strong>{new Date(selDate + "T00:00:00").toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</strong></p>
                      <p>Time: <strong>{selSchedule.startTime} – {selSchedule.endTime}</strong></p>
                      <p className="mt-1 text-xs text-emerald-600">
                        Fee: Rs. {selDoctor?.channelling_fee} (doctor) + Rs. 750 (hospital) = <strong>Rs. {Number(selDoctor?.channelling_fee || 0) + 750}</strong>
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
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
              <Input placeholder="Enter reason..." value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} />
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="refund" checked={refundRequired} onChange={(e) => setRefundRequired(e.target.checked)} />
              <label htmlFor="refund" className="text-sm text-gray-700">Refund required (if already paid)</label>
            </div>
          </div>
        </Modal>

      </div>
    </DashboardLayout>
  );
}

export default Appointments;

//