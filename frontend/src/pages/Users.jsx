import { useEffect, useMemo, useState } from "react";
import API from "../api/axios";
import DashboardLayout from "../layouts/DashboardLayout";
import Card from "../components/ui/Card";
import Input from "../components/ui/Input";
import Select from "../components/ui/Select";
import Button from "../components/ui/Button";
import Modal from "../components/ui/Modal";

const ROLES = ["ADMIN", "RECEPTIONIST", "CASHIER"];

const rolePill = (role) => {
  const map = {
    ADMIN:        "bg-red-100 text-red-700",
    RECEPTIONIST: "bg-blue-100 text-blue-700",
    CASHIER:      "bg-emerald-100 text-emerald-700",
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${map[role] || "bg-gray-100 text-gray-700"}`}>
      {role}
    </span>
  );
};

const EMPTY_FORM = { name: "", username: "", password: "", role: "RECEPTIONIST", email: "" };

function Users() {
  const [users, setUsers]         = useState([]);
  const [loading, setLoading]     = useState(false);
  const [q, setQ]                 = useState("");
  const [filterRole, setFilterRole] = useState("");
  const [toast, setToast]         = useState("");

  const [form, setForm]           = useState(EMPTY_FORM);
  const [editOpen, setEditOpen]   = useState(false);
  const [editId, setEditId]       = useState(null);
  const [editData, setEditData]   = useState({ name: "", username: "", password: "", role: "", email: "" });
  const [editLoading, setEditLoading] = useState(false);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(""), 5000); };

  const load = async () => {
    setLoading(true);
    try {
      const res = await API.get("/admin/users");
      setUsers(res.data);
    } catch (e) {
      alert("Failed to load users.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const onChange     = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const onEditChange = (e) => setEditData({ ...editData, [e.target.name]: e.target.value });

  const create = async (e) => {
    e.preventDefault();
    try {
      await API.post("/admin/users", { ...form, enabled: true });
      setForm(EMPTY_FORM);
      load();
      const emailHint = form.email ? ` Welcome email sent to ${form.email}.` : "";
      showToast(`✓ User "${form.username}" created.${emailHint}`);
    } catch (e) {
      alert(e?.response?.data?.message || e?.response?.data || "Failed to create user");
    }
  };

  const openEdit = (u) => {
    setEditId(u.id);
    setEditData({ name: u.name || "", username: u.username || "", password: "",
                  role: u.role || "RECEPTIONIST", email: u.email || "" });
    setEditOpen(true);
  };

  const saveEdit = async () => {
    setEditLoading(true);
    try {
      const payload = { name: editData.name, username: editData.username,
                        role: editData.role, email: editData.email };
      if (editData.password.trim()) payload.password = editData.password;
      await API.put(`/admin/users/${editId}`, payload);
      setEditOpen(false);
      load();
      showToast("✓ User updated.");
    } catch (e) {
      alert(e?.response?.data?.message || e?.response?.data || "Failed to update user");
    } finally {
      setEditLoading(false);
    }
  };

  const sendReset = async (u) => {
    if (!u.email) {
      alert(`No email on record for ${u.name}. Edit the user and add an email first.`);
      return;
    }
    try {
      await API.post("/auth/forgot-password", { email: u.email });
      showToast(`✓ Password reset link sent to ${u.email}`);
    } catch {
      showToast(`Reset link sent (if ${u.email} is registered).`);
    }
  };

  const remove = async (id) => {
    if (!confirm("Delete this user? This cannot be undone.")) return;
    try {
      await API.delete(`/admin/users/${id}`);
      load();
    } catch (e) {
      alert(e?.response?.data?.message || "Failed to delete user");
    }
  };

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return users
      .filter((u) => filterRole ? u.role === filterRole : true)
      .filter((u) => !s || [String(u.id), u.name, u.username, u.role, u.email || ""].some(
        (v) => v.toLowerCase().includes(s)
      ));
  }, [users, q, filterRole]);

  return (
    <DashboardLayout>
      <div className="space-y-6">

        {toast && (
          <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-lg text-sm font-medium">
            {toast}
            <button onClick={() => setToast("")} className="ml-4 opacity-60 hover:opacity-100 text-lg leading-none">×</button>
          </div>
        )}

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold">User Management</h2>
            <p className="text-gray-600 mt-1">Create and manage system accounts.</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
            <Select value={filterRole} onChange={(e) => setFilterRole(e.target.value)} className="w-40">
              <option value="">All roles</option>
              {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
            </Select>
            <div className="w-72">
              <Input placeholder="Search by name, username, email..." value={q} onChange={(e) => setQ(e.target.value)} />
            </div>
          </div>
        </div>

        <Card title="Create User">
          <form onSubmit={create} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input name="name"     placeholder="Full name"   value={form.name}     onChange={onChange} required />
            <Input name="username" placeholder="Username"    value={form.username} onChange={onChange} required />
            <Input name="password" placeholder="Password"    type="password" value={form.password} onChange={onChange} required />
            <Input name="email"    placeholder="Email (e.g. john@maildrop.cc)" type="email" value={form.email} onChange={onChange} />
            <Select name="role" value={form.role} onChange={onChange}>
              {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
            </Select>
            <div className="md:col-span-3 flex items-center justify-between">
              <p className="text-xs text-gray-400">
                {form.email ? `✉ Welcome email will be sent to ${form.email}` : "Add an email to send a welcome message with login details."}
              </p>
              <Button type="submit">Create User</Button>
            </div>
          </form>
        </Card>

        <Card title="Users" subtitle={loading ? "Loading..." : `${filtered.length} of ${users.length} records`}>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="p-3">ID</th>
                  <th className="p-3">Name</th>
                  <th className="p-3">Username</th>
                  <th className="p-3">Role</th>
                  <th className="p-3">Email</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((u) => (
                  <tr key={u.id} className="border-t hover:bg-gray-50">
                    <td className="p-3 text-gray-400">{u.id}</td>
                    <td className="p-3 font-medium">{u.name}</td>
                    <td className="p-3 text-gray-600">@{u.username}</td>
                    <td className="p-3">{rolePill(u.role)}</td>
                    <td className="p-3 text-gray-500 text-xs">{u.email || <span className="text-gray-300">—</span>}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                        u.enabled ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
                      }`}>{u.enabled ? "Active" : "Disabled"}</span>
                    </td>
                    <td className="p-3">
                      <div className="flex gap-1.5 flex-wrap">
                        <Button variant="secondary" onClick={() => openEdit(u)}>Edit</Button>
                        <Button variant="secondary" onClick={() => sendReset(u)}
                          title={u.email ? `Send reset to ${u.email}` : "No email on record"}>
                          📧 Reset
                        </Button>
                        <Button variant="danger" onClick={() => remove(u.id)}>Delete</Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!loading && filtered.length === 0 && (
                  <tr><td colSpan="7" className="p-6 text-center text-gray-500">No users found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* Edit Modal */}
      <Modal
        open={editOpen}
        title={`Edit User #${editId}`}
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
            <label className="text-xs text-gray-500 mb-1 block">Username</label>
            <Input name="username" value={editData.username} onChange={onEditChange} required />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Role</label>
            <Select name="role" value={editData.role} onChange={onEditChange}>
              {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
            </Select>
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Email</label>
            <Input name="email" type="email" placeholder="user@maildrop.cc"
              value={editData.email} onChange={onEditChange} />
          </div>
          <div className="md:col-span-2">
            <label className="text-xs text-gray-500 mb-1 block">
              New Password <span className="text-gray-400 font-normal">(leave blank to keep current)</span>
            </label>
            <Input name="password" type="password" placeholder="••••••••"
              value={editData.password} onChange={onEditChange} />
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  );
}

export default Users;