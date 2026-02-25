import { useEffect, useMemo, useState } from "react";
import API from "../api/axios";
import DashboardLayout from "../layouts/DashboardLayout";
import Card from "../components/ui/Card";
import Input from "../components/ui/Input";
import Select from "../components/ui/Select";
import Button from "../components/ui/Button";
import Modal from "../components/ui/Modal";

const EMPTY_FORM = { name: "", phone: "", email: "", gender: "", dob: "" };

function Patients() {
  const role = localStorage.getItem("role");

  const [patients, setPatients] = useState([]);
  const [loading, setLoading]   = useState(false);

  // filters
  const [q, setQ]                     = useState("");
  const [filterGender, setFilterGender] = useState("");

  // add form
  const [formData, setFormData] = useState(EMPTY_FORM);

  // edit modal
  const [editOpen, setEditOpen]   = useState(false);
  const [editData, setEditData]   = useState(EMPTY_FORM);
  const [editId, setEditId]       = useState(null);
  const [editLoading, setEditLoading] = useState(false);

  const fetchPatients = async () => {
    setLoading(true);
    try {
      const res = await API.get("/patients");
      setPatients(res.data);
    } catch (e) {
      alert("Failed to fetch patients.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPatients(); }, []);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
  const handleEditChange = (e) => setEditData({ ...editData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await API.post("/patients/register", formData);
      setFormData(EMPTY_FORM);
      fetchPatients();
    } catch (e) {
      alert(e?.response?.data?.message || e?.response?.data || "Failed to add patient");
    }
  };

  const openEdit = (p) => {
    setEditId(p.id);
    setEditData({
      name: p.name || "", phone: p.phone || "",
      email: p.email || "", gender: p.gender || "",
      dob: p.dob || "",
    });
    setEditOpen(true);
  };

  const saveEdit = async () => {
    setEditLoading(true);
    try {
      await API.put(`/patients/${editId}`, editData);
      setEditOpen(false);
      fetchPatients();
    } catch (e) {
      alert(e?.response?.data?.message || e?.response?.data || "Failed to update patient");
    } finally {
      setEditLoading(false);
    }
  };

  const deletePatient = async (id) => {
    if (!confirm("Delete this patient?")) return;
    try {
      await API.delete(`/patients/${id}`);
      fetchPatients();
    } catch (e) {
      alert(e?.response?.data?.message || e?.response?.data || "Failed to delete patient");
    }
  };

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return patients
      .filter((p) => filterGender ? p.gender === filterGender : true)
      .filter((p) => {
        if (!s) return true;
        return [p.name, p.phone, p.email, p.gender, String(p.id), p.dob].some(
          (v) => (v || "").toLowerCase().includes(s)
        );
      });
  }, [patients, q, filterGender]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold">Patient Management</h2>
            <p className="text-gray-600 mt-1">Register, edit, and manage patients.</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
            {/* Gender filter */}
            <Select value={filterGender} onChange={(e) => setFilterGender(e.target.value)} className="w-36">
              <option value="">All genders</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </Select>
            <div className="w-72">
              <Input placeholder="Search by name, phone, email..." value={q} onChange={(e) => setQ(e.target.value)} />
            </div>
          </div>
        </div>

        <Card title="Register New Patient">
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <Input name="name"  placeholder="Full name"  value={formData.name}  onChange={handleChange} required />
            <Input name="phone" placeholder="Phone"      value={formData.phone} onChange={handleChange} required />
            <Input name="email" placeholder="Email"      value={formData.email} onChange={handleChange} required />
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

        <Card title="Patients List" subtitle={loading ? "Loading..." : `${filtered.length} of ${patients.length} records`}>
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
                  <th className="p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <tr key={p.id} className="border-t hover:bg-gray-50">
                    <td className="p-3 text-gray-500">{p.id}</td>
                    <td className="p-3 font-medium">{p.name}</td>
                    <td className="p-3">{p.phone}</td>
                    <td className="p-3">{p.email}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                        p.gender === "Male"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-pink-100 text-pink-700"
                      }`}>{p.gender}</span>
                    </td>
                    <td className="p-3">{p.dob}</td>
                    <td className="p-3">
                      <div className="flex gap-2">
                        <Button variant="secondary" onClick={() => openEdit(p)}>Edit</Button>
                        {role === "ADMIN" && (
                          <Button variant="danger" onClick={() => deletePatient(p.id)}>Delete</Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {!loading && filtered.length === 0 && (
                  <tr>
                    <td colSpan="7" className="p-6 text-center text-gray-500">No patients found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* Edit Patient Modal */}
      <Modal
        open={editOpen}
        title={`Edit Patient #${editId}`}
        onClose={() => setEditOpen(false)}
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button onClick={saveEdit} disabled={editLoading}>
              {editLoading ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Full Name</label>
            <Input name="name" value={editData.name} onChange={handleEditChange} required />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Phone</label>
            <Input name="phone" value={editData.phone} onChange={handleEditChange} required />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Email</label>
            <Input name="email" value={editData.email} onChange={handleEditChange} required />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Gender</label>
            <Select name="gender" value={editData.gender} onChange={handleEditChange} required>
              <option value="">Select gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </Select>
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Date of Birth</label>
            <Input type="date" name="dob" value={editData.dob} onChange={handleEditChange} required />
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  );
}

export default Patients;