import { useEffect, useState } from "react";
import API from "../api/axios";
import DashboardLayout from "../layouts/DashboardLayout";
import Card from "../components/ui/Card";
import Input from "../components/ui/Input";
import Button from "../components/ui/Button";

function Profile() {
  const [profile, setProfile]       = useState({ name: "", username: "", email: "", role: "" });
  const [form, setForm]             = useState({ name: "", email: "" });
  const [pwForm, setPwForm]         = useState({ current: "", newPw: "", confirm: "" });
  const [loading, setLoading]       = useState(false);
  const [pwLoading, setPwLoading]   = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [msg, setMsg]               = useState({ type: "", text: "" });

  const flash = (type, text) => {
    setMsg({ type, text });
    setTimeout(() => setMsg({ type: "", text: "" }), 5000);
  };

  const load = async () => {
    try {
      const res = await API.get("/auth/me");
      setProfile(res.data);
      setForm({ name: res.data.name || "", email: res.data.email || "" });
    } catch {
      flash("error", "Failed to load profile.");
    }
  };

  useEffect(() => { load(); }, []);

  // ── Save name / email ────────────────────────────────────────────────
  const saveProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await API.put("/auth/me", form);
      setProfile(res.data);
      localStorage.setItem("name", res.data.name);
      flash("success", "✓ Profile updated successfully.");
    } catch (e) {
      flash("error", e?.response?.data?.message || e?.response?.data || "Failed to update profile.");
    } finally {
      setLoading(false);
    }
  };

  // ── Change password (knows current password) ─────────────────────────
  const changePassword = async (e) => {
    e.preventDefault();
    if (pwForm.newPw.length < 6)         { flash("error", "New password must be at least 6 characters."); return; }
    if (pwForm.newPw !== pwForm.confirm)  { flash("error", "Passwords do not match."); return; }
    setPwLoading(true);
    try {
      await API.post("/auth/change-password", {
        currentPassword: pwForm.current,
        newPassword:     pwForm.newPw,
      });
      setPwForm({ current: "", newPw: "", confirm: "" });
      flash("success", "✓ Password changed successfully.");
    } catch (e) {
      flash("error", e?.response?.data || "Incorrect current password.");
    } finally {
      setPwLoading(false);
    }
  };

  // ── Send reset link to own email ────────────────────────────────────
  const sendResetLink = async () => {
    if (!profile.email) {
      flash("error", "No email saved on your account. Add your email above first, then save.");
      return;
    }
    setResetLoading(true);
    try {
      await API.post("/auth/forgot-password", { email: profile.email });
      flash("success", `✓ Reset link sent to ${profile.email} — check your inbox!`);
    } catch {
      flash("success", "Reset link sent if your email is registered.");
    } finally {
      setResetLoading(false);
    }
  };

  const roleBadge = {
    ADMIN:        "bg-red-100 text-red-700",
    RECEPTIONIST: "bg-blue-100 text-blue-700",
    CASHIER:      "bg-emerald-100 text-emerald-700",
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-2xl">

        {/* Page header */}
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-blue-600 text-white flex items-center justify-center text-xl font-bold flex-shrink-0">
            {(profile.name || "U").split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase()}
          </div>
          <div>
            <h2 className="text-2xl font-bold">{profile.name || "My Profile"}</h2>
            <div className="flex items-center gap-2 mt-1">
              <code className="text-sm text-gray-500">@{profile.username}</code>
              <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${roleBadge[profile.role] || "bg-gray-100 text-gray-700"}`}>
                {profile.role}
              </span>
            </div>
          </div>
        </div>

        {/* Flash message */}
        {msg.text && (
          <div className={`px-4 py-3 rounded-lg text-sm font-medium flex items-center justify-between ${
            msg.type === "success"
              ? "bg-emerald-50 border border-emerald-200 text-emerald-700"
              : "bg-red-50 border border-red-200 text-red-700"
          }`}>
            <span>{msg.text}</span>
            <button onClick={() => setMsg({ type: "", text: "" })} className="ml-4 opacity-60 hover:opacity-100">×</button>
          </div>
        )}

        {/* ── Account Details ── */}
        <Card title="Account Details" subtitle="Update your name and email address">
          <form onSubmit={saveProfile} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Full Name</label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Username</label>
                <Input value={profile.username} disabled className="bg-gray-50 cursor-not-allowed" />
                <p className="text-xs text-gray-400 mt-1">Username cannot be changed</p>
              </div>
              <div className="md:col-span-2">
                <label className="text-xs text-gray-500 mb-1 block">
                  Email address
                  <span className="ml-1 text-gray-400 font-normal">— used for password reset links</span>
                </label>
                <Input
                  type="email"
                  placeholder="yourname@maildrop.cc"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
                {form.email && (
                  <p className="text-xs text-blue-500 mt-1">
                    Inbox: <a href={`https://maildrop.cc/inbox/${form.email.split("@")[0]}`}
                      target="_blank" rel="noreferrer" className="underline hover:text-blue-700">
                      maildrop.cc/inbox/{form.email.split("@")[0]}
                    </a>
                  </p>
                )}
              </div>
            </div>
            <div className="flex justify-end">
              <Button type="submit" disabled={loading}>
                {loading ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </Card>

        {/* ── Password Reset Link ── */}
        <Card title="Password Reset" subtitle="Send a reset link to your registered email">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex-1 text-sm text-gray-600">
              {profile.email
                ? <>A reset link will be sent to <strong>{profile.email}</strong>. Click the link in the email to set a new password.</>
                : <span className="text-amber-600">No email address saved. Add one in Account Details above first.</span>}
            </div>
            <Button variant="secondary" onClick={sendResetLink} disabled={resetLoading || !profile.email}>
              {resetLoading ? "Sending..." : "📧 Send Reset Link"}
            </Button>
          </div>
        </Card>

        {/* ── Change Password ── */}
        <Card title="Change Password" subtitle="Enter your current password to set a new one directly">
          <form onSubmit={changePassword} className="space-y-4">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Current Password</label>
              <Input type="password" placeholder="••••••••"
                value={pwForm.current} onChange={(e) => setPwForm({ ...pwForm, current: e.target.value })} required />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">New Password</label>
                <Input type="password" placeholder="Min. 6 characters"
                  value={pwForm.newPw} onChange={(e) => setPwForm({ ...pwForm, newPw: e.target.value })} required />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Confirm New Password</label>
                <Input type="password" placeholder="Repeat new password"
                  value={pwForm.confirm} onChange={(e) => setPwForm({ ...pwForm, confirm: e.target.value })} required />
              </div>
            </div>
            <div className="flex justify-end">
              <Button type="submit" disabled={pwLoading}>
                {pwLoading ? "Updating..." : "Change Password"}
              </Button>
            </div>
          </form>
        </Card>

      </div>
    </DashboardLayout>
  );
}

export default Profile;