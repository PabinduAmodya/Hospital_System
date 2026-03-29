import { useEffect, useState } from "react";
import API from "../api/axios";
import DashboardLayout from "../layouts/DashboardLayout";
import Card from "../components/ui/Card";
import Input from "../components/ui/Input";
import Button from "../components/ui/Button";
import LoadingSpinner from "../components/ui/LoadingSpinner";
import { useToast, Toast } from "../components/ui/Toast";

function getInitials(name) {
  return (name || "U")
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function PasswordStrengthBar({ password }) {
  const getStrength = (pw) => {
    if (!pw) return { level: 0, label: "", color: "bg-gray-200" };
    let score = 0;
    if (pw.length >= 6) score++;
    if (pw.length >= 10) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;

    if (score <= 1) return { level: 1, label: "Weak", color: "bg-red-500" };
    if (score <= 2) return { level: 2, label: "Fair", color: "bg-amber-500" };
    if (score <= 3) return { level: 3, label: "Good", color: "bg-blue-500" };
    return { level: 4, label: "Strong", color: "bg-emerald-500" };
  };

  const { level, label, color } = getStrength(password);
  if (!password) return null;

  return (
    <div className="mt-2">
      <div className="flex gap-1">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full transition-colors ${
              i <= level ? color : "bg-gray-200"
            }`}
          />
        ))}
      </div>
      <p className="text-xs text-gray-500 mt-1">{label}</p>
    </div>
  );
}

function Profile() {
  const { toasts, toast, remove } = useToast();

  const [pageLoading, setPageLoading] = useState(true);
  const [profile, setProfile] = useState({
    name: "",
    username: "",
    email: "",
    role: "",
  });
  const [form, setForm] = useState({ name: "", email: "" });
  const [pwForm, setPwForm] = useState({
    current: "",
    newPw: "",
    confirm: "",
  });

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [loading, setLoading] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  const load = async () => {
    setPageLoading(true);
    try {
      const res = await API.get("/auth/me");
      setProfile(res.data);
      setForm({ name: res.data.name || "", email: res.data.email || "" });
    } catch {
      toast.error("Failed to load profile.");
    } finally {
      setPageLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const roleBadge = {
    ADMIN: "bg-red-100 text-red-700 border-red-200",
    RECEPTIONIST: "bg-blue-100 text-blue-700 border-blue-200",
    CASHIER: "bg-emerald-100 text-emerald-700 border-emerald-200",
  };

  // ── Save name / email ────────────────────────────────────────────────
  const saveProfile = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.warning("Name cannot be empty.");
      return;
    }
    setLoading(true);
    try {
      const res = await API.put("/auth/me", form);
      setProfile(res.data);
      localStorage.setItem("name", res.data.name);
      toast.success("Profile updated successfully.");
    } catch (e) {
      toast.error(
        e?.response?.data?.message ||
          e?.response?.data ||
          "Failed to update profile."
      );
    } finally {
      setLoading(false);
    }
  };

  // ── Change password ──────────────────────────────────────────────────
  const changePassword = async (e) => {
    e.preventDefault();
    if (pwForm.newPw.length < 6) {
      toast.warning("New password must be at least 6 characters.");
      return;
    }
    if (pwForm.newPw !== pwForm.confirm) {
      toast.error("Passwords do not match.");
      return;
    }
    setPwLoading(true);
    try {
      await API.post("/auth/change-password", {
        currentPassword: pwForm.current,
        newPassword: pwForm.newPw,
      });
      setPwForm({ current: "", newPw: "", confirm: "" });
      toast.success("Password changed successfully.");
    } catch (e) {
      toast.error(e?.response?.data || "Incorrect current password.");
    } finally {
      setPwLoading(false);
    }
  };

  // ── Send reset link ──────────────────────────────────────────────────
  const sendResetLink = async () => {
    if (!profile.email) {
      toast.warning(
        "No email saved on your account. Add your email in Account Details first."
      );
      return;
    }
    setResetLoading(true);
    try {
      await API.post("/auth/forgot-password", { email: profile.email });
      toast.success(`Reset link sent to ${profile.email} -- check your inbox!`);
    } catch {
      toast.info("Reset link sent if your email is registered.");
    } finally {
      setResetLoading(false);
    }
  };

  const TogglePasswordButton = ({ visible, onClick }) => (
    <button
      type="button"
      onClick={onClick}
      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors text-xs font-medium select-none"
      tabIndex={-1}
    >
      {visible ? "Hide" : "Show"}
    </button>
  );

  if (pageLoading) {
    return (
      <DashboardLayout>
        <LoadingSpinner message="Loading profile..." />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <Toast toasts={toasts} remove={remove} />

      <div className="space-y-6">
        {/* ── Profile Header with Avatar ── */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 h-28" />
          <div className="px-6 pb-5 -mt-12">
            <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4">
              {/* Large avatar */}
              <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center text-3xl font-bold shadow-lg border-4 border-white flex-shrink-0">
                {getInitials(profile.name)}
              </div>
              <div className="flex-1 pb-1">
                <h2 className="text-2xl font-bold text-gray-900">
                  {profile.name || "My Profile"}
                </h2>
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  <code className="text-sm text-gray-500">
                    @{profile.username}
                  </code>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                      roleBadge[profile.role] ||
                      "bg-gray-100 text-gray-700 border-gray-200"
                    }`}
                  >
                    {profile.role}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Two-column layout for forms ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* ── Account Details Card (Left) ── */}
          <Card
            title="Account Details"
            subtitle="Update your name and email address"
          >
            <form onSubmit={saveProfile} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1.5 block">
                  Full Name
                </label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                  placeholder="Enter your full name"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-gray-500 mb-1.5 block">
                  Username
                </label>
                <Input
                  value={profile.username}
                  disabled
                  className="bg-gray-50 cursor-not-allowed text-gray-500"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Username cannot be changed.
                </p>
              </div>

              <div>
                <label className="text-xs font-medium text-gray-500 mb-1.5 block">
                  Email Address
                  <span className="ml-1 text-gray-400 font-normal">
                    -- used for password reset links
                  </span>
                </label>
                <Input
                  type="email"
                  placeholder="yourname@maildrop.cc"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
                {form.email && (
                  <p className="text-xs text-blue-500 mt-1">
                    Inbox:{" "}
                    <a
                      href={`https://maildrop.cc/inbox/${form.email.split("@")[0]}`}
                      target="_blank"
                      rel="noreferrer"
                      className="underline hover:text-blue-700"
                    >
                      maildrop.cc/inbox/{form.email.split("@")[0]}
                    </a>
                  </p>
                )}
              </div>

              <div className="flex justify-end pt-2">
                <Button type="submit" disabled={loading}>
                  {loading ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </form>
          </Card>

          {/* ── Security Card (Right) ── */}
          <Card title="Security" subtitle="Change your password directly">
            <form onSubmit={changePassword} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1.5 block">
                  Current Password
                </label>
                <div className="relative">
                  <Input
                    type={showCurrent ? "text" : "password"}
                    placeholder="Enter current password"
                    value={pwForm.current}
                    onChange={(e) =>
                      setPwForm({ ...pwForm, current: e.target.value })
                    }
                    required
                    className="pr-14"
                  />
                  <TogglePasswordButton
                    visible={showCurrent}
                    onClick={() => setShowCurrent(!showCurrent)}
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-gray-500 mb-1.5 block">
                  New Password
                </label>
                <div className="relative">
                  <Input
                    type={showNew ? "text" : "password"}
                    placeholder="Min. 6 characters"
                    value={pwForm.newPw}
                    onChange={(e) =>
                      setPwForm({ ...pwForm, newPw: e.target.value })
                    }
                    required
                    className="pr-14"
                  />
                  <TogglePasswordButton
                    visible={showNew}
                    onClick={() => setShowNew(!showNew)}
                  />
                </div>
                <PasswordStrengthBar password={pwForm.newPw} />
              </div>

              <div>
                <label className="text-xs font-medium text-gray-500 mb-1.5 block">
                  Confirm New Password
                </label>
                <div className="relative">
                  <Input
                    type={showConfirm ? "text" : "password"}
                    placeholder="Repeat new password"
                    value={pwForm.confirm}
                    onChange={(e) =>
                      setPwForm({ ...pwForm, confirm: e.target.value })
                    }
                    required
                    className="pr-14"
                  />
                  <TogglePasswordButton
                    visible={showConfirm}
                    onClick={() => setShowConfirm(!showConfirm)}
                  />
                </div>
                {pwForm.confirm && pwForm.newPw !== pwForm.confirm && (
                  <p className="text-xs text-red-500 mt-1">
                    Passwords do not match.
                  </p>
                )}
              </div>

              {/* Minimum requirements */}
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xs font-medium text-gray-500 mb-1.5">
                  Password requirements:
                </p>
                <ul className="text-xs text-gray-400 space-y-0.5">
                  <li
                    className={
                      pwForm.newPw.length >= 6 ? "text-emerald-600" : ""
                    }
                  >
                    {pwForm.newPw.length >= 6 ? "+" : "-"} Minimum 6 characters
                  </li>
                  <li
                    className={
                      /[A-Z]/.test(pwForm.newPw) ? "text-emerald-600" : ""
                    }
                  >
                    {/[A-Z]/.test(pwForm.newPw) ? "+" : "-"} At least one
                    uppercase letter
                  </li>
                  <li
                    className={
                      /[0-9]/.test(pwForm.newPw) ? "text-emerald-600" : ""
                    }
                  >
                    {/[0-9]/.test(pwForm.newPw) ? "+" : "-"} At least one
                    number
                  </li>
                  <li
                    className={
                      /[^A-Za-z0-9]/.test(pwForm.newPw)
                        ? "text-emerald-600"
                        : ""
                    }
                  >
                    {/[^A-Za-z0-9]/.test(pwForm.newPw) ? "+" : "-"} At least
                    one special character
                  </li>
                </ul>
              </div>

              <div className="flex justify-end pt-2">
                <Button type="submit" disabled={pwLoading}>
                  {pwLoading ? "Updating..." : "Change Password"}
                </Button>
              </div>
            </form>
          </Card>
        </div>

        {/* ── Bottom row: Password Reset + Session Info ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* ── Password Reset Card ── */}
          <Card
            title="Password Reset"
            subtitle="Send a reset link to your registered email"
          >
            <div className="space-y-4">
              <div className="text-sm text-gray-600">
                {profile.email ? (
                  <p>
                    A reset link will be sent to{" "}
                    <strong className="text-gray-800">{profile.email}</strong>.
                    Click the link in the email to set a new password.
                  </p>
                ) : (
                  <p className="text-amber-600">
                    No email address saved. Add one in Account Details above
                    first.
                  </p>
                )}
              </div>
              <Button
                variant="secondary"
                onClick={sendResetLink}
                disabled={resetLoading || !profile.email}
                className="w-full sm:w-auto"
              >
                {resetLoading ? "Sending..." : "Send Reset Link"}
              </Button>
            </div>
          </Card>

          {/* ── Session Info Card ── */}
          <Card title="Session Info" subtitle="Current session details">
            <div className="space-y-4">
              {/* Role */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Role</span>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                    roleBadge[profile.role] ||
                    "bg-gray-100 text-gray-700 border-gray-200"
                  }`}
                >
                  {profile.role}
                </span>
              </div>

              {/* Username */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Username</span>
                <code className="text-sm text-gray-700">
                  {profile.username}
                </code>
              </div>

              {/* Email */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Email</span>
                <span className="text-sm text-gray-700">
                  {profile.email || "Not set"}
                </span>
              </div>

              {/* Status */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Status</span>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="text-sm font-medium text-emerald-700">
                    Active
                  </span>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default Profile;
