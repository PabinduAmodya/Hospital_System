import { useEffect, useMemo, useState } from "react";
import API from "../api/axios";
import DashboardLayout from "../layouts/DashboardLayout";
import Card from "../components/ui/Card";
import Input from "../components/ui/Input";
import Select from "../components/ui/Select";
import Button from "../components/ui/Button";

function Schedules() {
  const [schedules, setSchedules] = useState([]);
  const [doctors, setDoctors]     = useState([]);
  const [loading, setLoading]     = useState(false);
  const [q, setQ]                 = useState("");

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
        doctorId:  Number(form.doctorId),
        day:       form.day,
        startTime: form.startTime,
        endTime:   form.endTime,
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

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return schedules;
    return schedules.filter((sc) =>
      [String(sc.id), sc.doctorName || "", sc.day, sc.startTime, sc.endTime].some(
        (v) => v.toLowerCase().includes(s)
      )
    );
  }, [schedules, q]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold">Schedules</h2>
            <p className="text-gray-600 mt-1">Manage doctor schedules (day + time window).</p>
          </div>
          <div className="w-72">
            <Input placeholder="Search schedules..." value={q} onChange={(e) => setQ(e.target.value)} />
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
              {["MONDAY","TUESDAY","WEDNESDAY","THURSDAY","FRIDAY","SATURDAY","SUNDAY"].map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </Select>

            <Input type="time" name="startTime" value={form.startTime} onChange={onChange} required />
            <Input type="time" name="endTime"   value={form.endTime}   onChange={onChange} required />

            <div className="md:col-span-4 flex justify-end">
              <Button type="submit">Add Schedule</Button>
            </div>
          </form>
        </Card>

        <Card title="Schedules List" subtitle={loading ? "Loading..." : `${filtered.length} records`}>
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
                  <tr key={sc.id} className="border-t">
                    <td className="p-3">{sc.id}</td>
                    <td className="p-3 font-medium">{sc.doctorName || "—"}</td>
                    <td className="p-3 text-gray-500">{sc.doctorSpecialization || "—"}</td>
                    <td className="p-3">{sc.day}</td>
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