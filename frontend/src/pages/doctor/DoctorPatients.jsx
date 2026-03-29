import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../api/axios";
import DoctorLayout from "../../layouts/DoctorLayout";
import Card from "../../components/ui/Card";
import StatusBadge from "../../components/ui/StatusBadge";
import LoadingSpinner from "../../components/ui/LoadingSpinner";
import EmptyState from "../../components/ui/EmptyState";
import SearchBar from "../../components/ui/SearchBar";
import Pagination from "../../components/ui/Pagination";
import Modal from "../../components/ui/Modal";

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

function formatDate(dateStr) {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function getInitials(firstName, lastName) {
  return `${(firstName || "")[0] || ""}${(lastName || "")[0] || ""}`.toUpperCase() || "?";
}

const avatarColors = [
  "bg-blue-100 text-blue-700",
  "bg-emerald-100 text-emerald-700",
  "bg-violet-100 text-violet-700",
  "bg-amber-100 text-amber-700",
  "bg-rose-100 text-rose-700",
  "bg-cyan-100 text-cyan-700",
  "bg-indigo-100 text-indigo-700",
  "bg-teal-100 text-teal-700",
];

function getAvatarColor(id) {
  return avatarColors[(id || 0) % avatarColors.length];
}

const ITEMS_PER_PAGE = 12;

function DoctorPatients() {
  const navigate = useNavigate();
  const doctorId = localStorage.getItem("doctorId");

  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  // History modal state
  const [historyModal, setHistoryModal] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [patientHistory, setPatientHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    try {
      const res = await API.get("/doctors/me/patients");
      setPatients(res.data || []);
    } catch (err) {
      console.error("Failed to load patients:", err);
    } finally {
      setLoading(false);
    }
  };

  const openHistory = async (patient) => {
    setSelectedPatient(patient);
    setHistoryModal(true);
    setLoadingHistory(true);
    try {
      const res = await API.get(`/consultations/patient/${patient.id}`);
      // Filter to only this doctor's consultations
      const doctorConsultations = (res.data || []).filter(
        (c) => c.doctorId === Number(doctorId) || c.doctor?.id === Number(doctorId)
      );
      setPatientHistory(doctorConsultations);
    } catch (err) {
      console.error("Failed to load patient history:", err);
      setPatientHistory([]);
    } finally {
      setLoadingHistory(false);
    }
  };

  const closeHistory = () => {
    setHistoryModal(false);
    setSelectedPatient(null);
    setPatientHistory([]);
  };

  // Filter patients
  const filtered = patients.filter((p) => {
    if (!search) return true;
    const q = search.toLowerCase();
    const name = `${p.firstName || ""} ${p.lastName || ""}`.toLowerCase();
    const phone = (p.phone || "").toLowerCase();
    const email = (p.email || "").toLowerCase();
    return name.includes(q) || phone.includes(q) || email.includes(q);
  });

  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  return (
    <DoctorLayout>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Patients</h1>
          <p className="text-sm text-gray-500 mt-1">Patients you have consulted</p>
        </div>
        <span className="px-4 py-2 bg-blue-50 text-blue-700 text-sm font-semibold rounded-full border border-blue-200">
          {filtered.length} patient{filtered.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Search */}
      <Card className="mb-6">
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Search by name, phone, or email..."
        />
      </Card>

      {/* Patient List */}
      {loading ? (
        <LoadingSpinner message="Loading patients..." />
      ) : filtered.length === 0 ? (
        <Card>
          <EmptyState
            title="No patients found"
            message={search ? "Try a different search term." : "Patients will appear here once you start consultations."}
            icon={
              <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            }
          />
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mb-6">
            {paginated.map((patient) => {
              const age = calculateAge(patient.dob);
              const initials = getInitials(patient.firstName, patient.lastName);
              const colorClass = getAvatarColor(patient.id);

              return (
                <div
                  key={patient.id}
                  className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 hover:border-gray-300 hover:shadow-md transition-all"
                >
                  <div className="flex items-start gap-4">
                    {/* Avatar */}
                    <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold ${colorClass}`}>
                      {initials}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">
                        {patient.firstName} {patient.lastName}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {age} yrs &middot; {patient.gender || "N/A"}
                      </p>
                      {patient.phone && (
                        <p className="text-xs text-gray-400 mt-1 truncate">
                          <svg className="w-3 h-3 inline mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                          </svg>
                          {patient.phone}
                        </p>
                      )}
                      {patient.email && (
                        <p className="text-xs text-gray-400 mt-0.5 truncate">
                          <svg className="w-3 h-3 inline mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                          {patient.email}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Action */}
                  <div className="mt-4 pt-3 border-t border-gray-100">
                    <button
                      onClick={() => openHistory(patient)}
                      className="w-full text-center text-xs font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 py-2 rounded-lg transition-colors"
                    >
                      View History
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filtered.length}
            itemsPerPage={ITEMS_PER_PAGE}
            onPageChange={setCurrentPage}
          />
        </>
      )}

      {/* Patient History Modal */}
      <Modal
        open={historyModal}
        onClose={closeHistory}
        title={selectedPatient ? `Consultation History - ${selectedPatient.firstName} ${selectedPatient.lastName}` : "Patient History"}
        size="lg"
      >
        {loadingHistory ? (
          <LoadingSpinner message="Loading consultation history..." size="sm" />
        ) : patientHistory.length === 0 ? (
          <EmptyState
            title="No consultations found"
            message="No consultation records found for this patient with you."
            icon={
              <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            }
          />
        ) : (
          <div className="space-y-3">
            {patientHistory.map((c) => (
              <div
                key={c.id}
                onClick={() => {
                  closeHistory();
                  navigate(`/doctor/consultation/${c.id}`);
                }}
                className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100 hover:border-gray-200 hover:shadow-sm cursor-pointer transition-all"
              >
                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center text-xs font-bold">
                  {c.consultationNumber || `#${c.id}`}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">
                    {formatDate(c.consultationDate || c.createdAt)}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5 truncate">
                    {c.diagnosis || "No diagnosis recorded"}
                  </p>
                </div>
                <StatusBadge status={c.status || "PENDING"} size="xs" />
                <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            ))}
          </div>
        )}
      </Modal>
    </DoctorLayout>
  );
}

export default DoctorPatients;
