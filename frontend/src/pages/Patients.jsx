import { useEffect, useMemo, useState } from "react";
import API from "../api/axios";
import DashboardLayout from "../layouts/DashboardLayout";
import Card from "../components/ui/Card";
import Input from "../components/ui/Input";
import Select from "../components/ui/Select";
import Button from "../components/ui/Button";

function Patients() {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [q, setQ] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    gender: "",
    dob: "", // YYYY-MM-DD
  });

  const fetchPatients = async () => {
    setLoading(true);
    try {
      const res = await API.get("/patients");
      setPatients(res.data);
    } catch (error) {
      console.error("Error fetching patients", error);
      alert("Failed to fetch patients. Check backend + token.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, []);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await API.post("/patients/register", formData);
      setFormData({ name: "", phone: "", email: "", gender: "", dob: "" });
      fetchPatients();
    } catch (error) {
      console.error("Error adding patient", error);
      alert(error?.response?.data?.message || error?.response?.data || "Failed to add patient");
    }
  };

  const deletePatient = async (id) => {
    if (!confirm("Delete this patient?")) return;
    try {
      await API.delete(`/patients/${id}`);
      fetchPatients();
    } catch (error) {
      console.error("Error deleting patient", error);
      alert(error?.response?.data?.message || error?.response?.data || "Failed to delete patient");
    }
  };

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return patients;
    return patients.filter((p) =>
      [p.name, p.phone, p.email, p.gender, String(p.id)].some((v) => (v || "").toString().toLowerCase().includes(s))
    );
  }, [patients, q]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold">Patient Management</h2>
            <p className="text-gray-600 mt-1">Create, view, and delete patients.</p>
          </div>

          <div className="w-72">
            <Input placeholder="Search patients..." value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
        </div>

        <Card title="Register New Patient">
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <Input name="name" placeholder="Full name" value={formData.name} onChange={handleChange} required />
            <Input name="phone" placeholder="Phone" value={formData.phone} onChange={handleChange} required />
            <Input name="email" placeholder="Email" value={formData.email} onChange={handleChange} required />
            <Select name="gender" value={formData.gender} onChange={handleChange} required>
              <option value="">Gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </Select>
            <Input type="date" name="dob" value={formData.dob} onChange={handleChange} required />
            <div className="md:col-span-5 flex justify-end">
              <Button type="submit">Add Patient</Button>
            </div>
          </form>
        </Card>

        <Card title="Patients List" subtitle={loading ? "Loading..." : `${filtered.length} records`}>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="p-3">ID</th>
                  <th className="p-3">Name</th>
                  <th className="p-3">Phone</th>
                  <th className="p-3">Email</th>
                  <th className="p-3">Gender</th>
                  <th className="p-3">DOB</th>
                  <th className="p-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <tr key={p.id} className="border-t">
                    <td className="p-3">{p.id}</td>
                    <td className="p-3 font-medium">{p.name}</td>
                    <td className="p-3">{p.phone}</td>
                    <td className="p-3">{p.email}</td>
                    <td className="p-3">{p.gender}</td>
                    <td className="p-3">{p.dob}</td>
                    <td className="p-3">
                      <Button variant="danger" onClick={() => deletePatient(p.id)}>Delete</Button>
                    </td>
                  </tr>
                ))}

                {!loading && filtered.length === 0 && (
                  <tr>
                    <td colSpan="7" className="p-6 text-center text-gray-500">
                      No patients found
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

export default Patients;
