import { useEffect, useMemo, useState } from "react";
import API from "../api/axios";
import DashboardLayout from "../layouts/DashboardLayout";
import Card from "../components/ui/Card";
import Input from "../components/ui/Input";
import Button from "../components/ui/Button";

function Doctors() {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [q, setQ] = useState("");

  const [form, setForm] = useState({
    name: "",
    specialization: "",
    phone: "",
    email: "",
    channeling_fee: "",
  });

  const fetchDoctors = async () => {
    setLoading(true);
    try {
      const res = await API.get("/doctors");
      setDoctors(res.data);
    } catch (e) {
      console.error(e);
      alert("Failed to fetch doctors.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctors();
  }, []);

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const addDoctor = async (e) => {
    e.preventDefault();
    try {
      await API.post("/doctors/add", {
        ...form,
        channeling_fee: Number(form.channeling_fee),
      });
      setForm({ name: "", specialization: "", phone: "", email: "", channeling_fee: "" });
      fetchDoctors();
    } catch (e) {
      console.error(e);
      alert(e?.response?.data?.message || e?.response?.data || "Failed to add doctor");
    }
  };

  const deleteDoctor = async (id) => {
    if (!confirm("Delete this doctor?")) return;
    try {
      await API.delete(`/doctors/${id}`);
      fetchDoctors();
    } catch (e) {
      console.error(e);
      alert("Failed to delete doctor");
    }
  };

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return doctors;
    return doctors.filter((d) =>
      [d.name, d.specialization, d.phone, d.email, String(d.id)].some((v) => (v || "").toString().toLowerCase().includes(s))
    );
  }, [doctors, q]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold">Doctor Management</h2>
            <p className="text-gray-600 mt-1">Add and manage doctors.</p>
          </div>
          <div className="w-72">
            <Input placeholder="Search doctors..." value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
        </div>

        <Card title="Add Doctor">
          <form onSubmit={addDoctor} className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <Input name="name" placeholder="Full name" value={form.name} onChange={onChange} required />
            <Input name="specialization" placeholder="Specialization" value={form.specialization} onChange={onChange} required />
            <Input name="phone" placeholder="Phone" value={form.phone} onChange={onChange} required />
            <Input name="email" placeholder="Email" value={form.email} onChange={onChange} required />
            <Input name="channeling_fee" type="number" step="0.01" placeholder="Channeling Fee" value={form.channeling_fee} onChange={onChange} required />
            <div className="md:col-span-5 flex justify-end">
              <Button type="submit">Add Doctor</Button>
            </div>
          </form>
        </Card>

        <Card title="Doctors List" subtitle={loading ? "Loading..." : `${filtered.length} records`}>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="p-3">ID</th>
                  <th className="p-3">Name</th>
                  <th className="p-3">Specialization</th>
                  <th className="p-3">Phone</th>
                  <th className="p-3">Email</th>
                  <th className="p-3">Fee</th>
                  <th className="p-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((d) => (
                  <tr key={d.id} className="border-t">
                    <td className="p-3">{d.id}</td>
                    <td className="p-3 font-medium">{d.name}</td>
                    <td className="p-3">{d.specialization}</td>
                    <td className="p-3">{d.phone}</td>
                    <td className="p-3">{d.email}</td>
                    <td className="p-3">{d.channelling_fee ?? d.channeling_fee}</td>
                    <td className="p-3">
                      <Button variant="danger" onClick={() => deleteDoctor(d.id)}>Delete</Button>
                    </td>
                  </tr>
                ))}

                {!loading && filtered.length === 0 && (
                  <tr>
                    <td colSpan="7" className="p-6 text-center text-gray-500">
                      No doctors found
                    </td>
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

export default Doctors;
