import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import API from "../api/axios";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";

function ResetPassword() {
  const [params]    = useSearchParams();
  const navigate    = useNavigate();
  const token       = params.get("token");

  const [step, setStep]         = useState("validating"); // validating | form | done | error
  const [userName, setUserName] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm]   = useState("");
  const [err, setErr]           = useState("");
  const [loading, setLoading]   = useState(false);

  useEffect(() => {
    if (!token) { setStep("error"); setErr("No reset token found in the link."); return; }
    API.get(`/auth/reset-password/validate?token=${token}`)
      .then((res) => { setUserName(res.data.name || ""); setStep("form"); })
      .catch(() => { setStep("error"); setErr("This reset link is invalid or has expired."); });
  }, [token]);

  const submit = async (e) => {
    e.preventDefault();
    if (password.length < 6)    { setErr("Password must be at least 6 characters."); return; }
    if (password !== confirm)   { setErr("Passwords do not match."); return; }
    setLoading(true); setErr("");
    try {
      await API.post("/auth/reset-password", { token, password });
      setStep("done");
    } catch (e) {
      setErr(e?.response?.data || "Failed to reset password. The link may have expired.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-950 to-blue-950 p-4">
      <div className="w-full max-w-md">

        <div className="text-center mb-6 text-white">
          <h1 className="text-2xl font-bold">Hospital HMS</h1>
          <p className="text-sm text-slate-300 mt-1">Password Reset</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="p-6">

            {/* Validating */}
            {step === "validating" && (
              <div className="text-center py-8">
                <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-gray-500 text-sm">Validating your reset link...</p>
              </div>
            )}

            {/* Invalid / expired */}
            {step === "error" && (
              <div className="text-center space-y-4 py-4">
                <div className="text-5xl">⛔</div>
                <p className="text-red-600 font-semibold text-lg">Link Invalid</p>
                <p className="text-sm text-gray-500">{err}</p>
                <p className="text-xs text-gray-400">Request a new link from the login page.</p>
                <Button onClick={() => navigate("/")}>Back to Login</Button>
              </div>
            )}

            {/* Set new password form */}
            {step === "form" && (
              <form onSubmit={submit} className="space-y-4">
                <div>
                  <p className="text-gray-800 font-semibold text-lg mb-1">
                    Hi {userName} 👋
                  </p>
                  <p className="text-sm text-gray-500">Set your new password below.</p>
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">New Password</label>
                  <Input type="password" placeholder="Min. 6 characters"
                    value={password} onChange={(e) => setPassword(e.target.value)} required autoFocus />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Confirm Password</label>
                  <Input type="password" placeholder="Repeat password"
                    value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
                </div>
                {err && (
                  <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-3 py-2 rounded-lg">
                    {err}
                  </div>
                )}
                <Button type="submit" disabled={loading} className="w-full">
                  {loading ? "Saving..." : "Set New Password"}
                </Button>
              </form>
            )}

            {/* Success */}
            {step === "done" && (
              <div className="text-center space-y-4 py-4">
                <div className="text-5xl">✅</div>
                <p className="text-emerald-700 font-semibold text-lg">Password Reset!</p>
                <p className="text-sm text-gray-500">
                  Your password has been updated. You can now log in.
                </p>
                <Button onClick={() => navigate("/")}>Go to Login</Button>
              </div>
            )}

          </div>
        </div>

      </div>
    </div>
  );
}

export default ResetPassword;