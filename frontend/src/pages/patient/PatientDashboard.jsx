import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../api/axios";
import PatientLayout from "../../layouts/PatientLayout";
import StatCard from "../../components/ui/StatCard";
import Card from "../../components/ui/Card";
import StatusBadge from "../../components/ui/StatusBadge";
import LoadingSpinner from "../../components/ui/LoadingSpinner";
import EmptyState from "../../components/ui/EmptyState";
import Button from "../../components/ui/Button";
import { useToast, Toast } from "../../components/ui/Toast";

function formatDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" });
}

function formatDateShort(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

const statIcons = {
  appointments: (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),
  completed: (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  bills: (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  ),
  records: (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),
};

function PatientDashboard() {
  const navigate = useNavigate();
  const { toasts, toast, remove } = useToast();

  const [dashboard, setDashboard] = useState(null);
  const [upcomingAppointments, setUpcomingAppointments] = useState([]);
  const [recentRecords, setRecentRecords] = useState([]);
  const [loadingDash, setLoadingDash] = useState(true);
  const [loadingAppts, setLoadingAppts] = useState(true);
  const [loadingRecords, setLoadingRecords] = useState(true);
  const [cancellingId, setCancellingId] = useState(null);

  const todayFormatted = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  useEffect(() => {
    fetchDashboard();
    fetchUpcoming();
    fetchRecords();
  }, []);

  const fetchDashboard = async () => {
    try {
      const res = await API.get("/patient-portal/dashboard");
      setDashboard(res.data);
    } catch (err) {
      console.error("Failed to load dashboard:", err);
    } finally {
      setLoadingDash(false);
    }
  };

  const fetchUpcoming = async () => {
    try {
      const res = await API.get("/patient-portal/appointments/upcoming");
      setUpcomingAppointments((res.data || []).slice(0, 3));
    } catch (err) {
      console.error("Failed to load upcoming appointments:", err);
    } finally {
      setLoadingAppts(false);
    }
  };

  const fetchRecords = async () => {
    try {
      const res = await API.get("/patient-portal/records");
      setRecentRecords((res.data || []).slice(0, 3));
    } catch (err) {
      console.error("Failed to load records:", err);
    } finally {
      setLoadingRecords(false);
    }
  };

  const handleCancelAppointment = async (id) => {
    setCancellingId(id);
    try {
      await API.put(`/patient-portal/appointments/${id}/cancel`, { reason: "Cancelled by patient" });
      toast.success("Appointment cancelled successfully");
      fetchUpcoming();
      fetchDashboard();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to cancel appointment");
    } finally {
      setCancellingId(null);
    }
  };

  const patientName = dashboard?.patientName || localStorage.getItem("name") || "Patient";
  const patientId = dashboard?.patientId || "";

  return (
    <PatientLayout>
      <Toast toasts={toasts} remove={remove} />

      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-teal-600 rounded-2xl p-6 sm:p-8 mb-6 text-white shadow-lg shadow-blue-600/15">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">
              {getGreeting()}, {patientName}
            </h1>
            <p className="text-blue-100 mt-1.5 text-sm">{todayFormatted}</p>
            <p className="text-blue-200 text-xs mt-1">Your health journey, all in one place.</p>
          </div>
          {patientId && (
            <div className="flex items-center gap-2">
              <span className="px-4 py-2 bg-white/15 backdrop-blur-sm rounded-full text-sm font-medium border border-white/20">
                Patient ID: #{patientId}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Stats Row */}
      {loadingDash ? (
        <div className="mb-6">
          <LoadingSpinner message="Loading overview..." size="sm" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard
            icon={statIcons.appointments}
            label="Upcoming Appointments"
            value={dashboard?.upcomingAppointments ?? 0}
            color="blue"
          />
          <StatCard
            icon={statIcons.completed}
            label="Completed Visits"
            value={dashboard?.completedVisits ?? 0}
            color="emerald"
          />
          <StatCard
            icon={statIcons.bills}
            label="Unpaid Bills"
            value={dashboard?.unpaidBills ?? 0}
            subtitle={dashboard?.totalBilled ? `Total: Rs. ${Number(dashboard.totalBilled).toLocaleString()}` : undefined}
            color="amber"
          />
          <StatCard
            icon={statIcons.records}
            label="Medical Records"
            value={dashboard?.totalRecords ?? 0}
            color="violet"
          />
        </div>
      )}

      {/* Main Content: 2 columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* LEFT: Upcoming Appointments */}
        <Card
          title="Upcoming Appointments"
          subtitle="Your next scheduled visits"
          right={
            <button
              onClick={() => navigate("/patient/appointments")}
              className="text-xs text-blue-600 hover:text-blue-700 font-medium"
            >
              View All
            </button>
          }
        >
          {loadingAppts ? (
            <LoadingSpinner message="Loading appointments..." size="sm" />
          ) : upcomingAppointments.length === 0 ? (
            <EmptyState
              title="No upcoming appointments"
              message="You have no scheduled appointments. Book one to get started!"
              icon={
                <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              }
            />
          ) : (
            <div className="space-y-3">
              {upcomingAppointments.map((appt) => (
                <div
                  key={appt.id}
                  className="p-4 bg-gray-50 rounded-xl border border-gray-100 hover:border-blue-200 transition-all"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="flex-shrink-0 w-11 h-11 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">
                          Dr. {appt.doctorName || appt.doctor?.name || "N/A"}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {appt.doctorSpecialization || appt.doctor?.specialization || "General"}
                        </p>
                        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                          <span className="text-xs text-gray-600 font-medium">
                            {formatDate(appt.appointmentDate || appt.date)}
                          </span>
                          {appt.tokenNumber && (
                            <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                              Token #{appt.tokenNumber}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2 flex-shrink-0">
                      <StatusBadge status={appt.status || "PENDING"} size="xs" />
                      {(appt.status === "PENDING" || appt.status === "CONFIRMED") && (
                        <button
                          onClick={() => handleCancelAppointment(appt.id)}
                          disabled={cancellingId === appt.id}
                          className="text-xs text-red-500 hover:text-red-700 font-medium disabled:opacity-50"
                        >
                          {cancellingId === appt.id ? "Cancelling..." : "Cancel"}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* RIGHT: Recent Medical Records */}
        <Card
          title="Recent Medical Records"
          subtitle="Your latest consultations"
          right={
            <button
              onClick={() => navigate("/patient/records")}
              className="text-xs text-blue-600 hover:text-blue-700 font-medium"
            >
              View All
            </button>
          }
        >
          {loadingRecords ? (
            <LoadingSpinner message="Loading records..." size="sm" />
          ) : recentRecords.length === 0 ? (
            <EmptyState
              title="No medical records"
              message="Your consultation history will appear here after your visits."
              icon={
                <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              }
            />
          ) : (
            <div className="space-y-3">
              {recentRecords.map((record) => (
                <div
                  key={record.id}
                  className="p-4 bg-gray-50 rounded-xl border border-gray-100 hover:border-violet-200 transition-all"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium text-violet-600 bg-violet-50 px-2 py-0.5 rounded-full">
                          {formatDateShort(record.consultationDate || record.date)}
                        </span>
                        <StatusBadge status={record.status || "COMPLETED"} size="xs" />
                      </div>
                      <p className="text-sm font-semibold text-gray-900 truncate">
                        Dr. {record.doctorName || record.doctor?.name || "N/A"}
                      </p>
                      {record.diagnosis && (
                        <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                          {record.diagnosis.length > 80
                            ? record.diagnosis.substring(0, 80) + "..."
                            : record.diagnosis}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => navigate("/patient/records")}
                      className="flex-shrink-0 text-xs text-blue-600 hover:text-blue-700 font-medium"
                    >
                      View
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Quick Actions */}
      <Card title="Quick Actions" subtitle="Navigate to common tasks">
        <div className="flex flex-wrap gap-3">
          <Button
            variant="primary"
            className="flex items-center gap-2 px-5 py-2.5"
            onClick={() => navigate("/patient/appointments")}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            My Appointments
          </Button>
          <Button
            variant="secondary"
            className="flex items-center gap-2 px-5 py-2.5"
            onClick={() => navigate("/patient/records")}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Medical Records
          </Button>
          <Button
            variant="secondary"
            className="flex items-center gap-2 px-5 py-2.5"
            onClick={() => navigate("/patient/bills")}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            View Bills
          </Button>
        </div>
      </Card>
    </PatientLayout>
  );
}

export default PatientDashboard;
