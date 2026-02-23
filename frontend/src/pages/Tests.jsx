import { useEffect, useMemo, useState } from "react";
import API from "../api/axios";
import DashboardLayout from "../layouts/DashboardLayout";
import Card from "../components/ui/Card";
import Input from "../components/ui/Input";
import Select from "../components/ui/Select";
import Button from "../components/ui/Button";

const TYPES = ["LAB", "XRAY", "SCAN", "OTHER"];

function Tests() {
  const [tests, setTests] = useState([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({ name: "", type: "LAB", price: "" });

  const load = async () => {
    setLoading(true);
    try {
      const res = await API.get("/tests");
      setTests(res.data);
    } catch (e) {
      console.error(e);
      alert("Failed to load medical tests.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const add = async (e) => {
    e.preventDefault();
    try {
      await API.post("/tests", { ...form, price: Number(form.price) });
      setForm({ name: "", type: "LAB", price: "" });
      load();
    } catch (e) {
      console.error(e);
      alert(e?.response?.data?.message || e?.response?.data || "Failed to add test");
    }
  };

  const deactivate = async (id) => {
    if (!confirm("Deactivate this test?")) return;
    try {
      await API.delete(`/tests/${id}`);
      load();
    } catch (e) {
      console.error(e);
      alert("Failed to deactivate test");
    }
  };

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return tests;
    return tests.filter((t) => [String(t.id), t.name, t.type].some((v) => (v || "").toString().toLowerCase().includes(s)));
  }, [tests, q]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold">Medical Tests</h2>
            <p className="text-gray-600 mt-1">Manage tests that can be added to bills.</p>
          </div>
          <div className="w-72">
            <Input placeholder="Search tests..." value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
        </div>

        <Card title="Add Test">
          <form onSubmit={add} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input name="name" placeholder="Test name" value={form.name} onChange={onChange} required />
            <Select name="type" value={form.type} onChange={onChange}>
              {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </Select>
            <Input name="price" type="number" step="0.01" placeholder="Price" value={form.price} onChange={onChange} required />
            <div className="md:col-span-3 flex justify-end">
              <Button type="submit">Add</Button>
            </div>
          </form>
        </Card>

        <Card title="Tests" subtitle={loading ? "Loading..." : `${filtered.length} records`}>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="p-3">ID</th>
                  <th className="p-3">Name</th>
                  <th className="p-3">Type</th>
                  <th className="p-3">Price</th>
                  <th className="p-3">Active</th>
                  <th className="p-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((t) => (
                  <tr key={t.id} className="border-t">
                    <td className="p-3">{t.id}</td>
                    <td className="p-3 font-medium">{t.name}</td>
                    <td className="p-3">{t.type}</td>
                    <td className="p-3">{t.price}</td>
                    <td className="p-3">{t.active ? "Yes" : "No"}</td>
                    <td className="p-3">
                      <Button variant="danger" onClick={() => deactivate(t.id)}>Deactivate</Button>
                    </td>
                  </tr>
                ))}

                {!loading && filtered.length === 0 && (
                  <tr>
                    <td colSpan="6" className="p-6 text-center text-gray-500">
                      No tests found
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

export default Tests;
