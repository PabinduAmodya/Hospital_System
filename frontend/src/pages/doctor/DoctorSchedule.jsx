import { useState, useEffect } from "react";
import API from "../../api/axios";
import DoctorLayout from "../../layouts/DoctorLayout";
import Card from "../../components/ui/Card";
import LoadingSpinner from "../../components/ui/LoadingSpinner";
import EmptyState from "../../components/ui/EmptyState";

const DAYS_ORDER = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"];
const DAY_SHORT = { MONDAY: "Mon", TUESDAY: "Tue", WEDNESDAY: "Wed", THURSDAY: "Thu", FRIDAY: "Fri", SATURDAY: "Sat", SUNDAY: "Sun" };

function formatTime12(time) {
  if (!time) return "";
  // Handle "HH:mm" or "HH:mm:ss" format
  const parts = time.split(":");
  let h = parseInt(parts[0], 10);
  const m = parts[1] || "00";
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return `${h}:${m} ${ampm}`;
}

function formatDateShort(dateStr) {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

function getTodayDayName() {
  return ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"][new Date().getDay()];
}

function getNext7Days() {
  const days = [];
  const today = new Date();
  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    days.push(d);
  }
  return days;
}

function isSameDay(d1, d2) {
  return d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth() && d1.getDate() === d2.getDate();
}

function DoctorSchedule() {
  const [doctor, setDoctor] = useState(null);
  const [schedules, setSchedules] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingAppointments, setLoadingAppointments] = useState(true);

  const todayDay = getTodayDayName();
  const next7Days = getNext7Days();

  useEffect(() => {
    fetchDoctor();
    fetchAppointments();
  }, []);

  const fetchDoctor = async () => {
    try {
      const res = await API.get("/doctors/me");
      setDoctor(res.data);
      setSchedules(res.data?.schedules || []);
    } catch (err) {
      console.error("Failed to load doctor info:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAppointments = async () => {
    try {
      const res = await API.get("/doctors/me/appointments");
      setAppointments(res.data || []);
    } catch (err) {
      console.error("Failed to load appointments:", err);
    } finally {
      setLoadingAppointments(false);
    }
  };

  // Build schedule map by day
  const scheduleByDay = {};
  schedules.forEach((s) => {
    const day = (s.day || s.dayOfWeek || "").toUpperCase();
    if (!scheduleByDay[day]) scheduleByDay[day] = [];
    scheduleByDay[day].push(s);
  });

  // Filter appointments to next 7 days
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const endRange = new Date(today);
  endRange.setDate(endRange.getDate() + 7);
  endRange.setHours(23, 59, 59, 999);

  const upcomingAppointments = appointments.filter((a) => {
    const aDate = new Date(a.appointmentDate || a.appointmentTime || a.startTime || a.createdAt);
    return aDate >= today && aDate <= endRange;
  });

  // Group upcoming by date
  const appointmentsByDate = {};
  upcomingAppointments.forEach((a) => {
    const aDate = new Date(a.appointmentDate || a.appointmentTime || a.startTime || a.createdAt);
    const key = aDate.toISOString().split("T")[0];
    if (!appointmentsByDate[key]) appointmentsByDate[key] = [];
    appointmentsByDate[key].push(a);
  });

  const sortedDates = Object.keys(appointmentsByDate).sort();

  return (
    <DoctorLayout>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">My Schedule</h1>
        <p className="text-sm text-gray-500 mt-1">
          Your weekly schedule and upcoming appointments
        </p>
      </div>

      {loading ? (
        <LoadingSpinner message="Loading schedule..." />
      ) : (
        <>
          {/* Weekly Schedule Grid */}
          <Card title="Weekly Schedule" subtitle="Your regular consultation hours" className="mb-6">
            {schedules.length === 0 ? (
              <EmptyState
                title="No schedule set"
                message="Your schedule has not been configured yet. Please contact the administrator."
                icon={
                  <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                }
              />
            ) : (
              <div className="grid grid-cols-7 gap-3">
                {DAYS_ORDER.map((day) => {
                  const isToday = day === todayDay;
                  const daySchedules = scheduleByDay[day] || [];
                  const hasSchedule = daySchedules.length > 0;

                  return (
                    <div
                      key={day}
                      className={`rounded-xl border-2 p-4 text-center transition-all ${
                        isToday
                          ? "border-blue-400 bg-blue-50 shadow-sm shadow-blue-100"
                          : hasSchedule
                          ? "border-emerald-200 bg-emerald-50/50"
                          : "border-gray-200 bg-gray-50"
                      }`}
                    >
                      <p className={`text-xs font-bold uppercase tracking-wider mb-2 ${
                        isToday ? "text-blue-700" : hasSchedule ? "text-emerald-700" : "text-gray-400"
                      }`}>
                        {DAY_SHORT[day]}
                      </p>
                      {isToday && (
                        <span className="inline-block px-2 py-0.5 bg-blue-500 text-white text-[10px] font-semibold rounded-full mb-2">
                          TODAY
                        </span>
                      )}
                      {hasSchedule ? (
                        <div className="space-y-1.5">
                          {daySchedules.map((s, i) => (
                            <div key={s.id || i} className={`text-xs font-medium rounded-lg px-2 py-1.5 ${
                              isToday ? "bg-blue-100 text-blue-800" : "bg-emerald-100 text-emerald-800"
                            }`}>
                              <p>{formatTime12(s.startTime)}</p>
                              <p className="text-[10px] opacity-70">to</p>
                              <p>{formatTime12(s.endTime)}</p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-gray-400 mt-2">Off</p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          {/* Upcoming Appointments */}
          <Card
            title="Upcoming Appointments"
            subtitle="Next 7 days"
            right={
              <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full">
                {upcomingAppointments.length} appointment{upcomingAppointments.length !== 1 ? "s" : ""}
              </span>
            }
          >
            {loadingAppointments ? (
              <LoadingSpinner message="Loading appointments..." size="sm" />
            ) : sortedDates.length === 0 ? (
              <EmptyState
                title="No upcoming appointments"
                message="You have no appointments scheduled for the next 7 days."
                icon={
                  <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                }
              />
            ) : (
              <div className="space-y-4">
                {sortedDates.map((dateKey) => {
                  const appts = appointmentsByDate[dateKey];
                  const dateObj = new Date(dateKey + "T00:00:00");
                  const isToday = isSameDay(dateObj, new Date());

                  return (
                    <div key={dateKey} className={`rounded-xl border p-4 ${isToday ? "border-blue-200 bg-blue-50/50" : "border-gray-100 bg-gray-50"}`}>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <h4 className={`text-sm font-semibold ${isToday ? "text-blue-800" : "text-gray-900"}`}>
                            {formatDateShort(dateKey)}
                          </h4>
                          {isToday && (
                            <span className="px-2 py-0.5 bg-blue-500 text-white text-[10px] font-semibold rounded-full">
                              TODAY
                            </span>
                          )}
                        </div>
                        <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                          isToday ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-600"
                        }`}>
                          {appts.length} patient{appts.length !== 1 ? "s" : ""}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {appts.map((a) => {
                          const patient = a.patient || {};
                          const time = a.appointmentTime || a.startTime;
                          return (
                            <div key={a.id} className="inline-flex items-center gap-2 px-3 py-1.5 bg-white rounded-lg border border-gray-200 text-xs">
                              <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[10px] font-bold">
                                {a.tokenNumber || "#"}
                              </span>
                              <span className="font-medium text-gray-700">
                                {patient.firstName} {patient.lastName}
                              </span>
                              {time && (
                                <span className="text-gray-400">
                                  {new Date(time).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })}
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </>
      )}
    </DoctorLayout>
  );
}

export default DoctorSchedule;
