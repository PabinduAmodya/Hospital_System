import { useEffect, useMemo, useState } from "react";
import API from "../api/axios";
import DashboardLayout from "../layouts/DashboardLayout";
import Card from "../components/ui/Card";
import Input from "../components/ui/Input";
import Select from "../components/ui/Select";
import Button from "../components/ui/Button";

const ROLES = ["ADMIN", "RECEPTIONIST", "CASHIER"];

function Users() {
  const [users, setUsers] = useState([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({ name: "", username: "", password: "", role: "RECEPTIONIST", enabled: true });

  const load = async () => {
    setLoading(true);
    try {
      const res = await API.get("/admin/users");
      setUsers(res.data);
    } catch (e) {
      console.error(e);
      alert("Failed to load users (ADMIN only).");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const create = async (e) => {
    e.preventDefault();
    try {
      await API.post("/admin/users", {
        name: form.name,
        username: form.username,
        password: form.password,
        role: form.role,
        enabled: true,
      });
      setForm({ name: "", username: "", password: "", role: "RECEPTIONIST", enabled: true });
      load();
    } catch (e) {
      console.error(e);
      alert(e?.response?.data?.message || e?.response?.data || "Failed to create user");
    }
  };

  const remove = async (id) => {
    if (!confirm("Delete this user?")) return;
    try {
      await API.delete(`/admin/users/${id}`);
      load();
    } catch (e) {
      console.error(e);
      alert("Failed to delete user");
    }
  };

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return users;
    return users.filter((u) =>
      [String(u.id), u.name, u.username, u.role].some((v) => (v || "").toString().toLowerCase().includes(s))
    );
  }, [users, q]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold">User Management</h2>
            <p className="text-gray-600 mt-1">Create receptionist/cashier/admin accounts.</p>
          </div>
          <div className="w-72">
            <Input placeholder="Search users..." value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
        </div>

        <Card title="Create User">
          <form onSubmit={create} className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Input name="name" placeholder="Name" value={form.name} onChange={onChange} required />
            <Input name="username" placeholder="Username" value={form.username} onChange={onChange} required />
            <Input name="password" placeholder="Password" type="password" value={form.password} onChange={onChange} required />
            <Select name="role" value={form.role} onChange={onChange}>
              {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
            </Select>
            <div className="md:col-span-4 flex justify-end">
              <Button type="submit">Create</Button>
            </div>
          </form>
        </Card>

        <Card title="Users" subtitle={loading ? "Loading..." : `${filtered.length} records`}>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="p-3">ID</th>
                  <th className="p-3">Name</th>
                  <th className="p-3">Username</th>
                  <th className="p-3">Role</th>
                  <th className="p-3">Enabled</th>
                  <th className="p-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((u) => (
                  <tr key={u.id} className="border-t">
                    <td className="p-3">{u.id}</td>
                    <td className="p-3 font-medium">{u.name}</td>
                    <td className="p-3">{u.username}</td>
                    <td className="p-3">{u.role}</td>
                    <td className="p-3">{u.enabled ? "Yes" : "No"}</td>
                    <td className="p-3">
                      <Button variant="danger" onClick={() => remove(u.id)}>Delete</Button>
                    </td>
                  </tr>
                ))}

                {!loading && filtered.length === 0 && (
                  <tr>
                    <td colSpan="6" className="p-6 text-center text-gray-500">
                      No users found
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

export default Users;
