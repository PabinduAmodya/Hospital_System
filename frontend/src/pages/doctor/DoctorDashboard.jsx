import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../api/axios";
import DoctorLayout from "../../layouts/DoctorLayout";
import StatCard from "../../components/ui/StatCard";
import Card from "../../components/ui/Card";
import StatusBadge from "../../components/ui/StatusBadge";
import LoadingSpinner from "../../components/ui/LoadingSpinner";
import EmptyState from "../../components/ui/EmptyState";
import Button from "../../components/ui/Button";
import { useToast, Toast } from "../../components/ui/Toast";

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

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

function formatDate(dateStr) {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

const statIcons = {
  patients: (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  completed: (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  inProgress: (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  total: (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
    </svg>
  ),
};

function DoctorDashboard() {
  const navigate = useNavigate();
  const { toasts, toast, remove } = useToast();

  const doctorId = localStorage.getItem("doctorId");
  const doctorName = localStorage.getItem("name") || "Doctor";
  const specialization = localStorage.getItem("specialization") || "General";

  const [stats, setStats] = useState({ totalConsultations: 0, completedToday: 0, inProgress: 0, totalPatientsSeen: 0 });
  const [queue, setQueue] = useState([]);
  const [recentConsultations, setRecentConsultations] = useState([]);
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingQueue, setLoadingQueue] = useState(true);
  const [loadingRecent, setLoadingRecent] = useState(true);
  const [startingConsultation, setStartingConsultation] = useState(null);

  const todayFormatted = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  useEffect(() => {
    fetchStats();
    fetchQueue();
    fetchRecent();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await API.get(`/consultations/doctor/${doctorId}/stats`);
      setStats(res.data);
    } catch (err) {
      console.error("Failed to load stats:", err);
    } finally {
      setLoadingStats(false);
    }
  };

  const fetchQueue = async () => {
    try {
      const res = await API.get("/doctors/me/appointments/today");
      setQueue(res.data || []);
    } catch (err) {
      console.error("Failed to load queue:", err);
    } finally {
      setLoadingQueue(false);
    }
  };

  const fetchRecent = async () => {
    try {
      const res = await API.get(`/consultations/doctor/${doctorId}/recent?limit=8`);
      setRecentConsultations(res.data || []);
    } catch (err) {
      console.error("Failed to load recent consultations:", err);
    } finally {
      setLoadingRecent(false);
    }
  };

  const handleStartConsultation = async (appointmentId) => {
    setStartingConsultation(appointmentId);
    try {
      const res = await API.post(`/consultations/start/${appointmentId}`);
      toast.success("Consultation started successfully");
      navigate(`/doctor/consultation/${res.data.id}`);
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data || "Failed to start consultation";
      toast.error(typeof msg === "string" ? msg : "Failed to start consultation");
    } finally {
      setStartingConsultation(null);
    }
  };

  const handleResumeConsultation = async (appointmentId) => {
    try {
      const res = await API.get(`/consultations/appointment/${appointmentId}`);
      if (res.data?.id) {
        navigate(`/doctor/consultation/${res.data.id}`);
      }
    } catch (err) {
      toast.error("Failed to find consultation for this appointment");
    }
  };

  return (
    <DoctorLayout>
      <Toast toasts={toasts} remove={remove} />

      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-teal-600 to-emerald-700 rounded-2xl p-6 mb-6 text-white shadow-lg shadow-emerald-600/15">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">
              {getGreeting()}, Dr. {doctorName}
            </h1>
            <p className="text-emerald-100 mt-1 text-sm">{todayFormatted}</p>
          </div>
          <div className="hidden sm:flex items-center gap-2">
            <span className="px-3 py-1.5 bg-white/15 backdrop-blur-sm rounded-full text-sm font-medium border border-white/20">
              {specialization}
            </span>
          </div>
        </div>
      </div>

      {/* Stats Row */}
      {loadingStats ? (
        <div className="mb-6">
          <LoadingSpinner message="Loading stats..." size="sm" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard
            icon={statIcons.patients}
            label="Patients Today"
            value={stats.totalConsultations}
            color="blue"
          />
          <StatCard
            icon={statIcons.completed}
            label="Completed Today"
            value={stats.completedToday}
            color="emerald"
          />
          <StatCard
            icon={statIcons.inProgress}
            label="In Progress"
            value={stats.inProgress}
            color="amber"
          />
          <StatCard
            icon={statIcons.total}
            label="Total Patients"
            value={stats.totalPatientsSeen}
            color="violet"
          />
        </div>
      )}

      {/* Main Content: Queue + Recent */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-6">
        {/* Left: Today's Queue (3/5 = 60%) */}
        <div className="lg:col-span-3">
          <Card
            title="Today's Queue"
            subtitle="Patients scheduled for today"
            right={
              <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full">
                {queue.length} patient{queue.length !== 1 ? "s" : ""}
              </span>
            }
          >
            {loadingQueue ? (
              <LoadingSpinner message="Loading queue..." size="sm" />
            ) : queue.length === 0 ? (
              <EmptyState
                title="No appointments today"
                message="You have no patients scheduled for today. Enjoy your free time!"
                icon={
                  <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                }
              />
            ) : (
              <div className="space-y-3">
                {queue.map((appt, index) => {
                  const patient = appt.patient || {};
                  const age = calculateAge(patient.dob);
                  const consultationStatus = appt.consultationStatus;
                  const isCompleted = consultationStatus === "COMPLETED" || appt.status === "COMPLETED";
                  const isInProgress = consultationStatus === "IN_PROGRESS";

                  return (
                    <div
                      key={appt.id}
                      className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100 hover:border-gray-200 transition-all"
                    >
                      {/* Token Number */}
                      <div className="flex-shrink-0 w-11 h-11 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-sm font-bold border-2 border-blue-200">
                        {appt.tokenNumber || index + 1}
                      </div>

                      {/* Patient Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">
                          {patient.firstName} {patient.lastName}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {patient.gender || "N/A"} &middot; {age} yrs &middot; {formatTime(appt.appointmentTime || appt.startTime)}
                        </p>
                      </div>

                      {/* Status & Action */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {isCompleted ? (
                          <StatusBadge status="COMPLETED" size="xs" />
                        ) : isInProgress ? (
                          <Button
                            variant="primary"
                            className="text-xs px-3 py-1.5"
                            onClick={() => handleResumeConsultation(appt.id)}
                          >
                            Resume
                          </Button>
                        ) : (
                          <>
                            <StatusBadge status={appt.status || "PENDING"} size="xs" />
                            <Button
                              variant="success"
                              className="text-xs px-3 py-1.5"
                              disabled={startingConsultation === appt.id}
                              onClick={() => handleStartConsultation(appt.id)}
                            >
                              {startingConsultation === appt.id ? "Starting..." : "Start"}
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>

        {/* Right: Recent Consultations (2/5 = 40%) */}
        <div className="lg:col-span-2">
          <Card
            title="Recent Consultations"
            subtitle="Your latest consultations"
            right={
              <button
                onClick={() => navigate("/doctor/consultations")}
                className="text-xs text-blue-600 hover:text-blue-700 font-medium"
              >
                View all
              </button>
            }
          >
            {loadingRecent ? (
              <LoadingSpinner message="Loading..." size="sm" />
            ) : recentConsultations.length === 0 ? (
              <EmptyState
                title="No consultations yet"
                message="Your recent consultations will appear here."
                icon={
                  <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                }
              />
            ) : (
              <div className="space-y-2">
                {recentConsultations.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => navigate(`/doctor/consultation/${c.id}`)}
                    className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors text-left"
                  >
                    <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center text-[10px] font-bold">
                      {c.consultationNumber || `#${c.id}`}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {c.patientName || `${c.patient?.firstName || ""} ${c.patient?.lastName || ""}`.trim() || "Patient"}
                      </p>
                      <p className="text-[11px] text-gray-400">{formatDate(c.consultationDate || c.createdAt)}</p>
                    </div>
                    <StatusBadge status={c.status || "PENDING"} size="xs" />
                  </button>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Quick Actions */}
      <Card title="Quick Actions" subtitle="Frequently used actions">
        <div className="flex flex-wrap gap-3">
          <Button
            variant="success"
            className="flex items-center gap-2"
            onClick={() => navigate("/doctor/consultations/walk-in")}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Start Walk-in Consultation
          </Button>
          <Button
            variant="secondary"
            className="flex items-center gap-2"
            onClick={() => navigate("/doctor/consultations")}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            View All Consultations
          </Button>
          <Button
            variant="secondary"
            className="flex items-center gap-2"
            onClick={() => navigate("/doctor/schedule")}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            View My Schedule
          </Button>
        </div>
      </Card>
    </DoctorLayout>
  );
}

export default DoctorDashboard;
