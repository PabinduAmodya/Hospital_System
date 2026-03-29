import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../api/axios";
import DoctorLayout from "../../layouts/DoctorLayout";
import Card from "../../components/ui/Card";
import StatusBadge from "../../components/ui/StatusBadge";
import LoadingSpinner from "../../components/ui/LoadingSpinner";
import EmptyState from "../../components/ui/EmptyState";
import Button from "../../components/ui/Button";
import { useToast, Toast } from "../../components/ui/Toast";

function calculateAge(dob) {
  if (!dob) return "N/A";
  const birth = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

function formatTime(dateStr) {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
}

const statusBorderColors = {
  PENDING: "border-l-amber-400",
  CONFIRMED: "border-l-blue-400",
  COMPLETED: "border-l-emerald-400",
  CANCELLED: "border-l-red-400",
  IN_PROGRESS: "border-l-violet-400",
};

function DoctorQueue() {
  const navigate = useNavigate();
  const { toasts, toast, remove } = useToast();

  const [appointments, setAppointments] = useState([]);
  const [consultationMap, setConsultationMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [startingId, setStartingId] = useState(null);
  const intervalRef = useRef(null);

  const todayFormatted = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const fetchQueue = async () => {
    try {
      const res = await API.get("/doctors/me/appointments/today");
      const appts = res.data || [];
      setAppointments(appts);

      // Check consultation status for each appointment
      const map = {};
      await Promise.all(
        appts.map(async (appt) => {
          try {
            const cRes = await API.get(`/consultations/appointment/${appt.id}`);
            const consultation = Array.isArray(cRes.data) ? cRes.data[0] : cRes.data;
            if (consultation?.id) {
              map[appt.id] = consultation;
            }
          } catch {
            // No consultation exists for this appointment
          }
        })
      );
      setConsultationMap(map);
    } catch (err) {
      console.error("Failed to load queue:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
    intervalRef.current = setInterval(fetchQueue, 30000);
    return () => clearInterval(intervalRef.current);
  }, []);

  const handleStartConsultation = async (appointmentId) => {
    setStartingId(appointmentId);
    try {
      const res = await API.post(`/consultations/start/${appointmentId}`);
      toast.success("Consultation started successfully");
      navigate(`/doctor/consultation/${res.data.id}`);
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data || "";
      // If consultation already exists, try to navigate to it
      if (typeof msg === "string" && msg.includes("already exists")) {
        try {
          const cRes = await API.get(`/consultations/appointment/${appointmentId}`);
          const existing = Array.isArray(cRes.data) ? cRes.data[0] : cRes.data;
          if (existing?.id) {
            navigate(`/doctor/consultation/${existing.id}`);
            return;
          }
        } catch {}
      }
      toast.error(typeof msg === "string" ? msg : "Failed to start consultation");
    } finally {
      setStartingId(null);
    }
  };

  return (
    <DoctorLayout>
      <Toast toasts={toasts} remove={remove} />

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Today's Queue</h1>
          <p className="text-sm text-gray-500 mt-1">{todayFormatted}</p>
        </div>
        <span className="px-4 py-2 bg-blue-50 text-blue-700 text-sm font-semibold rounded-full border border-blue-200">
          {appointments.length} patient{appointments.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Queue List */}
      <Card>
        {loading ? (
          <LoadingSpinner message="Loading today's queue..." />
        ) : appointments.length === 0 ? (
          <EmptyState
            title="No patients today"
            message="You have no appointments scheduled for today. Enjoy your free time!"
            icon={
              <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            }
          />
        ) : (
          <div className="space-y-3">
            {appointments.map((appt, index) => {
              const patient = appt.patient || {};
              const age = calculateAge(patient.dob);
              const consultation = consultationMap[appt.id];
              const isCompleted = consultation?.status === "COMPLETED" || appt.status === "COMPLETED";
              const isInProgress = consultation?.status === "IN_PROGRESS";
              const borderColor = isCompleted
                ? statusBorderColors.COMPLETED
                : isInProgress
                ? statusBorderColors.IN_PROGRESS
                : statusBorderColors[appt.status] || "border-l-gray-300";

              return (
                <div
                  key={appt.id}
                  className={`flex items-center gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100 border-l-4 ${borderColor} hover:border-gray-200 hover:shadow-sm transition-all`}
                >
                  {/* Token Number */}
                  <div className="flex-shrink-0 w-12 h-12 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-lg font-bold border-2 border-blue-200">
                    {appt.tokenNumber || index + 1}
                  </div>

                  {/* Patient Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900">
                      {patient.name || "Unknown Patient"}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {age} yrs &middot; {patient.gender || "N/A"}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {formatTime(appt.appointmentTime || appt.startTime)}
                      {appt.endTime && ` - ${formatTime(appt.endTime)}`}
                    </p>
                  </div>

                  {/* Status Badges */}
                  <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                    <StatusBadge status={appt.status || "PENDING"} size="xs" />
                    {appt.paymentStatus && (
                      <StatusBadge status={appt.paymentStatus} size="xs" />
                    )}
                  </div>

                  {/* Action Button */}
                  <div className="flex-shrink-0">
                    {isCompleted ? (
                      <Button
                        variant="secondary"
                        className="text-xs px-4 py-2"
                        onClick={() => navigate(`/doctor/consultation/${consultation.id}`)}
                      >
                        View
                      </Button>
                    ) : isInProgress ? (
                      <Button
                        variant="primary"
                        className="text-xs px-4 py-2"
                        onClick={() => navigate(`/doctor/consultation/${consultation.id}`)}
                      >
                        Resume
                      </Button>
                    ) : (
                      <Button
                        variant="success"
                        className="text-xs px-4 py-2"
                        disabled={startingId === appt.id || appt.status === "CANCELLED"}
                        onClick={() => handleStartConsultation(appt.id)}
                      >
                        {startingId === appt.id ? "Starting..." : "Start Consultation"}
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </DoctorLayout>
  );
}

export default DoctorQueue;
