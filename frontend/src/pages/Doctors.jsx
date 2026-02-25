import { useEffect, useMemo, useState } from "react";
import API from "../api/axios";
import DashboardLayout from "../layouts/DashboardLayout";
import Card from "../components/ui/Card";
import Input from "../components/ui/Input";
import Select from "../components/ui/Select";
import Button from "../components/ui/Button";
import Modal from "../components/ui/Modal";

const EMPTY_FORM = { name: "", specialization: "", phone: "", email: "", channeling_fee: "" };

function Doctors() {
  const role = localStorage.getItem("role");

  const [doctors, setDoctors]       = useState([]);
  const [specializations, setSpecs] = useState([]);
  const [loading, setLoading]       = useState(false);

  // filters
  const [q, setQ]                         = useState("");
  const [filterSpec, setFilterSpec]       = useState("");

  // add form
  const [form, setForm] = useState(EMPTY_FORM);

  // edit modal
  const [editOpen, setEditOpen]       = useState(false);
  const [editData, setEditData]       = useState(EMPTY_FORM);
  const [editId, setEditId]           = useState(null);
  const [editLoading, setEditLoading] = useState(false);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [dRes, sRes] = await Promise.all([
        API.get("/doctors"),
        API.get("/master/specializations"),
      ]);
      setDoctors(dRes.data);
      setSpecs(sRes.data);
    } catch (e) {
      alert("Failed to fetch doctors.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const onChange     = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const onEditChange = (e) => setEditData({ ...editData, [e.target.name]: e.target.value });

  const addDoctor = async (e) => {
    e.preventDefault();
    try {
      await API.post("/doctors/add", { ...form, channeling_fee: Number(form.channeling_fee) });
      setForm(EMPTY_FORM);
      fetchAll();
    } catch (e) {
      alert(e?.response?.data?.message || e?.response?.data || "Failed to add doctor");
    }
  };

  const openEdit = (d) => {
    setEditId(d.id);
    setEditData({
      name: d.name || "", specialization: d.specialization || "",
      phone: d.phone || "", email: d.email || "",
      channeling_fee: String(d.channelling_fee ?? d.channeling_fee ?? ""),
    });
    setEditOpen(true);
  };

  const saveEdit = async () => {
    setEditLoading(true);
    try {
      await API.put(`/doctors/${editId}`, {
        ...editData,
        channeling_fee: Number(editData.channeling_fee),
      });
      setEditOpen(false);
      fetchAll();
    } catch (e) {
      alert(e?.response?.data?.message || e?.response?.data || "Failed to update doctor");
    } finally {
      setEditLoading(false);
    }
  };

  const deleteDoctor = async (id) => {
    if (!confirm("Delete this doctor?")) return;
    try {
      await API.delete(`/doctors/${id}`);
      fetchAll();
    } catch (e) {
      alert("Failed to delete doctor");
    }
  };

  // unique specializations in current data for filter dropdown
  const specOptions = useMemo(() => {
    const fromData = [...new Set(doctors.map((d) => d.specialization).filter(Boolean))];
    const merged   = [...new Set([...specializations, ...fromData])].sort();
    return merged;
  }, [doctors, specializations]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return doctors
      .filter((d) => filterSpec ? d.specialization === filterSpec : true)
      .filter((d) => {
        if (!s) return true;
        return [d.name, d.specialization, d.phone, d.email, String(d.id)].some(
          (v) => (v || "").toLowerCase().includes(s)
        );
      });
  }, [doctors, q, filterSpec]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold">Doctor Management</h2>
            <p className="text-gray-600 mt-1">Add, edit, and manage doctors.</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
            {/* Specialization filter */}
            <Select value={filterSpec} onChange={(e) => setFilterSpec(e.target.value)} className="w-48">
              <option value="">All specializations</option>
              {specOptions.map((s) => <option key={s} value={s}>{s}</option>)}
            </Select>
            <div className="w-72">
              <Input placeholder="Search by name, email, phone..." value={q} onChange={(e) => setQ(e.target.value)} />
            </div>
          </div>
        </div>

        <Card title="Add Doctor">
          <form onSubmit={addDoctor} className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <Input name="name" placeholder="Full name" value={form.name} onChange={onChange} required />
            <Select name="specialization" value={form.specialization} onChange={onChange} required>
              <option value="">Select specialization</option>
              {specializations.map((s) => <option key={s} value={s}>{s}</option>)}
            </Select>
            <Input name="phone" placeholder="Phone" value={form.phone} onChange={onChange} required />
            <Input name="email" placeholder="Email" value={form.email} onChange={onChange} required />
            <Input name="channeling_fee" type="number" step="0.01" placeholder="Channeling Fee (Rs.)" value={form.channeling_fee} onChange={onChange} required />
            <div className="md:col-span-5 flex justify-end">
              <Button type="submit">Add Doctor</Button>
            </div>
          </form>
        </Card>

        <Card title="Doctors List" subtitle={loading ? "Loading..." : `${filtered.length} of ${doctors.length} records`}>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="p-3">ID</th>
                  <th className="p-3">Name</th>
                  <th className="p-3">Specialization</th>
                  <th className="p-3">Phone</th>
                  <th className="p-3">Email</th>
                  <th className="p-3">Channeling Fee</th>
                  <th className="p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((d) => (
                  <tr key={d.id} className="border-t hover:bg-gray-50">
                    <td className="p-3 text-gray-500">{d.id}</td>
                    <td className="p-3 font-medium">{d.name}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                        {d.specialization}
                      </span>
                    </td>
                    <td className="p-3">{d.phone}</td>
                    <td className="p-3">{d.email}</td>
                    <td className="p-3 font-medium">Rs. {d.channelling_fee ?? d.channeling_fee}</td>
                    <td className="p-3">
                      <div className="flex gap-2">
                        <Button variant="secondary" onClick={() => openEdit(d)}>Edit</Button>
                        {role === "ADMIN" && (
                          <Button variant="danger" onClick={() => deleteDoctor(d.id)}>Delete</Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {!loading && filtered.length === 0 && (
                  <tr>
                    <td colSpan="7" className="p-6 text-center text-gray-500">No doctors found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* Edit Doctor Modal */}
      <Modal
        open={editOpen}
        title={`Edit Doctor #${editId}`}
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
            <Input name="name" value={editData.name} onChange={onEditChange} required />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Specialization</label>
            <Select name="specialization" value={editData.specialization} onChange={onEditChange} required>
              <option value="">Select specialization</option>
              {specializations.map((s) => <option key={s} value={s}>{s}</option>)}
            </Select>
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Phone</label>
            <Input name="phone" value={editData.phone} onChange={onEditChange} required />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Email</label>
            <Input name="email" value={editData.email} onChange={onEditChange} required />
          </div>
          <div className="md:col-span-2">
            <label className="text-xs text-gray-500 mb-1 block">Channeling Fee (Rs.)</label>
            <Input type="number" step="0.01" name="channeling_fee" value={editData.channeling_fee} onChange={onEditChange} required />
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  );
}

export default Doctors;