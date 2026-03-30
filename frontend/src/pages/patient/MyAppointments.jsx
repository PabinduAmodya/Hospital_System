import { useState, useEffect } from "react";
import API from "../../api/axios";
import PatientLayout from "../../layouts/PatientLayout";
import Card from "../../components/ui/Card";
import StatusBadge from "../../components/ui/StatusBadge";
import LoadingSpinner from "../../components/ui/LoadingSpinner";
import EmptyState from "../../components/ui/EmptyState";
import Button from "../../components/ui/Button";
import Modal from "../../components/ui/Modal";
import { useToast, Toast } from "../../components/ui/Toast";

function formatDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" });
}

function formatTime(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
}

const tabs = [
  { key: "upcoming", label: "Upcoming" },
  { key: "past", label: "Past" },
  { key: "cancelled", label: "Cancelled" },
];

function MyAppointments() {
  const { toasts, toast, remove } = useToast();

  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("upcoming");

  // Cancel modal
  const [cancelModal, setCancelModal] = useState(false);
  const [cancelTarget, setCancelTarget] = useState(null);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelling, setCancelling] = useState(false);

  // Detail modal
  const [detailModal, setDetailModal] = useState(false);
  const [detailAppt, setDetailAppt] = useState(null);

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      const res = await API.get("/patient-portal/appointments");
      setAppointments(res.data || []);
    } catch (err) {
      console.error("Failed to load appointments:", err);
      toast.error("Failed to load appointments");
    } finally {
      setLoading(false);
    }
  };

  const filtered = appointments.filter((appt) => {
    const status = (appt.status || "").toUpperCase();
    if (activeTab === "upcoming") {
      return status === "PENDING" || status === "CONFIRMED";
    }
    if (activeTab === "past") {
      return status === "COMPLETED";
    }
    if (activeTab === "cancelled") {
      return status === "CANCELLED";
    }
    return true;
  });

  const openCancelModal = (appt) => {
    setCancelTarget(appt);
    setCancelReason("");
    setCancelModal(true);
  };

  const handleCancel = async () => {
    if (!cancelTarget) return;
    setCancelling(true);
    try {
      await API.put(`/patient-portal/appointments/${cancelTarget.id}/cancel`, { reason: cancelReason || "Cancelled by patient" });
      toast.success("Appointment cancelled successfully");
      setCancelModal(false);
      setCancelTarget(null);
      fetchAppointments();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to cancel appointment");
    } finally {
      setCancelling(false);
    }
  };

  const openDetail = (appt) => {
    setDetailAppt(appt);
    setDetailModal(true);
  };

  return (
    <PatientLayout>
      <Toast toasts={toasts} remove={remove} />

      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">My Appointments</h1>
        <p className="text-sm text-gray-500 mt-1">View and manage all your appointments</p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1 mb-6 w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.key
                ? "bg-white text-blue-600 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab.label}
            <span className="ml-1.5 text-xs bg-gray-200/80 text-gray-600 px-1.5 py-0.5 rounded-full">
              {appointments.filter((a) => {
                const s = (a.status || "").toUpperCase();
                if (tab.key === "upcoming") return s === "PENDING" || s === "CONFIRMED";
                if (tab.key === "past") return s === "COMPLETED";
                if (tab.key === "cancelled") return s === "CANCELLED";
                return false;
              }).length}
            </span>
          </button>
        ))}
      </div>

      {/* Appointments List */}
      {loading ? (
        <LoadingSpinner message="Loading appointments..." />
      ) : filtered.length === 0 ? (
        <Card>
          <EmptyState
            title={`No ${activeTab} appointments`}
            message={
              activeTab === "upcoming"
                ? "You don't have any upcoming appointments scheduled."
                : activeTab === "past"
                ? "No completed appointments found."
                : "No cancelled appointments."
            }
            icon={
              <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            }
          />
        </Card>
      ) : (
        <div className="space-y-4">
          {filtered.map((appt) => {
            const canCancel =
              activeTab === "upcoming" &&
              (appt.status === "PENDING" || appt.status === "CONFIRMED");

            return (
              <div
                key={appt.id}
                className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 hover:shadow-md transition-all"
              >
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  {/* Doctor Icon */}
                  <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-base font-semibold text-gray-900">
                        Dr. {appt.doctorName || appt.doctor?.name || "N/A"}
                      </p>
                      <span className="text-xs text-gray-400">|</span>
                      <span className="text-sm text-gray-500">
                        {appt.doctorSpecialization || appt.doctor?.specialization || "General"}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-2 flex-wrap">
                      <span className="flex items-center gap-1 text-sm text-gray-600">
                        <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        {formatDate(appt.appointmentDate || appt.date)}
                      </span>
                      {(appt.appointmentTime || appt.startTime) && (
                        <span className="flex items-center gap-1 text-sm text-gray-600">
                          <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {formatTime(appt.appointmentTime || appt.startTime)}
                        </span>
                      )}
                      {appt.tokenNumber && (
                        <span className="text-xs bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded-full font-medium">
                          Token #{appt.tokenNumber}
                        </span>
                      )}
                      {appt.appointmentFee != null && (
                        <span className="text-sm font-medium text-gray-700">
                          Rs. {Number(appt.appointmentFee).toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Status & Actions */}
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <div className="flex flex-col items-end gap-2">
                      <StatusBadge status={appt.status || "PENDING"} />
                      {appt.paymentStatus && (
                        <StatusBadge status={appt.paymentStatus} size="xs" />
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="secondary"
                        className="text-xs px-3 py-1.5"
                        onClick={() => openDetail(appt)}
                      >
                        Details
                      </Button>
                      {canCancel && (
                        <Button
                          variant="danger"
                          className="text-xs px-3 py-1.5"
                          onClick={() => openCancelModal(appt)}
                        >
                          Cancel
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Cancel Confirmation Modal */}
      <Modal
        open={cancelModal}
        onClose={() => setCancelModal(false)}
        title="Cancel Appointment"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setCancelModal(false)}>
              Keep Appointment
            </Button>
            <Button variant="danger" onClick={handleCancel} disabled={cancelling}>
              {cancelling ? "Cancelling..." : "Confirm Cancellation"}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Are you sure you want to cancel your appointment with{" "}
            <span className="font-semibold text-gray-900">
              Dr. {cancelTarget?.doctorName || cancelTarget?.doctor?.name || "N/A"}
            </span>{" "}
            on{" "}
            <span className="font-semibold text-gray-900">
              {formatDate(cancelTarget?.appointmentDate || cancelTarget?.date)}
            </span>
            ?
          </p>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Reason for cancellation (optional)
            </label>
            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              rows={3}
              placeholder="Please provide a reason..."
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all resize-none"
            />
          </div>
        </div>
      </Modal>

      {/* Appointment Detail Modal */}
      <Modal
        open={detailModal}
        onClose={() => setDetailModal(false)}
        title="Appointment Details"
        size="md"
      >
        {detailAppt && (
          <div className="space-y-5">
            {/* Doctor Info */}
            <div className="flex items-center gap-4 p-4 bg-blue-50 rounded-xl">
              <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div>
                <p className="text-base font-semibold text-gray-900">
                  Dr. {detailAppt.doctorName || detailAppt.doctor?.name || "N/A"}
                </p>
                <p className="text-sm text-gray-500">
                  {detailAppt.doctorSpecialization || detailAppt.doctor?.specialization || "General"}
                </p>
              </div>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500 uppercase tracking-wider">Date</p>
                <p className="text-sm font-semibold text-gray-900 mt-1">
                  {formatDate(detailAppt.appointmentDate || detailAppt.date)}
                </p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500 uppercase tracking-wider">Time</p>
                <p className="text-sm font-semibold text-gray-900 mt-1">
                  {formatTime(detailAppt.appointmentTime || detailAppt.startTime) || "N/A"}
                </p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500 uppercase tracking-wider">Token Number</p>
                <p className="text-sm font-semibold text-gray-900 mt-1">
                  {detailAppt.tokenNumber || "Not assigned"}
                </p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500 uppercase tracking-wider">Fee</p>
                <p className="text-sm font-semibold text-gray-900 mt-1">
                  {detailAppt.appointmentFee != null
                    ? `Rs. ${Number(detailAppt.appointmentFee).toLocaleString()}`
                    : "N/A"}
                </p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500 uppercase tracking-wider">Status</p>
                <div className="mt-1">
                  <StatusBadge status={detailAppt.status || "PENDING"} size="sm" />
                </div>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500 uppercase tracking-wider">Payment</p>
                <div className="mt-1">
                  <StatusBadge status={detailAppt.paymentStatus || "UNPAID"} size="sm" />
                </div>
              </div>
            </div>

            {/* Notes / Reason */}
            {detailAppt.notes && (
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Notes</p>
                <p className="text-sm text-gray-700">{detailAppt.notes}</p>
              </div>
            )}
            {detailAppt.cancellationReason && (
              <div className="p-3 bg-red-50 rounded-lg border border-red-100">
                <p className="text-xs text-red-500 uppercase tracking-wider mb-1">Cancellation Reason</p>
                <p className="text-sm text-red-700">{detailAppt.cancellationReason}</p>
              </div>
            )}
          </div>
        )}
      </Modal>
    </PatientLayout>
  );
}

export default MyAppointments;
