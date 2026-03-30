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
  Cardiology: "bg-red-100 text-red-700",
  Neurology: "bg-purple-100 text-purple-700",
  Orthopedics: "bg-blue-100 text-blue-700",
  Pediatrics: "bg-pink-100 text-pink-700",
  Dermatology: "bg-amber-100 text-amber-700",
  default: "bg-gray-100 text-gray-700",
};

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

function formatDate(dateStr) {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
}

const DAY_NAMES = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];

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

const STEPS = ["Select Date & Time", "Confirm Booking", "Booking Confirmed"];

export default function BookAppointment() {
  const { doctorId } = useParams();
  const navigate = useNavigate();
  const { toasts, toast, remove } = useToast();

  const [step, setStep] = useState(1);
  const [doctor, setDoctor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(null);
  const [slots, setSlots] = useState(null);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [notes, setNotes] = useState("");
  const [booking, setBooking] = useState(false);
  const [bookingResult, setBookingResult] = useState(null);

  const next14Days = useMemo(() => getNext14Days(), []);

  // Available schedule days
  const scheduleDays = useMemo(() => {
    if (!doctor?.schedules) return new Set();
    return new Set(doctor.schedules.map((s) => s.dayOfWeek));
  }, [doctor]);

  useEffect(() => {
    fetchDoctor();
  }, [doctorId]);

  async function fetchDoctor() {
    setLoading(true);
    try {
      const res = await API.get(`/patient-portal/doctors/${doctorId}`);
      setDoctor(res.data);
    } catch (err) {
      toast.error("Failed to load doctor information.");
    } finally {
      setLoading(false);
    }
  }

  async function fetchSlots(date) {
    setSlotsLoading(true);
    setSlots(null);
    setSelectedSlot(null);
    try {
      const res = await API.get(`/patient-portal/doctors/${doctorId}/slots?date=${date}`);
      setSlots(res.data);
    } catch (err) {
      toast.error("Failed to load available slots.");
    } finally {
      setSlotsLoading(false);
    }
  }

  function handleDateSelect(dateInfo) {
    if (!scheduleDays.has(dateInfo.dayOfWeek)) return;
    setSelectedDate(dateInfo);
    fetchSlots(dateInfo.date);
  }

  function handleSlotSelect(slot) {
    setSelectedSlot(slot);
  }

  function proceedToConfirm() {
    if (!selectedSlot) {
      toast.warning("Please select a time slot first.");
      return;
    }
    setStep(2);
  }

  async function confirmBooking() {
    setBooking(true);
    try {
      const res = await API.post("/patient-portal/appointments/book", {
        scheduleId: selectedSlot.scheduleId,
        date: selectedDate.date,
        notes: notes.trim() || undefined,
      });
      setBookingResult(res.data);
      setStep(3);
      toast.success("Appointment booked successfully!");
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.error || "Failed to book appointment. Please try again.";
      toast.error(msg);
    } finally {
      setBooking(false);
    }
  }

  if (loading) {
    return (
      <PatientLayout>
        <LoadingSpinner message="Loading doctor information..." />
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

      {/* Header with Back */}
      <div className="mb-6">
        <button onClick={() => navigate("/patient/doctors")} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-3 transition-colors">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to doctors
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Book Appointment</h1>
      </div>

      {/* Step Indicator */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 mb-6">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          {STEPS.map((label, i) => {
            const stepNum = i + 1;
            const isActive = step === stepNum;
            const isDone = step > stepNum;
            return (
              <div key={i} className="flex items-center gap-2 flex-1">
                <div className="flex flex-col items-center flex-shrink-0">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${
                    isDone ? "bg-green-500 text-white" : isActive ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-500"
                  }`}>
                    {isDone ? (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : stepNum}
                  </div>
                  <span className={`text-[10px] mt-1 font-medium whitespace-nowrap ${isActive ? "text-blue-600" : "text-gray-400"}`}>
                    {label}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`flex-1 h-0.5 rounded mx-2 mb-4 ${isDone ? "bg-green-400" : "bg-gray-200"}`} />
                )}
              </div>
            );
          })}
        </div>
        {/* Progress bar */}
        <div className="mt-3 h-1 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-600 rounded-full transition-all duration-500"
            style={{ width: `${((step - 1) / (STEPS.length - 1)) * 100}%` }}
          />
        </div>
      </div>

      {/* Doctor Info Card (always visible in steps 1 & 2) */}
      {step <= 2 && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 mb-6">
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 rounded-full ${getAvatarColor(doctor.name)} flex items-center justify-center text-white text-lg font-bold flex-shrink-0`}>
              {getInitials(doctor.name)}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-semibold text-gray-900">Dr. {doctor.name}</h3>
              <span className={`inline-block mt-0.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${getSpecColor(doctor.specialization)}`}>
                {doctor.specialization}
              </span>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-xs text-gray-500">Consultation Fee</p>
              <p className="text-lg font-bold text-blue-600">Rs. {formatFee(doctor.consultationFee)}</p>
            </div>
          </div>
        </div>
      )}

      {/* STEP 1: Date & Time Selection */}
      {step === 1 && (
        <div className="space-y-6">
          {/* Date Picker */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Select a Date</h3>
            <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-thin">
              {next14Days.map((d) => {
                const isAvailable = scheduleDays.has(d.dayOfWeek);
                const isSelected = selectedDate?.date === d.date;
                return (
                  <button
                    key={d.date}
                    onClick={() => isAvailable && handleDateSelect(d)}
                    disabled={!isAvailable}
                    className={`flex flex-col items-center min-w-[72px] px-3 py-3 rounded-xl border-2 transition-all flex-shrink-0 ${
                      isSelected
                        ? "border-blue-500 bg-blue-50 text-blue-700"
                        : isAvailable
                          ? "border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50/50 cursor-pointer"
                          : "border-gray-100 bg-gray-50 text-gray-300 cursor-not-allowed"
                    }`}
                  >
                    <span className="text-[10px] font-medium uppercase">{d.dayName}</span>
                    <span className={`text-xl font-bold my-0.5 ${isSelected ? "text-blue-700" : isAvailable ? "text-gray-900" : "text-gray-300"}`}>
                      {d.day}
                    </span>
                    <span className="text-[10px]">{d.month}</span>
                    {d.isToday && (
                      <span className="text-[8px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full mt-1 font-medium">TODAY</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Time Slots */}
          {selectedDate && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
              <h3 className="text-sm font-semibold text-gray-700 mb-1">
                Available Slots for {formatDate(selectedDate.date)}
              </h3>

              {slotsLoading ? (
                <div className="flex items-center justify-center py-10">
                  <div className="h-8 w-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
                </div>
              ) : !slots || (Array.isArray(slots) && slots.length === 0) ? (
                <div className="text-center py-10">
                  <p className="text-gray-400 text-sm">No available slots for this date.</p>
                </div>
              ) : (
                <div className="space-y-3 mt-3">
                  {(Array.isArray(slots) ? slots : [slots]).map((slot, i) => {
                    const isSelected = selectedSlot?.scheduleId === slot.scheduleId;
                    const isFull = slot.availableSlots === 0;
                    return (
                      <button
                        key={i}
                        onClick={() => !isFull && handleSlotSelect(slot)}
                        disabled={isFull}
                        className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all text-left ${
                          isSelected
                            ? "border-blue-500 bg-blue-50"
                            : isFull
                              ? "border-gray-100 bg-gray-50 cursor-not-allowed opacity-60"
                              : "border-gray-200 hover:border-blue-300 hover:bg-blue-50/30 cursor-pointer"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isSelected ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600"}`}>
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-gray-900">
                              {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
                            </p>
                            <p className={`text-xs mt-0.5 ${isFull ? "text-red-500" : "text-green-600"}`}>
                              {isFull ? "Fully booked" : `${slot.availableSlots} slot${slot.availableSlots !== 1 ? "s" : ""} available`}
                            </p>
                          </div>
                        </div>
                        {isSelected && (
                          <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center">
                            <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Continue Button */}
          {selectedSlot && (
            <div className="flex justify-end">
              <Button onClick={proceedToConfirm} className="px-8 py-3 text-base">
                Continue to Confirm
              </Button>
            </div>
          )}
        </div>
      )}

      {/* STEP 2: Confirm Booking */}
      {step === 2 && (
        <div className="max-w-xl mx-auto space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 bg-gray-50 border-b border-gray-100">
              <h3 className="text-sm font-semibold text-gray-900">Booking Summary</h3>
            </div>
            <div className="p-5 space-y-3">
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-sm text-gray-500">Doctor</span>
                <span className="text-sm font-medium text-gray-900">Dr. {doctor.name} ({doctor.specialization})</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-sm text-gray-500">Date</span>
                <span className="text-sm font-medium text-gray-900">{formatDate(selectedDate?.date)}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-sm text-gray-500">Time</span>
                <span className="text-sm font-medium text-gray-900">
                  {formatTime(selectedSlot?.startTime)} - {formatTime(selectedSlot?.endTime)}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-sm text-gray-500">Consultation Fee</span>
                <span className="text-sm font-medium text-gray-900">Rs. {formatFee(doctor.consultationFee)}</span>
              </div>
              {selectedSlot?.hospitalCharge > 0 && (
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-500">Hospital Charge</span>
                  <span className="text-sm font-medium text-gray-900">Rs. {formatFee(selectedSlot.hospitalCharge)}</span>
                </div>
              )}
              <div className="flex justify-between py-3 bg-blue-50 -mx-5 px-5 rounded-b-xl">
                <span className="text-sm font-semibold text-gray-900">Total</span>
                <span className="text-lg font-bold text-blue-600">
                  Rs. {formatFee((doctor.consultationFee || 0) + (selectedSlot?.hospitalCharge || 0))}
                </span>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Any specific concerns? <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="E.g., I have been experiencing chest pain for the last 2 days..."
              rows={3}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500 resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => setStep(1)} className="flex-1 py-3 text-base">
              Back
            </Button>
            <button
              onClick={confirmBooking}
              disabled={booking}
              className="flex-1 py-3 text-base font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {booking ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Booking...
                </span>
              ) : (
                "Confirm Booking"
              )}
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: Booking Confirmed */}
      {step === 3 && (
        <div className="max-w-md mx-auto text-center space-y-6 py-8">
          {/* Success Icon */}
          <div className="flex justify-center">
            <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center animate-bounce-once">
              <div className="w-14 h-14 rounded-full bg-green-500 flex items-center justify-center">
                <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-gray-900">Appointment Booked!</h2>
            {bookingResult?.tokenNumber && (
              <div className="mt-3 inline-flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-xl px-5 py-3">
                <span className="text-sm text-blue-600">Token Number</span>
                <span className="text-2xl font-bold text-blue-700">#{bookingResult.tokenNumber}</span>
              </div>
            )}
          </div>

          {/* Summary */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 text-left space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Doctor</span>
              <span className="text-sm font-medium text-gray-900">Dr. {doctor.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Date</span>
              <span className="text-sm font-medium text-gray-900">{formatDate(selectedDate?.date)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Time</span>
              <span className="text-sm font-medium text-gray-900">
                {formatTime(selectedSlot?.startTime)} - {formatTime(selectedSlot?.endTime)}
              </span>
            </div>
          </div>

          <p className="text-sm text-gray-500 leading-relaxed">
            Your appointment has been confirmed. Please arrive 15 minutes before your scheduled time.
          </p>

          <div className="flex gap-3">
            <Button
              variant="secondary"
              onClick={() => navigate("/patient/appointments")}
              className="flex-1 py-3"
            >
              View My Appointments
            </Button>
            <Button
              onClick={() => navigate("/patient/doctors")}
              className="flex-1 py-3"
            >
              Book Another
            </Button>
          </div>
        </div>
      )}
    </PatientLayout>
  );
}
