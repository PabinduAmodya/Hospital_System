import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../api/axios";
import PatientLayout from "../../layouts/PatientLayout";
import SearchBar from "../../components/ui/SearchBar";
import Select from "../../components/ui/Select";
import Button from "../../components/ui/Button";
import LoadingSpinner from "../../components/ui/LoadingSpinner";
import EmptyState from "../../components/ui/EmptyState";
import Modal from "../../components/ui/Modal";
import { useToast, Toast } from "../../components/ui/Toast";

const AVATAR_COLORS = [
  "bg-blue-500", "bg-emerald-500", "bg-violet-500", "bg-rose-500",
  "bg-amber-500", "bg-cyan-500", "bg-indigo-500", "bg-pink-500",
  "bg-teal-500", "bg-orange-500",
];

const SPEC_COLORS = {
  Cardiology: "bg-red-100 text-red-700",
  Neurology: "bg-purple-100 text-purple-700",
  Orthopedics: "bg-blue-100 text-blue-700",
  Pediatrics: "bg-pink-100 text-pink-700",
  Dermatology: "bg-amber-100 text-amber-700",
  Ophthalmology: "bg-cyan-100 text-cyan-700",
  ENT: "bg-teal-100 text-teal-700",
  Gynecology: "bg-rose-100 text-rose-700",
  default: "bg-gray-100 text-gray-700",
};

function getInitials(name) {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  return parts.length >= 2
    ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    : name.slice(0, 2).toUpperCase();
}

function getAvatarColor(name) {
  let hash = 0;
  for (let i = 0; i < (name || "").length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function getSpecColor(spec) {
  return SPEC_COLORS[spec] || SPEC_COLORS.default;
}

function formatFee(fee) {
  return Number(fee || 0).toLocaleString("en-IN");
}

function formatScheduleDays(schedules) {
  if (!schedules || schedules.length === 0) return "No schedule available";
  const dayOrder = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"];
  const days = [...new Set(schedules.map((s) => s.dayOfWeek))];
  days.sort((a, b) => dayOrder.indexOf(a) - dayOrder.indexOf(b));
  const formatted = days.map((d) => d.charAt(0) + d.slice(1).toLowerCase());
  return `Available on ${formatted.join(", ")}`;
}

function formatTime(t) {
  if (!t) return "";
  const [h, m] = t.split(":");
  const hr = parseInt(h, 10);
  const ampm = hr >= 12 ? "PM" : "AM";
  const h12 = hr % 12 || 12;
  return `${h12}:${m} ${ampm}`;
}

export default function FindDoctors() {
  const navigate = useNavigate();
  const { toasts, toast, remove } = useToast();

  const [doctors, setDoctors] = useState([]);
  const [specializations, setSpecializations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [specFilter, setSpecFilter] = useState("");
  const [sortBy, setSortBy] = useState("name-asc");

  // Profile modal
  const [profileDoctor, setProfileDoctor] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const [docRes, specRes] = await Promise.all([
        API.get("/patient-portal/doctors"),
        API.get("/patient-portal/specializations").catch(() => ({ data: [] })),
      ]);
      setDoctors(docRes.data || []);
      setSpecializations(specRes.data || []);
    } catch (err) {
      toast.error("Failed to load doctors. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const filtered = useMemo(() => {
    let list = [...doctors];

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((d) => (d.name || "").toLowerCase().includes(q));
    }

    if (specFilter) {
      list = list.filter((d) => (d.specialization || "") === specFilter);
    }

    switch (sortBy) {
      case "name-asc":
        list.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
        break;
      case "fee-low":
        list.sort((a, b) => (a.consultationFee || 0) - (b.consultationFee || 0));
        break;
      case "fee-high":
        list.sort((a, b) => (b.consultationFee || 0) - (a.consultationFee || 0));
        break;
      default:
        break;
    }

    return list;
  }, [doctors, search, specFilter, sortBy]);

  return (
    <PatientLayout>
      <Toast toasts={toasts} remove={remove} />

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Find a Doctor</h1>
        <p className="text-gray-500 mt-1">Choose from our experienced specialists</p>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder="Search by doctor name..."
            className="flex-1"
          />
          <Select
            className="sm:w-52"
            value={specFilter}
            onChange={(e) => setSpecFilter(e.target.value)}
          >
            <option value="">All Specializations</option>
            {specializations.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </Select>
          <Select
            className="sm:w-44"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="name-asc">Name A-Z</option>
            <option value="fee-low">Fee: Low to High</option>
            <option value="fee-high">Fee: High to Low</option>
          </Select>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <LoadingSpinner message="Finding doctors..." />
      ) : filtered.length === 0 ? (
        <EmptyState
          title="No doctors found"
          message={search || specFilter ? "Try adjusting your search or filters." : "No doctors are currently available."}
          icon={
            <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          }
        />
      ) : (
        <>
          <p className="text-sm text-gray-500 mb-4">{filtered.length} doctor{filtered.length !== 1 ? "s" : ""} found</p>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {filtered.map((doctor) => (
              <DoctorCard
                key={doctor.id}
                doctor={doctor}
                onBook={() => navigate(`/patient/book/${doctor.id}`)}
                onProfile={() => setProfileDoctor(doctor)}
              />
            ))}
          </div>
        </>
      )}

      {/* Quick Profile Modal */}
      <Modal
        open={!!profileDoctor}
        onClose={() => setProfileDoctor(null)}
        title={profileDoctor ? `Dr. ${profileDoctor.name}` : ""}
        size="md"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setProfileDoctor(null)}>Close</Button>
            <Button onClick={() => {
              const id = profileDoctor?.id;
              setProfileDoctor(null);
              navigate(`/patient/doctor/${id}`);
            }}>View Full Profile</Button>
            <Button variant="success" onClick={() => {
              const id = profileDoctor?.id;
              setProfileDoctor(null);
              navigate(`/patient/book/${id}`);
            }}>Book Appointment</Button>
          </div>
        }
      >
        {profileDoctor && (
          <div className="space-y-5">
            {/* Doctor header */}
            <div className="flex items-center gap-4">
              <div className={`w-16 h-16 rounded-full ${getAvatarColor(profileDoctor.name)} flex items-center justify-center text-white text-xl font-bold flex-shrink-0`}>
                {getInitials(profileDoctor.name)}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Dr. {profileDoctor.name}</h3>
                <span className={`inline-block mt-1 px-3 py-0.5 rounded-full text-xs font-medium ${getSpecColor(profileDoctor.specialization)}`}>
                  {profileDoctor.specialization}
                </span>
              </div>
            </div>

            {/* Info grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500">Consultation Fee</p>
                <p className="text-sm font-semibold text-gray-900">Rs. {formatFee(profileDoctor.consultationFee)}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500">Phone</p>
                <p className="text-sm font-medium text-gray-900">{profileDoctor.phone || "N/A"}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 col-span-2">
                <p className="text-xs text-gray-500">Email</p>
                <p className="text-sm font-medium text-gray-900">{profileDoctor.email || "N/A"}</p>
              </div>
            </div>

            {/* Schedule */}
            {profileDoctor.schedules && profileDoctor.schedules.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Schedule</h4>
                <div className="space-y-2">
                  {profileDoctor.schedules.map((s, i) => (
                    <div key={i} className="flex items-center justify-between bg-blue-50 rounded-lg px-3 py-2">
                      <span className="text-sm font-medium text-blue-800">
                        {s.dayOfWeek.charAt(0) + s.dayOfWeek.slice(1).toLowerCase()}
                      </span>
                      <span className="text-sm text-blue-600">
                        {formatTime(s.startTime)} - {formatTime(s.endTime)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </PatientLayout>
  );
}

function DoctorCard({ doctor, onBook, onProfile }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
      <div className="p-5">
        {/* Top section */}
        <div className="flex items-start gap-4 mb-4">
          <div className={`w-16 h-16 rounded-full ${getAvatarColor(doctor.name)} flex items-center justify-center text-white text-xl font-bold flex-shrink-0`}>
            {getInitials(doctor.name)}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-base font-semibold text-gray-900 truncate">Dr. {doctor.name}</h3>
            <span className={`inline-block mt-1 px-3 py-0.5 rounded-full text-xs font-medium ${getSpecColor(doctor.specialization)}`}>
              {doctor.specialization}
            </span>
            <p className="text-lg font-bold text-blue-600 mt-2">
              Rs. {formatFee(doctor.consultationFee)}
              <span className="text-xs font-normal text-gray-400 ml-1">consultation</span>
            </p>
          </div>
        </div>

        {/* Schedule */}
        <div className="flex items-start gap-2 mb-3">
          <svg className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p className="text-xs text-gray-600 leading-relaxed">{formatScheduleDays(doctor.schedules)}</p>
        </div>

        {/* Contact */}
        <div className="space-y-1 mb-4">
          {doctor.phone && (
            <div className="flex items-center gap-2">
              <svg className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              <span className="text-xs text-gray-500">{doctor.phone}</span>
            </div>
          )}
          {doctor.email && (
            <div className="flex items-center gap-2">
              <svg className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <span className="text-xs text-gray-500 truncate">{doctor.email}</span>
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="border-t border-gray-100 px-5 py-3 bg-gray-50 flex gap-2">
        <button
          onClick={onProfile}
          className="flex-1 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          View Profile
        </button>
        <button
          onClick={onBook}
          className="flex-1 px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Book Appointment
        </button>
      </div>
    </div>
  );
}
