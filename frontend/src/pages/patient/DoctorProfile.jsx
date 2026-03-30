import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../../api/axios";
import PatientLayout from "../../layouts/PatientLayout";
import Button from "../../components/ui/Button";
import LoadingSpinner from "../../components/ui/LoadingSpinner";
import { useToast, Toast } from "../../components/ui/Toast";

const AVATAR_COLORS = [
  "bg-blue-500", "bg-emerald-500", "bg-violet-500", "bg-rose-500",
  "bg-amber-500", "bg-cyan-500", "bg-indigo-500", "bg-pink-500",
];

const SPEC_COLORS = {
  Cardiology: "bg-red-100 text-red-700 border-red-200",
  Neurology: "bg-purple-100 text-purple-700 border-purple-200",
  Orthopedics: "bg-blue-100 text-blue-700 border-blue-200",
  Pediatrics: "bg-pink-100 text-pink-700 border-pink-200",
  Dermatology: "bg-amber-100 text-amber-700 border-amber-200",
  Ophthalmology: "bg-cyan-100 text-cyan-700 border-cyan-200",
  ENT: "bg-teal-100 text-teal-700 border-teal-200",
  Gynecology: "bg-rose-100 text-rose-700 border-rose-200",
  default: "bg-gray-100 text-gray-700 border-gray-200",
};

const DAY_ORDER = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"];
const DAY_NAMES = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];

function getInitials(name) {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  return parts.length >= 2 ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase() : name.slice(0, 2).toUpperCase();
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

function formatTime(t) {
  if (!t) return "";
  const [h, m] = t.split(":");
  const hr = parseInt(h, 10);
  const ampm = hr >= 12 ? "PM" : "AM";
  const h12 = hr % 12 || 12;
  return `${h12}:${m} ${ampm}`;
}

function getNext14Days() {
  const days = [];
  const today = new Date();
  for (let i = 0; i < 14; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    days.push({
      date: d.toISOString().split("T")[0],
      day: d.getDate(),
      dayName: d.toLocaleDateString("en-US", { weekday: "short" }),
      dayOfWeek: DAY_NAMES[d.getDay()],
      month: d.toLocaleDateString("en-US", { month: "short" }),
      isToday: i === 0,
    });
  }
  return days;
}

export default function DoctorProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toasts, toast, remove } = useToast();

  const [doctor, setDoctor] = useState(null);
  const [loading, setLoading] = useState(true);

  const next14Days = useMemo(() => getNext14Days(), []);

  const scheduleDays = useMemo(() => {
    if (!doctor?.schedules) return new Set();
    return new Set(doctor.schedules.map((s) => s.dayOfWeek));
  }, [doctor]);

  const sortedSchedules = useMemo(() => {
    if (!doctor?.schedules) return [];
    return [...doctor.schedules].sort((a, b) => DAY_ORDER.indexOf(a.dayOfWeek) - DAY_ORDER.indexOf(b.dayOfWeek));
  }, [doctor]);

  const availableDates = useMemo(() => {
    return next14Days.filter((d) => scheduleDays.has(d.dayOfWeek));
  }, [next14Days, scheduleDays]);

  useEffect(() => {
    fetchDoctor();
  }, [id]);

  async function fetchDoctor() {
    setLoading(true);
    try {
      const res = await API.get(`/patient-portal/doctors/${id}`);
      setDoctor(res.data);
    } catch (err) {
      toast.error("Failed to load doctor profile.");
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <PatientLayout>
        <LoadingSpinner message="Loading doctor profile..." />
      </PatientLayout>
    );
  }

  if (!doctor) {
    return (
      <PatientLayout>
        <div className="text-center py-20">
          <p className="text-gray-500">Doctor not found.</p>
          <Button className="mt-4" onClick={() => navigate("/patient/doctors")}>Back to Doctors</Button>
        </div>
      </PatientLayout>
    );
  }

  return (
    <PatientLayout>
      <Toast toasts={toasts} remove={remove} />

      {/* Back button */}
      <button onClick={() => navigate("/patient/doctors")} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4 transition-colors">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to doctors
      </button>

      {/* Doctor Header */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mb-6">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-8">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
            <div className={`w-24 h-24 rounded-full ${getAvatarColor(doctor.name)} flex items-center justify-center text-white text-3xl font-bold border-4 border-white/30 flex-shrink-0`}>
              {getInitials(doctor.name)}
            </div>
            <div className="text-center sm:text-left">
              <h1 className="text-2xl font-bold text-white">Dr. {doctor.name}</h1>
              <span className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-semibold border ${getSpecColor(doctor.specialization)}`}>
                {doctor.specialization}
              </span>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 mt-3">
                <span className="text-blue-100 text-sm flex items-center gap-1.5">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Rs. {formatFee(doctor.consultationFee)}
                </span>
              </div>
            </div>
            <div className="sm:ml-auto flex-shrink-0">
              <button
                onClick={() => navigate(`/patient/book/${doctor.id}`)}
                className="px-6 py-3 bg-white text-blue-600 font-semibold rounded-xl hover:bg-blue-50 transition-colors shadow-lg"
              >
                Book Appointment
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Contact & Info */}
        <div className="space-y-6">
          {/* Contact Info */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Contact Information</h3>
            <div className="space-y-4">
              {doctor.phone && (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Phone</p>
                    <p className="text-sm font-medium text-gray-900">{doctor.phone}</p>
                  </div>
                </div>
              )}
              {doctor.email && (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Email</p>
                    <p className="text-sm font-medium text-gray-900 break-all">{doctor.email}</p>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Consultation Fee</p>
                  <p className="text-sm font-bold text-gray-900">Rs. {formatFee(doctor.consultationFee)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Book (mobile CTA) */}
          <div className="lg:hidden">
            <button
              onClick={() => navigate(`/patient/book/${doctor.id}`)}
              className="w-full py-3.5 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors text-base"
            >
              Book Appointment
            </button>
          </div>
        </div>

        {/* Right Column: Schedule & Available Dates */}
        <div className="lg:col-span-2 space-y-6">
          {/* Weekly Schedule */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h3 className="text-sm font-semibold text-gray-900">Weekly Schedule</h3>
            </div>
            {sortedSchedules.length > 0 ? (
              <div className="divide-y divide-gray-100">
                {sortedSchedules.map((s, i) => (
                  <div key={i} className="flex items-center justify-between px-5 py-3.5 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-green-500" />
                      <span className="text-sm font-medium text-gray-900">
                        {s.dayOfWeek.charAt(0) + s.dayOfWeek.slice(1).toLowerCase()}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-gray-600">
                        {formatTime(s.startTime)} - {formatTime(s.endTime)}
                      </span>
                      {s.maxPatients && (
                        <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                          {s.maxPatients} slots
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-5 text-center text-sm text-gray-400">No schedule available.</div>
            )}
          </div>

          {/* Available Dates - Next 2 Weeks */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Available Dates (Next 2 Weeks)</h3>
            {availableDates.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {availableDates.map((d) => (
                  <button
                    key={d.date}
                    onClick={() => navigate(`/patient/book/${doctor.id}`)}
                    className="flex flex-col items-center min-w-[80px] px-3 py-3 rounded-xl border-2 border-gray-200 bg-white hover:border-blue-400 hover:bg-blue-50 transition-all group"
                  >
                    <span className="text-[10px] font-medium uppercase text-gray-400 group-hover:text-blue-500">{d.dayName}</span>
                    <span className="text-lg font-bold text-gray-900 group-hover:text-blue-700">{d.day}</span>
                    <span className="text-[10px] text-gray-400 group-hover:text-blue-500">{d.month}</span>
                    {d.isToday && (
                      <span className="text-[8px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full mt-1 font-medium">TODAY</span>
                    )}
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400 text-center py-6">No available dates in the next 2 weeks.</p>
            )}
          </div>
        </div>
      </div>
    </PatientLayout>
  );
}
