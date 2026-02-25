import { useEffect, useMemo, useState } from "react";
import API from "../api/axios";
import DashboardLayout from "../layouts/DashboardLayout";
import Card from "../components/ui/Card";
import Input from "../components/ui/Input";
import Select from "../components/ui/Select";
import Button from "../components/ui/Button";
import Modal from "../components/ui/Modal";

const TYPES = ["LAB", "XRAY", "SCAN", "OTHER"];

const typePill = (type) => {
  const map = {
    LAB:   "bg-blue-100 text-blue-700",
    XRAY:  "bg-purple-100 text-purple-700",
    SCAN:  "bg-amber-100 text-amber-700",
    OTHER: "bg-gray-100 text-gray-700",
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${map[type] || "bg-gray-100 text-gray-700"}`}>
      {type}
    </span>
  );
};

function Tests() {
  const role = localStorage.getItem("role");
  const [tests, setTests]   = useState([]);
  const [loading, setLoading] = useState(false);

  // filters
  const [q, setQ]                   = useState("");
  const [filterType, setFilterType] = useState("");
  const [showInactive, setShowInactive] = useState(false);

  // add form
  const [form, setForm] = useState({ name: "", type: "LAB", price: "", description: "" });

  // edit modal
  const [editOpen, setEditOpen]     = useState(false);
  const [editId, setEditId]         = useState(null);
  const [editData, setEditData]     = useState({ name: "", type: "LAB", price: "", description: "" });
  const [editLoading, setEditLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      // Fetch all — active filter done client-side so we can show inactive too if toggled
      const res = await API.get("/tests");
      setTests(res.data);
    } catch (e) {
      alert("Failed to load medical tests.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const onChange     = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const onEditChange = (e) => setEditData({ ...editData, [e.target.name]: e.target.value });

  const add = async (e) => {
    e.preventDefault();
    try {
      await API.post("/tests", { ...form, price: Number(form.price), active: true });
      setForm({ name: "", type: "LAB", price: "", description: "" });
      load();
    } catch (e) {
      alert(e?.response?.data?.message || e?.response?.data || "Failed to add test");
    }
  };

  const openEdit = (t) => {
    setEditId(t.id);
    setEditData({
      name: t.name || "", type: t.type || "LAB",
      price: String(t.price || ""), description: t.description || "",
    });
    setEditOpen(true);
  };

  const saveEdit = async () => {
    setEditLoading(true);
    try {
      await API.put(`/tests/${editId}`, {
        ...editData,
        price: Number(editData.price),
        active: true,
      });
      setEditOpen(false);
      load();
    } catch (e) {
      alert(e?.response?.data?.message || e?.response?.data || "Failed to update test");
    } finally {
      setEditLoading(false);
    }
  };

  const deactivate = async (id) => {
    if (!confirm("Deactivate this test? It won't appear in billing but won't be deleted.")) return;
    try {
      await API.delete(`/tests/${id}`);
      load();
    } catch (e) {
      alert("Failed to deactivate test");
    }
  };

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return tests
      .filter((t) => showInactive ? true : t.active)
      .filter((t) => filterType ? t.type === filterType : true)
      .filter((t) => {
        if (!s) return true;
        return [String(t.id), t.name, t.type, String(t.price), t.description || ""].some(
          (v) => v.toLowerCase().includes(s)
        );
      });
  }, [tests, q, filterType, showInactive]);

  const activeCount   = tests.filter((t) => t.active).length;
  const inactiveCount = tests.filter((t) => !t.active).length;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold">Medical Tests</h2>
            <p className="text-gray-600 mt-1">
              Manage tests available for billing.&nbsp;
              <span className="text-emerald-600 font-medium">{activeCount} active</span>
              {inactiveCount > 0 && <span className="text-gray-400"> · {inactiveCount} inactive</span>}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 sm:items-center flex-wrap">
            <Select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="w-32">
              <option value="">All types</option>
              {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </Select>
            {inactiveCount > 0 && (
              <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                <input type="checkbox" checked={showInactive} onChange={(e) => setShowInactive(e.target.checked)} />
                Show inactive
              </label>
            )}
            <div className="w-64">
              <Input placeholder="Search tests..." value={q} onChange={(e) => setQ(e.target.value)} />
            </div>
          </div>
        </div>

        {role === "ADMIN" && (
          <Card title="Add Test">
            <form onSubmit={add} className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Input name="name" placeholder="Test name" value={form.name} onChange={onChange} required />
              <Select name="type" value={form.type} onChange={onChange}>
                {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </Select>
              <Input name="price" type="number" step="0.01" placeholder="Price (Rs.)" value={form.price} onChange={onChange} required />
              <Input name="description" placeholder="Description (optional)" value={form.description} onChange={onChange} />
              <div className="md:col-span-4 flex justify-end">
                <Button type="submit">Add Test</Button>
              </div>
            </form>
          </Card>
        )}

        <Card title="Tests List" subtitle={loading ? "Loading..." : `${filtered.length} of ${tests.length} records`}>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="p-3">ID</th>
                  <th className="p-3">Name</th>
                  <th className="p-3">Type</th>
                  <th className="p-3">Price (Rs.)</th>
                  <th className="p-3">Description</th>
                  <th className="p-3">Status</th>
                  {role === "ADMIN" && <th className="p-3">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {filtered.map((t) => (
                  <tr key={t.id} className={`border-t hover:bg-gray-50 ${!t.active ? "opacity-50" : ""}`}>
                    <td className="p-3 text-gray-500">{t.id}</td>
                    <td className="p-3 font-medium">{t.name}</td>
                    <td className="p-3">{typePill(t.type)}</td>
                    <td className="p-3 font-medium">Rs. {t.price}</td>
                    <td className="p-3 text-gray-500">{t.description || "—"}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                        t.active ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
                      }`}>
                        {t.active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    {role === "ADMIN" && (
                      <td className="p-3">
                        <div className="flex gap-2">
                          <Button variant="secondary" onClick={() => openEdit(t)}>Edit</Button>
                          {t.active && (
                            <Button variant="danger" onClick={() => deactivate(t.id)}>Deactivate</Button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
                {!loading && filtered.length === 0 && (
                  <tr>
                    <td colSpan="7" className="p-6 text-center text-gray-500">No tests found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* Edit Test Modal */}
      <Modal
        open={editOpen}
        title={`Edit Test #${editId}`}
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
            <label className="text-xs text-gray-500 mb-1 block">Test Name</label>
            <Input name="name" value={editData.name} onChange={onEditChange} required />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Type</label>
            <Select name="type" value={editData.type} onChange={onEditChange}>
              {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </Select>
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Price (Rs.)</label>
            <Input type="number" step="0.01" name="price" value={editData.price} onChange={onEditChange} required />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Description</label>
            <Input name="description" placeholder="Optional" value={editData.description} onChange={onEditChange} />
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  );
}

export default Tests;