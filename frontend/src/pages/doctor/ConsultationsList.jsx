import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../api/axios";
import DoctorLayout from "../../layouts/DoctorLayout";
import Card from "../../components/ui/Card";
import StatusBadge from "../../components/ui/StatusBadge";
import LoadingSpinner from "../../components/ui/LoadingSpinner";
import EmptyState from "../../components/ui/EmptyState";
import SearchBar from "../../components/ui/SearchBar";
import Select from "../../components/ui/Select";
import Pagination from "../../components/ui/Pagination";

function formatDate(dateStr) {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function truncate(str, max = 40) {
  if (!str) return "-";
  return str.length > max ? str.substring(0, max) + "..." : str;
}

const ITEMS_PER_PAGE = 15;

function ConsultationsList() {
  const navigate = useNavigate();
  const doctorId = localStorage.getItem("doctorId");

  const [consultations, setConsultations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    fetchConsultations();
  }, []);

  const fetchConsultations = async () => {
    try {
      const res = await API.get(`/consultations/doctor/${doctorId}`);
      setConsultations(res.data || []);
    } catch (err) {
      console.error("Failed to load consultations:", err);
    } finally {
      setLoading(false);
    }
  };

  // Filter consultations
  const filtered = consultations.filter((c) => {
    // Search filter
    if (search) {
      const q = search.toLowerCase();
      const patientName = (c.patientName || `${c.patient?.firstName || ""} ${c.patient?.lastName || ""}`).toLowerCase();
      const consultNum = (c.consultationNumber || `#${c.id}`).toString().toLowerCase();
      if (!patientName.includes(q) && !consultNum.includes(q)) return false;
    }
    // Status filter
    if (statusFilter !== "ALL" && c.status !== statusFilter) return false;
    // Date range filter
    if (dateFrom) {
      const cDate = new Date(c.consultationDate || c.createdAt);
      if (cDate < new Date(dateFrom)) return false;
    }
    if (dateTo) {
      const cDate = new Date(c.consultationDate || c.createdAt);
      const toDate = new Date(dateTo);
      toDate.setHours(23, 59, 59, 999);
      if (cDate > toDate) return false;
    }
    return true;
  });

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter, dateFrom, dateTo]);

  // Pagination
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
          <h1 className="text-2xl font-bold text-gray-900">My Consultations</h1>
          <p className="text-sm text-gray-500 mt-1">All your consultation records</p>
        </div>
        <span className="px-4 py-2 bg-blue-50 text-blue-700 text-sm font-semibold rounded-full border border-blue-200">
          {filtered.length} consultation{filtered.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Filter Bar */}
      <Card className="mb-6">
        <div className="flex flex-wrap items-center gap-3">
          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder="Search patient name, consultation #..."
            className="flex-1 min-w-[200px]"
          />
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-44"
          >
            <option value="ALL">All Statuses</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="COMPLETED">Completed</option>
          </Select>
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500 bg-white"
              placeholder="From"
            />
            <span className="text-gray-400 text-xs">to</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500 bg-white"
              placeholder="To"
            />
          </div>
          {(search || statusFilter !== "ALL" || dateFrom || dateTo) && (
            <button
              onClick={() => { setSearch(""); setStatusFilter("ALL"); setDateFrom(""); setDateTo(""); }}
              className="text-xs text-gray-500 hover:text-gray-700 underline"
            >
              Clear filters
            </button>
          )}
        </div>
      </Card>

      {/* Consultations Table */}
      <Card noPadding>
        {loading ? (
          <div className="p-5">
            <LoadingSpinner message="Loading consultations..." />
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-5">
            <EmptyState
              title="No consultations found"
              message={search || statusFilter !== "ALL" ? "Try adjusting your filters." : "Your consultations will appear here once you start seeing patients."}
              icon={
                <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              }
            />
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/50">
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Consultation #</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Patient Name</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Diagnosis</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {paginated.map((c) => {
                    const patientName = c.patientName || `${c.patient?.firstName || ""} ${c.patient?.lastName || ""}`.trim() || "Patient";
                    return (
                      <tr
                        key={c.id}
                        onClick={() => navigate(`/doctor/consultation/${c.id}`)}
                        className="hover:bg-gray-50 cursor-pointer transition-colors"
                      >
                        <td className="px-5 py-3.5">
                          <span className="font-medium text-gray-900">{c.consultationNumber || `#${c.id}`}</span>
                        </td>
                        <td className="px-5 py-3.5 text-gray-700">{patientName}</td>
                        <td className="px-5 py-3.5 text-gray-500">{formatDate(c.consultationDate || c.createdAt)}</td>
                        <td className="px-5 py-3.5 text-gray-500">{truncate(c.diagnosis)}</td>
                        <td className="px-5 py-3.5">
                          <StatusBadge status={c.status || "PENDING"} size="xs" />
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/doctor/consultation/${c.id}`);
                            }}
                            className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="px-5 border-t border-gray-100">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={filtered.length}
                itemsPerPage={ITEMS_PER_PAGE}
                onPageChange={setCurrentPage}
              />
            </div>
          </>
        )}
      </Card>
    </DoctorLayout>
  );
}

export default ConsultationsList;
