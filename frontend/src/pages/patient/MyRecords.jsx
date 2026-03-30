import { useState, useEffect } from "react";
import API from "../../api/axios";
import PatientLayout from "../../layouts/PatientLayout";
import Card from "../../components/ui/Card";
import StatusBadge from "../../components/ui/StatusBadge";
import LoadingSpinner from "../../components/ui/LoadingSpinner";
import EmptyState from "../../components/ui/EmptyState";
import Button from "../../components/ui/Button";
import Modal from "../../components/ui/Modal";
import SearchBar from "../../components/ui/SearchBar";
import Pagination from "../../components/ui/Pagination";
import { useToast, Toast } from "../../components/ui/Toast";
import { printPrescription } from "../../utils/printPrescription";
import { printVisitSummary } from "../../utils/printVisitSummary";

function formatDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" });
}

function MyRecords() {
  const { toasts, toast, remove } = useToast();

  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const perPage = 8;

  // Detail modal
  const [detailModal, setDetailModal] = useState(false);
  const [detailRecord, setDetailRecord] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  useEffect(() => {
    fetchRecords();
  }, []);

  const fetchRecords = async () => {
    try {
      const res = await API.get("/patient-portal/records");
      setRecords(res.data || []);
    } catch (err) {
      console.error("Failed to load records:", err);
      toast.error("Failed to load medical records");
    } finally {
      setLoading(false);
    }
  };

  const openDetail = async (record) => {
    setDetailModal(true);
    setLoadingDetail(true);
    try {
      const res = await API.get(`/patient-portal/records/${record.id}`);
      setDetailRecord(res.data);
    } catch (err) {
      toast.error("Failed to load record details");
      setDetailModal(false);
    } finally {
      setLoadingDetail(false);
    }
  };

  const handlePrintPrescription = () => {
    if (!detailRecord) return;
    printPrescription(detailRecord, {
      name: detailRecord.hospitalName || "Hospital",
      address: detailRecord.hospitalAddress || "",
      phone: detailRecord.hospitalPhone || "",
      email: detailRecord.hospitalEmail || "",
    });
  };

  const handlePrintSummary = () => {
    if (!detailRecord) return;
    printVisitSummary(detailRecord, {
      name: detailRecord.hospitalName || "Hospital",
      address: detailRecord.hospitalAddress || "",
      phone: detailRecord.hospitalPhone || "",
      email: detailRecord.hospitalEmail || "",
    });
  };

  // Filter and paginate
  const filtered = records.filter((r) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      (r.consultationNumber || "").toLowerCase().includes(q) ||
      (r.doctorName || r.doctor?.name || "").toLowerCase().includes(q) ||
      (r.diagnosis || "").toLowerCase().includes(q)
    );
  });

  const totalPages = Math.ceil(filtered.length / perPage);
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  const vitals = detailRecord?.vitals || {};

  return (
    <PatientLayout>
      <Toast toasts={toasts} remove={remove} />

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Medical Records</h1>
          <p className="text-sm text-gray-500 mt-1">Your consultation history and medical details</p>
        </div>
        <SearchBar
          value={search}
          onChange={(v) => { setSearch(v); setPage(1); }}
          placeholder="Search by doctor, diagnosis..."
          className="w-full sm:w-72"
        />
      </div>

      {/* Records List */}
      {loading ? (
        <LoadingSpinner message="Loading medical records..." />
      ) : filtered.length === 0 ? (
        <Card>
          <EmptyState
            title="No medical records found"
            message={search ? "No records match your search." : "Your consultation history will appear here after your visits."}
            icon={
              <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            }
          />
        </Card>
      ) : (
        <>
          <div className="space-y-4">
            {paginated.map((record) => (
              <div
                key={record.id}
                className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 hover:shadow-md transition-all"
              >
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  {/* Icon */}
                  <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      {record.consultationNumber && (
                        <span className="text-xs font-mono font-medium text-violet-600 bg-violet-50 px-2 py-0.5 rounded-full">
                          {record.consultationNumber}
                        </span>
                      )}
                      <span className="text-xs text-gray-400">
                        {formatDate(record.consultationDate || record.date)}
                      </span>
                    </div>
                    <p className="text-base font-semibold text-gray-900 mt-1">
                      Dr. {record.doctorName || record.doctor?.name || "N/A"}
                    </p>
                    <p className="text-sm text-gray-500">
                      {record.doctorSpecialization || record.doctor?.specialization || "General"}
                    </p>
                    {record.diagnosis && (
                      <p className="text-sm text-gray-600 mt-1.5 line-clamp-1">
                        <span className="font-medium text-gray-700">Diagnosis:</span>{" "}
                        {record.diagnosis.length > 100
                          ? record.diagnosis.substring(0, 100) + "..."
                          : record.diagnosis}
                      </p>
                    )}
                  </div>

                  {/* Status & Action */}
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <StatusBadge status={record.status || "COMPLETED"} />
                    <Button
                      variant="primary"
                      className="text-xs px-4 py-2"
                      onClick={() => openDetail(record)}
                    >
                      View Details
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          <div className="mt-6">
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              totalItems={filtered.length}
              itemsPerPage={perPage}
              onPageChange={setPage}
            />
          </div>
        </>
      )}

      {/* Record Detail Modal */}
      <Modal
        open={detailModal}
        onClose={() => { setDetailModal(false); setDetailRecord(null); }}
        title="Consultation Details"
        size="lg"
        footer={
          detailRecord && (
            <div className="flex justify-end gap-3">
              <Button variant="secondary" onClick={handlePrintPrescription}>
                <span className="flex items-center gap-1.5">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                  </svg>
                  Print Prescription
                </span>
              </Button>
              <Button variant="primary" onClick={handlePrintSummary}>
                <span className="flex items-center gap-1.5">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                  </svg>
                  Print Summary
                </span>
              </Button>
            </div>
          )
        }
      >
        {loadingDetail ? (
          <LoadingSpinner message="Loading details..." size="sm" />
        ) : detailRecord ? (
          <div className="space-y-6">
            {/* Header Info */}
            <div className="flex items-center gap-4 p-4 bg-violet-50 rounded-xl">
              <div className="w-12 h-12 rounded-full bg-violet-100 text-violet-600 flex items-center justify-center">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div>
                <p className="text-base font-semibold text-gray-900">
                  Dr. {detailRecord.doctorName || detailRecord.doctor?.name || "N/A"}
                </p>
                <p className="text-sm text-gray-500">
                  {detailRecord.doctorSpecialization || detailRecord.doctor?.specialization || "General"}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {detailRecord.consultationNumber} | {formatDate(detailRecord.consultationDate || detailRecord.date)}
                </p>
              </div>
            </div>

            {/* Vitals */}
            {Object.keys(vitals).some((k) => vitals[k]) && (
              <div>
                <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-3">Vitals</h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {vitals.bloodPressure || vitals.bp ? (
                    <div className="p-3 bg-red-50 rounded-lg text-center">
                      <p className="text-xs text-gray-500">Blood Pressure</p>
                      <p className="text-sm font-bold text-gray-900 mt-1">{vitals.bloodPressure || vitals.bp}</p>
                      <p className="text-[10px] text-gray-400">mmHg</p>
                    </div>
                  ) : null}
                  {vitals.temperature || vitals.temp ? (
                    <div className="p-3 bg-amber-50 rounded-lg text-center">
                      <p className="text-xs text-gray-500">Temperature</p>
                      <p className="text-sm font-bold text-gray-900 mt-1">{vitals.temperature || vitals.temp}</p>
                      <p className="text-[10px] text-gray-400">&deg;C</p>
                    </div>
                  ) : null}
                  {vitals.heartRate || vitals.pulse ? (
                    <div className="p-3 bg-pink-50 rounded-lg text-center">
                      <p className="text-xs text-gray-500">Pulse</p>
                      <p className="text-sm font-bold text-gray-900 mt-1">{vitals.heartRate || vitals.pulse}</p>
                      <p className="text-[10px] text-gray-400">bpm</p>
                    </div>
                  ) : null}
                  {vitals.oxygenSaturation || vitals.spo2 ? (
                    <div className="p-3 bg-blue-50 rounded-lg text-center">
                      <p className="text-xs text-gray-500">SpO2</p>
                      <p className="text-sm font-bold text-gray-900 mt-1">{vitals.oxygenSaturation || vitals.spo2}</p>
                      <p className="text-[10px] text-gray-400">%</p>
                    </div>
                  ) : null}
                  {vitals.weight ? (
                    <div className="p-3 bg-green-50 rounded-lg text-center">
                      <p className="text-xs text-gray-500">Weight</p>
                      <p className="text-sm font-bold text-gray-900 mt-1">{vitals.weight}</p>
                      <p className="text-[10px] text-gray-400">kg</p>
                    </div>
                  ) : null}
                  {vitals.height ? (
                    <div className="p-3 bg-teal-50 rounded-lg text-center">
                      <p className="text-xs text-gray-500">Height</p>
                      <p className="text-sm font-bold text-gray-900 mt-1">{vitals.height}</p>
                      <p className="text-[10px] text-gray-400">cm</p>
                    </div>
                  ) : null}
                  {vitals.bmi ? (
                    <div className="p-3 bg-indigo-50 rounded-lg text-center">
                      <p className="text-xs text-gray-500">BMI</p>
                      <p className="text-sm font-bold text-gray-900 mt-1">{vitals.bmi}</p>
                    </div>
                  ) : null}
                </div>
              </div>
            )}

            {/* Diagnosis */}
            {detailRecord.diagnosis && (
              <div>
                <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-2">Diagnosis</h4>
                <p className="text-sm text-gray-700 p-3 bg-gray-50 rounded-lg border-l-3 border-blue-500">
                  {detailRecord.diagnosis}
                </p>
              </div>
            )}

            {/* Prescription Table */}
            {(detailRecord.prescriptionItems || []).length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-3">Prescription</h4>
                <div className="overflow-x-auto rounded-xl border border-gray-200">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200">
                        <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase">#</th>
                        <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase">Drug</th>
                        <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase">Dosage</th>
                        <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase">Frequency</th>
                        <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase">Duration</th>
                        <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase">Instructions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {detailRecord.prescriptionItems.map((item, i) => (
                        <tr key={i} className="border-b border-gray-100 last:border-0">
                          <td className="px-4 py-2.5 text-gray-500">{i + 1}</td>
                          <td className="px-4 py-2.5 font-medium text-gray-900">
                            {item.drugName || item.medication || "N/A"}
                            {item.genericName && (
                              <span className="block text-xs text-gray-400 font-normal">{item.genericName}</span>
                            )}
                          </td>
                          <td className="px-4 py-2.5 text-gray-600">{item.dosage || "-"}</td>
                          <td className="px-4 py-2.5 text-gray-600">{item.frequency || "-"}</td>
                          <td className="px-4 py-2.5 text-gray-600">{item.duration || "-"}</td>
                          <td className="px-4 py-2.5 text-gray-500 text-xs">{item.instructions || item.notes || "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Lab Orders */}
            {(detailRecord.labOrders || []).length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-2">Lab Orders</h4>
                <div className="flex flex-wrap gap-2">
                  {detailRecord.labOrders.map((lab, i) => (
                    <span key={i} className="text-xs bg-orange-50 text-orange-700 px-3 py-1.5 rounded-full font-medium border border-orange-200">
                      {typeof lab === "string" ? lab : lab.testName || lab.name || "Test"}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* AI Summary */}
            {detailRecord.aiSummary && (
              <div>
                <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-2">AI Clinical Summary</h4>
                <div className="text-sm text-gray-700 p-4 bg-blue-50 rounded-xl border border-blue-100 whitespace-pre-wrap leading-relaxed">
                  {detailRecord.aiSummary}
                </div>
              </div>
            )}

            {/* Follow-up */}
            {detailRecord.followUpDate && (
              <div className="p-3 bg-teal-50 rounded-lg border border-teal-100">
                <p className="text-xs text-teal-600 uppercase tracking-wider font-medium mb-0.5">Follow-up Date</p>
                <p className="text-sm font-semibold text-teal-800">{formatDate(detailRecord.followUpDate)}</p>
              </div>
            )}
          </div>
        ) : null}
      </Modal>
    </PatientLayout>
  );
}

export default MyRecords;
