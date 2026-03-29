import { useState, useEffect, useMemo, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../../api/axios";
import DoctorLayout from "../../layouts/DoctorLayout";
import Card from "../../components/ui/Card";
import LoadingSpinner from "../../components/ui/LoadingSpinner";
import Modal from "../../components/ui/Modal";
import StatusBadge from "../../components/ui/StatusBadge";
import EmptyState from "../../components/ui/EmptyState";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import Select from "../../components/ui/Select";
import { useToast, Toast } from "../../components/ui/Toast";
import DrugSearch from "../../components/DrugSearch";
import { printPrescription } from "../../utils/printPrescription";
import { printVisitSummary } from "../../utils/printVisitSummary";

// ─── Helpers ──────────────────────────────────────────────────────────
function calculateAge(dob) {
  if (!dob) return "N/A";
  const birth = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

function formatDate(dateStr) {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// ─── Constants ────────────────────────────────────────────────────────
const TABS = [
  { key: "vitals", label: "Vitals", icon: "M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" },
  { key: "clinical", label: "Clinical", icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" },
  { key: "prescription", label: "Prescription", icon: "M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" },
  { key: "lab", label: "Lab Orders", icon: "M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" },
  { key: "followup", label: "Follow-up", icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" },
  { key: "summary", label: "AI Summary", icon: "M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" },
];

const DOSAGE_PRESETS = ["250mg", "500mg", "1g", "5ml", "10ml"];
const DOSAGE_FORMS = ["Tablet", "Capsule", "Syrup", "Injection", "Cream", "Ointment", "Drops", "Inhaler", "Suppository", "Other"];
const FREQUENCIES = ["Once daily", "Twice daily", "Three times daily", "Four times daily", "Every 6 hours", "Every 8 hours", "Every 12 hours", "As needed (PRN)", "At bedtime"];
const DURATIONS = ["3 days", "5 days", "7 days", "10 days", "14 days", "21 days", "1 month", "2 months", "3 months", "Ongoing", "Custom"];
const ROUTES = ["ORAL", "IV", "IM", "SC", "TOPICAL", "INHALATION", "SUBLINGUAL", "RECTAL", "OPHTHALMIC", "OTIC", "NASAL"];
const TEST_CATEGORIES = ["ALL", "LAB", "XRAY", "SCAN", "RADIOLOGY", "OTHER"];

const VITALS_META = [
  { key: "bpSystolic", label: "BP Systolic", unit: "mmHg", hint: "Normal: 90-120", placeholder: "120" },
  { key: "bpDiastolic", label: "BP Diastolic", unit: "mmHg", hint: "Normal: 60-80", placeholder: "80" },
  { key: "temperature", label: "Temperature", unit: "°C", hint: "Normal: 36.1-37.2", placeholder: "36.6" },
  { key: "pulseRate", label: "Pulse Rate", unit: "bpm", hint: "Normal: 60-100", placeholder: "72" },
  { key: "spO2", label: "SpO2", unit: "%", hint: "Normal: 95-100", placeholder: "98" },
  { key: "respiratoryRate", label: "Respiratory Rate", unit: "/min", hint: "Normal: 12-20", placeholder: "16" },
  { key: "weight", label: "Weight", unit: "kg", hint: "Used for BMI", placeholder: "70" },
  { key: "height", label: "Height", unit: "cm", hint: "Used for BMI", placeholder: "170" },
];

const EMPTY_DRUG = {
  drugName: "", genericName: "", dosage: "", dosageForm: "", frequency: "",
  duration: "", route: "ORAL", quantity: "", instructions: "",
  fromDatabase: false, fdaNdc: "", manufacturer: "",
};

// ─── Main Component ───────────────────────────────────────────────────
export default function Consultation() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toasts, toast, remove } = useToast();

  // Core state
  const [consultation, setConsultation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("vitals");
  const [hospitalInfo, setHospitalInfo] = useState({});

  // Vitals
  const [vitals, setVitals] = useState({});
  const [vitalsChanged, setVitalsChanged] = useState(false);
  const [savingVitals, setSavingVitals] = useState(false);

  // Clinical
  const [clinical, setClinical] = useState({
    chiefComplaint: "", historyOfPresentIllness: "", pastMedicalHistory: "",
    knownAllergies: "", physicalExamination: "", diagnosis: "",
  });
  const [clinicalChanged, setClinicalChanged] = useState(false);
  const [savingClinical, setSavingClinical] = useState(false);

  // Prescription
  const [prescriptionItems, setPrescriptionItems] = useState([]);
  const [drugForm, setDrugForm] = useState({ ...EMPTY_DRUG });
  const [drugInputMode, setDrugInputMode] = useState("search"); // search | manual
  const [addingDrug, setAddingDrug] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [editForm, setEditForm] = useState({ ...EMPTY_DRUG });
  const [savingEdit, setSavingEdit] = useState(false);

  // Lab Orders
  const [allTests, setAllTests] = useState([]);
  const [selectedTestIds, setSelectedTestIds] = useState([]);
  const [labNotes, setLabNotes] = useState("");
  const [labCategory, setLabCategory] = useState("ALL");
  const [savingLab, setSavingLab] = useState(false);
  const [labChanged, setLabChanged] = useState(false);

  // Follow-up & Notes
  const [followUpDate, setFollowUpDate] = useState("");
  const [specialInstructions, setSpecialInstructions] = useState("");
  const [doctorNotes, setDoctorNotes] = useState("");
  const [savingFollowUp, setSavingFollowUp] = useState(false);
  const [savingNotes, setSavingNotes] = useState(false);
  const [followUpChanged, setFollowUpChanged] = useState(false);
  const [notesChanged, setNotesChanged] = useState(false);

  // AI Summary
  const [summary, setSummary] = useState("");
  const [generatingSummary, setGeneratingSummary] = useState(false);
  const [editingSummary, setEditingSummary] = useState(false);
  const [editedSummary, setEditedSummary] = useState("");
  const [savingSummary, setSavingSummary] = useState(false);

  // Complete
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [completing, setCompleting] = useState(false);

  const isCompleted = consultation?.status === "COMPLETED";

  // ─── BMI Calculation ──────────────────────────────────────────────
  const bmi = useMemo(() => {
    const w = parseFloat(vitals.weight);
    const h = parseFloat(vitals.height);
    if (!w || !h || h === 0) return null;
    return (w / ((h / 100) ** 2)).toFixed(1);
  }, [vitals.weight, vitals.height]);

  const bmiInfo = useMemo(() => {
    if (!bmi) return null;
    const v = parseFloat(bmi);
    if (v < 18.5) return { label: "Underweight", color: "bg-yellow-100 text-yellow-700" };
    if (v < 25) return { label: "Normal", color: "bg-green-100 text-green-700" };
    if (v < 30) return { label: "Overweight", color: "bg-orange-100 text-orange-700" };
    return { label: "Obese", color: "bg-red-100 text-red-700" };
  }, [bmi]);

  // ─── Data Loading ─────────────────────────────────────────────────
  const loadConsultation = useCallback(async () => {
    try {
      const res = await API.get(`/consultations/${id}`);
      const c = res.data;
      setConsultation(c);

      // Populate vitals
      setVitals({
        bpSystolic: c.bpSystolic || "", bpDiastolic: c.bpDiastolic || "",
        temperature: c.temperature || "", pulseRate: c.pulseRate || "",
        spO2: c.spO2 || "", respiratoryRate: c.respiratoryRate || "",
        weight: c.weight || "", height: c.height || "",
      });

      // Populate clinical
      setClinical({
        chiefComplaint: c.chiefComplaint || "",
        historyOfPresentIllness: c.historyOfPresentIllness || "",
        pastMedicalHistory: c.pastMedicalHistory || "",
        knownAllergies: c.knownAllergies || "",
        physicalExamination: c.physicalExamination || "",
        diagnosis: c.diagnosis || "",
      });

      // Prescription items
      setPrescriptionItems(c.prescriptionItems || []);

      // Lab orders
      if (c.labOrders && c.labOrders.length > 0) {
        setSelectedTestIds(c.labOrders.map((lo) => lo.testId || lo.id));
      }
      setLabNotes(c.labNotes || "");

      // Follow-up
      setFollowUpDate(c.followUpDate || "");
      setSpecialInstructions(c.specialInstructions || "");
      setDoctorNotes(c.notes || "");

      // Summary
      setSummary(c.summary || "");
    } catch (err) {
      console.error("Failed to load consultation:", err);
      toast.error("Failed to load consultation data");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadConsultation();
  }, [loadConsultation]);

  useEffect(() => {
    API.get("/tests").then((res) => setAllTests(res.data || [])).catch(() => {});
    API.get("/master/hospital-info").then((res) => setHospitalInfo(res.data || {})).catch(() => {});
  }, []);

  // ─── Vitals Save ─────────────────────────────────────────────────
  const saveVitals = async () => {
    setSavingVitals(true);
    try {
      await API.put(`/consultations/${id}/vitals`, vitals);
      toast.success("Vitals saved successfully");
      setVitalsChanged(false);
    } catch {
      toast.error("Failed to save vitals");
    } finally {
      setSavingVitals(false);
    }
  };

  // ─── Clinical Save ────────────────────────────────────────────────
  const saveClinical = async () => {
    setSavingClinical(true);
    try {
      await API.put(`/consultations/${id}/clinical`, clinical);
      toast.success("Clinical data saved successfully");
      setClinicalChanged(false);
    } catch {
      toast.error("Failed to save clinical data");
    } finally {
      setSavingClinical(false);
    }
  };

  // ─── Prescription ─────────────────────────────────────────────────
  const handleDrugSelect = (drug) => {
    setDrugForm((prev) => ({
      ...prev,
      drugName: drug.brandName || "",
      genericName: drug.genericName || "",
      dosageForm: drug.dosageForm || prev.dosageForm,
      route: drug.route || prev.route,
      manufacturer: drug.manufacturer || "",
      fdaNdc: drug.fdaNdc || "",
      fromDatabase: true,
    }));
  };

  const addPrescriptionItem = async () => {
    if (!drugForm.drugName) {
      toast.warning("Please enter a drug name");
      return;
    }
    setAddingDrug(true);
    try {
      const res = await API.post(`/consultations/${id}/prescription`, drugForm);
      setPrescriptionItems((prev) => [...prev, res.data]);
      setDrugForm({ ...EMPTY_DRUG });
      toast.success("Medication added to prescription");
    } catch {
      toast.error("Failed to add medication");
    } finally {
      setAddingDrug(false);
    }
  };

  const removePrescriptionItem = async (itemId) => {
    try {
      await API.delete(`/consultations/${id}/prescription/${itemId}`);
      setPrescriptionItems((prev) => prev.filter((p) => p.id !== itemId));
      toast.success("Medication removed");
    } catch {
      toast.error("Failed to remove medication");
    }
  };

  const openEditModal = (item) => {
    setEditItem(item);
    setEditForm({
      drugName: item.drugName || "", genericName: item.genericName || "",
      dosage: item.dosage || "", dosageForm: item.dosageForm || "",
      frequency: item.frequency || "", duration: item.duration || "",
      route: item.route || "ORAL", quantity: item.quantity || "",
      instructions: item.instructions || "", fromDatabase: item.fromDatabase || false,
      fdaNdc: item.fdaNdc || "", manufacturer: item.manufacturer || "",
    });
  };

  const saveEditItem = async () => {
    setSavingEdit(true);
    try {
      const res = await API.put(`/prescription/${editItem.id}`, editForm);
      setPrescriptionItems((prev) => prev.map((p) => (p.id === editItem.id ? res.data : p)));
      setEditItem(null);
      toast.success("Medication updated");
    } catch {
      toast.error("Failed to update medication");
    } finally {
      setSavingEdit(false);
    }
  };

  // ─── Lab Orders ───────────────────────────────────────────────────
  const toggleTest = (testId) => {
    setLabChanged(true);
    setSelectedTestIds((prev) =>
      prev.includes(testId) ? prev.filter((id) => id !== testId) : [...prev, testId]
    );
  };

  const filteredTests = useMemo(() => {
    if (labCategory === "ALL") return allTests;
    return allTests.filter((t) => (t.type || "OTHER").toUpperCase() === labCategory);
  }, [allTests, labCategory]);

  const saveLabOrders = async () => {
    setSavingLab(true);
    try {
      await API.put(`/consultations/${id}/lab-orders`, {
        testIds: selectedTestIds.join(","),
        notes: labNotes,
      });
      toast.success("Lab orders saved successfully");
      setLabChanged(false);
    } catch {
      toast.error("Failed to save lab orders");
    } finally {
      setSavingLab(false);
    }
  };

  // ─── Follow-up & Notes ────────────────────────────────────────────
  const saveFollowUp = async () => {
    setSavingFollowUp(true);
    try {
      await API.put(`/consultations/${id}/follow-up`, {
        followUpDate,
        instructions: specialInstructions,
      });
      toast.success("Follow-up saved successfully");
      setFollowUpChanged(false);
    } catch {
      toast.error("Failed to save follow-up");
    } finally {
      setSavingFollowUp(false);
    }
  };

  const saveNotes = async () => {
    setSavingNotes(true);
    try {
      await API.put(`/consultations/${id}/notes`, { notes: doctorNotes });
      toast.success("Notes saved successfully");
      setNotesChanged(false);
    } catch {
      toast.error("Failed to save notes");
    } finally {
      setSavingNotes(false);
    }
  };

  // ─── AI Summary ───────────────────────────────────────────────────
  const generateSummary = async () => {
    setGeneratingSummary(true);
    try {
      const res = await API.post(`/consultations/${id}/generate-summary`);
      setSummary(res.data.summary || res.data);
      toast.success("AI summary generated successfully");
    } catch {
      toast.error("Failed to generate AI summary");
    } finally {
      setGeneratingSummary(false);
    }
  };

  const saveSummaryEdit = async () => {
    setSavingSummary(true);
    try {
      await API.put(`/consultations/${id}/summary`, { summary: editedSummary });
      setSummary(editedSummary);
      setEditingSummary(false);
      toast.success("Summary saved successfully");
    } catch {
      toast.error("Failed to save summary");
    } finally {
      setSavingSummary(false);
    }
  };

  // ─── Complete Consultation ────────────────────────────────────────
  const completeConsultation = async () => {
    setCompleting(true);
    try {
      await API.post(`/consultations/${id}/complete`);
      toast.success("Consultation completed successfully");
      setShowCompleteModal(false);
      loadConsultation();
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data || "Failed to complete consultation";
      toast.error(typeof msg === "string" ? msg : "Failed to complete consultation");
    } finally {
      setCompleting(false);
    }
  };

  // ─── Dirty Tracking ──────────────────────────────────────────────
  const tabDirty = {
    vitals: vitalsChanged,
    clinical: clinicalChanged,
    lab: labChanged,
    followup: followUpChanged,
    notes: notesChanged,
  };

  // ─── Loading State ────────────────────────────────────────────────
  if (loading) {
    return (
      <DoctorLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <LoadingSpinner message="Loading consultation..." />
        </div>
      </DoctorLayout>
    );
  }

  if (!consultation) {
    return (
      <DoctorLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <EmptyState
            title="Consultation not found"
            message="The consultation you are looking for does not exist or has been deleted."
            icon={
              <svg className="w-10 h-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
        </div>
      </DoctorLayout>
    );
  }

  const patient = consultation.patient || {};
  const doctor = consultation.doctor || {};
  const patientAge = calculateAge(patient.dob || patient.dateOfBirth);

  // ─── Render ───────────────────────────────────────────────────────
  return (
    <DoctorLayout>
      <Toast toasts={toasts} remove={remove} />

      {/* ═══ HEADER BAR ═══ */}
      <div className="sticky top-0 z-20 bg-white border-b border-gray-200 -mx-6 -mt-6 px-6 py-3 mb-6 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/doctor/dashboard")}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Queue
          </button>
          <div className="h-5 w-px bg-gray-200" />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-gray-900">
                Consultation #{consultation.consultationNumber || id}
              </span>
              <StatusBadge status={consultation.status} size="xs" />
              {consultation.status === "IN_PROGRESS" && (
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500" />
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              {patient.firstName} {patient.lastName} &middot; {patientAge} yrs &middot; {patient.gender || "N/A"}
              {consultation.consultationDate && <> &middot; {formatDate(consultation.consultationDate)}</>}
            </p>
          </div>
        </div>

        {!isCompleted && (
          <Button variant="success" onClick={() => setShowCompleteModal(true)}>
            <span className="flex items-center gap-1.5">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Complete Consultation
            </span>
          </Button>
        )}
      </div>

      {/* ═══ TAB NAVIGATION ═══ */}
      <div className="border-b border-gray-200 mb-6 -mx-6 px-6">
        <nav className="flex gap-1 overflow-x-auto pb-px">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`relative flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors border-b-2 ${
                activeTab === tab.key
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={tab.icon} />
              </svg>
              {tab.label}
              {tabDirty[tab.key] && (
                <span className="absolute top-2 right-1.5 w-2 h-2 bg-orange-400 rounded-full" />
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* ═══ TAB CONTENT ═══ */}
      <div className="pb-24">

        {/* ───── VITALS TAB ───── */}
        {activeTab === "vitals" && (
          <Card title="Patient Vitals" subtitle="Record vital signs">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {VITALS_META.map((v) => (
                <div key={v.key}>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">{v.label}</label>
                  <div className="relative">
                    <Input
                      type="number"
                      step="any"
                      placeholder={v.placeholder}
                      value={vitals[v.key] || ""}
                      disabled={isCompleted}
                      onChange={(e) => {
                        setVitals((prev) => ({ ...prev, [v.key]: e.target.value }));
                        setVitalsChanged(true);
                      }}
                      className="pr-12"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 pointer-events-none">
                      {v.unit}
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-400 mt-1">{v.hint}</p>
                </div>
              ))}

              {/* BMI (auto-calculated, read-only) */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">BMI</label>
                <div className="relative">
                  <Input
                    type="text"
                    value={bmi || "—"}
                    disabled
                    className="bg-gray-50 pr-24"
                  />
                  {bmiInfo && (
                    <span className={`absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-medium px-2 py-0.5 rounded-full ${bmiInfo.color}`}>
                      {bmiInfo.label}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-gray-400 mt-1">Auto-calculated from weight & height</p>
              </div>
            </div>

            {!isCompleted && (
              <div className="mt-6 flex justify-end">
                <Button onClick={saveVitals} disabled={savingVitals}>
                  {savingVitals ? "Saving..." : "Save Vitals"}
                </Button>
              </div>
            )}
          </Card>
        )}

        {/* ───── CLINICAL TAB ───── */}
        {activeTab === "clinical" && (
          <Card title="Clinical Assessment" subtitle="Document clinical findings">
            <div className="space-y-5">
              {[
                { key: "chiefComplaint", label: "Chief Complaint", rows: 3 },
                { key: "historyOfPresentIllness", label: "History of Present Illness", rows: 5 },
                { key: "pastMedicalHistory", label: "Past Medical History", rows: 3 },
                { key: "knownAllergies", label: "Known Allergies", rows: 2, redBorder: true },
                { key: "physicalExamination", label: "Physical Examination", rows: 4 },
                { key: "diagnosis", label: "Diagnosis", rows: 3 },
              ].map((field) => (
                <div key={field.key}>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">{field.label}</label>
                  <textarea
                    rows={field.rows}
                    value={clinical[field.key]}
                    disabled={isCompleted}
                    onChange={(e) => {
                      setClinical((prev) => ({ ...prev, [field.key]: e.target.value }));
                      setClinicalChanged(true);
                    }}
                    className={`w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500 resize-y ${
                      field.redBorder && clinical[field.key] ? "border-red-300 bg-red-50/30" : ""
                    } ${isCompleted ? "bg-gray-50 cursor-not-allowed" : ""}`}
                  />
                </div>
              ))}
            </div>

            {!isCompleted && (
              <div className="mt-6 flex justify-end">
                <Button onClick={saveClinical} disabled={savingClinical}>
                  {savingClinical ? "Saving..." : "Save Clinical Data"}
                </Button>
              </div>
            )}
          </Card>
        )}

        {/* ───── PRESCRIPTION TAB ───── */}
        {activeTab === "prescription" && (
          <div className="space-y-6">
            {/* Add Medication Form */}
            {!isCompleted && (
              <Card title="Add Medication" subtitle="Search the FDA database or enter manually">
                {/* Toggle: Search / Manual */}
                <div className="flex gap-1 p-1 bg-gray-100 rounded-lg w-fit mb-5">
                  <button
                    onClick={() => setDrugInputMode("search")}
                    className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
                      drugInputMode === "search"
                        ? "bg-white text-blue-700 shadow-sm"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    Search Database
                  </button>
                  <button
                    onClick={() => setDrugInputMode("manual")}
                    className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
                      drugInputMode === "manual"
                        ? "bg-white text-blue-700 shadow-sm"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    Manual Entry
                  </button>
                </div>

                {/* Drug Search */}
                {drugInputMode === "search" && (
                  <div className="mb-5">
                    <DrugSearch onSelect={handleDrugSelect} />
                  </div>
                )}

                {/* Fields Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">Drug Name *</label>
                    <Input
                      value={drugForm.drugName}
                      onChange={(e) => setDrugForm((p) => ({ ...p, drugName: e.target.value }))}
                      placeholder="Enter drug name"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">Generic Name</label>
                    <Input
                      value={drugForm.genericName}
                      onChange={(e) => setDrugForm((p) => ({ ...p, genericName: e.target.value }))}
                      placeholder="Enter generic name"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">Dosage</label>
                    <Input
                      value={drugForm.dosage}
                      onChange={(e) => setDrugForm((p) => ({ ...p, dosage: e.target.value }))}
                      placeholder="e.g., 500mg"
                    />
                    <div className="flex gap-1.5 mt-1.5">
                      {DOSAGE_PRESETS.map((d) => (
                        <button
                          key={d}
                          type="button"
                          onClick={() => setDrugForm((p) => ({ ...p, dosage: d }))}
                          className="text-[11px] px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full hover:bg-blue-100 transition-colors"
                        >
                          {d}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">Dosage Form</label>
                    <Select
                      value={drugForm.dosageForm}
                      onChange={(e) => setDrugForm((p) => ({ ...p, dosageForm: e.target.value }))}
                    >
                      <option value="">Select form</option>
                      {DOSAGE_FORMS.map((f) => (
                        <option key={f} value={f}>{f}</option>
                      ))}
                    </Select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">Frequency</label>
                    <Select
                      value={drugForm.frequency}
                      onChange={(e) => setDrugForm((p) => ({ ...p, frequency: e.target.value }))}
                    >
                      <option value="">Select frequency</option>
                      {FREQUENCIES.map((f) => (
                        <option key={f} value={f}>{f}</option>
                      ))}
                    </Select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">Duration</label>
                    <Select
                      value={drugForm.duration}
                      onChange={(e) => setDrugForm((p) => ({ ...p, duration: e.target.value }))}
                    >
                      <option value="">Select duration</option>
                      {DURATIONS.map((d) => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </Select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">Route</label>
                    <Select
                      value={drugForm.route}
                      onChange={(e) => setDrugForm((p) => ({ ...p, route: e.target.value }))}
                    >
                      {ROUTES.map((r) => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </Select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">Quantity</label>
                    <Input
                      type="number"
                      min="0"
                      value={drugForm.quantity}
                      onChange={(e) => setDrugForm((p) => ({ ...p, quantity: e.target.value }))}
                      placeholder="e.g., 30"
                    />
                  </div>
                </div>

                <div className="mt-4">
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">Instructions</label>
                  <textarea
                    rows={1}
                    value={drugForm.instructions}
                    onChange={(e) => setDrugForm((p) => ({ ...p, instructions: e.target.value }))}
                    placeholder="e.g., Take after meals with water"
                    className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500 resize-y"
                  />
                </div>

                <div className="mt-5 flex justify-end">
                  <Button onClick={addPrescriptionItem} disabled={addingDrug}>
                    {addingDrug ? "Adding..." : "Add to Prescription"}
                  </Button>
                </div>
              </Card>
            )}

            {/* Prescription Items Table */}
            <Card
              title="Prescription Items"
              subtitle={`${prescriptionItems.length} medication(s) prescribed`}
              noPadding
            >
              {prescriptionItems.length === 0 ? (
                <div className="p-8">
                  <EmptyState
                    title="No medications added yet"
                    message="Add medications using the form above to build the prescription."
                    icon={
                      <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                      </svg>
                    }
                  />
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200">
                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 w-10">#</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Drug Name</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Dosage</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Form</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Frequency</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Duration</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Route</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Instructions</th>
                        {!isCompleted && (
                          <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 w-24">Actions</th>
                        )}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {prescriptionItems.map((item, idx) => (
                        <tr key={item.id || idx} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-4 py-3 text-gray-400">{idx + 1}</td>
                          <td className="px-4 py-3">
                            <p className="font-medium text-gray-900">{item.drugName}</p>
                            {item.genericName && (
                              <p className="text-xs text-gray-400">{item.genericName}</p>
                            )}
                          </td>
                          <td className="px-4 py-3 text-gray-600">{item.dosage || "—"}</td>
                          <td className="px-4 py-3 text-gray-600">{item.dosageForm || "—"}</td>
                          <td className="px-4 py-3 text-gray-600">{item.frequency || "—"}</td>
                          <td className="px-4 py-3 text-gray-600">{item.duration || "—"}</td>
                          <td className="px-4 py-3 text-gray-600">{item.route || "—"}</td>
                          <td className="px-4 py-3 text-gray-500 max-w-[200px] truncate">{item.instructions || "—"}</td>
                          {!isCompleted && (
                            <td className="px-4 py-3 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <button
                                  onClick={() => openEditModal(item)}
                                  className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                                  title="Edit"
                                >
                                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                  </svg>
                                </button>
                                <button
                                  onClick={() => removePrescriptionItem(item.id)}
                                  className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                  title="Remove"
                                >
                                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              </div>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>

            {/* Edit Prescription Item Modal */}
            <Modal
              open={!!editItem}
              onClose={() => setEditItem(null)}
              title="Edit Medication"
              size="lg"
              footer={
                <div className="flex justify-end gap-3">
                  <Button variant="secondary" onClick={() => setEditItem(null)}>Cancel</Button>
                  <Button onClick={saveEditItem} disabled={savingEdit}>
                    {savingEdit ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              }
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">Drug Name</label>
                  <Input
                    value={editForm.drugName}
                    onChange={(e) => setEditForm((p) => ({ ...p, drugName: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">Generic Name</label>
                  <Input
                    value={editForm.genericName}
                    onChange={(e) => setEditForm((p) => ({ ...p, genericName: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">Dosage</label>
                  <Input
                    value={editForm.dosage}
                    onChange={(e) => setEditForm((p) => ({ ...p, dosage: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">Dosage Form</label>
                  <Select
                    value={editForm.dosageForm}
                    onChange={(e) => setEditForm((p) => ({ ...p, dosageForm: e.target.value }))}
                  >
                    <option value="">Select form</option>
                    {DOSAGE_FORMS.map((f) => (
                      <option key={f} value={f}>{f}</option>
                    ))}
                  </Select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">Frequency</label>
                  <Select
                    value={editForm.frequency}
                    onChange={(e) => setEditForm((p) => ({ ...p, frequency: e.target.value }))}
                  >
                    <option value="">Select frequency</option>
                    {FREQUENCIES.map((f) => (
                      <option key={f} value={f}>{f}</option>
                    ))}
                  </Select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">Duration</label>
                  <Select
                    value={editForm.duration}
                    onChange={(e) => setEditForm((p) => ({ ...p, duration: e.target.value }))}
                  >
                    <option value="">Select duration</option>
                    {DURATIONS.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </Select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">Route</label>
                  <Select
                    value={editForm.route}
                    onChange={(e) => setEditForm((p) => ({ ...p, route: e.target.value }))}
                  >
                    {ROUTES.map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </Select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">Quantity</label>
                  <Input
                    type="number"
                    min="0"
                    value={editForm.quantity}
                    onChange={(e) => setEditForm((p) => ({ ...p, quantity: e.target.value }))}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">Instructions</label>
                  <textarea
                    rows={2}
                    value={editForm.instructions}
                    onChange={(e) => setEditForm((p) => ({ ...p, instructions: e.target.value }))}
                    className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500 resize-y"
                  />
                </div>
              </div>
            </Modal>
          </div>
        )}

        {/* ───── LAB ORDERS TAB ───── */}
        {activeTab === "lab" && (
          <div className="space-y-6">
            {/* Selected Tests Chips */}
            {selectedTestIds.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {selectedTestIds.map((tid) => {
                  const test = allTests.find((t) => t.id === tid);
                  return (
                    <span
                      key={tid}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full text-xs font-medium"
                    >
                      {test?.name || `Test #${tid}`}
                      {!isCompleted && (
                        <button
                          onClick={() => toggleTest(tid)}
                          className="hover:bg-blue-100 rounded-full p-0.5 transition-colors"
                        >
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}
                    </span>
                  );
                })}
                <span className="text-xs text-gray-400 self-center ml-2">
                  {selectedTestIds.length} test(s) selected
                </span>
              </div>
            )}

            {/* Category Tabs */}
            <div className="flex gap-1 p-1 bg-gray-100 rounded-lg w-fit flex-wrap">
              {TEST_CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setLabCategory(cat)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                    labCategory === cat
                      ? "bg-white text-blue-700 shadow-sm"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Tests Grid */}
            <Card title="Available Tests" noPadding>
              {filteredTests.length === 0 ? (
                <div className="p-8">
                  <EmptyState title="No tests available" message="No tests found for the selected category." />
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-gray-100">
                  {filteredTests.map((test) => {
                    const isSelected = selectedTestIds.includes(test.id);
                    return (
                      <label
                        key={test.id}
                        className={`flex items-center gap-3 p-4 bg-white cursor-pointer transition-colors ${
                          isSelected ? "bg-blue-50/50" : "hover:bg-gray-50"
                        } ${isCompleted ? "cursor-not-allowed opacity-70" : ""}`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          disabled={isCompleted}
                          onChange={() => toggleTest(test.id)}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{test.name}</p>
                          <p className="text-xs text-gray-400">{test.type || "OTHER"}</p>
                        </div>
                        <span className="text-xs font-semibold text-gray-600">
                          Rs. {test.price || 0}
                        </span>
                      </label>
                    );
                  })}
                </div>
              )}
            </Card>

            {/* Lab Notes */}
            <Card title="Lab Notes">
              <textarea
                rows={3}
                value={labNotes}
                disabled={isCompleted}
                onChange={(e) => {
                  setLabNotes(e.target.value);
                  setLabChanged(true);
                }}
                placeholder="Additional notes for the lab..."
                className={`w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500 resize-y ${
                  isCompleted ? "bg-gray-50 cursor-not-allowed" : ""
                }`}
              />
              {!isCompleted && (
                <div className="mt-4 flex justify-end">
                  <Button onClick={saveLabOrders} disabled={savingLab}>
                    {savingLab ? "Saving..." : "Save Lab Orders"}
                  </Button>
                </div>
              )}
            </Card>
          </div>
        )}

        {/* ───── FOLLOW-UP & NOTES TAB ───── */}
        {activeTab === "followup" && (
          <div className="space-y-6">
            <Card title="Follow-up" subtitle="Schedule a follow-up visit">
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">Follow-up Date</label>
                  <Input
                    type="date"
                    value={followUpDate}
                    disabled={isCompleted}
                    onChange={(e) => {
                      setFollowUpDate(e.target.value);
                      setFollowUpChanged(true);
                    }}
                    className="max-w-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">Special Instructions</label>
                  <textarea
                    rows={3}
                    value={specialInstructions}
                    disabled={isCompleted}
                    onChange={(e) => {
                      setSpecialInstructions(e.target.value);
                      setFollowUpChanged(true);
                    }}
                    placeholder="Instructions for the patient's follow-up visit..."
                    className={`w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500 resize-y ${
                      isCompleted ? "bg-gray-50 cursor-not-allowed" : ""
                    }`}
                  />
                </div>
              </div>
              {!isCompleted && (
                <div className="mt-5 flex justify-end">
                  <Button onClick={saveFollowUp} disabled={savingFollowUp}>
                    {savingFollowUp ? "Saving..." : "Save Follow-up"}
                  </Button>
                </div>
              )}
            </Card>

            <Card title="Doctor's Private Notes" subtitle="These notes are for your reference only">
              <textarea
                rows={5}
                value={doctorNotes}
                disabled={isCompleted}
                onChange={(e) => {
                  setDoctorNotes(e.target.value);
                  setNotesChanged(true);
                }}
                placeholder="Private notes, observations, or reminders..."
                className={`w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500 resize-y ${
                  isCompleted ? "bg-gray-50 cursor-not-allowed" : ""
                }`}
              />
              <p className="text-[11px] text-gray-400 mt-2 flex items-center gap-1">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                These notes are private and will not be included in patient-facing documents.
              </p>
              {!isCompleted && (
                <div className="mt-4 flex justify-end">
                  <Button onClick={saveNotes} disabled={savingNotes}>
                    {savingNotes ? "Saving..." : "Save Notes"}
                  </Button>
                </div>
              )}
            </Card>
          </div>
        )}

        {/* ───── AI SUMMARY TAB ───── */}
        {activeTab === "summary" && (
          <div className="space-y-6">
            {/* Generating State */}
            {generatingSummary && (
              <Card>
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="relative mb-4">
                    <div className="w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center">
                      <span className="text-3xl animate-pulse">🧠</span>
                    </div>
                    <div className="absolute -inset-2 rounded-full border-2 border-purple-200 animate-ping opacity-30" />
                  </div>
                  <p className="text-sm font-semibold text-gray-700">AI is analyzing the consultation data...</p>
                  <div className="flex gap-1 mt-3">
                    <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                  <p className="text-xs text-gray-400 mt-4">Powered by Groq AI</p>
                </div>
              </Card>
            )}

            {/* No Summary Yet */}
            {!generatingSummary && !summary && (
              <Card>
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="w-16 h-16 rounded-full bg-purple-50 flex items-center justify-center mb-4">
                    <span className="text-3xl">&#10024;</span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">Generate AI Summary</h3>
                  <p className="text-sm text-gray-500 mb-6 text-center max-w-md">
                    AI will analyze all consultation data and generate a professional visit summary
                  </p>
                  <Button onClick={generateSummary}>
                    <span className="flex items-center gap-2">
                      &#10024; Generate AI Summary
                    </span>
                  </Button>
                  <p className="text-xs text-gray-400 mt-4">Powered by Groq AI</p>
                </div>
              </Card>
            )}

            {/* Summary Display */}
            {!generatingSummary && summary && (
              <Card
                title="Visit Summary"
                right={
                  <div className="flex items-center gap-2">
                    {!editingSummary && !isCompleted && (
                      <button
                        onClick={() => {
                          setEditedSummary(summary);
                          setEditingSummary(true);
                        }}
                        className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Edit
                      </button>
                    )}
                  </div>
                }
              >
                {editingSummary ? (
                  <div>
                    <textarea
                      rows={15}
                      value={editedSummary}
                      onChange={(e) => setEditedSummary(e.target.value)}
                      className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500 resize-y font-mono"
                    />
                    <div className="mt-4 flex justify-end gap-3">
                      <Button variant="secondary" onClick={() => setEditingSummary(false)}>Cancel</Button>
                      <Button onClick={saveSummaryEdit} disabled={savingSummary}>
                        {savingSummary ? "Saving..." : "Save Changes"}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-gray-50 rounded-xl p-5 text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {summary.split("\n").map((line, i) => {
                      // Simple markdown-ish rendering
                      if (line.startsWith("### ")) {
                        return <p key={i} className="font-bold text-gray-900 mt-3 mb-1 text-base">{line.replace("### ", "")}</p>;
                      }
                      if (line.startsWith("## ")) {
                        return <p key={i} className="font-bold text-gray-900 mt-4 mb-1 text-lg">{line.replace("## ", "")}</p>;
                      }
                      if (line.startsWith("# ")) {
                        return <p key={i} className="font-bold text-gray-900 mt-4 mb-2 text-xl">{line.replace("# ", "")}</p>;
                      }
                      if (line.startsWith("**") && line.endsWith("**")) {
                        return <p key={i} className="font-semibold text-gray-900 mt-2">{line.replace(/\*\*/g, "")}</p>;
                      }
                      if (line.startsWith("- ") || line.startsWith("* ")) {
                        return <p key={i} className="ml-4 before:content-['•'] before:mr-2 before:text-gray-400">{line.slice(2)}</p>;
                      }
                      if (!line.trim()) return <br key={i} />;
                      return <p key={i}>{line}</p>;
                    })}
                  </div>
                )}

                {!editingSummary && (
                  <div className="mt-5 flex items-center gap-3">
                    {!isCompleted && (
                      <Button variant="secondary" onClick={generateSummary} disabled={generatingSummary}>
                        Regenerate Summary
                      </Button>
                    )}
                    <Button
                      variant="secondary"
                      onClick={() => printVisitSummary(consultation, hospitalInfo)}
                    >
                      <span className="flex items-center gap-1.5">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                        </svg>
                        Print Visit Summary
                      </span>
                    </Button>
                  </div>
                )}
              </Card>
            )}
          </div>
        )}
      </div>

      {/* ═══ STICKY BOTTOM ACTION BAR ═══ */}
      {!isCompleted && (
        <div className="fixed bottom-0 left-0 right-0 z-20 bg-white border-t border-gray-200 shadow-lg">
          <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="secondary"
                onClick={() => printPrescription(consultation, hospitalInfo)}
              >
                <span className="flex items-center gap-1.5">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                  </svg>
                  Print Prescription
                </span>
              </Button>
              <Button
                variant="secondary"
                onClick={() => printVisitSummary(consultation, hospitalInfo)}
              >
                <span className="flex items-center gap-1.5">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Print Visit Summary
                </span>
              </Button>
            </div>
            <Button variant="success" onClick={() => setShowCompleteModal(true)}>
              <span className="flex items-center gap-1.5">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Complete Consultation
              </span>
            </Button>
          </div>
        </div>
      )}

      {/* ═══ COMPLETE CONFIRMATION MODAL ═══ */}
      <Modal
        open={showCompleteModal}
        onClose={() => setShowCompleteModal(false)}
        title="Complete Consultation"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setShowCompleteModal(false)}>
              Cancel
            </Button>
            <Button variant="success" onClick={completeConsultation} disabled={completing}>
              {completing ? "Completing..." : "Yes, Complete"}
            </Button>
          </div>
        }
      >
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center">
            <svg className="w-6 h-6 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p className="text-sm text-gray-700">
              Are you sure you want to complete this consultation? This will mark the consultation as complete and <strong>cannot be undone</strong>.
            </p>
            <p className="text-xs text-gray-400 mt-2">
              All data will be saved and the consultation will become read-only.
            </p>
          </div>
        </div>
      </Modal>
    </DoctorLayout>
  );
}
