import { useEffect, useMemo, useState } from "react";
import API from "../api/axios";
import DashboardLayout from "../layouts/DashboardLayout";
import Card from "../components/ui/Card";
import Input from "../components/ui/Input";
import Select from "../components/ui/Select";
import Button from "../components/ui/Button";

const DAYS = ["MONDAY","TUESDAY","WEDNESDAY","THURSDAY","FRIDAY","SATURDAY","SUNDAY"];

function Schedules() {
  const [schedules, setSchedules] = useState([]);
  const [doctors, setDoctors]     = useState([]);
  const [loading, setLoading]     = useState(false);

  // filters
  const [q, setQ]               = useState("");
  const [filterDay, setFilterDay]     = useState("");
  const [filterDoctor, setFilterDoctor] = useState("");

  const [form, setForm] = useState({
    doctorId: "", day: "MONDAY", startTime: "09:00", endTime: "12:00",
  });

  const load = async () => {
    setLoading(true);
    try {
      const [sRes, dRes] = await Promise.all([API.get("/schedules"), API.get("/doctors")]);
      setSchedules(sRes.data);
      setDoctors(dRes.data);
    } catch (e) {
      alert("Failed to load schedules/doctors.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const addSchedule = async (e) => {
    e.preventDefault();
    try {
      await API.post("/schedules/add", {
        doctorId: Number(form.doctorId),
        day: form.day, startTime: form.startTime, endTime: form.endTime,
      });
      setForm({ doctorId: "", day: "MONDAY", startTime: "09:00", endTime: "12:00" });
      load();
    } catch (e) {
      alert(e?.response?.data?.message || e?.response?.data || "Failed to add schedule");
    }
  };

  const deleteSchedule = async (id) => {
    if (!confirm("Delete this schedule?")) return;
    try {
      await API.delete(`/schedules/${id}`);
      load();
    } catch (e) {
      alert("Failed to delete schedule");
    }
  };

  // Use flat ScheduleResponse fields (doctorName, not doctor?.name)
  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return schedules
      .filter((sc) => filterDay    ? sc.day === filterDay               : true)
      .filter((sc) => filterDoctor ? String(sc.doctorId) === filterDoctor : true)
      .filter((sc) => {
        if (!s) return true;
        return [
          String(sc.id),
          sc.doctorName || "",
          sc.doctorSpecialization || "",
          sc.day || "",
          sc.startTime || "",
          sc.endTime || "",
        ].some((v) => v.toLowerCase().includes(s));
      });
  }, [schedules, q, filterDay, filterDoctor]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold">Schedules</h2>
            <p className="text-gray-600 mt-1">Manage doctor schedules (day + time window).</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 sm:items-center flex-wrap">
            {/* Filter by doctor */}
            <Select value={filterDoctor} onChange={(e) => setFilterDoctor(e.target.value)} className="w-44">
              <option value="">All doctors</option>
              {doctors.map((d) => <option key={d.id} value={String(d.id)}>{d.name}</option>)}
            </Select>
            {/* Filter by day */}
            <Select value={filterDay} onChange={(e) => setFilterDay(e.target.value)} className="w-36">
              <option value="">All days</option>
              {DAYS.map((d) => <option key={d} value={d}>{d.charAt(0) + d.slice(1).toLowerCase()}</option>)}
            </Select>
            <div className="w-64">
              <Input placeholder="Search schedules..." value={q} onChange={(e) => setQ(e.target.value)} />
            </div>
          </div>
        </div>

        <Card title="Add Schedule">
          <form onSubmit={addSchedule} className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Select name="doctorId" value={form.doctorId} onChange={onChange} required>
              <option value="">Select Doctor</option>
              {doctors.map((d) => (
                <option key={d.id} value={d.id}>{d.name} ({d.specialization})</option>
              ))}
            </Select>
            <Select name="day" value={form.day} onChange={onChange}>
              {DAYS.map((d) => <option key={d} value={d}>{d}</option>)}
            </Select>
            <Input type="time" name="startTime" value={form.startTime} onChange={onChange} required />
            <Input type="time" name="endTime"   value={form.endTime}   onChange={onChange} required />
            <div className="md:col-span-4 flex justify-end">
              <Button type="submit">Add Schedule</Button>
            </div>
          </form>
        </Card>

        <Card title="Schedules List" subtitle={loading ? "Loading..." : `${filtered.length} of ${schedules.length} records`}>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="p-3">ID</th>
                  <th className="p-3">Doctor</th>
                  <th className="p-3">Specialization</th>
                  <th className="p-3">Day</th>
                  <th className="p-3">Start</th>
                  <th className="p-3">End</th>
                  <th className="p-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((sc) => (
                  <tr key={sc.id} className="border-t hover:bg-gray-50">
                    <td className="p-3 text-gray-500">{sc.id}</td>
                    <td className="p-3 font-medium">{sc.doctorName || "—"}</td>
                    <td className="p-3 text-gray-500">{sc.doctorSpecialization || "—"}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                        {sc.day ? sc.day.charAt(0) + sc.day.slice(1).toLowerCase() : "—"}
                      </span>
                    </td>
                    <td className="p-3">{sc.startTime}</td>
                    <td className="p-3">{sc.endTime}</td>
                    <td className="p-3">
                      <Button variant="danger" onClick={() => deleteSchedule(sc.id)}>Delete</Button>
                    </td>
                  </tr>
                ))}
                {!loading && filtered.length === 0 && (
                  <tr>
                    <td colSpan="7" className="p-6 text-center text-gray-500">No schedules found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}

export default Schedules;